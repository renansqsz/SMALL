import type { Metadata } from "next";
import siteLogo from "@/lib/logo_site.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventário | Campsoft",
  description: "Inventário de equipamentos Campsoft.",
  icons: {
    icon: siteLogo.src,
    shortcut: siteLogo.src,
    apple: siteLogo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const themeStorageKey = "campsoft_theme_mode";
                  const themeSessionStorageKey = "campsoft_theme_mode_session";
                  const sessionTheme = sessionStorage.getItem(themeSessionStorageKey);
                  const storedTheme = localStorage.getItem(themeStorageKey);
                  const theme = sessionTheme === "dark" || sessionTheme === "light"
                    ? sessionTheme
                    : storedTheme === "dark" || storedTheme === "light"
                      ? storedTheme
                      : "light";
                  const isDark = theme === "dark";
                  const isSidebarCollapsed = localStorage.getItem("campsoft_sidebar_collapsed") === "true";
                  localStorage.setItem(themeStorageKey, theme);
                  sessionStorage.setItem(themeSessionStorageKey, theme);
                  document.documentElement.classList.toggle("dark", isDark);
                  document.documentElement.dataset.theme = isDark ? "dark" : "light";
                  document.documentElement.dataset.sidebarCollapsed = isSidebarCollapsed ? "true" : "false";
                } catch {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
