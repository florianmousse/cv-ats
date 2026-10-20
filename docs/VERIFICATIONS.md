# Vérifications — version 1.3

- `npm test` : **23 groupes de tests réussis**.
- `npm run lint`, `npm run typecheck` et `npm run build` : code, types et compilation de production vérifiés.
- Serveur de production lancé localement : la page compte redirige les visiteurs vers la connexion ; GET, PUT et DELETE sur la route des clés refusent les visiteurs avec 401 et des réponses `no-store`.
- Les tests utilisent des comptes et clés fictifs, sans appel Gemini réel ni accès à un projet Supabase hébergé. L’application livrée ne possède aucun mode de contournement ou de démonstration.

## Clés personnelles

Les nouveaux tests couvrent : chiffrement AES-256-GCM avec nonce différent à chaque opération ; déchiffrement réservé au même identifiant utilisateur ; rejet d’une valeur altérée, d’un mauvais secret ou d’une configuration absente ; refus des requêtes anonymes et d’une origine différente ; impossibilité de choisir un autre propriétaire dans le formulaire ; stockage de ciphertext uniquement ; absence de clé complète/ciphertext dans les réponses d’API ; suppression limitée au compte connecté.

Une analyse optimisée est testée avec une clé personnelle et un modèle personnel, sans clé partagée configurée : génération et audit utilisent tous deux cette clé. Les erreurs fournisseur 400, 403, 404, 429 et 503 ainsi qu’une clé indéchiffrable ne produisent aucun repli vers la clé du site. La clé partagée n’est sélectionnée qu’en l’absence d’enregistrement personnel. Les réponses fournisseur brutes, contenant une clé fictive dans le test, ne sont pas exposées au client.

## Migrations et suppression des quotas

Les fichiers SQL sont exécutés dans **PGlite**, moteur PostgreSQL embarqué. Seuls le contexte Auth Supabase et la table minimale des utilisateurs sont simulés. La migration 001 historique et ses anciennes règles restent testées en isolation pour vérifier les installations de départ.

Un test séparé applique **001 puis 002**, avec des limites historiques fixées à zéro, puis rejoue 002 pour vérifier sa réexécution. Il effectue **105 admissions pour chacune des deux sources de clé dans la même minute**, sans refus lié aux anciennes limites quotidiennes, mensuelles ou de fréquence. La fonction de compatibilité `cvats_reserve` est également vérifiée sans plafond.

Les tables de clés et fonctions de suivi sont inaccessibles au rôle utilisateur. Les anciens réglages de quotas ne sont plus modifiables par `service_role`. Les statistiques séparent exactement les appels/tokens des deux sources ; les anciens champs de plafond ne sont plus retournés. Les comptes désactivés restent refusés. La suppression d’un compte supprime sa clé tout en préservant les statistiques globales dissociées.

PGlite n’est pas un déploiement Supabase réel ni un test de charge Vercel multi-instance. Les permissions et intégrations du projet hébergé sont à vérifier après installation.

## Fonctions existantes

Les tests d’authentification, de révocation des sessions, d’isolation des sauvegardes, de contrôle des rôles, de parsing/validation Gemini, d’audit de fidélité et de suivi des tokens restent présents. Les API refusent l’analyse en cas d’indisponibilité de configuration/suivi, sans appeler Gemini avec une autre clé.

L’export Word est relu avec Mammoth : texte, accents et dates sont conservés, sans tableau ni zone de texte flottante. Les moteurs PDF et d’import existants sont inchangés ; leur validation antérieure reste décrite dans l’historique de livraison. Les nouveaux écrans ne sont pas vérifiés visuellement dans une session connectée à un vrai compte Supabase.

**Non effectué ici :** migration sur ton projet hébergé, appels avec tes clés réelles, validation de leurs modèles/quotas Google, déploiement sur ton compte Vercel. Le guide `CLES-PERSONNELLES.md` fournit les contrôles fonctionnels à réaliser après configuration.

```bash
npm ci
npm run build
npm test
npm run typecheck
npm run lint
```

Le premier build crée notamment `next-env.d.ts`, exclu de l’archive comme les dépendances et les fichiers de compilation.
