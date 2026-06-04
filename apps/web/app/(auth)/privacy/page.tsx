import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors mb-8 inline-block">
          ← Retour
        </Link>

        <h1 className="text-3xl font-extrabold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-gray-500 text-sm mb-10">Hi! Platform — Hi! PARIS · Version 1.0 · Juin 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300">

          <Section title="1. Responsable du traitement">
            <p>Hi! PARIS — Centre interdisciplinaire IA & Data, porté par HEC Paris et l'Institut Polytechnique de Paris.<br />
            Contact DPO : <a href="mailto:dpo@hi-paris.fr" className="text-primary">dpo@hi-paris.fr</a></p>
          </Section>

          <Section title="2. Données collectées & bases légales">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2 pr-4">Donnée</th>
                  <th className="py-2 pr-4">Base légale</th>
                  <th className="py-2">Conservation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Nom, prénom, email", "Exécution du contrat", "Durée du compte + 1 an"],
                  ["Progression dans les cours", "Intérêt légitime pédagogique", "Durée de scolarité + 1 an"],
                  ["Résultats aux quiz", "Exécution du contrat", "Durée de scolarité + 3 ans"],
                  ["Logs de connexion", "Obligation légale / sécurité", "12 mois"],
                  ["Temps de visionnage vidéo", "Consentement (opt-in)", "6 mois glissants"],
                  ["Cookies analytiques", "Consentement (opt-in)", "13 mois max"],
                  ["Tracking comportemental", "Consentement (opt-in)", "6 mois max"],
                ].map(([d, b, c]) => (
                  <tr key={d}>
                    <td className="py-2 pr-4 text-white">{d}</td>
                    <td className="py-2 pr-4 text-gray-400">{b}</td>
                    <td className="py-2 text-gray-400">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="3. Vos droits (RGPD)">
            <ul className="space-y-2 text-sm">
              <li><strong className="text-white">Droit d'accès (Art. 15)</strong> — Obtenez l'export complet de vos données depuis votre profil.</li>
              <li><strong className="text-white">Droit de rectification (Art. 16)</strong> — Modifiez vos informations depuis votre profil à tout moment.</li>
              <li><strong className="text-white">Droit à l'effacement (Art. 17)</strong> — Demandez la suppression de votre compte depuis les paramètres. Traitement sous 30 jours.</li>
              <li><strong className="text-white">Droit à la portabilité (Art. 20)</strong> — Exportez vos données en JSON depuis votre profil.</li>
              <li><strong className="text-white">Droit d'opposition (Art. 21)</strong> — Gérez vos consentements analytics et tracking depuis le bandeau cookies ou votre profil.</li>
            </ul>
            <p className="mt-3 text-sm">Pour exercer vos droits : <a href="mailto:dpo@hi-paris.fr" className="text-primary">dpo@hi-paris.fr</a> — réponse sous 30 jours.</p>
          </Section>

          <Section title="4. Cookies">
            <p>Nous utilisons trois catégories de cookies :</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li><strong className="text-white">Nécessaires</strong> — authentification, sécurité. Toujours actifs.</li>
              <li><strong className="text-white">Analytiques</strong> — statistiques d'usage anonymisées. Opt-in requis.</li>
              <li><strong className="text-white">Tracking comportemental</strong> — suivi du parcours d'apprentissage. Opt-in requis.</li>
            </ul>
          </Section>

          <Section title="5. Sécurité">
            <p>Toutes les données sont chiffrées en transit (TLS 1.2+) et au repos. Les mots de passe ne sont jamais stockés en clair. Les tokens JWT expirent après 15 minutes. Hébergement exclusivement en Union Européenne.</p>
          </Section>

          <Section title="6. Contact & réclamation">
            <p>DPO Hi! PARIS : <a href="mailto:dpo@hi-paris.fr" className="text-primary">dpo@hi-paris.fr</a><br />
            Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" className="text-primary" target="_blank" rel="noopener noreferrer">CNIL</a>.</p>
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
