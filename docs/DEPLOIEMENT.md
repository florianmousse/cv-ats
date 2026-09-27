# Publier CV-ATS sur GitHub puis Vercel

## Avant de déployer : configurer l’accès privé

Suivre **[AUTHENTIFICATION.md](AUTHENTIFICATION.md)** : créer un projet Supabase, désactiver les inscriptions publiques, renseigner les trois variables Supabase et créer ton administrateur avec `npm run admin:create`. Aucun visiteur ne peut utiliser l’atelier sans un compte autorisé.

## 1. Extraire le ZIP

Décompresser l’archive. Le dossier `cv-ats` contient `package.json`, `app`, `lib`, `public` et cette documentation. C’est **son contenu** qui doit être à la racine du dépôt GitHub.

## 2. Obtenir une clé Gemini

1. Aller sur https://aistudio.google.com/apikey et se connecter à son compte Google.
2. Créer une clé pour un projet autorisé à utiliser Gemini.
3. Vérifier dans Google AI Studio le quota, l’offre et les modèles accessibles au projet.
4. Conserver la clé pour Vercel ou `.env.local`. Ne pas la mettre dans le dépôt, le code, une capture d’écran ou une variable publique.

Modèle par défaut : `gemini-3.5-flash-lite`. Pour changer de modèle, définir `GEMINI_MODEL` avec l’identifiant exact d’un modèle de génération de texte compatible JSON accessible à ton projet. Les modèles 2.5 peuvent être réservés aux projets les ayant déjà utilisés : ne pas les choisir automatiquement pour un nouveau projet.

Le quota gratuit n’est pas illimité. Une optimisation compte deux appels (génération et audit), un scan un appel. Pour les conditions de publication à destination d’utilisateurs en France/EEE et l’utilisation des données, lire la section correspondante du README.

## 3. Envoyer le code sur GitHub

### Avec GitHub Desktop

1. Créer un nouveau dépôt à partir du dossier `cv-ats`.
2. Vérifier que `.env.local`, `node_modules` et `.next` ne sont pas dans la liste des fichiers à publier.
3. Faire un premier commit, puis **Publish repository**.
4. Choisir public ou privé selon le besoin : Vercel peut importer les deux si tu lui donnes accès.

### Avec Git en ligne de commande

Créer un dépôt GitHub vide, puis dans le dossier contenant `package.json` :

```bash
git init
git add .
git commit -m "Initialise CV-ATS avec Gemini"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/cv-ats.git
git push -u origin main
```

Remplacer `TON-COMPTE` par le compte réel. Si tu téléverses par l’interface web de GitHub, déposer les fichiers et dossiers extraits, **pas le ZIP**. Vérifier la présence de `.gitignore` et de `package-lock.json`.

## 4. Importer le dépôt sur Vercel

1. Aller sur https://vercel.com et choisir **Add New → Project**.
2. Autoriser l’accès au dépôt GitHub, puis l’importer.
3. Framework : **Next.js**.
4. Root Directory : le dossier contenant `package.json` (la racine si l’étape précédente a été suivie).
5. Node.js : **22.x** dans les réglages du projet.
6. Build Command : `npm run build` (détection automatique possible).
7. Install Command : `npm ci`.
8. Output Directory : laisser la valeur Next.js par défaut ; ne pas mettre `out` ou `dist`.
9. Avant le déploiement, ajouter les variables ci-dessous.

| Variable | Valeur | Obligatoire |
| --- | --- | --- |
| `GEMINI_API_KEY` | Ta clé Google AI Studio | Oui |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` ou un modèle compatible accessible à ton projet | Non, valeur par défaut intégrée |
| `SUPABASE_URL` | URL du projet Auth | Oui |
| `SUPABASE_ANON_KEY` | Clé anon ou publishable | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role ou secret, privée côté serveur | Oui |

Sélectionner l’environnement **Production** et, si souhaité, **Preview**. Garder la clé en variable sensible lorsque l’option est proposée. Aucune clé n’est nécessaire pour compiler : elle n’est lue qu’au moment d’un appel d’analyse.

10. Cliquer **Deploy**.

L’application utilise des fonctions Node.js. Supabase Auth est utilisé pour les comptes ; aucune table SQL personnalisée, aucun stockage Blob, aucun bucket et aucun service Cloudflare ne sont nécessaires. Ne pas ajouter `ADMIN_EMAIL` ou `ADMIN_PASSWORD` à Vercel : ces variables servent uniquement au script local.

## 5. Vérifier après déploiement

- Ouvrir le site, se connecter en tant qu’administrateur et changer le mot de passe temporaire.
- Importer un petit PDF ou DOCX non confidentiel de test.
- Vérifier qu’une fenêtre privée non connectée n’accède pas à l’atelier.
- Tester la création puis la désactivation d’un compte utilisateur.
- Vérifier le texte extrait.
- Lancer un scan, puis une optimisation avec une annonce.
- Vérifier la fidélité des informations et tester les trois exports PDF.
- Si le site doit rester personnel, vérifier sa protection d’accès dans Vercel.

## Modifier une variable après publication

Dans **Project → Settings → Environment Variables**, modifier ou ajouter la variable puis effectuer un **Redeploy**. Les anciens déploiements ne reçoivent pas automatiquement la nouvelle valeur.

## Erreurs fréquentes

| Message / symptôme | Action |
| --- | --- |
| Accès privé non configuré | Ajouter les trois variables Supabase puis redéployer. |
| Compte non autorisé | Créer le compte depuis le script administrateur ou l’interface `/admin`, pas simplement depuis le tableau de bord Supabase. |
| Session révoquée / expirée | Se reconnecter ; si le compte est désactivé, demander sa réactivation à l’administrateur. |
| IA non activée | Ajouter `GEMINI_API_KEY` dans le bon environnement puis redéployer. |
| Quota Gemini atteint / HTTP 429 | Consulter le quota AI Studio, attendre sa réinitialisation, vérifier l’éligibilité du modèle. Ne pas lancer des tentatives en boucle. |
| Modèle indisponible / HTTP 404 | Choisir un modèle accessible, modifier `GEMINI_MODEL`, redéployer. |
| Gemini refuse la requête | Vérifier la clé, les autorisations du projet et l’accès au modèle. |
| Import trop volumineux | Limite volontaire de 4 Mo ; réduire le PDF ou coller le texte. |
| PDF scanné | Coller manuellement le texte ; aucun OCR n’est intégré. |
| Délai dépassé | Raccourcir le contenu et réessayer. La route déclare 120 s côté Vercel, et interrompt les appels Gemini après 80 s. Vérifier le plafond du plan si nécessaire. |
| Build introuvable / mauvaise sortie | Utiliser le preset Next.js et la racine contenant `package.json`, sans export statique. |
| Différence entre local et Vercel | Vérifier les versions Node, les variables d’environnement et le dernier commit déployé. |

Sources : https://vercel.com/docs/frameworks/full-stack/nextjs ; https://vercel.com/docs/environment-variables ; https://vercel.com/docs/functions/limitations ; https://ai.google.dev/gemini-api/docs/api-key
