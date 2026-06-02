"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, postJson } from "@/lib/api";
import { validateFormWithFeedback } from "@/lib/form-validation";
import bonecoImage from "@/lib/boneco.png";
import bonecoDarkImage from "@/lib/boneco_dark.png";
import siteLogo from "@/lib/logo_site.png";
import { ValidationToast, useTimedNotice } from "@/components/form-toast";
import { getSession, peekSession, seedSession } from "@/lib/session";
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
  const cachedSession = peekSession();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice } = useTimedNotice();

  useEffect(() => {
    if (cachedSession) {
      router.replace("/dashboard");
      return;
    }

    if (cachedSession === null) {
      return;
    }

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
  }, [cachedSession, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateFormWithFeedback(event.currentTarget, showNotice)) {
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

  useEffect(() => {
    if (error) {
      showNotice(error, { tone: "error" });
    }
  }, [error, showNotice]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Passion+One:wght@400;700;900&display=swap" rel="stylesheet" />
      <ValidationToast notice={notice} />
      <div className="login-page page-enter">
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
                  <Image src={siteLogo} alt="" className="login-brand-icon" priority />
                </div>
                <div className="brand-lockup-copy">
                  <div className="brand-name login-brand-name">SMALL</div>
                  <div className="brand-copy">Acesso ao sistema de gerenciamento de Ativos de TI</div>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <h1 className="login-headline">Bem-vindo.</h1>
                <p className="login-copy">
                  Sistema de gerenciamento de Ativos de TI. Um portal mais rápido e fácil de manter.
                </p>
              </div>

              <form className="stack" onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                  <br></br>
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
                    <br /> Salvar meus dados de acesso para a próxima vez.
                  </span>
                </label>

                {error ? <div className="message error">{error}</div> : null}

                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="subtle-divider" />
              <div className="muted-link">
                {/*
                Linha comentada, ainda não implementada a funcionalidade de cadastro. {false && 'Ainda não tem uma conta? <strong>Cadastre-se</strong>'} */}
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
                <div className="hero-graphic-stack" aria-hidden="true">
                  <Image src={bonecoImage} alt="" className="hero-graphic hero-graphic-light" priority />
                  <Image src={bonecoDarkImage} alt="" className="hero-graphic hero-graphic-dark" priority />
                </div>
              </div>

              {/*<p className="hero-copy">
                Sistema pensado em praticidade, segurança e organização, tudo para que você possa gerenciar seus ativos de forma eficiente e segura.
              </p>*/}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
