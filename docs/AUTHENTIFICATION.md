# Accès privé et administration

Cette version impose une connexion avant l’accès à l’atelier. Les routes d’analyse, d’import et d’administration vérifient aussi les droits côté serveur. Masquer un bouton ne constitue pas la protection : même un appel HTTP direct doit être authentifié.

## 1. Créer un projet Supabase dédié

1. Aller sur https://supabase.com/dashboard et créer un projet dédié à CV-ATS.
2. Dans **Authentication → Sign In / Providers**, conserver la connexion **Email / Password**.
3. Désactiver **Allow new users to sign up** et **Allow anonymous sign-ins**. Ne pas activer de connexion sociale pour cette application.
4. Dans **Authentication → URL Configuration**, renseigner l’URL Vercel du site dans **Site URL** lorsque tu la connais.
5. Dans les paramètres du projet, récupérer l’URL du projet et les clés API :
   - URL → `SUPABASE_URL` ;
   - clé `anon` (ou clé publishable) → `SUPABASE_ANON_KEY` ;
   - clé privilégiée `service_role` (ou clé secret côté serveur) → `SUPABASE_SERVICE_ROLE_KEY`.

Les noms des variables de cette application restent ceux ci-dessus, même si l’interface Supabase propose les nouvelles clés publishable/secret. **La clé service_role/secret est exclusivement serveur** : jamais dans GitHub, dans une variable `NEXT_PUBLIC_`, ni dans le navigateur.

Les comptes résident dans Supabase Auth. **Depuis la version 1.2, exécuter aussi `supabase/migrations/001_saves_and_quotas.sql` dans le SQL Editor** pour les sauvegardes et quotas ; voir `SAUVEGARDES-QUOTAS.md`. Aucun bucket n’est nécessaire. Les droits sont dans `app_metadata`, modifiable uniquement par le serveur privilégié. `user_metadata`, modifiable par les utilisateurs, n’est jamais utilisé pour autoriser un accès.

## 2. Créer ton administrateur depuis ton ordinateur

Dans le dossier contenant `package.json` :

```bash
npm ci
```

Copier `.env.example` en `.env.local`. Sous Windows PowerShell :

```powershell
Copy-Item .env.example .env.local
```

Renseigner dans `.env.local` :

```dotenv
GEMINI_API_KEY=ta_cle_gemini
GEMINI_MODEL=gemini-3.5-flash-lite
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_ANON_KEY=ta_cle_anon_ou_publishable
SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role_ou_secret
ADMIN_EMAIL=ton.adresse@example.com
ADMIN_PASSWORD="un_mot_de_passe_temporaire_unique_de_12_caracteres_minimum"
```

Remplacer toutes les valeurs d’exemple. Ne pas envoyer ce fichier au dépôt. Les guillemets autour du mot de passe évitent notamment qu’un `#` soit interprété comme le début d’un commentaire.

Exécuter :

```bash
npm run admin:create
```

Le script crée le compte administrateur et ses droits. Il ne publie pas le site, n’envoie aucun e-mail et ne crée aucun compte de démonstration. Si le compte existe, il refuse de le modifier automatiquement. **Créer manuellement un utilisateur dans le tableau de bord Supabase ne suffit pas** : sans les métadonnées d’autorisation, il est refusé par CV-ATS.

Supprimer ensuite `ADMIN_PASSWORD` de `.env.local`. Les deux variables `ADMIN_EMAIL` et `ADMIN_PASSWORD` ne sont utiles qu’aux commandes d’initialisation/récupération : ne pas les ajouter à Vercel.

## 3. Configurer Vercel

Ajouter les variables suivantes dans **Settings → Environment Variables** :

| Variable | Utilité |
| --- | --- |
| `GEMINI_API_KEY` | Clé Gemini privée |
| `GEMINI_MODEL` | Modèle Gemini, facultatif |
| `SUPABASE_URL` | URL du projet Auth |
| `SUPABASE_ANON_KEY` | Clé client Auth utilisée ici côté serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé privilégiée de gestion des comptes, côté serveur uniquement |

Les variables requises pour la connexion sont les trois variables Supabase. Si elles sont absentes, le site reste **fermé**, avec une page de configuration : il ne bascule jamais en accès libre. Une clé Gemini absente bloque uniquement les analyses.

Sélectionner les environnements nécessaires, puis redéployer. Préférer un projet Supabase distinct pour les previews si d’autres personnes contribuent au code : toute personne qui peut déployer du code avec la clé privilégiée peut administrer les comptes.

## 4. Première connexion

1. Ouvrir `/connexion` et saisir les identifiants de l’administrateur.
2. Choisir un nouveau mot de passe dans `/compte` : cette étape est obligatoire.
3. Se reconnecter avec le nouveau mot de passe.
4. Ouvrir **Administration** dans la barre supérieure, ou `/admin`.

