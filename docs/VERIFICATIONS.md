# Vérifications — version 1.2

Vérifications effectuées pour cette archive :

- `npm test` : **18 groupes de tests passent**.
- `npm run typecheck`, `npm run lint` et `npm run build` : types, lint et compilation de production réussis.
- Serveur de production lancé localement : `/`, `/admin` et `/compte` redirigent vers la connexion ; `/connexion` répond 200. Sept accès API anonymes couvrant les sauvegardes, quotas et analyses sont refusés avec 401 et `Cache-Control: no-store`.

## Authentification et API

Les réponses réseau Supabase/Gemini sont simulées dans les tests uniquement. Les contrôles vérifient notamment : visiteurs anonymes, séparation utilisateur/admin, comptes désactivés ou révoqués, premier changement de mot de passe obligatoire, cookies, origines, absence d’élévation de rôle, accès aux sauvegardes avec le jeton utilisateur plutôt que la clé privilégiée, filtre explicite du propriétaire et refus d’un changement de propriétaire dans le corps JSON.

Les tests vérifient qu’aucun appel Gemini n’a lieu lorsque la réservation de quota est refusée ou indisponible. Le suivi des tokens est contrôlé pour une réponse valide, une erreur fournisseur et une erreur réseau. Les appels de génération **et** d’audit passent par le compteur, avec persistance de la tentative avant l’appel.

## Migration et droits PostgreSQL

Le fichier SQL réel est exécuté dans **PGlite**, moteur PostgreSQL embarqué en mémoire. Seules les fonctions de contexte Auth Supabase et la table minimale des utilisateurs sont simulées. Aucun projet Supabase externe n’est utilisé.

Les tests couvrent :

- exécution de la migration et réexécution sans destruction ;
- sauvegarde, isolation RLS entre deux comptes, impossibilité de supprimer le CV d’autrui ;
- jeton révoqué, compte désactivé, limite de 20 sauvegardes ;
- impossibilité pour un utilisateur d’appeler les fonctions privilégiées ou de lire les tables de comptage ;
- réservation de deux appels, plafond individuel, budget partagé, libération de l’audit non tenté ;
- décompte d’un appel tenté en erreur, idempotence du suivi et de la clôture ;
- demandes concurrentes soumises au moteur : seulement deux admissions pour deux emplacements disponibles ;
- réservations non clôturées conservées, exclusion des anciennes périodes, limite sur 60 secondes ;
- suppression des sauvegardes avec le compte sans disparition de la consommation globale.

PGlite n’est pas un déploiement Supabase réel ni un test de charge multi-instance Vercel : l’intégration au projet de production reste à vérifier après migration.

## Exports

Le nouveau DOCX est généré puis relu avec Mammoth. Le texte, les accents, les dates et les puces sont retrouvés. Le XML ne contient ni tableau ni zone de texte flottante. Il n’y a pas d’appel IA pour cet export.

Les trois styles PDF et l’import PDF/DOCX existants sont conservés de la version précédemment vérifiée : extraction de texte, PDF sans texte détecté, polices et rendu contrôlés. Cette mise à jour ne change pas leur moteur. Les nouveaux écrans n’ont pas fait l’objet d’un contrôle visuel automatisé dans un navigateur connecté à un véritable compte.

**Non testé sans tes accès :** exécution de la migration dans ton projet Supabase hébergé, tes comptes réels, appel Gemini avec ta clé, valeurs/quotas de ton projet Google, déploiement sur ton compte Vercel. Aucun secret réel n’est inclus dans le ZIP. L’application livrée n’a aucun mode factice ni contournement d’authentification.

Pour relancer :

```bash
npm ci
npm run build
npm test
npm run typecheck
npm run lint
```

Le premier build crée notamment `next-env.d.ts`. Les étapes de vérification fonctionnelle après installation sont dans `SAUVEGARDES-QUOTAS.md`.
