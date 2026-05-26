"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession, peekSession } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

import { ValidationToast, type TimedNotice } from "./form-toast";
import { AppShell } from "./app-shell";

type ProtectedPageProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  notice?: TimedNotice | null;
  children: React.ReactNode;
};

export function ProtectedPage({ actions, children, description, notice, title }: ProtectedPageProps) {
  const router = useRouter();
  const cachedSession = peekSession();
  const [user, setUser] = useState<AuthUser | null>(() => cachedSession?.user ?? null);
  const [loading, setLoading] = useState(() => cachedSession === undefined);

  useEffect(() => {
    if (cachedSession === null) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    if (cachedSession) {
      return;
    }

    let mounted = true;

    async function loadSession() {
      try {
        const session = await getSession();
        if (!mounted) {
          return;
        }

        if (session) {
          setUser(session.user);
        } else {
          router.replace("/login");
        }
      } catch {
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSession();
    return () => {
      mounted = false;
    };
  }, [cachedSession, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card surface-panel">
          <div className="page-kicker">Portal de TI - Campsoft</div>
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
            Carregando...
          </h1>
          <p className="panel-copy">Carregando a área autenticada.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <ValidationToast notice={notice ?? null} />
      <AppShell user={user} title={title} description={description} actions={actions}>
        {children}
      </AppShell>
    </>
  );
}