## 5. Ajouter une personne

1. Dans `/admin`, saisir son adresse e-mail et cliquer **Créer l’accès**.
2. Copier le mot de passe temporaire affiché une fois.
3. Transmettre toi-même, par un canal privé, le lien du site, l’adresse de connexion et ce mot de passe.
4. La personne doit changer ce mot de passe avant de pouvoir utiliser Gemini.

Aucun e-mail automatique, fournisseur SMTP, invitation externe ou inscription publique n’est intégré. L’adresse est validée par l’administrateur au moment de l’ajout ; ce parcours ne vérifie pas automatiquement la propriété de la boîte mail.

## 6. Gérer les accès

- **Désactiver** : bloque la connexion et les nouvelles requêtes ; les sessions déjà ouvertes deviennent inutilisables pour l’atelier.
- **Réactiver** : permet une nouvelle connexion. Les anciens cookies ne sont pas réhabilités.
- **Réinitialiser le mot de passe** : génère un nouveau mot de passe temporaire et révoque les anciennes sessions. Le compte reste désactivé s’il l’était déjà.
- **Supprimer** : supprime le compte Supabase Auth et ses sauvegardes de CV. Une confirmation est demandée dans l’interface.
- Les comptes administrateurs sont protégés : ils ne peuvent pas être désactivés, réinitialisés ou supprimés depuis cette liste. Pour ton propre mot de passe, utiliser **Mon compte**.

Les nouveaux comptes créés dans l’interface sont toujours des utilisateurs ordinaires : on ne peut pas s’attribuer le rôle administrateur dans une requête.

Une analyse déjà acceptée avant une révocation peut terminer son exécution et consommer les tokens associés. L’accès est bloqué à la prochaine requête ; il n’y a pas d’annulation distante d’une génération déjà en cours.

## 7. Mot de passe administrateur oublié

Sur ton ordinateur, renseigner temporairement `ADMIN_EMAIL` et un nouveau `ADMIN_PASSWORD` dans `.env.local`, avec les clés Supabase. Puis :

```bash
npm run admin:reset
```

Cette commande refuse de promouvoir un utilisateur ordinaire : elle réinitialise uniquement un administrateur CV-ATS existant correspondant à l’adresse exacte. Reconnecte-toi, change le mot de passe temporaire, puis retire `ADMIN_PASSWORD` du fichier local.

## Sessions et confidentialité

- Cookie `HttpOnly`, `SameSite=Lax` et `Secure` en production, avec préfixe `__Host-`.
- Session d’une heure au maximum, ou moins si le jeton Supabase expire plus tôt. Aucun refresh token n’est conservé : il faut se reconnecter après expiration.
- Vérification auprès de Supabase à chaque requête protégée. Les droits courants et une version de session sont vérifiés, sans se fier uniquement à un rôle ancien dans un JWT.
- Une déconnexion ferme toutes les sessions CV-ATS du compte ; un changement ou reset de mot de passe les révoque également.
- Les actions qui modifient un état refusent les origines absentes ou différentes, en plus du contrôle de session.
- Les réponses d’API sensibles ne sont pas mises en cache ; les pages privées sont rendues dynamiquement.
- Les comptes, mots de passe protégés, droits et événements d’authentification sont gérés/persistés par Supabase. Les versions de CV et leurs annexes sont stockées uniquement sur sauvegarde explicite. Les compteurs de consommation ne contiennent pas les textes analysés.
- Sauvegardes privées volontaires et supprimables, quotas individuels et budget quotidien partagé : voir `SAUVEGARDES-QUOTAS.md`. Les limites s’appliquent également aux administrateurs.

Conserver les protections et limites d’authentification Supabase. Pour un domaine très exposé, les règles de pare-feu/rate limiting de l’hébergeur peuvent compléter ces contrôles ; l’application ne prétend pas empêcher tout abus par un utilisateur auquel tu as volontairement donné accès.

## Vérification après configuration

- En navigation privée : `/`, `/admin` et `/compte` doivent conduire à la connexion.
- Connecté comme utilisateur : `/admin` renvoie vers l’atelier, et l’API admin refuse l’accès.
- Désactiver un compte depuis l’admin, puis tenter une nouvelle analyse dans une autre session : elle doit être refusée.
- Réactiver puis reconnecter le compte pour confirmer la récupération d’accès.
- Tester la création et le changement du mot de passe temporaire avant de distribuer des accès.

Sources :
- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/reference/javascript/auth-admin-createuser
- https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
- https://supabase.com/docs/guides/getting-started/api-keys
- https://nextjs.org/docs/app/api-reference/functions/cookies
