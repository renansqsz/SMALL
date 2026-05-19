"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, postJson } from "@/lib/api";
import { ValidationToast, useTimedNotice } from "@/components/form-toast";
import { getSession, seedSession } from "@/lib/session";
import type { SessionResponse } from "@/lib/types";

type LoginForm = {
  username: string;
  password: string;
  remember_me: boolean;
};

const initialForm: LoginForm = {
  username: "",
  password: "",
  remember_me: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice } = useTimedNotice();

  useEffect(() => {
    let mounted = true;

    async function trySession() {
      try {
        const session = await getSession();
        if (mounted && session) {
          router.replace("/dashboard");
        }
      } catch {
        // Ignore missing session on the login page.
      }
    }

    void trySession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      showNotice("Preencha os campos obrigatorios.", { tone: "error" });
      event.currentTarget.querySelector<HTMLElement>("input:invalid, select:invalid, textarea:invalid")?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await postJson<SessionResponse>("/auth/login", form);
      seedSession(session);
      router.replace("/dashboard");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Não foi possível entrar agora.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ValidationToast notice={notice} />
      <div className="login-page">
        <div>
          <div className="login-browser">
          <div className="login-browser-dots">
            <span />
            <span />
            <span />
          </div>
          {/* <div className="login-browser-bar">campsoft.cloud / acesso-seguro</div> */}
          </div>

          <div className="login-shell">
            <section className="form-panel">
              <div className="brand-lockup">
                <div className="brand-mark" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="24" rx="8" fill="url(#login-brand-gradient)" />
                    <path d="M11 18.5 16 11l5 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="16" cy="21.5" r="2.1" fill="#fff" />
                    <defs>
                      <linearGradient id="login-brand-gradient" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60A5FA" />
                        <stop offset="1" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <div className="brand-name">SMALL</div>
                  <div className="brand-copy">Acesso ao sistema de gerenciamento de Ativos de TI</div>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <div className="login-tag">Login corporativo</div>
                <h1 className="login-headline">Bem-vindo de volta</h1>
                <p className="login-copy">
                  Sistema de gerenciamento de Ativos de TI. Um portal mais rápido e fácil de manter.
                </p>
              </div>

              <form className="stack" onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                  <label htmlFor="username">Usuário</label>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="Digite seu usuário"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">Senha</label>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </div>

                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={form.remember_me}
                    onChange={(event) => setForm((current) => ({ ...current, remember_me: event.target.checked }))}
                  />
                  <span className="muted-link">
                    <strong>Lembrar de mim</strong>
                    <br />
                    Salvar meus dados de acesso para a próxima vez.
                  </span>
                </label>

                {error ? <div className="message error">{error}</div> : null}

                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="subtle-divider" />
              <div className="muted-link">
                {/* {false && 'Ainda não tem uma conta? <strong>Cadastre-se</strong>'} */}
              </div>
              {/*  <div className="copyright">Direitos Autorais 2026. Todos os direitos reservados.</div> */}
            </section>

            <section className="hero-panel">
              <div className="hero-content">
                <div className="hero-kicker">Ambiente seguro</div>
                <h2 className="hero-title">
                  Organize, armazene e consulte com segurança os ativos de TI.
                </h2>
              </div>

              <div className="hero-visual">
                <svg className="hero-graphic" viewBox="0 0 760 560" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="login-panel-glow" x1="130" y1="70" x2="640" y2="470" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EFF6FF" />
                      <stop offset="1" stopColor="#DBEAFE" />
                    </linearGradient>
                    <linearGradient id="login-shirt-gradient" x1="330" y1="240" x2="520" y2="450" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#60A5FA" />
                      <stop offset="1" stopColor="#2563EB" />
                    </linearGradient>
                    <linearGradient id="login-phone-gradient" x1="482" y1="192" x2="574" y2="340" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#C4B5FD" />
                      <stop offset="1" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>
                  <circle cx="632" cy="108" r="72" fill="#EEF2FF" />
                  <circle cx="126" cy="404" r="56" fill="#E0F2FE" />
                  <rect x="160" y="126" width="446" height="298" rx="44" fill="url(#login-panel-glow)" />
                  <rect x="184" y="150" width="398" height="250" rx="36" fill="#FFF" fillOpacity="0.72" stroke="#D7E3F4" strokeWidth="2" />
                  <rect x="462" y="168" width="98" height="176" rx="24" fill="url(#login-phone-gradient)" />
                  <rect x="475" y="184" width="72" height="118" rx="16" fill="#FFF" fillOpacity="0.92" />
                  <rect x="194" y="196" width="144" height="94" rx="24" fill="#FFF" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="306" cy="230" r="16" fill="#DBEAFE" />
                  <path d="M300 230l5 5 10-12" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <ellipse cx="394" cy="478" rx="142" ry="26" fill="#D7EAFE" fillOpacity="0.45" />
                  <path d="M358 240c0-24 19-43 43-43h18c24 0 43 19 43 43v26h-104v-26Z" fill="#0F172A" />
                  <circle cx="410" cy="206" r="40" fill="#F8C7B9" />
                  <path d="M373 198c6-24 22-40 49-40 19 0 34 8 44 24-9 2-14 8-17 15-16-1-34 2-55 13-8-2-15-6-21-12Z" fill="#0F172A" />
                  <path d="M381 255c10 8 22 12 34 12 12 0 24-4 34-12v32h-68v-32Z" fill="#F5B09C" />
                  <path d="M328 444c6-76 24-130 53-162h60c33 27 53 78 58 152-42 18-137 20-171 10Z" fill="url(#login-shirt-gradient)" />
                  <path d="M334 328c-22 16-39 36-50 62-12 29-12 60 6 76l31-22c-6-8-6-22 0-40 7-18 19-35 33-49l-20-27Z" fill="#F8C7B9" />
                  <path d="M472 324c18 16 33 36 42 61 10 27 8 57-9 73l-30-24c6-8 5-21-1-37-5-16-16-32-29-46l27-27Z" fill="#F8C7B9" />
                </svg>
              </div>

              <p className="hero-copy">
                Sistema pensado em praticidade, segurança e organização, tudo para que você possa gerenciar seus ativos de forma eficiente e segura.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
