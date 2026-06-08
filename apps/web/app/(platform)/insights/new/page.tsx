/**
 * @file (platform)/insights/new/page.tsx
 * @description Éditeur d'article Hi! Insights "/insights/new" — builder WYSIWYG bloc par bloc.
 *
 * Interface d'édition en deux colonnes :
 *   - Colonne gauche (lg:col-span-1) : palette des types de blocs disponibles (sticky).
 *   - Colonne principale (lg:col-span-3) : zone d'édition (métadonnées + blocs).
 *
 * Modes :
 *   - Mode édition (défaut) : affiche la palette et le formulaire d'édition.
 *   - Mode prévisualisation : cache la palette, affiche un rendu approximatif de l'article.
 *
 * Architecture des blocs :
 *   Chaque bloc est une instance de `InsightBlock` augmentée d'un `id: number` (timestamp)
 *   pour les keys React et les opérations de suppression/déplacement.
 *
 *   - `addBlock(type)` : crée un bloc avec le contenu par défaut (`defaultContent[type]`).
 *   - `updateBlock(id, updated)` : remplace le bloc dans le tableau par ID.
 *   - `removeBlock(id)` : filtre le bloc hors du tableau.
 *   - `moveBlock(index, direction)` : échange le bloc avec son voisin (+1 ou -1).
 *
 * Composant `BlockEditor` :
 *   Affiche l'interface d'édition pour un bloc selon son type.
 *   Chaque type a ses propres champs (textarea, input, select, preview).
 *   Les props `onChange`, `onRemove`, `onMoveUp`, `onMoveDown` permettent la manipulation.
 *
 * Sauvegarde :
 *   Simule une sauvegarde (state uniquement, pas d'appel API en MVP).
 *   Affiche "✓ Sauvegardé" pendant 2.5s puis revient à "Sauvegarder".
 *
 * État initial :
 *   2 blocs pré-créés : un titre h2 "Introduction" et un bloc texte vide.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { InsightBlock } from "@/lib/mock";

/** Type interne : bloc avec ID unique pour les opérations de liste React. */
type Block = InsightBlock & { id: number };

/**
 * Définition des types de blocs disponibles dans la palette.
 * Chaque entrée génère un bouton dans la palette de gauche.
 */
const BLOCK_PALETTE = [
  { type: "heading",     label: "Titre",      icon: "H",   desc: "H2 ou H3" },
  { type: "text",        label: "Texte",      icon: "¶",   desc: "Paragraphe libre" },
  { type: "code",        label: "Code",       icon: "</>", desc: "Bloc de code" },
  { type: "quote",       label: "Citation",   icon: "❝",   desc: "Citation avec auteur" },
  { type: "key-insight", label: "Point clé",  icon: "💡",  desc: "Mise en avant" },
  { type: "figure",      label: "Figure",     icon: "🖼",  desc: "Image + légende" },
  { type: "divider",     label: "Séparateur", icon: "—",   desc: "Ligne de séparation" },
];

/**
 * Contenu par défaut pour chaque type de bloc à la création.
 * Les `as any` sont nécessaires car TypeScript ne peut pas inférer le type discriminé
 * depuis une clé string dynamique.
 */
const defaultContent: Record<string, Partial<Block>> = {
  heading:       { content: "", level: 2 } as any,
  text:          { content: "" },
  code:          { content: "", language: "python" } as any,
  quote:         { content: "", author: "" } as any,
  "key-insight": { content: "" },
  figure:        { url: "", caption: "" } as any,
  divider:       {},
};

/**
 * Éditeur de bloc individuel avec contrôles (déplacer, supprimer).
 * Rendu spécifique par type de bloc.
 *
 * @property block       - Bloc à éditer.
 * @property onChange    - Callback appelé à chaque modification du contenu.
 * @property onRemove    - Callback pour supprimer ce bloc.
 * @property onMoveUp    - Callback pour remonter ce bloc d'une position.
 * @property onMoveDown  - Callback pour descendre ce bloc d'une position.
 */
function BlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown }: {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  /** Classes communes aux champs de saisie dans un bloc — fond transparent. */
  const base = "w-full bg-transparent focus:outline-none resize-none";

  return (
    <div className="group relative bg-gray-900 border border-white/10 hover:border-white/20 rounded-xl p-5 transition-colors">
      {/* Contrôles de manipulation du bloc */}
      <div className="flex items-center gap-2 mb-3">
        {/* Badge type en haut à gauche */}
        <span className="text-xs font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wide">
          {block.type}
        </span>
        <div className="flex-1" />
        {/* Flèches de déplacement + bouton suppression */}
        <button onClick={onMoveUp}   className="text-gray-600 hover:text-white text-xs px-1.5 transition-colors">↑</button>
        <button onClick={onMoveDown} className="text-gray-600 hover:text-white text-xs px-1.5 transition-colors">↓</button>
        <button onClick={onRemove}   className="text-gray-600 hover:text-danger text-xs px-1.5 transition-colors">✕</button>
      </div>

      {/* ── Champs d'édition selon le type ── */}

      {/* Branche heading : select niveau (H2/H3) + input titre */}
      {block.type === "heading" && (
        <div className="flex gap-3 items-center">
          <select value={(block as any).level ?? 2}
            onChange={(e) => onChange({ ...block, level: Number(e.target.value) } as any)}
            className="bg-white/10 text-gray-400 text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none">
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input value={(block as any).content ?? ""}
            onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
            placeholder="Titre de la section..."
            className={`${base} text-xl font-bold text-white placeholder-gray-700 border-b border-white/10 pb-1 flex-1`}
          />
        </div>
      )}

      {/* Branche text : textarea 4 lignes */}
      {block.type === "text" && (
        <textarea value={(block as any).content ?? ""}
          onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
          placeholder="Rédigez votre paragraphe ici..."
          rows={4}
          className={`${base} text-gray-300 placeholder-gray-700 leading-relaxed`}
        />
      )}

      {/* Branche code : select langage + textarea monospaced */}
      {block.type === "code" && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <select value={(block as any).language ?? "python"}
              onChange={(e) => onChange({ ...block, language: e.target.value } as any)}
              className="bg-gray-800 text-gray-400 text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none">
              {["python", "javascript", "typescript", "bash", "r", "sql", "json"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <textarea value={(block as any).content ?? ""}
            onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
            placeholder="# Votre code ici..."
            rows={6}
            className={`${base} font-mono text-sm text-green-400 bg-gray-950 rounded-lg p-4 placeholder-gray-700 border border-white/5`}
          />
        </>
      )}

      {/* Branche quote : textarea citation + input auteur (optionnel) */}
      {block.type === "quote" && (
        <div className="border-l-4 border-danger pl-4 flex flex-col gap-2">
          <textarea value={(block as any).content ?? ""}
            onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
            placeholder="Citation..."
            rows={2}
            className={`${base} text-gray-200 italic text-lg placeholder-gray-700`}
          />
          <input value={(block as any).author ?? ""}
            onChange={(e) => onChange({ ...block, author: e.target.value } as any)}
            placeholder="— Auteur (optionnel)"
            className={`${base} text-sm text-gray-500 placeholder-gray-700`}
          />
        </div>
      )}

      {/* Branche key-insight : textarea avec fond bleu primary */}
      {block.type === "key-insight" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
          <span className="text-xl shrink-0">💡</span>
          <textarea value={(block as any).content ?? ""}
            onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
            placeholder="Point clé à mettre en avant..."
            rows={2}
            className={`${base} text-primary font-semibold placeholder-primary/30`}
          />
        </div>
      )}

      {/* Branche figure : input URL + préview live + input légende */}
      {block.type === "figure" && (
        <div className="flex flex-col gap-3">
          <input value={(block as any).url ?? ""}
            onChange={(e) => onChange({ ...block, url: e.target.value } as any)}
            placeholder="URL de l'image..."
            className={`${base} text-sm text-gray-400 placeholder-gray-700 border-b border-white/10 pb-1`}
          />
          {/* Préview de l'image si l'URL est fournie */}
          {(block as any).url && (
            <img src={(block as any).url} alt="" className="w-full max-h-48 object-cover rounded-lg border border-white/10" />
          )}
          <input value={(block as any).caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value } as any)}
            placeholder="Légende de la figure..."
            className={`${base} text-xs text-gray-500 placeholder-gray-700 text-center`}
          />
        </div>
      )}

      {/* Branche divider : simple hr — pas de contenu éditable */}
      {block.type === "divider" && (
        <hr className="border-white/10" />
      )}
    </div>
  );
}

