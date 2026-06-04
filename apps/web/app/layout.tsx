import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CookieBanner } from "@/components/platform/CookieBanner";

export const metadata: Metadata = {
  title: "Hi! Platform",
  description: "Plateforme pédagogique mutualisée Hi! PARIS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
