# Architecture

## Flux

1. `app/page.tsx` vérifie la session côté serveur. Le composant `components/workspace.tsx` conserve les textes et résultats dans l'état React jusqu'à une sauvegarde volontaire via `components/saved-cvs.tsx`.
2. Les routes d'analyse/import vérifient le jeton auprès de Supabase et les droits actuels avant toute extraction ou génération. L'import envoie un fichier à `POST /api/import`. Le serveur lit un corps borné, valide le type, extrait le texte en mémoire avec unpdf ou Mammoth et retourne le texte. Aucun fichier n'est envoyé à Gemini.
3. Le scan/optimisation envoie le texte à `POST /api/analyze`.
4. La route valide les entrées et appelle `askGemini` avec les consignes et les données séparées. Les textes utilisateur sont explicitement traités comme des données non fiables.
5. Gemini renvoie du JSON. `lib/cv.ts` extrait un objet même entouré de texte, puis Zod valide le schéma.
6. L'optimisation vérifie les champs factuels et les chiffres, puis appelle Gemini une seconde fois pour un audit sémantique. Un échec ne produit pas de faux résultat de remplacement.
7. Le navigateur ouvre le résultat dans l'éditeur local. Chaque modification met à jour le résultat parent utilisé pour les sauvegardes et les exports. L'aperçu PDF et le téléchargement utilisent le même générateur pdfmake.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `app/page.tsx` | Protection serveur de l'atelier. |
| `components/workspace.tsx` | Saisie, import, scan, copie et export, état React en mémoire. |
| `app/connexion/`, `app/compte/`, `app/admin/` | Écrans de connexion, changement de mot de passe et administration. |
| `app/api/auth/` | Connexion, déconnexion et changement de mot de passe. |
| `app/api/admin/users/` | Création, pagination, activation/désactivation, reset et suppression. |
| `lib/auth/` | Clients Supabase serveur, sessions, droits, contrôles de page et validation. |
| `scripts/create-admin.mjs` | Initialisation/récupération locale d'un administrateur, sans endpoint public. |
| `app/globals.css` | Design et règles responsive. |
| `app/layout.tsx` | Langue française et métadonnées. |
| `app/api/import/route.ts` | Extraction PDF/DOCX, 4 Mo max, 25 pages PDF, limite DOCX décompressé. |
| `app/api/analyze/route.ts` | Prompts scan/optimisation, validation, garde-fous et audit. |
| `lib/gemini.ts` | Appel REST `generateContent`, clé en en-tête serveur, réponses JSON et erreurs Gemini. |
| `lib/cv.ts` | Types, schémas, parsing, contrôle des champs, assemblage texte brut. |
| `lib/http.ts` | Réponses non mises en cache, taille maximale des requêtes et contrôle d'origine. |
| `lib/pdf.ts` | Générateur commun aperçu/export, modèles Essentiel, Classique et Éditorial, PDF à texte sélectionnable. |
| `components/resume-editor.tsx`, `components/resume-preview.tsx` | Formulaire structuré, styles, offre, comparaison, aperçu HTML et PDF. |
| `lib/resume-editor.ts`, `lib/presentation.ts` | Historique immuable, réordonnancement, mots-clés et schéma du style sauvegardé. |
| `app/compte/settings.tsx`, `components/private-header.tsx`, `components/account-nav.tsx` | Panneaux du compte et navigation partagée. |
| `components/ui/select.tsx` | Sélecteur accessible basé sur Radix. |
| `public/fonts/` | Police serif et licence ; Roboto est livré avec pdfmake. |
| `.env.example` | Noms des variables, sans secret. |
| `next.config.ts`, `vercel.json` | Configuration Next.js et détection Vercel. |
| `package-lock.json` | Versions npm reproductibles avec `npm ci`. |

## Modification

- Changer le modèle : variable `GEMINI_MODEL`, sans modification du code.
- Modifier les règles de rédaction : prompts `base`, `optimize`, `scan` et audit dans la route d'analyse. Garder les contraintes d'honnêteté.
- Ajouter un champ : mettre à jour le prompt JSON, le schéma Zod, le texte brut et le PDF.
- Modifier un style PDF : `createDefinition` dans `lib/pdf.ts`. Ne pas ajouter de rasterisation, colonne, tableau ou image.
- Modifier la limite d'import : synchroniser client et serveur, sans dépasser la limite de charge utile de l'hébergeur.

Aucun SDK Gemini n'est nécessaire : la requête HTTPS Gemini est faite avec `fetch`. Aucune clé ne se trouve dans le code client. Les erreurs fournisseur brutes ne sont ni affichées ni journalisées.

## Modèle d'accès

Supabase Auth conserve les comptes. Les métadonnées serveur `app_metadata` contiennent `cvats`, `cvats_role`, `enabled`, `must_change_password` et `access_version`. Le rôle public `user_metadata` est ignoré. Chaque API protégée valide le jeton via `getUser`, puis compare ses métadonnées de version avec les valeurs actuelles. Le client ne reçoit ni clé Gemini, ni clé Supabase privilégiée, ni refresh token.

