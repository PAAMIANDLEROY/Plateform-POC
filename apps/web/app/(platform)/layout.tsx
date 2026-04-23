import { Nav } from "@/components/platform/Nav";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <Nav />
      <main>{children}</main>
    </div>
  );
}
