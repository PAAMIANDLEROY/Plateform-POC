/**
 * @file export.ts
 * @description Utilitaires d'export de données côté client.
 *
 * Fonctions pures (sans dépendance React) utilisées pour :
 *   - Générer et télécharger des fichiers CSV depuis le navigateur.
 *   - Produire un horodatage formaté pour nommer les fichiers d'export.
 *
 * Conformité RGPD :
 *   `downloadCSV` est utilisé dans le tableau de bord admin pour exporter les données
 *   utilisateurs (Art. 20 — droit à la portabilité).
 *   Le BOM UTF-8 garantit une ouverture correcte dans Excel sans problème d'encodage.
 */

/**
 * Génère et déclenche le téléchargement d'un fichier CSV encodé en UTF-8 avec BOM.
 *
 * Le BOM (Byte Order Mark `﻿`) est ajouté en tête du fichier pour qu'Excel
 * détecte automatiquement l'encodage UTF-8 et affiche correctement les accents.
 *
 * Mécanisme de téléchargement :
 *   1. Création d'un `Blob` avec le contenu CSV.
 *   2. Création d'une URL temporaire via `URL.createObjectURL`.
 *   3. Injection d'un `<a>` invisible dans le DOM, clic programmatique, puis nettoyage.
 *   Cette approche fonctionne dans tous les navigateurs modernes sans dépendance externe.
 *
 * @param rows     - Tableau d'objets représentant les lignes du CSV.
 *                   Les clés du premier objet deviennent les en-têtes de colonnes.
 * @param filename - Nom du fichier téléchargé (ex. `"users-2026-06-08.csv"`).
 *
 * @example
 * ```ts
 * downloadCSV(
 *   [{ nom: "Alice", email: "alice@exemple.fr", score: 92 }],
 *   "export-etudiants.csv"
 * );
 * ```
 */
export function downloadCSV(
  rows: Record<string, string | number | null | undefined>[],
  filename: string
): void {
  // Garde : ne rien faire si le tableau est vide (évite un fichier CSV avec seulement les en-têtes)
  if (rows.length === 0) return;

  /** En-têtes déduits des clés du premier objet (ordre d'insertion conservé). */
  const headers = Object.keys(rows[0]);

  /**
   * Échappe une valeur de cellule CSV selon la RFC 4180 :
   * - Wrap entre guillemets si la valeur contient une virgule, un guillemet ou un saut de ligne.
   * - Les guillemets internes sont doublés (`"` → `""`).
   * - Les valeurs `null`/`undefined` sont converties en chaîne vide.
   */
  function escapeCell(val: string | number | null | undefined): string {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }

  const csvLines = [
    // Ligne d'en-têtes
    headers.map(escapeCell).join(","),
    // Lignes de données : chaque objet est transformé en ligne CSV ordonnée par `headers`
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ];

  // BOM UTF-8 (U+FEFF) pour compatibilité Excel
  const blob = new Blob(["﻿" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  // Création d'une URL objet temporaire pour déclencher le téléchargement
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Ajout temporaire au DOM requis par Firefox
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Libération de la mémoire allouée pour l'URL objet
  URL.revokeObjectURL(url);
}

/**
 * Retourne la date du jour au format `YYYY-MM-DD` pour nommer les fichiers d'export.
 *
 * @returns Chaîne ISO tronquée à la date (ex. `"2026-06-08"`).
 *
 * @example
 * ```ts
 * downloadCSV(rows, `users-${todayStamp()}.csv`);
 * // → télécharge "users-2026-06-08.csv"
 * ```
 */
export function todayStamp(): string {
  // `toISOString()` retourne "YYYY-MM-DDTHH:mm:ss.sssZ" — on garde les 10 premiers caractères
  return new Date().toISOString().slice(0, 10);
}
