"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getJson } from "@/lib/api";
import type { AuthUser, SessionResponse } from "@/lib/types";

import { AppShell } from "./app-shell";

type ProtectedPageProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function ProtectedPage({ actions, children, description, title }: ProtectedPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await getJson<SessionResponse>("/auth/me");
        if (mounted) {
          setUser(data.user);
        }
      } catch {
        router.replace("/login");
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
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell user={user} title={title} description={description} actions={actions}>
      {children}
    </AppShell>
  );
}
