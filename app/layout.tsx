import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ActionFeedback } from "@/components/ui/action-feedback";
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
      <body>
        {children}
        <ActionFeedback />
        <Analytics />
      </body>
    </html>
  );
}
