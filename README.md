# CV-ATS — Gemini, GitHub et Vercel

Application web en français pour adapter honnêtement un CV à une annonce d’emploi et analyser sa lisibilité ATS. Projet **Next.js standard** pour Vercel, avec **Supabase Auth** pour une connexion privée et un espace administrateur. Aucun compte ChatGPT ni plugin requis. Sauvegardes privées de CV sur demande, suivi de consommation Gemini et quotas par utilisateur dans Supabase.

## Version 1.2 : sauvegardes et quotas

**Si ton site fonctionne déjà : suivre [docs/SAUVEGARDES-QUOTAS.md](docs/SAUVEGARDES-QUOTAS.md)**. Exécuter la migration SQL fournie dans ton projet Supabase avant de redéployer. Aucune nouvelle clé nécessaire. Le budget initial est de 100 appels par utilisateur/mois et 100 appels pour le site/jour, réglables dans l’admin.

## Accès privé obligatoire

L’atelier et les API sont réservés aux comptes autorisés. L’administrateur crée les utilisateurs, désactive/réactive leurs accès, réinitialise leurs mots de passe et supprime les comptes. Il n’y a aucune inscription publique et aucun e-mail envoyé automatiquement.

**Commencer par [docs/AUTHENTIFICATION.md](docs/AUTHENTIFICATION.md)** pour configurer Supabase et créer ton administrateur. Sans configuration, l’accès reste fermé.

## Démarrage rapide

Prérequis : Node.js 22 LTS et npm. Ouvrir un terminal dans le dossier contenant `package.json`.

```bash
npm ci
```

Copier `.env.example` vers `.env.local` et renseigner la clé :

```dotenv
GEMINI_API_KEY=ta_cle_personnelle
GEMINI_MODEL=gemini-3.5-flash-lite
```

Ajouter aussi `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`, puis créer l’administrateur avec `npm run admin:create` comme indiqué dans le guide d’authentification. Exécuter aussi `supabase/migrations/001_saves_and_quotas.sql` dans le SQL Editor Supabase avant la première analyse.

Ne jamais mettre de clé dans GitHub. `.env.local` est ignoré par Git. Ne pas préfixer la variable par `NEXT_PUBLIC_`.

```bash
npm run dev
```

Ouvrir http://localhost:3000. Pour tester la version de production :

```bash
npm run build
npm start
```

Le mode de compilation Webpack est choisi explicitement pour une compilation reproductible des bibliothèques d’extraction/PDF. L’application reste une application Next.js native pour Vercel.

## Déployer

Suivre **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)** : création de clé Gemini, dépôt GitHub, import Vercel, variables et redéploiement. Le code et le verrou npm sont inclus ; les dépendances et les fichiers de compilation sont volontairement exclus du ZIP.

## Fonctions

- CV et annonce éditables ; annonce facultative pour le scan.
- Import `.pdf` / `.docx` côté serveur, en mémoire : **4 Mo maximum**, jusqu’à 25 pages PDF. Cette limite laisse une marge sous la limite de requête Vercel de 4,5 Mo.
- PDF sans texte extractible : message explicite, aucun OCR ni contenu inventé.
- Optimisation avec Gemini : JSON validé par Zod, contrôle des champs factuels et des chiffres, puis second appel de vérification de fidélité. Les réponses non conformes sont refusées.
- Scan : score indicatif sur le texte, points forts, problèmes, recommandations et mots-clés manquants. Les prompts prennent en compte les synonymes réellement équivalents.
- Jusqu’à 20 sauvegardes privées par compte : enregistrer une nouvelle version, charger, supprimer ; annonce et résultat optimisé facultatifs.
- Quotas persistants réservés avant Gemini ; compteurs individuels et budget partagé modifiables dans l’admin.
- Tokens réellement déclarés par Gemini, avec indication des appels sans total connu et liens AI Studio.
- Export Word modifiable dans le navigateur, sans appel IA supplémentaire.
- Copie en texte brut et téléchargement PDF : Moderne sobre, Finance classique, Minimal aéré.
- Vrai texte PDF incorporé, une colonne, sans image ni tableau. Le téléchargement est généré dans le navigateur.
- Gestion des erreurs : clé absente, quotas, modèle inaccessible, réponse incomplète, fichier illisible, délai dépassé.

