# CV-ATS — Gemini, GitHub et Vercel

Application web en français pour adapter honnêtement un CV à une annonce d’emploi et analyser sa lisibilité ATS. Projet **Next.js standard** pour Vercel, avec **Supabase Auth** pour une connexion privée et un espace administrateur. Aucun compte ChatGPT ni plugin requis. Sauvegardes privées de CV sur demande, suivi de consommation Gemini et clés Gemini personnelles chiffrées dans Supabase. Quotas configurables pour la clé partagée uniquement.

## Version 1.8 : dossier de candidature persistant

Le CV éditable, le diagnostic et la lettre sont indépendants. Le scan utilise la version actuelle de l’éditeur et conserve les documents existants, y compris en cas d’échec. Quatre espaces regroupent le travail : Mon CV, Diagnostic, Lettre de motivation, Outils et IA. Un brouillon local par compte permet de reprendre pendant sept jours ; il est désactivable et effacé à la déconnexion explicite. Les prompts exportables restent disponibles sans quota. La version apparaît dans le menu d’administration.

**À déployer avec [la migration 004](supabase/migrations/004_candidature_workflows.sql), après 003.** Les lettres et la structuration consomment au maximum deux appels, vérification comprise. Voir [le guide de candidature](docs/CANDIDATURE.md). Le diagnostic repère les anglicismes contextuels, applique un barème plus exigeant et masque la note globale si la relecture est incomplète.

## Version 1.7 : contrôles vérifiables et score explicable

Le rapport ajoute 14 contrôles mécaniques avec trois états (vérifié, à examiner, inconnu). Les pages PDF et leur présence de texte sont mesurées à l’import ; le texte collé ne reçoit aucune validation de fichier. Les corrections IA doivent citer le CV et fournir une proposition exploitable. Le score est recalculé après déduplication sur cinq dimensions de 20 points, avec le coût visible de chaque correction et un avertissement si la relecture est incomplète. Le nombre de mots, de pages ou l’écart avec l’annonce n’entraîne pas de pénalité automatique. Voir [la méthode et ses limites](docs/DIAGNOSTIC.md). Toujours un appel Gemini et aucune nouvelle migration.

## Version 1.6 : diagnostic éditorial et exigences de l’offre

Le scan examine dix axes : orthographe, typographie, volume, phrases d’expérience, réalisations, structure, dates, compétences, adéquation et clarté. Des règles locales complètent la relecture IA. Les mots-clés couvrent davantage d’outils et les versions ; un relevé séparé garde les extraits de l’annonce et les preuves du CV. Voir [le guide du diagnostic](docs/DIAGNOSTIC.md). Le scan reste à un appel IA, sans nouvelle migration.

## Version 1.5 : éditeur de CV et navigation simplifiée

Après optimisation, édite le contenu dans un atelier avec aperçu, trois modèles, couleurs, densité, annuler/rétablir et comparaison avec la source. Le texte et le style sont conservés dans les versions sauvegardées. Le diagnostic détaille ses critères et ses conseils ; Mon compte distingue IA/consommation et sécurité. Voir [le guide de l’éditeur](docs/EDITEUR-CV.md). Aucune migration supplémentaire après 003.

## Version 1.4 : quotas partagés et atelier de mots-clés

**Mise à jour : [docs/QUOTAS-IA.md](docs/QUOTAS-IA.md)**. Appliquer la migration 003 après 001 et 002, puis redéployer. L’admin configure le plafond quotidien du site, le quota mensuel par défaut et les exceptions par compte. Les clés personnelles restent prioritaires et hors quota interne. L’atelier propose aussi un repérage local de mots-clés et un diagnostic organisé par priorité.

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

Ajouter aussi `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`, puis créer l’administrateur avec `npm run admin:create` comme indiqué dans le guide d’authentification. Sur une installation neuve, exécuter les migrations SQL 001, 002, 003 puis 004 dans le SQL Editor Supabase avant la première analyse. Configurer `API_KEY_ENCRYPTION_SECRET` pour les clés personnelles ; voir le guide dédié.

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
- Clé personnelle chiffrée, modèle personnel facultatif, clé partagée uniquement en l’absence de clé personnelle.
- Quotas sur la clé du site : 10 appels par mois et par compte, 100 par jour pour le site par défaut, réglables par l’admin ; 0 impose une clé personnelle.
- Atelier local de mots-clés : quatre domaines ou liste personnalisée, repérage dans le CV et l’annonce sans appel IA.
- Tokens réellement déclarés par Gemini, avec indication des appels sans total connu et liens AI Studio.
- Export Word modifiable dans le navigateur, sans appel IA supplémentaire.
- Copie en texte brut et téléchargement PDF : Essentiel, Classique et Éditorial, avec couleur et densité au choix.
- Vrai texte PDF incorporé, une colonne, sans image ni tableau. Le téléchargement est généré dans le navigateur.
- Gestion des erreurs : clé absente, quotas, modèle inaccessible, réponse incomplète, fichier illisible, délai dépassé.

