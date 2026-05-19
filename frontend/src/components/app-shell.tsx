"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";

import { postJson } from "@/lib/api";
import campsoftLogo from "@/lib/logo-camps.webp";
import { NAV_ITEMS } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types";

type AppShellProps = PropsWithChildren<{
  description?: string;
  title: string;
  user: AuthUser;
  actions?: ReactNode;
}>;

function IconShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M4 11.5h7v-7H4z" />
      <path d="M13 4.5h7v5h-7z" />
      <path d="M13 11.5h7v8h-7z" />
      <path d="M4 15.5h7v4H4z" />
    </IconShell>
  );
}

function EquipmentIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M7 7.5h10l3 4v5l-3 0.5H7l-3-0.5v-5z" />
      <path d="M9 7.5v-2h6v2" />
      <path d="M8 14.5h8" />
    </IconShell>
  );
}

function NotebookIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <rect x="5" y="4.5" width="14" height="13" rx="2.2" />
      <path d="M8 7.5h8" />
      <path d="M8 10.5h5" />
      <path d="M5 18.5h14" />
    </IconShell>
  );
}

function CategoryIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M5 7.5h6v6H5z" />
      <path d="M13 5.5h6v6h-6z" />
      <path d="M13 13.5h6v5h-6z" />
      <path d="M5 15.5h6v3H5z" />
    </IconShell>
  );
}

function EmployeesIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M9.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M4.5 18.5c0-2.5 2.1-4 5-4s5 1.5 5 4" />
      <path d="M16.5 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M14.5 18.5c.3-1.9 1.7-3.1 4-3.1 1.7 0 2.9.6 3.5 1.9" />
    </IconShell>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M10 5.5H6.5A2.5 2.5 0 0 0 4 8v8a2.5 2.5 0 0 0 2.5 2.5H10" />
      <path d="M14.5 9.5 18 12l-3.5 2.5" />
      <path d="M18 12H9" />
    </IconShell>
  );
}

export function AppShell({ actions, children, description, title, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentNav = NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await postJson("/auth/logout");
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="brand-lockup">
            <div className="sidebar-brand-mark">
              <Image className="sidebar-brand-image" src={campsoftLogo} alt="CAMPSOFT" priority />
            </div>
          </div>

          <div className="sidebar-nav-block">
            <div className="nav-label">Menu</div>
            <nav className="nav-list">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${pathname === item.href ? " active" : ""}`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="nav-emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="ghost-button sidebar-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              <span className="sidebar-action-emoji" aria-hidden="true">
                🚪
              </span>
              <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
            </button>
            <div className="account-chip">
              <div className="account-label">Conectado como</div>
              <div className="account-value">{user.username}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="page-area">
        <div className="page-stack">
          <header className="page-header surface-panel">
            <div className="page-heading">
              <div className="page-kicker">Portal Campsoft</div>
              <div className="page-title-row">
                <span className="page-icon" aria-hidden="true">
                  {currentNav.icon === "dashboard" ? (
                    <DashboardIcon className="page-icon-svg" />
                  ) : currentNav.icon === "equipment" ? (
                    <EquipmentIcon className="page-icon-svg" />
                  ) : currentNav.icon === "notebook" ? (
                    <NotebookIcon className="page-icon-svg" />
                  ) : currentNav.icon === "category" ? (
                    <CategoryIcon className="page-icon-svg" />
                  ) : currentNav.icon === "employees" ? (
                    <EmployeesIcon className="page-icon-svg" />
                  ) : null}
                </span>
                <h1 className="page-title">{title}</h1>
              </div>
              {description ? <p className="page-description">{description}</p> : null}
            </div>
            {actions ? <div className="header-actions">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
