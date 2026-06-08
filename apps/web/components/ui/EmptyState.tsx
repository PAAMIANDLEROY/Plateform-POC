/**
 * @file EmptyState.tsx
 * @description Composant état vide du design system Hi! Platform.
 *
 * Affiché quand une liste ne contient aucun élément : catalogue sans résultats,
 * parcours sans cours commencés, badges non encore obtenus, etc.
 *
 * Structure : icône emoji + titre + description optionnelle + action optionnelle (bouton/lien).
 */

/**
 * Props du composant EmptyState.
 *
 * @property icon        - Emoji affiché en grand. Défaut : `"📭"`.
 * @property title       - Message principal (obligatoire), ex. "Aucun cours commencé".
 * @property description - Message secondaire optionnel, ex. "Explorez le catalogue pour commencer.".
 * @property action      - Élément React optionnel affiché en dessous (bouton, lien).
 */
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Écran d'état vide centré verticalement.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📖"
 *   title="Aucun cours commencé"
 *   description="Explorez le catalogue pour commencer."
 *   action={<Link href="/courses">Explorer →</Link>}
 * />
 * ```
 */
export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      {/* Icône emoji en grand format */}
      <span className="text-5xl">{icon}</span>
      <div>
        <p className="text-lg font-semibold text-white">{title}</p>
        {/* Description : rendue uniquement si fournie */}
        {description && (
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>
        )}
      </div>
      {/* Action : rendue uniquement si fournie (bouton, lien, etc.) */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
