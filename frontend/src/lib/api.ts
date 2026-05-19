import { translateApiMessage, translateErrorField } from "@/lib/pt-br";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type RequestOptions = RequestInit & {
  bodyJson?: unknown;
};

type ErrorPayload = {
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
};

function formatErrorPayload(payload: ErrorPayload): string {
  if (typeof payload.detail === "string") {
    return translateApiMessage(payload.detail);
  }

  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    return payload.detail
      .map((item) => {
        const rawField = Array.isArray(item.loc)
          ? item.loc.filter((segment) => !["body", "query", "path", "header"].includes(String(segment))).join(".")
          : "requisição";
        const field = translateErrorField(rawField);
        const message = translateApiMessage(item.msg ?? "Valor inválido.");
        return field ? `${field}: ${message}` : message;
      })
      .join(" | ");
  }

  return "A requisição falhou.";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { bodyJson, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: bodyJson !== undefined ? JSON.stringify(bodyJson) : rest.body,
    ...rest,
  });

  if (!response.ok) {
    let message = "A requisição falhou.";
    try {
      const payload = (await response.json()) as ErrorPayload;
      message = formatErrorPayload(payload);
    } catch {
      const text = await response.text();
      if (text) {
        message = translateApiMessage(text);
      }
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function postJson<T>(path: string, bodyJson?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", bodyJson });
}

export async function putJson<T>(path: string, bodyJson?: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", bodyJson });
}

export async function deleteJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export async function downloadFile(path: string, fileName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError("Download failed.", response.status);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