Une optimisation utilise **deux appels Gemini** ; un scan en utilise un. Aucun résultat factice ne remplace l’API.

## Gratuité et confidentialité

Gemini dispose de quotas gratuits pour certains modèles/projets, avec des limites et des conditions d’accès. Le modèle est configurable par `GEMINI_MODEL`. Le choix par défaut est un modèle stable actuellement proposé : `gemini-3.5-flash-lite`. Il n’y a pas de bascule automatique vers un autre modèle ou une autre offre.

**Attention pour une publication en France / dans l’EEE : les conditions Gemini consultées le 27 septembre 2026 imposent l’utilisation des services payants lorsqu’un client API est mis à disposition d’utilisateurs dans l’EEE, en Suisse ou au Royaume-Uni.** La présence d’un quota gratuit ne signifie donc pas qu’une application publique peut être exploitée gratuitement dans ces zones. Vérifier les conditions du projet avant l’ouverture aux utilisateurs.

CV-ATS conserve les versions de CV uniquement sur clic explicite de sauvegarde, avec annonce et résultat optimisé facultatifs. Ces sauvegardes sont privées et supprimables. Le suivi de consommation conserve des métadonnées techniques sans contenu de CV. Aucun fichier importé, contenu de navigateur persistant ou journal de texte n’est créé. Les clés personnelles sont conservées chiffrées, sans être renvoyées au navigateur. Les comptes et droits sont stockés par Supabase Auth ; la connexion utilise un cookie HttpOnly, et les événements d’authentification relèvent de Supabase. L’extraction s’effectue en mémoire et les endpoints utilisent `Cache-Control: no-store`. Sans sauvegarde volontaire, les textes restent uniquement dans l’onglet jusqu’à fermeture ou actualisation.

Pour analyser, CV et annonce sont transmis à **Google Gemini**. L’application n’utilise ni Files API, ni cache explicite, ni conversation conservée. Cela ne constitue pas une garantie de conservation zéro chez Google : les conditions du fournisseur, la région et l’offre s’appliquent. Les règles d’utilisation des données des services payants s’appliquent également au quota gratuit pour les utilisateurs situés dans l’EEE, en Suisse ou au Royaume-Uni, selon les conditions consultées. Ne pas ajouter d’analytics, de capture de corps de requêtes ou de logs de contenu. Vercel conserve sa propre télémétrie technique selon son offre.

## Limites

- Les vérifications ne peuvent pas garantir mathématiquement la fidélité de toutes les reformulations : relire avant d’envoyer un CV.
- Dates et intitulés sont conservés strictement ; cela peut entraîner le rejet d’une reformulation pourtant acceptable.
- Le score est une estimation textuelle, pas celui d’un ATS commercial ni une probabilité d’embauche. La mise en page d’origine n’est pas évaluée après extraction.
- Relire l’extraction, notamment pour un PDF partiellement scanné.
- Les polices fournies couvrent notamment le français et les alphabets latin, grec et cyrillique. Ajouter des polices adaptées pour d’autres écritures.
- Les visiteurs non connectés et les comptes non autorisés sont bloqués avant tout appel à Gemini. Les quotas internes s’appliquent uniquement à la clé partagée, administrateurs compris. Les limites Gemini restent liées au projet Google utilisé ; deux clés du même projet partagent ses limites. Une requête déjà en cours peut terminer après désactivation. Une protection d’accès Vercel peut être conservée en complément.

## Vérifications locales

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Les tests Gemini utilisent des réponses simulées uniquement dans les fichiers de test : aucune clé ni facturation nécessaire pour ces tests.

## Documentation

- [Éditeur, diagnostic et nouvelle navigation](docs/EDITEUR-CV.md)

- [Quotas de la clé du site et migration 003](docs/QUOTAS-IA.md)

- [Clés personnelles et chiffrement](docs/CLES-PERSONNELLES.md)
- [Sauvegardes et suivi Gemini](docs/SAUVEGARDES-QUOTAS.md)
- [Revue du dépôt de référence et améliorations retenues](docs/REPO-REFERENCE.md)
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

### Correctifs 1.8.1

Score toujours visible (indicatif si relecture incomplète), corrections orthographiques courtes préservées, plusieurs fautes d’une même phrase conservées. Lettres en trois paragraphes Je / Vous / Nous avec contrôle de personnalisation et actualité facultative renseignée par l’utilisateur (extrait, source, date). Les URLs ne sont pas consultées automatiquement. Voir [le guide candidature](docs/CANDIDATURE.md). Aucune migration supplémentaire après 004.
