import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const frontendDir = join(rootDir, "frontend");
const frontendEnv = join(frontendDir, ".env.local");
const frontendEnvExample = join(frontendDir, ".env.local.example");

if (!existsSync(frontendEnv) && existsSync(frontendEnvExample)) {
  copyFileSync(frontendEnvExample, frontendEnv);
}

if (existsSync(frontendEnv)) {
  const currentEnv = readFileSync(frontendEnv, "utf8");
  const normalizedEnv = currentEnv.replaceAll("http://127.0.0.1:8000/api/v1", "http://localhost:8000/api/v1");
  if (normalizedEnv !== currentEnv) {
    writeFileSync(frontendEnv, normalizedEnv);
  }
}

const isWindows = process.platform === "win32";
const pythonCommand = isWindows ? "python" : "python3";

const backend = spawn(
  pythonCommand,
  [
    "-m",
    "uvicorn",
    "backend.app.main:app",
    "--reload",
    "--host",
    "localhost",
    "--port",
    "8000",
  ],
  {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
  },
);

const frontend = isWindows
  ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: false,
    })
  : spawn("npm", ["run", "dev"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: false,
    });

let shuttingDown = false;

function terminateAll(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of [backend, frontend]) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

backend.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`\n[backend] exited with code ${code ?? 0}`);
    terminateAll(code ?? 0);
  }
});

frontend.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`\n[frontend] exited with code ${code ?? 0}`);
    terminateAll(code ?? 0);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => terminateAll(0));
}

console.log("Starting Campsoft development workspace...");
console.log("Frontend: http://localhost:3000");
console.log("Backend:  http://localhost:8000");
