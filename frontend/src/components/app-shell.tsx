"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Anton } from "next/font/google";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState } from "react";

import { postJson } from "@/lib/api";
import campsoftNegativeLogo from "@/lib/camp_negativa.png";
import { clearSessionCache } from "@/lib/session";
import campsoftLogo from "@/lib/logo-camps.webp";
import { NAV_ITEMS } from "@/lib/navigation";
import type { AuthUser } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const SIDEBAR_STATE_STORAGE_KEY = "campsoft_sidebar_collapsed";

function getInitialSidebarCollapsed() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.sidebarCollapsed === "true";
}

function getInitialDarkMode() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.classList.contains("dark");
}

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

function SidebarToggleIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <IconShell className={className}>
      {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
    </IconShell>
  );
}

function FooterSocialIcon({ className, type }: { className?: string; type: "facebook" | "github" | "linkedin" | "instagram" }) {
  if (type === "facebook") {
    return (
      <IconShell className={className}>
        <path d="M14 7.5h2.5V4.8H14c-2.1 0-3.5 1.4-3.5 3.8v2.1H8v2.8h2.5v5.7h2.9v-5.7h2.7l.4-2.8h-3.1V9c0-.9.4-1.5 1.6-1.5Z" />
      </IconShell>
    );
  }

  if (type === "github") {
    return (
      <IconShell className={className}>
        <path d="M9 18.5c-3.5 1-3.5-2-5-2.5" />
        <path d="M15 20v-3.1c0-1 .1-1.5-.5-2 2.2-.2 4.5-1.1 4.5-5a3.9 3.9 0 0 0-1-2.7 3.7 3.7 0 0 0-.1-2.7s-.9-.3-2.9 1a10 10 0 0 0-5 0c-2-1.3-2.9-1-2.9-1a3.7 3.7 0 0 0-.1 2.7 3.9 3.9 0 0 0-1 2.7c0 3.9 2.3 4.8 4.5 5-.6.5-.6 1-.5 2V20" />
      </IconShell>
    );
  }

  return (
    <IconShell className={className}>
      <path d="M8 9.5v8" />
      <path d="M8 6.5a1 1 0 1 0 0-.01" />
      <path d="M12 17.5v-4.8c0-1.8 1.7-2.1 2.4-2.1 1.4 0 2.6.8 2.6 3v3.9" />
      <path d="M12 11.5v-2" />
    </IconShell>
  );

  return (
    <IconShell className={className}>
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <path d="M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
      <path d="M16.8 8.4h.01" />
    </IconShell>
  );
}

export function AppShell({ actions, children, description, title, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const currentNav = NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_STORAGE_KEY, String(isSidebarCollapsed));
    document.documentElement.dataset.sidebarCollapsed = isSidebarCollapsed ? "true" : "false";
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const element = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkMode(element.classList.contains("dark"));
    });

    observer.observe(element, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  function renderNavIcon(icon: string) {
    if (icon === "dashboard") {
      return "🌐";
    }

    if (icon === "equipment") {
      return "🧰";
    }

    if (icon === "notebook") {
      return "💻";
    }

    if (icon === "category") {
      return "📦";
    }

    if (icon === "employees") {
      return "👤";
    }

    return null;
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await postJson("/auth/logout");
      clearSessionCache();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className={`app-shell page-enter${isSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-topbar">
            <div className="sidebar-brand-mark">
              <Image className="sidebar-brand-image" src={isDarkMode ? campsoftNegativeLogo : campsoftLogo} alt="CAMPSOFT" priority />
              <div className="sidebar-brand-monogram" aria-hidden="true">
                C
              </div>
            </div>
            <button
              className="ghost-button sidebar-collapse-toggle"
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-pressed={isSidebarCollapsed}
            >
              <SidebarToggleIcon collapsed={isSidebarCollapsed} className="button-icon-svg" />
            </button>
          </div>

          <div className="sidebar-nav-block">
            <div className="nav-label">Menu</div>
            <nav className="nav-list">
              {NAV_ITEMS.map((item) => {
                if ("variant" in item && item.variant === "brand") {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link nav-link-brand${pathname === item.href ? " active" : ""}`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <span className={`${anton.className} nav-brand-text`}>{isSidebarCollapsed ? "B" : item.label}</span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link${pathname === item.href ? " active" : ""}`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <span className="nav-emoji" aria-hidden="true">
                      {renderNavIcon(item.icon)}
                    </span>
                    <span className="nav-text">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="ghost-button sidebar-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              <span className="button-icon" aria-hidden="true">
                <LogoutIcon className="button-icon-svg" />
              </span>
              <span className="sidebar-logout-text">{isLoggingOut ? "Saindo..." : "Sair"}</span>
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
              <div className="page-kicker">Portal de TI</div>
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
            <div className="header-actions">
              <ThemeToggle />
              {actions}
            </div>
          </header>
          {children}
        </div>
        <footer className="site-footer">
          <div className="site-footer-brand">
            <div className="site-footer-logo">
              <span className="site-footer-logo-mark" aria-hidden="true">
                <Image className="site-footer-logo-image" src={isDarkMode ? campsoftNegativeLogo : campsoftLogo} alt="" />
              </span>
              <div className="site-footer-logo-copy">
                <div className="site-footer-logo-name">Portal de TI</div>
                <p className="site-footer-copy">
                  Plataforma interna para controlar inventário, acompanhar ativos e operar o fluxo de TI com uma interface clara e objetiva.
                </p>
              </div>
            </div>

            <div className="site-footer-socials">
              <a className="site-footer-social" href="#" aria-label="Campsoft no Facebook">
                <FooterSocialIcon type="facebook" className="button-icon-svg" />
              </a>
              <a className="site-footer-social" href="#" aria-label="Campsoft no Instagram">
                <FooterSocialIcon type="instagram" className="button-icon-svg" />
              </a>
              <a className="site-footer-social" href="#" aria-label="Campsoft no GitHub">
                <FooterSocialIcon type="github" className="button-icon-svg" />
              </a>
              <a className="site-footer-social" href="#" aria-label="Campsoft no LinkedIn">
                <FooterSocialIcon type="linkedin" className="button-icon-svg" />
              </a>
            </div>
          </div>

          <div className="site-footer-links">
            <div className="site-footer-column">
              <div className="site-footer-heading">PÁGINAS</div>
              <a href="/equipments">Equipamentos</a>
              <a href="/notebooks">Notebooks</a>
              <a href="/categories">Categorias</a>
              <a href="/employees">Colaboradores</a>
            </div>
            <div className="site-footer-column">
              <div className="site-footer-heading">Empresa</div>
              <a href="#">Sobre</a>
              <a href="#">Operações</a>
              <a href="#">Times</a>
              <a href="#">Contato</a>
            </div>
            <div className="site-footer-column">
              <div className="site-footer-heading">Recursos</div>
              <a href="#">Documentação</a>
              <a href="#">Suporte</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
