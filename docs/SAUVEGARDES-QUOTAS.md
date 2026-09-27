# Sauvegardes privées et quotas — mise à jour 1.2

## Mise à jour d’un site existant

Aucun nouveau service ni aucune nouvelle clé n’est nécessaire. Le projet Supabase Auth déjà configuré est réutilisé.

1. Dans **le projet Supabase utilisé par ton site**, ouvrir **SQL Editor → New query**.
2. Copier **tout** le contenu de `supabase/migrations/001_saves_and_quotas.sql` et exécuter avec **Run**.
3. Vérifier l’absence d’erreur. Le script crée cinq tables et leurs fonctions/droits. Il peut être rejoué sans effacer les comptes ou les sauvegardes. Ne pas désactiver la RLS.
4. Remplacer les fichiers du dépôt GitHub par cette version, en conservant tes secrets uniquement dans les variables Vercel et ton `.env.local` local. Inclure les nouveaux dossiers `supabase/`, `tests/`, composants et routes, ainsi que `package-lock.json`.
5. Déployer sur Vercel avec les mêmes variables que précédemment.
6. Se connecter en administrateur, ouvrir `/admin`, puis régler le budget quotidien et les quotas des utilisateurs.

**Appliquer la migration avant de redéployer.** Sans elle, sauvegardes et statistiques signalent une indisponibilité ; les analyses sont bloquées avant Gemini. Le système ne contourne jamais un suivi de quotas indisponible.

Pour une nouvelle installation, suivre d’abord `AUTHENTIFICATION.md` pour les clés/comptes, puis appliquer cette migration avant d’utiliser l’application.

## Sauvegarder et charger son CV

Dans **Mes sauvegardes** :

1. Saisir/importer le CV et donner un nom à la version.
2. Cocher, si souhaité, **Conserver aussi l’annonce** et/ou **Conserver aussi le CV optimisé et ses exports**. Ces cases sont décochées par défaut ; le résultat optimisé doit déjà exister pour le joindre.
3. Cliquer **Enregistrer une nouvelle version**. Chaque clic réussi crée une version distincte : aucune ancienne version n’est écrasée.
4. Choisir une version dans la liste puis **Charger**. Si un CV est déjà affiché, une confirmation précède son remplacement. Les textes, l’annonce éventuellement enregistrée et le résultat optimisé éventuel sont restaurés ensemble.
5. Modifier le texte puis enregistrer une autre version au besoin. Le texte chargé ne modifie jamais automatiquement la sauvegarde.
6. **Supprimer** retire cette version après confirmation. Cela ne vide pas le CV actuellement ouvert.

Maximum : 20 versions par utilisateur ; nom de 100 caractères ; CV de 40 000 caractères ; annonce de 30 000 caractères. Les fichiers PDF/DOCX d’origine ne sont pas conservés. Un scan n’est pas sauvegardé : seul le résultat optimisé peut être joint, ce qui permet de retélécharger les exports sans nouveau coût IA. Une sauvegarde sans annonce se charge avec une annonce vide.

Il n’y a pas de liste des CV des autres utilisateurs dans l’admin. La RLS vérifie le propriétaire et les droits courants du compte, y compris pour un appel direct à Supabase. La désactivation, un changement de mot de passe ou une révocation de session bloque aussi les anciennes sessions sur les sauvegardes. Comme pour toute base hébergée, le propriétaire technique du projet Supabase et la clé `service_role` ont des privilèges d’administration : ce n’est pas un chiffrement de bout en bout.

La suppression d’un utilisateur dans l’admin supprime ses sauvegardes et son plafond individuel. Les lignes de consommation sont dissociées du compte et conservées pour que sa suppression ne remette pas à zéro le budget du site. Les politiques de sauvegarde/rétention de l’hébergeur s’appliquent également aux données supprimées.

## Quotas par utilisateur

Tous les comptes, **administrateurs compris**, ont par défaut **100 appels par mois civil UTC**. La limite est appliquée même si le compte n’a pas encore de ligne de quota : celle-ci est créée à la première analyse ou à la première modification du plafond.

Dans `/admin`, chaque personne affiche :

- ses appels utilisés/réservés et son plafond ;
- le nombre d’appels restants ;
- les tokens déclarés par Gemini ce mois-ci ;
- les appels dont les tokens sont inconnus ;
- un champ permettant de modifier son plafond mensuel.

Le compte administrateur est protégé contre la suppression/désactivation, mais son quota reste modifiable. **0 bloque les nouvelles analyses.** Abaisser une limite en dessous de la consommation existante n’efface rien : il ne reste simplement aucun appel disponible. Le compteur de l’atelier affiche à chacun son quota et la prochaine remise à zéro.

Les quotas sont exprimés en **appels à Gemini**, et non en tokens : la taille exacte d’une réponse n’est pas connue avant la génération. Les tokens sont suivis pour information, sans plafond individuel de tokens dans cette version.

| Action | Appels réservés | Décompte final |
| --- | --- | --- |
| Scan | 1 | Un appel tenté |
| Optimisation | 2 | Génération + audit de fidélité, si les deux sont tentés |
| Import, sauvegarde, chargement, exports | 0 | Aucun appel IA |

