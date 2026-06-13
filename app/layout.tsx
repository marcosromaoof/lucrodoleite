import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucro do Leite",
  description: "Controle produtivo e financeiro para fazendas leiteiras.",
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
