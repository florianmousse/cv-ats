# Sauvegardes privées et suivi de consommation - version 1.4

Les quotas internes limitent uniquement la clé partagée. Voir [QUOTAS-IA.md](QUOTAS-IA.md) pour leur configuration et [CLES-PERSONNELLES.md](CLES-PERSONNELLES.md) pour les clés personnelles.

## Installation ou mise à jour

- Projet neuf : exécuter `001_saves_and_quotas.sql`, puis `002_personal_keys_no_quotas.sql` et `003_shared_key_quotas.sql`, dans le SQL Editor Supabase.
- Projet déjà en 1.2 : exécuter 002 puis 003 ; en 1.3 : exécuter 003 seulement. Voir `QUOTAS-IA.md`.
- Les comptes et sauvegardes existants sont conservés. Aucun bucket n'est requis.

## Sauvegarder et charger son CV

Dans **Mes sauvegardes** :

1. Saisir/importer le CV et donner un nom à la version.
2. Cocher, si souhaité, **Conserver aussi l'annonce** et/ou **Conserver aussi le CV optimisé et ses exports**. Ces cases sont décochées par défaut ; le résultat optimisé doit déjà exister pour le joindre.
3. Cliquer **Enregistrer une nouvelle version**. Chaque clic réussi crée une version distincte : aucune ancienne version n'est écrasée.
4. Choisir une version dans la liste puis **Charger**. Si un CV est déjà affiché, une confirmation précède son remplacement. Les textes, l'annonce éventuellement enregistrée et le résultat optimisé éventuel sont restaurés ensemble.
5. Modifier le texte puis enregistrer une autre version au besoin. Le texte chargé ne modifie jamais automatiquement la sauvegarde.
6. **Supprimer** retire cette version après confirmation. Cela ne vide pas le CV actuellement ouvert.

Maximum : 20 versions par utilisateur ; nom de 100 caractères ; CV de 40 000 caractères ; annonce de 30 000 caractères. Les fichiers PDF/DOCX d'origine ne sont pas conservés. Un scan n'est pas sauvegardé : seul le résultat optimisé peut être joint, ce qui permet de retélécharger les exports sans nouveau coût IA. Une sauvegarde sans annonce se charge avec une annonce vide.

Il n'y a pas de liste des CV des autres utilisateurs dans l'admin. La RLS vérifie le propriétaire et les droits courants du compte, y compris pour un appel direct à Supabase. La désactivation, un changement de mot de passe ou une révocation de session bloque aussi les anciennes sessions sur les sauvegardes. Comme pour toute base hébergée, le propriétaire technique du projet Supabase et la clé `service_role` ont des privilèges d'administration : ce n'est pas un chiffrement de bout en bout.

La suppression d'un utilisateur dans l'admin supprime ses sauvegardes et sa clé personnelle. Les lignes de consommation sont dissociées du compte et conservées pour préserver les statistiques globales. Les politiques de sauvegarde/rétention de l'hébergeur s'appliquent également aux données supprimées.

## Suivi et quotas partagés

L'atelier et l'admin affichent les appels tentés et tokens déclarés, en séparant clé personnelle et clé du site. Les appels utilisant la clé du site sont soumis au quota mensuel par compte et au plafond quotidien global définis par l'admin. Les clés personnelles restent hors quota interne. Voir `QUOTAS-IA.md`. Les erreurs de réseau/base/authentification restent des erreurs de service, sans contournement d'accès ni changement automatique de clé.

Un scan utilise 1 appel, une optimisation jusqu'à 2. L'import, l'enregistrement, le chargement et les exports ne consomment pas d'IA. Le suivi commence à l'installation de cette fonctionnalité et n'importe pas d'historique Google. Les tokens inconnus sont signalés ; les tableaux ne constituent ni une facture ni un solde officiel de quota.

## Données conservées

| Données | Emplacement et usage |
| --- | --- |
| Comptes et droits | Supabase Auth |
| CV et annexes facultatives | `cvats_saved_cvs`, sur sauvegarde volontaire |
| Clés personnelles chiffrées | `cvats_personal_keys`, serveur uniquement |
| Métadonnées d'appels | `cvats_usage_runs`, `cvats_usage_calls`, sans texte de CV/clé |
| Quotas partagés | `cvats_shared_policy`, `cvats_shared_user_limits`, paramètres serveur uniquement |

La RLS protège toutes les tables. Les sauvegardes utilisent un jeton utilisateur et la vérification de leurs propriétaires ; le comptage et la gestion chiffrée des clés utilisent des routes serveur authentifiées. Les jetons des utilisateurs ne permettent pas de lire la table des clés.

## Contrôles après déploiement

Avec deux comptes, vérifier que leurs sauvegardes restent isolées, y compris lors d'un accès direct à l'identifiant d'une sauvegarde. Charger une version avec et sans annonce/résultat, puis tester ses exports. Désactiver un compte et vérifier que l'accès aux sauvegardes est refusé. Les vérifications de routage des clés et de consommation sont détaillées dans `CLES-PERSONNELLES.md`.
