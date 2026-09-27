# Architecture

## Flux

1. `app/page.tsx` vérifie la session côté serveur. Le composant `components/workspace.tsx` conserve les textes et résultats dans l’état React jusqu’à une sauvegarde volontaire via `components/saved-cvs.tsx`.
2. Les routes d’analyse/import vérifient le jeton auprès de Supabase et les droits actuels avant toute extraction ou génération. L’import envoie un fichier à `POST /api/import`. Le serveur lit un corps borné, valide le type, extrait le texte en mémoire avec unpdf ou Mammoth et retourne le texte. Aucun fichier n’est envoyé à Gemini.
3. Le scan/optimisation envoie le texte à `POST /api/analyze`.
4. La route valide les entrées et appelle `askGemini` avec les consignes et les données séparées. Les textes utilisateur sont explicitement traités comme des données non fiables.
5. Gemini renvoie du JSON. `lib/cv.ts` extrait un objet même entouré de texte, puis Zod valide le schéma.
6. L’optimisation vérifie les champs factuels et les chiffres, puis appelle Gemini une seconde fois pour un audit sémantique. Un échec ne produit pas de faux résultat de remplacement.
7. Le navigateur affiche les résultats et génère, sur demande, un PDF avec pdfmake.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `app/page.tsx` | Protection serveur de l’atelier. |
| `components/workspace.tsx` | Saisie, import, scan, copie et export, état React en mémoire. |
| `app/connexion/`, `app/compte/`, `app/admin/` | Écrans de connexion, changement de mot de passe et administration. |
| `app/api/auth/` | Connexion, déconnexion et changement de mot de passe. |
| `app/api/admin/users/` | Création, pagination, activation/désactivation, reset et suppression. |
| `lib/auth/` | Clients Supabase serveur, sessions, droits, contrôles de page et validation. |
| `scripts/create-admin.mjs` | Initialisation/récupération locale d’un administrateur, sans endpoint public. |
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

Aucun SDK Gemini n’est nécessaire : la requête HTTPS Gemini est faite avec `fetch`. Aucune clé ne se trouve dans le code client. Les erreurs fournisseur brutes ne sont ni affichées ni journalisées.

## Modèle d’accès

Supabase Auth conserve les comptes. Les métadonnées serveur `app_metadata` contiennent `cvats`, `cvats_role`, `enabled`, `must_change_password` et `access_version`. Le rôle public `user_metadata` est ignoré. Chaque API protégée valide le jeton via `getUser`, puis compare ses métadonnées de version avec les valeurs actuelles. Le client ne reçoit ni clé Gemini, ni clé Supabase privilégiée, ni refresh token.

La déconnexion, la désactivation/réactivation et les changements de mot de passe changent la version d’accès. Une session ancienne est donc refusée à la prochaine requête, même si son JWT n’est pas encore expiré. La session en cookie dure au maximum une heure ; il n’y a pas de renouvellement automatique.


## Sauvegardes et consommation (1.2)

- `supabase/migrations/001_saves_and_quotas.sql` : tables, RLS et fonctions transactionnelles.
- `lib/data/saves.ts`, `/api/cvs`, `/api/cvs/[id]` : snapshots volontaires validés, accès par jeton utilisateur sous RLS et filtre propriétaire explicite.
- `lib/data/usage.ts` : réservations, suivi de chaque requête fournisseur et clôture. Les réponses Gemini sont observées avant parsing/validation, audit compris. Seules les métadonnées sont enregistrées.
- `/api/usage` : quota de la personne connectée uniquement.
- `/api/admin/usage`, `/api/admin/users/[id]/quota` : tableau global, budget quotidien et quotas individuels ; contrôle du rôle admin puis RPC privilégiée.
- `components/usage-card.tsx`, `app/admin/usage-dashboard.tsx` : interfaces et affichage des limites du suivi.
- `lib/docx.ts` : export Word côté navigateur, à la demande, sans API ni consommation Gemini.

Flux d’analyse : authentification/droits → validation des entrées → réservation atomique (1 ou 2 appels) → enregistrement de tentative avant chaque `fetch` → stockage des métadonnées de réponse → validation/audit → clôture et libération des seuls appels non tentés. L’authentification est en pratique vérifiée avant la lecture du corps, afin de refuser tôt les visiteurs anonymes. Une erreur de réservation bloque l’IA. Un crash laisse une réservation prudente.

Les fonctions de comptage sont réservées à `service_role`, jamais à un jeton utilisateur. Les réservations se verrouillent sur la ligne de paramètres, commune à toutes les instances Vercel ; aucun quota n’est fondé sur une Map mémoire. Pour modifier les valeurs de départ ou les unités/périodes, créer une nouvelle migration explicite et adapter les interfaces/documentations ; ne pas modifier silencieusement des compteurs existants.

Voir `SAUVEGARDES-QUOTAS.md` pour les schémas, règles de période, données conservées et limites du suivi Google.