La déconnexion, la désactivation/réactivation et les changements de mot de passe changent la version d'accès. Une session ancienne est donc refusée à la prochaine requête, même si son JWT n'est pas encore expiré. La session en cookie dure au maximum une heure ; il n'y a pas de renouvellement automatique.


## Sauvegardes, clés et consommation (1.4)

- `001_saves_and_quotas.sql` est la migration historique de départ, conservée telle quelle. Elle doit être suivie de `002_personal_keys_no_quotas.sql`, qui ajoute les clés personnelles, puis de `003_shared_key_quotas.sql`, qui limite uniquement la clé partagée.
- `lib/data/saves.ts`, `/api/cvs`, `/api/cvs/[id]` : snapshots validés, accès par jeton utilisateur sous RLS et filtre propriétaire explicite.
- `lib/keys/crypto.ts` : chiffrement AES-256-GCM, nonce aléatoire, identifiant utilisateur authentifié. Le secret réside dans `API_KEY_ENCRYPTION_SECRET`.
- `lib/keys/personal.ts`, `/api/account/gemini` : lecture de statut masqué, enregistrement/remplacement et suppression de sa propre clé. La sélection de clé utilise une lecture serveur privilégiée filtrée par l'identifiant du compte authentifié. Une erreur ne permet jamais de supposer l'absence de clé personnelle.
- `lib/data/usage.ts` : enregistrement de l'analyse, suivi de chaque requête fournisseur et clôture. Les réponses Gemini sont observées avant parsing/validation, audit compris. Seules les métadonnées sont enregistrées, avec `key_source`.
- `/api/usage` : consommation et configuration masquée de la personne connectée.
- `/api/admin/usage`, `/api/admin/users` : statistiques par modèle, source de clé et utilisateur. Les mutations admin valident les plafonds et appellent des RPC réservées au serveur.
- `components/usage-card.tsx`, `app/admin/usage-dashboard.tsx`, `app/compte/gemini-form.tsx` : interfaces affichant les quotas partagés et invitant à configurer une clé personnelle.
- `lib/docx.ts` : export Word navigateur, sans API ni consommation Gemini.

Flux d'analyse : authentification/droits → validation des entrées → sélection/déchiffrement de la clé → ouverture d'une ligne de suivi → tentative enregistrée avant chaque requête Gemini → métadonnées de réponse → validation/audit → clôture. La même clé et le même modèle sont utilisés pour toute l'analyse. L'authentification est vérifiée avant la lecture du corps. Aucune clé ne vient du corps de `/api/analyze`.

La RPC `cvats_admit_run` exige la migration 003 et délègue à `cvats_begin_run`. Pour une clé partagée, une transaction verrouille la politique, vérifie les limites et réserve 1 ou 2 appels. Une clôture rend les appels non tentés ; un crash conserve la réservation. Les anciens points d'entrée restent soumis aux mêmes plafonds. Les clés personnelles sont suivies mais ne consomment aucun quota interne. Les fonctions sont réservées à `service_role`. Voir `QUOTAS-IA.md`.

Les enregistrements de clés sont inaccessibles aux rôles navigateur, même chiffrés. Seuls un statut, le modèle, la date et les quatre derniers caractères peuvent être renvoyés à leur propriétaire. Un incident de déchiffrement ou de base bloque l'analyse, sans utiliser la clé partagée. Les clés ne sont jamais incluses dans les statistiques.

Voir `CLES-PERSONNELLES.md` pour la migration, le routage, le secret de chiffrement, les limites réelles Gemini et les contrôles après déploiement.

## Éditeur et diagnostic (1.5)

Le style est stocké dans le champ facultatif `result.presentation` du JSON de sauvegarde existant. Les anciennes versions sont compatibles, sans migration supplémentaire. L'historique d'édition est borné et reste en mémoire ; aucune modification n'appelle Gemini. Les URLs blob du PDF sont révoquées au remplacement ou au démontage du composant ; un aperçu périmé demande une régénération. Les champs de présentation sont énumérés et validés, sans CSS arbitraire.

Les critères détaillés du scan restent facultatifs pour les réponses anciennes. `groundScan` additionne les critères fournis et ne conserve que les citations présentes dans la source après normalisation des espaces. Les corrections restent des conseils, sans mutation automatique du CV.

## Diagnostic éditorial (1.6)

`lib/scan-prompt.ts` demande les dix contrôles et les exigences contextualisées. `lib/diagnostic-schema.ts` borne les catégories et preuves. `lib/diagnostic.ts` enrichit la réponse validée : citations, règles locales, métriques, comparaison des termes et des exigences. Ce traitement conserve le seul appel IA du scan. `components/diagnostic-details.tsx` affiche les contrôles et le relevé ; `components/scan-report.tsx` filtre les corrections. Les champs supplémentaires du scan sont facultatifs pour la compatibilité. `lib/keywords.ts` partage entre atelier, éditeur et scan les listes et variantes étroites, sans cache des textes personnels.
