# Architecture

## Flux

1. `app/page.tsx` conserve les textes et résultats uniquement dans l’état React.
2. L’import envoie un fichier à `POST /api/import`. Le serveur lit un corps borné, valide le type, extrait le texte en mémoire avec unpdf ou Mammoth et retourne le texte. Aucun fichier n’est envoyé à Gemini.
3. Le scan/optimisation envoie le texte à `POST /api/analyze`.
4. La route valide les entrées et appelle `askGemini` avec les consignes et les données séparées. Les textes utilisateur sont explicitement traités comme des données non fiables.
5. Gemini renvoie du JSON. `lib/cv.ts` extrait un objet même entouré de texte, puis Zod valide le schéma.
6. L’optimisation vérifie les champs factuels et les chiffres, puis appelle Gemini une seconde fois pour un audit sémantique. Un échec ne produit pas de faux résultat de remplacement.
7. Le navigateur affiche les résultats et génère, sur demande, un PDF avec pdfmake.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `app/page.tsx` | Saisie, import, états de chargement/erreur, scan, résultat, copie, sélection du style. |
| `app/globals.css` | Design et règles responsive. |
| `app/layout.tsx` | Langue française et métadonnées. |
| `app/api/import/route.ts` | Extraction PDF/DOCX, 4 Mo max, 25 pages PDF, limite DOCX décompressé. |
| `app/api/analyze/route.ts` | Prompts scan/optimisation, validation, garde-fous et audit. |
| `lib/gemini.ts` | Appel REST `generateContent`, clé en en-tête serveur, réponses JSON et erreurs Gemini. |
| `lib/cv.ts` | Types, schémas, parsing, contrôle des champs, assemblage texte brut. |
| `lib/http.ts` | Réponses non mises en cache, taille maximale des requêtes et contrôle d’origine. |
| `lib/pdf.ts` | Styles Moderne, Finance, Minimal et PDF à texte sélectionnable. |
| `components/ui/select.tsx` | Sélecteur accessible basé sur Radix. |
| `public/fonts/` | Police serif et licence ; Roboto est livré avec pdfmake. |
| `.env.example` | Noms des variables, sans secret. |
| `next.config.ts`, `vercel.json` | Configuration Next.js et détection Vercel. |
| `package-lock.json` | Versions npm reproductibles avec `npm ci`. |

## Modification

- Changer le modèle : variable `GEMINI_MODEL`, sans modification du code.
- Modifier les règles de rédaction : prompts `base`, `optimize`, `scan` et audit dans la route d’analyse. Garder les contraintes d’honnêteté.
- Ajouter un champ : mettre à jour le prompt JSON, le schéma Zod, le texte brut et le PDF.
- Modifier un style PDF : `createDefinition` dans `lib/pdf.ts`. Ne pas ajouter de rasterisation, colonne, tableau ou image.
- Modifier la limite d’import : synchroniser client et serveur, sans dépasser la limite de charge utile de l’hébergeur.

Aucun SDK fournisseur n’est nécessaire : la requête HTTPS Gemini est faite avec `fetch`. Aucune clé ne se trouve dans le code client. Les erreurs fournisseur brutes ne sont ni affichées ni journalisées.
