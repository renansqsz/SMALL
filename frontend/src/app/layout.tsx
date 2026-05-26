import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventário | Campsoft",
  description: "Inventário de equipamentos Campsoft.",
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
                  const theme = localStorage.getItem("campsoft_theme_mode");
                  const isDark = theme === "dark";
                  const isSidebarCollapsed = localStorage.getItem("campsoft_sidebar_collapsed") === "true";
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
