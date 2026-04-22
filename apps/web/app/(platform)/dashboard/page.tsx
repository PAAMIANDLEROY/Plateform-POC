"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError, UserResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await authApi.logout().catch(() => {});
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Hi! Platform</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {user.role}
            </span>
            <button onClick={handleLogout} className="text-sm text-text-muted hover:text-danger transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bonjour, {user.first_name} 👋
        </h1>
        <p className="text-text-muted mb-10">Bienvenue sur Hi! Platform</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Hi! Tube", desc: "Explorez la vidéothèque pédagogique", icon: "▶", href: "/tube" },
            { name: "Hi! Course", desc: "Accédez aux cours interactifs", icon: "📖", href: "/courses" },
            { name: "Hi! MOOC", desc: "Suivez un parcours structuré", icon: "🎓", href: "/moocs" },
          ].map((m) => (
            <div
              key={m.name}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-3xl mb-3">{m.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{m.name}</h3>
              <p className="text-text-muted text-sm">{m.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