/**
 * Page de création d'un article Insights.
 */
export default function InsightsNewPage() {
  /** Titre de l'article. */
  const [title, setTitle] = useState("");

  /** Résumé / abstract de l'article. */
  const [abstract, setAbstract] = useState("");

  /** Auteurs séparés par des virgules (formatage libre). */
  const [authors, setAuthors] = useState("");

  /** Catégorie éditoriale de l'article. */
  const [category, setCategory] = useState("IA & Cognition");

  /** Tags séparés par des virgules. */
  const [tags, setTags] = useState("");

  /**
   * Liste des blocs de contenu.
   * Initialisée avec 2 blocs : un titre h2 "Introduction" et un texte vide.
   */
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: "heading", content: "Introduction", level: 2 } as any,
    { id: 2, type: "text",    content: "" },
  ]);

  /** `true` si le mode prévisualisation est actif. */
  const [preview, setPreview] = useState(false);

  /** `true` pendant 2.5s après une sauvegarde simulée. */
  const [saved, setSaved] = useState(false);

  /**
   * Ajoute un nouveau bloc à la fin de la liste.
   * L'ID est le timestamp courant — unique dans une session normale.
   */
  function addBlock(type: string) {
    const newBlock = { id: Date.now(), type, ...defaultContent[type] } as Block;
    setBlocks((b) => [...b, newBlock]);
  }

  /**
   * Met à jour un bloc existant identifié par son `id`.
   * Préserve l'ordre des blocs.
   */
  function updateBlock(id: number, updated: Block) {
    setBlocks((b) => b.map((block) => block.id === id ? updated : block));
  }

  /** Supprime un bloc par son `id`. */
  function removeBlock(id: number) {
    setBlocks((b) => b.filter((block) => block.id !== id));
  }

  /**
   * Déplace un bloc d'une position vers le haut (-1) ou le bas (+1).
   * Ignore si le déplacement sortirait du tableau.
   */
  function moveBlock(index: number, direction: -1 | 1) {
    const newBlocks = [...blocks];
    const target = index + direction;
    // Guard : pas de déplacement hors limites
    if (target < 0 || target >= newBlocks.length) return;
    // Échange par déstructuration
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  }

  /**
   * Simule une sauvegarde (MVP — pas d'appel API).
   * Affiche le feedback "✓ Sauvegardé" pendant 2.5s.
   */
  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Barre d'actions en haut de page */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/insights" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Retour aux Insights
        </Link>
        <div className="flex items-center gap-3">
          {/* Toggle édition / prévisualisation */}
          <button onClick={() => setPreview((p) => !p)}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors font-medium ${
              // Branche prévisualisation active : fond légèrement éclairé
              preview ? "border-white/30 bg-white/10 text-white"
              // Branche mode édition : bouton transparent avec hover
              : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
            }`}>
            {preview ? "✏️ Éditer" : "👁 Prévisualiser"}
          </button>
          {/* Bouton sauvegarde — feedback visuel pendant 2.5s */}
          <button onClick={save} className="text-sm bg-gray-800 border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
            {saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
          {/* Bouton publier — action future (appel API) */}
          <button className="text-sm bg-danger text-white px-5 py-2 rounded-lg hover:bg-danger-dark transition-colors font-semibold shadow-lg shadow-danger/30">
            Publier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Palette de blocs (masquée en mode prévisualisation) ── */}
        {!preview && (
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-900 border border-white/10 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Blocs</h2>
              <div className="flex flex-col gap-2">
                {BLOCK_PALETTE.map((bp) => (
                  <button key={bp.type} onClick={() => addBlock(bp.type)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 text-left transition-all group">
                    {/* Icône du type — devient bleu au survol */}
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white text-sm font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                      {bp.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{bp.label}</p>
                      <p className="text-xs text-gray-600">{bp.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ── Zone principale : édition ou prévisualisation ── */}
        {/* En mode prévisualisation, prend toute la largeur (lg:col-span-4) */}
        <div className={preview ? "lg:col-span-4" : "lg:col-span-3"}>

          {/* Branche mode édition */}
          {!preview ? (
            <div className="flex flex-col gap-5">
              {/* Section métadonnées */}
              <div className="bg-gray-900 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Métadonnées</h2>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de l'article..."
                  className="w-full text-2xl font-extrabold text-white bg-transparent focus:outline-none placeholder-gray-700 border-b border-white/10 pb-2"
                />
                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Résumé / abstract (2-3 phrases)..."
                  rows={3}
                  className="w-full text-sm text-gray-400 bg-transparent focus:outline-none resize-none placeholder-gray-700 border-b border-white/10 pb-2"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input value={authors} onChange={(e) => setAuthors(e.target.value)}
                    placeholder="Auteurs (séparés par des virgules)"
                    className="text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30 placeholder-gray-700"
                  />
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30">
                    {["IA & Cognition", "IA & Société", "Génération & Synthèse", "IA & Raisonnement", "Mathématiques", "Sciences des données"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input value={tags} onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags (ex: LLM, Vision, NLP)"
                    className="col-span-2 text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-white/30 placeholder-gray-700"
                  />
                </div>
              </div>

              {/* Blocs de contenu éditables */}
              {blocks.map((block, i) => (
                <BlockEditor key={block.id} block={block}
                  onChange={(updated) => updateBlock(block.id, updated)}
                  onRemove={() => removeBlock(block.id)}
                  onMoveUp={() => moveBlock(i, -1)}
                  onMoveDown={() => moveBlock(i, 1)}
                />
              ))}

              {/* Zone d'ajout de bloc rapide — toujours en bas */}
              <button onClick={() => addBlock("text")}
                className="border-2 border-dashed border-white/10 rounded-xl p-5 text-sm text-gray-600 hover:border-white/30 hover:text-gray-400 transition-colors text-center">
                + Ajouter un bloc
              </button>
            </div>

          ) : (
            /* ── Branche mode prévisualisation ── */
            <div className="bg-gray-950 rounded-2xl border border-white/10 p-10">
              <div className="max-w-2xl mx-auto">
                {title && <h1 className="text-3xl font-extrabold text-white mb-4">{title}</h1>}
                {abstract && <p className="text-gray-400 text-lg mb-6 leading-relaxed">{abstract}</p>}
                {/* Séparateur auteur + catégorie */}
                {(authors || category) && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 pb-6 border-b border-white/10 mb-8">
                    {authors && <span>{authors}</span>}
                    {authors && category && <span>·</span>}
                    {category && <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-full">{category}</span>}
                  </div>
                )}
                {/* Rendu simplifié des blocs (sans le composant Block complet) */}
                <div className="flex flex-col gap-5">
                  {blocks.map((block, i) => {
                    if (block.type === "heading")
                      return (block as any).level === 2
                        ? <h2 key={i} className="text-2xl font-bold text-white mt-6">{(block as any).content}</h2>
                        : <h3 key={i} className="text-lg font-bold text-gray-200 mt-4">{(block as any).content}</h3>;
                    if (block.type === "text")
                      return <p key={i} className="text-gray-300 leading-relaxed">{(block as any).content}</p>;
                    if (block.type === "code")
                      return <pre key={i} className="bg-gray-900 border border-white/10 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto">{(block as any).content}</pre>;
                    if (block.type === "quote")
                      return (
                        <blockquote key={i} className="border-l-4 border-danger pl-5 py-1">
                          <p className="text-gray-200 italic text-lg">"{(block as any).content}"</p>
                          {(block as any).author && <cite className="text-sm text-gray-500 not-italic mt-1 block">— {(block as any).author}</cite>}
                        </blockquote>
                      );
                    if (block.type === "key-insight")
                      return (
                        <div key={i} className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex gap-3">
                          <span>💡</span>
                          <p className="text-primary font-semibold">{(block as any).content}</p>
                        </div>
                      );
                    if (block.type === "figure" && (block as any).url)
                      return (
                        <figure key={i}>
                          <img src={(block as any).url} alt={(block as any).caption} className="w-full rounded-xl border border-white/10 max-h-72 object-cover" />
                          {(block as any).caption && <figcaption className="text-center text-xs text-gray-500 mt-2">{(block as any).caption}</figcaption>}
                        </figure>
                      );
                    if (block.type === "divider") return <hr key={i} className="border-white/10 my-4" />;
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
