"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession } from "@/lib/session";
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card surface-panel">
          <div className="page-kicker">Portal Campsoft</div>
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
            Carregando...
          </h1>
          <p className="panel-copy">Validando sua sessão e abrindo a área autenticada.</p>
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
