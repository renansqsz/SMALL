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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
