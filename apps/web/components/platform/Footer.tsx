import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Hi! PARIS — HEC Paris & Institut Polytechnique de Paris</p>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Confidentialité</Link>
          <Link href="/cgu" className="hover:text-gray-400 transition-colors">CGU</Link>
          <a href="mailto:contact@hi-paris.fr" className="hover:text-gray-400 transition-colors">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