Une optimisation exige deux appels disponibles avant de commencer. Si elle s’arrête avant l’audit, le second emplacement est libéré lors de la clôture. Les appels tentés restent décomptés même en cas de 429, erreur réseau, contenu bloqué, réponse invalide ou audit refusé : leur consommation réelle chez Google peut être inconnue. Ce décompte volontairement prudent évite les tentatives gratuites en boucle. Aucun retry automatique n’est ajouté.

Une réservation est enregistrée dans une transaction SQL avant l’appel fournisseur. Un verrou PostgreSQL sérialise les admissions, même avec plusieurs onglets et plusieurs instances Vercel. Il existe aussi une limite de **6 appels réservés par utilisateur sur 60 secondes glissantes**.

En cas d’arrêt brutal de la fonction ou d’échec de la clôture, la réservation reste décomptée jusqu’à la fin de sa période. L’admin affiche ces analyses « en attente de clôture » ; ce choix préfère bloquer trop tôt que permettre un dépassement. Il n’y a pas de remboursement manuel automatique d’un appel dont l’état est incertain.

## Budget partagé du site

L’admin possède un second plafond, commun à tous les modèles et utilisateurs : **100 appels par jour** par défaut. Il est modifiable dans **Consommation Gemini**. La journée suit `America/Los_Angeles` (minuit Pacifique, changement d’heure compris), comme le repère quotidien documenté pour les RPD Gemini. L’heure de remise à zéro est affichée dans le fuseau du navigateur.

Ce budget est une **limite interne décidée par toi**, pas une valeur reçue de Google. Choisis-le après consultation des limites de ton projet. Une analyse est rattachée au mois/jour où sa réservation a commencé ; si elle traverse minuit, ses deux appels restent rattachés à cette période interne.

## Ce que l’on sait sur Gemini

Le tableau admin regroupe, par modèle et pour le mois UTC en cours :

- les appels tentés et les appels décomptés/réservés ;
- les tokens d’entrée, de sortie et de réflexion lorsqu’ils sont fournis ;
- `usageMetadata.totalTokenCount`, sans double comptage des tokens de réflexion ;
- les erreurs d’analyse, totaux de tokens inconnus et réservations en attente de clôture.

Le suivi commence après installation de cette version. **Il ne récupère pas l’historique Google**, les requêtes d’autres applications, les appels faits avec d’autres clés du même projet, les coûts ni le montant disponible sur le compte Google. Les compteurs sont actualisés à l’ouverture des pages et après les analyses/modifications ; un bouton **Actualiser** permet un rafraîchissement manuel. Ce n’est pas un tableau temps réel par abonnement.

Les liens **Consommation officielle** et **Limites Gemini** ouvrent Google AI Studio. Les limites effectives varient selon le projet, le modèle et l’offre, et portent notamment sur les requêtes par minute/jour et tokens d’entrée par minute. Une clé Gemini de génération ne fournit pas, dans la réponse `generateContent`, un solde universel de quota. L’application ne prétend donc pas lire un « quota restant Google » avec cette seule clé. Une intégration Google Cloud supplémentaire avec autorisations de monitoring serait un travail distinct.

Les tokens inconnus ne sont pas estimés ni remplacés par un faux zéro : un compteur spécifique les signale. Le total affiché correspond aux réponses observées, donc peut être incomplet. Même lorsqu’il reste un budget CV-ATS, Google peut renvoyer une erreur de limite sur son propre projet.

## Données conservées

| Données | Où et pourquoi |
| --- | --- |
| Comptes et droits | Supabase Auth, pour contrôler les accès |
| CV, nom de version, annonce/résultat facultatifs | `cvats_saved_cvs`, uniquement sur action explicite |
| Plafonds | `cvats_user_quotas`, `cvats_quota_settings` |
| Métadonnées de consommation | `cvats_usage_runs`, `cvats_usage_calls` : modèle, mode, dates, statuts, compteurs ; aucun texte de CV/annonce/réponse |

Toutes ces tables ont la RLS activée. Seules les opérations personnelles de lecture/suppression des CV et la fonction de sauvegarde sont autorisées avec un jeton utilisateur valide. Les fonctions de comptage et les modifications de quotas ne sont exécutables que par le rôle serveur `service_role`. Les routes admin exigent en plus le rôle administrateur CV-ATS. Les contenus ne sont ni journalisés ni envoyés à des outils d’analytics par l’application.

## Vérifications après déploiement

1. Avec deux comptes, enregistrer un CV dans A et vérifier qu’il n’apparaît pas dans B. Un identifiant de sauvegarde de A doit produire 404 pour B.
2. Recharger une version avec puis sans annonce/résultat ; vérifier le texte et les exports.
3. Donner temporairement un quota de 1 à un utilisateur sans consommation : le scan est autorisé, l’optimisation refusée avant Gemini. Après le scan, un autre appel est refusé.
4. Fixer le budget global à 0 : aucune nouvelle analyse ne démarre, même pour un administrateur. Le rétablir ensuite.
5. Vérifier que les appels et tokens sont affichés, y compris les deux appels d’une optimisation réussie. Comparer avec AI Studio en tenant compte des consommations extérieures au site.
6. Désactiver un compte et vérifier que son accès aux sauvegardes est refusé.

Références officielles consultées le 27 septembre 2026 :
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/api/generate-content#UsageMetadata
