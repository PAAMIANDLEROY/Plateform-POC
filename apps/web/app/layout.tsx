import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hi! Platform",
  description: "Plateforme pédagogique mutualisée Hi! PARIS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
