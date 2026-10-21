# Vérifications — version 1.6

- `npm test` : **39 tests réussis**.
- `npm run lint`, `npm run typecheck` et `npm run build` : code, types et compilation de production vérifiés.
- Serveur de production lancé localement : la page compte redirige les visiteurs vers la connexion ; GET, PUT et DELETE sur la route des clés refusent les visiteurs avec 401 et des réponses `no-store`.
- Les tests utilisent des comptes et clés fictifs, sans appel Gemini réel ni accès à un projet Supabase hébergé. L’application livrée ne possède aucun mode de contournement ou de démonstration.

## Clés personnelles

Les nouveaux tests couvrent : chiffrement AES-256-GCM avec nonce différent à chaque opération ; déchiffrement réservé au même identifiant utilisateur ; rejet d’une valeur altérée, d’un mauvais secret ou d’une configuration absente ; refus des requêtes anonymes et d’une origine différente ; impossibilité de choisir un autre propriétaire dans le formulaire ; stockage de ciphertext uniquement ; absence de clé complète/ciphertext dans les réponses d’API ; suppression limitée au compte connecté.

Une analyse optimisée est testée avec une clé personnelle et un modèle personnel, sans clé partagée configurée : génération et audit utilisent tous deux cette clé. Les erreurs fournisseur 400, 403, 404, 429 et 503 ainsi qu’une clé indéchiffrable ne produisent aucun repli vers la clé du site. La clé partagée n’est sélectionnée qu’en l’absence d’enregistrement personnel. Les réponses fournisseur brutes, contenant une clé fictive dans le test, ne sont pas exposées au client.

## Migrations et quotas de la clé partagée

Les fichiers SQL sont exécutés dans **PGlite**, moteur PostgreSQL embarqué. Seuls le contexte Auth Supabase et la table minimale des utilisateurs sont simulés. La migration 001 historique et ses anciennes règles restent testées en isolation pour vérifier les installations de départ.

Le test historique de la version 1.3 applique **001 puis 002**, avec des limites historiques fixées à zéro, puis rejoue 002 pour vérifier sa réexécution. Il effectue **105 admissions pour chacune des deux sources de clé dans la même minute**, sans refus lié aux anciennes limites quotidiennes, mensuelles ou de fréquence. La fonction de compatibilité `cvats_reserve` est également vérifiée sans plafond.

Dans le test historique 002, les tables de clés et fonctions de suivi sont inaccessibles au rôle utilisateur. Les anciens réglages de quotas ne sont plus modifiables par `service_role`. Les statistiques séparent exactement les appels/tokens des deux sources ; les anciens champs de plafond ne sont plus retournés. Les comptes désactivés restent refusés. La suppression d’un compte supprime sa clé tout en préservant les statistiques globales dissociées.

PGlite n’est pas un déploiement Supabase réel ni un test de charge Vercel multi-instance. Les permissions et intégrations du projet hébergé sont à vérifier après installation.

La migration 003 est testée après 001 et 002 : valeur par défaut, exceptions, quota nul, plafond global, réservation de deux appels, restitution de l’appel non tenté, admissions concurrentes, périodes expirées, permissions, réexécution et conservation des exceptions. Les clés personnelles restent autorisées même avec des plafonds partagés à zéro. Les routes admin sont testées pour les valeurs invalides et les accès interdits ; les refus de quota renvoient 429 sans appel fournisseur.

L’atelier, le diagnostic avec données fictives, les filtres de mots-clés et les formulaires admin ont été vérifiés dans un aperçu local isolé. Le rendu de l’atelier est aussi contrôlé à 390 px. Aucun contournement d’authentification ni jeu de données de démonstration n’est livré dans l’application.

## Fonctions existantes

Les tests d’authentification, de révocation des sessions, d’isolation des sauvegardes, de contrôle des rôles, de parsing/validation Gemini, d’audit de fidélité et de suivi des tokens restent présents. Les API refusent l’analyse en cas d’indisponibilité de configuration/suivi, sans appeler Gemini avec une autre clé.

L’export Word est relu avec Mammoth : texte, accents et dates sont conservés, sans tableau ni zone de texte flottante. Le moteur PDF prend désormais en compte la présentation enregistrée ; un test génère un vrai PDF puis relit son texte avec unpdf. Le moteur d’import est inchangé. Les nouveaux écrans ne sont pas vérifiés visuellement dans une session connectée à un vrai compte Supabase.

**Non effectué ici :** migration sur ton projet hébergé, appels avec tes clés réelles, validation de leurs modèles/quotas Google, déploiement sur ton compte Vercel. Le guide `CLES-PERSONNELLES.md` fournit les contrôles fonctionnels à réaliser après configuration.

```bash
npm ci
npm run build
npm test
npm run typecheck
npm run lint
```

Le premier build crée notamment `next-env.d.ts`, exclu de l’archive comme les dépendances et les fichiers de compilation.

## Éditeur et interface (1.5)

Les cinq tests supplémentaires couvrent les modifications immuables, le réordonnancement, annuler/rétablir, les limites des champs, le style sauvegardé, les anciennes sauvegardes, les mots-clés locaux, la somme des critères et les extraits réellement présents. Le test PDF vérifie le contenu modifié extrait du fichier généré.

Un aperçu isolé avec données fictives a permis de vérifier l’édition, les modèles, annuler/rétablir, la génération du PDF, la sauvegarde puis le rechargement du contenu et de sa couleur, les corrections filtrées et les panneaux du compte. L’éditeur et Mon compte ont aussi été inspectés à 390 px. Le lecteur PDF du navigateur intégré reste limité : le lien d’ouverture et le téléchargement sont proposés. Les données et serveurs de cet aperçu temporaire sont retirés avant livraison.

## Diagnostic éditorial (1.6)

Six tests supplémentaires couvrent le diagnostic issu d’une réponse IA peu fournie, les fautes et lettres espacées, le regroupement des lignes d’expérience, les outils et versions manquants, la séparation Java/JavaScript, React/React Native et JUnit/PHPUnit, les durées demandées et la validation des citations. Une preuve contenant seulement Java ne valide pas Java 17 ; un terme métier absent du dictionnaire peut être conservé si l’offre le contient. Sans annonce, aucune exigence n’est inventée. Le test de route vérifie l’enrichissement du résultat sans appel fournisseur supplémentaire.

L’aperçu local avec données fictives a permis d’inspecter les corrections filtrées par catégorie, leurs extraits, les exigences développées, le filtre des mentions et le catalogue élargi. Le rendu a été inspecté à 390 px. Aucun compte réel ni appel Gemini n’a servi à ce contrôle ; le score dans l’aperçu est une fixture. Les règles éditoriales et leurs limites sont décrites dans `DIAGNOSTIC.md`.