Une optimisation utilise **deux appels Gemini** ; un scan en utilise un. Aucun résultat factice ne remplace l’API.

## Gratuité et confidentialité

Gemini dispose de quotas gratuits pour certains modèles/projets, avec des limites et des conditions d’accès. Le modèle est configurable par `GEMINI_MODEL`. Le choix par défaut est un modèle stable actuellement proposé : `gemini-3.5-flash-lite`. Il n’y a pas de bascule automatique vers un autre modèle ou une autre offre.

**Attention pour une publication en France / dans l’EEE : les conditions Gemini consultées le 27 septembre 2026 imposent l’utilisation des services payants lorsqu’un client API est mis à disposition d’utilisateurs dans l’EEE, en Suisse ou au Royaume-Uni.** La présence d’un quota gratuit ne signifie donc pas qu’une application publique peut être exploitée gratuitement dans ces zones. Vérifier les conditions du projet avant l’ouverture aux utilisateurs.

CV-ATS conserve les versions de CV uniquement sur clic explicite de sauvegarde, avec annonce et résultat optimisé facultatifs. Ces sauvegardes sont privées et supprimables. Le suivi des quotas conserve des métadonnées techniques sans contenu de CV. Aucun fichier importé, contenu de navigateur persistant ou journal de texte n’est créé. Les comptes et droits sont stockés par Supabase Auth ; la connexion utilise un cookie HttpOnly, et les événements d’authentification relèvent de Supabase. L’extraction s’effectue en mémoire et les endpoints utilisent `Cache-Control: no-store`. Sans sauvegarde volontaire, les textes restent uniquement dans l’onglet jusqu’à fermeture ou actualisation.

Pour analyser, CV et annonce sont transmis à **Google Gemini**. L’application n’utilise ni Files API, ni cache explicite, ni conversation conservée. Cela ne constitue pas une garantie de conservation zéro chez Google : les conditions du fournisseur, la région et l’offre s’appliquent. Les règles d’utilisation des données des services payants s’appliquent également au quota gratuit pour les utilisateurs situés dans l’EEE, en Suisse ou au Royaume-Uni, selon les conditions consultées. Ne pas ajouter d’analytics, de capture de corps de requêtes ou de logs de contenu. Vercel conserve sa propre télémétrie technique selon son offre.

## Limites

- Les vérifications ne peuvent pas garantir mathématiquement la fidélité de toutes les reformulations : relire avant d’envoyer un CV.
- Dates et intitulés sont conservés strictement ; cela peut entraîner le rejet d’une reformulation pourtant acceptable.
- Le score est une estimation textuelle, pas celui d’un ATS commercial ni une probabilité d’embauche. La mise en page d’origine n’est pas évaluée après extraction.
- Relire l’extraction, notamment pour un PDF partiellement scanné.
- Les polices fournies couvrent notamment le français et les alphabets latin, grec et cyrillique. Ajouter des polices adaptées pour d’autres écritures.
- Les visiteurs non connectés et les comptes non autorisés sont bloqués avant tout appel à Gemini. Les utilisateurs sont soumis à un quota individuel mensuel et à un budget quotidien partagé. Ces plafonds internes ne garantissent pas qu’il reste du quota officiel Google. Une requête déjà en cours peut terminer après désactivation. Une protection d’accès Vercel peut être conservée en complément.

## Vérifications locales

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Les tests Gemini utilisent des réponses simulées uniquement dans les fichiers de test : aucune clé ni facturation nécessaire pour ces tests.

## Documentation

- [Sauvegardes, migration Supabase, quotas et suivi Gemini](docs/SAUVEGARDES-QUOTAS.md)
- [Authentification, administrateur et gestion des utilisateurs](docs/AUTHENTIFICATION.md)
- [Déploiement GitHub et Vercel](docs/DEPLOIEMENT.md)
- [Architecture et points de modification](docs/ARCHITECTURE.md)
- [Vérifications et limites du test](docs/VERIFICATIONS.md)

Sources officielles consultées le 27 septembre 2026 :

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/terms
- https://vercel.com/docs/functions/limitations
