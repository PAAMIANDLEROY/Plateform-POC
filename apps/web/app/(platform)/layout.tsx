import { Nav } from "@/components/platform/Nav";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
