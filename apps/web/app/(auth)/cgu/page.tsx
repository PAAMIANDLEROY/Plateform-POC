import Link from "next/link";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-black py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors mb-8 inline-block">
          ← Retour
        </Link>

        <h1 className="text-3xl font-extrabold text-white mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-500 text-sm mb-10">Hi! Platform — Hi! PARIS · Version 1.0 · Juin 2026</p>

        <div className="space-y-8 text-gray-300 text-sm">

          <Section title="1. Objet">
            <p>Les présentes CGU régissent l'accès et l'utilisation de la plateforme LMS Hi! Platform, développée par Hi! PARIS (HEC Paris + Institut Polytechnique de Paris). La plateforme est réservée aux membres des institutions partenaires de Hi! PARIS.</p>
          </Section>

          <Section title="2. Accès à la plateforme">
            <p>L'accès est conditionné à la possession d'une adresse email institutionnelle rattachée à un domaine autorisé par Hi! PARIS. L'utilisateur est responsable de la confidentialité de son compte et de toute activité effectuée sous celui-ci.</p>
          </Section>

          <Section title="3. Propriété intellectuelle">
            <p>L'ensemble des contenus publiés sur la plateforme (cours, vidéos, quiz, articles) sont la propriété de leurs auteurs respectifs et/ou de Hi! PARIS. Toute reproduction, distribution ou utilisation commerciale sans autorisation préalable est interdite.</p>
          </Section>

          <Section title="4. Comportement des utilisateurs">
            <ul className="list-disc list-inside space-y-1">
              <li>Ne pas partager ses identifiants d'accès</li>
              <li>Ne pas publier de contenu illégal, diffamatoire ou offensant</li>
              <li>Ne pas tenter de contourner les mécanismes de sécurité</li>
              <li>Respecter les droits de propriété intellectuelle des autres utilisateurs</li>
            </ul>
          </Section>

          <Section title="5. Données personnelles">
            <p>Le traitement des données personnelles est régi par notre <Link href="/privacy" className="text-primary underline">Politique de confidentialité</Link>, conforme au RGPD (UE 2016/679).</p>
          </Section>

          <Section title="6. Disponibilité du service">
            <p>Hi! PARIS s'engage à assurer une disponibilité de 99,5% du service (hors maintenance planifiée). Des interruptions peuvent survenir pour des raisons techniques ou de maintenance, avec notification préalable aux utilisateurs.</p>
          </Section>

          <Section title="7. Modification des CGU">
            <p>Hi! PARIS se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés de toute modification significative par email. L'utilisation continue de la plateforme vaut acceptation des CGU mises à jour.</p>
          </Section>

          <Section title="8. Droit applicable">
            <p>Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Paris.</p>
          </Section>

          <Section title="9. Contact">
            <p>Hi! PARIS — <a href="mailto:contact@hi-paris.fr" className="text-primary">contact@hi-paris.fr</a></p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      {children}
    </section>
  );
}
