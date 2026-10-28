# Clés Gemini personnelles - version 1.4

## Mettre à jour ton site existant

1. Dans **Supabase → SQL Editor**, exécuter `supabase/migrations/002_personal_keys_no_quotas.sql` si nécessaire, puis `003_shared_key_quotas.sql`. Voir `QUOTAS-IA.md`.
2. Si la migration 001 n'avait pas encore été exécutée, exécuter d'abord `001_saves_and_quotas.sql`, puis **002**. Sur une installation neuve, exécuter 001, 002 puis 003 dans cet ordre. Ne pas rejouer les anciennes migrations seules ensuite.
3. Générer une clé de chiffrement sur ton ordinateur :

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

4. Copier la valeur générée dans une nouvelle variable Vercel nommée **`API_KEY_ENCRYPTION_SECRET`**. Ne pas la préfixer par `NEXT_PUBLIC_`, ni la placer dans GitHub. Pour un essai local, l'ajouter dans `.env.local`.
5. Conserver cette valeur secrète et stable. Tous les déploiements qui partagent les mêmes clés chiffrées doivent utiliser la même valeur. Utiliser des projets/secrets distincts pour des environnements qui doivent rester indépendants.
6. Remplacer les fichiers du dépôt par cette archive, dont les migrations, puis redéployer sur Vercel.
7. Dans **Mon compte → Ma clé Gemini**, enregistrer une clé personnelle puis effectuer une analyse pour vérifier l'accès au modèle.

Les migrations conservent les comptes, CV et métadonnées. La migration 003 réintroduit des quotas uniquement sur la clé du site ; les clés personnelles restent hors quota interne. Les anciennes routes admin de quotas sont à nouveau actives.

Les routes de clés ont besoin de 002 ; les analyses exigent aussi 003. Sans elle, l'application affiche une erreur de configuration et n'appelle pas Gemini : elle ne suppose jamais à tort qu'une clé personnelle absente de la réponse doit être remplacée par celle du site.

## Utilisation par chaque personne

1. Se connecter à son compte autorisé. Changer le mot de passe temporaire si nécessaire.
2. Ouvrir **Mon compte**, puis **Ma clé Gemini**.
3. Coller la clé obtenue dans [Google AI Studio](https://aistudio.google.com/apikey).
4. Facultativement, indiquer un modèle Gemini accessible à son projet. Un champ vide utilise `GEMINI_MODEL` du site, ou le modèle par défaut du code si cette variable est absente.
5. Cliquer **Enregistrer ma clé**. Aucun appel Gemini n'est effectué à cette étape : l'enregistrement vérifie le format, pas la validité chez Google. Le premier scan/optimisation vérifiera effectivement l'accès au service.

Après enregistrement, seuls les quatre derniers caractères sont affichés. La clé complète n'est pas relisible depuis l'interface ou une réponse d'API. Le champ est vidé après soumission et n'est pas conservé dans localStorage/sessionStorage/cookie. Il faut la saisir à nouveau pour remplacer la clé ou modifier son modèle.

**Supprimer ma clé personnelle** retire la copie chiffrée de CV-ATS, après confirmation. Les prochaines analyses utiliseront alors la clé du site si elle existe et si le quota le permet ; sinon, une clé personnelle sera demandée. La suppression dans CV-ATS ne révoque pas la clé chez Google : pour cela, la supprimer/révoquer dans AI Studio. La suppression du compte CV-ATS supprime aussi sa clé enregistrée.

Une requête déjà partie continue avec la clé choisie au début : remplacer/supprimer une clé ou désactiver un compte n'annule pas rétroactivement cette requête.

## Quelle clé est utilisée ?

| Situation | Comportement |
| --- | --- |
| Clé personnelle enregistrée | Utilisée pour la génération et l'audit, avec le modèle personnel ou le modèle par défaut |
| Clé personnelle invalide, quota Google atteint, modèle inaccessible ou erreur réseau | Message d'erreur ; **aucun essai avec la clé du site** |
| Clé personnelle indéchiffrable / secret serveur absent | Analyse refusée ; **aucun essai avec la clé du site** |
| Aucune clé personnelle et `GEMINI_API_KEY` présente | Utilisation de la clé partagée du site, sous réserve des quotas internes |
| Aucune clé personnelle et aucune clé du site | Invitation à ajouter une clé personnelle dans Mon compte |
| Supabase indisponible pendant la sélection de clé | Analyse refusée, sans appel Gemini |

Une clé personnelle fonctionne même si `GEMINI_API_KEY` n'est pas définie sur Vercel. L'accès au site reste réservé aux comptes créés par l'administrateur, quelle que soit la clé.

## Quotas partagés et limites Google

L'admin règle un quota mensuel par compte et un plafond quotidien pour les appels avec la clé du site. Les clés personnelles ne consomment pas ces quotas. Une valeur nulle impose une clé personnelle. Voir `QUOTAS-IA.md`.

Les limites **Google Gemini** s'appliquent toujours au projet associé à la clé, selon le modèle et l'offre. Plusieurs clés d'un même projet partagent ses limites : créer simplement une autre clé du même projet ne procure pas un quota indépendant. L'usage éventuel payant relève du projet Google concerné. Aucun contournement ni rotation de clés automatique n'est mis en place.

L'exemption des clés personnelles concerne uniquement les quotas internes. Les contraintes techniques existantes restent nécessaires au traitement : import de 4 Mo, tailles des textes, durée maximale d'une requête, longueur de réponse et limite de 20 sauvegardes par compte. Un scan déclenche un appel ; une optimisation jusqu'à deux (génération puis audit). Ce nombre décrit le fonctionnement d'une action, pas un plafond d'usage du compte.

## Suivi de consommation

- L'atelier affiche la clé sélectionnée et les appels du mois UTC, ventilés entre clé personnelle et clé partagée.
- L'administration sépare les consommations **clé du site** et **clés personnelles**, avec détail par modèle et par compte.
- L'admin voit si une personne a configuré une clé personnelle, **jamais la clé ni son texte chiffré** dans ces écrans.
- L'historique antérieur à 1.3 est classé « clé partagée », puisque cette version ne gérait pas de clés personnelles.
- Les métadonnées de consommation ne contiennent ni clé, ni empreinte de clé, ni CV, ni annonce, ni réponse du modèle. Le nom de modèle, la source de clé, les dates, les statuts et les nombres de tokens sont conservés.
- Les tokens inconnus sont signalés. Un appel peut apparaître dans le compteur même s'il a échoué ; cela ne signifie pas qu'il a été facturé par Google.
- La source est une indication de routage, pas une preuve que les projets Google sont distincts : une personne pourrait enregistrer une clé du même projet que celle du site.

Les tableaux couvrent exclusivement les analyses passées par CV-ATS depuis l'installation du suivi. Ils n'indiquent pas le solde officiel Google, ni les dépenses du projet, ni les appels faits ailleurs. Consulter AI Studio pour ces informations. Les erreurs de collecte/connexion à la base sont traitées comme des incidents de service, sans revenir à une autre clé.

## Chiffrement et configuration

Les clés sont chiffrées côté serveur en **AES-256-GCM**, avec un nonce aléatoire de 12 octets et un tag d'authentification de 16 octets. L'identifiant du propriétaire est authentifié avec le ciphertext : déplacer simplement une valeur chiffrée sur le compte d'une autre personne empêche son déchiffrement.

La table `cvats_personal_keys` est sous RLS sans accès `anon` ou `authenticated`, y compris à la valeur chiffrée. Les routes serveur vérifient la session actuelle et utilisent exclusivement l'identifiant du compte connecté. Aucune route ne permet à un administrateur de lire la clé d'autrui. La clé est déchiffrée uniquement pour l'appel serveur à Google, puis n'est pas persistée en clair.

`API_KEY_ENCRYPTION_SECRET` est une valeur aléatoire de **32 octets encodés en base64**, conservée hors de Supabase dans les variables du serveur. Le chiffrement protège une copie isolée de la base ; ce n'est pas un chiffrement de bout en bout. Le propriétaire technique qui dispose à la fois de la base et du secret du serveur peut déchiffrer les clés. Ne pas ajouter de logs ou d'outils capturant les corps d'enregistrement de clé ou les en-têtes sortants `x-goog-api-key`.

**Ne pas régénérer ce secret à chaque déploiement.** Le perdre ou le remplacer rend les anciennes clés inutilisables. Pour remplacer volontairement le secret dans cette version, chaque utilisateur devra ensuite ressaisir sa clé personnelle ; aucune migration automatique de chiffrement n'est fournie. Le remplacement via Mon compte fonctionne sans devoir déchiffrer l'ancienne valeur. La suppression reste possible même si le secret de chiffrement n'est plus configuré.

## Vérification après déploiement

1. Vérifier que l'admin n'affiche plus de formulaires de quotas.
2. Avec un compte sans clé personnelle, lancer un scan : le suivi doit indiquer la clé partagée si elle est configurée.
3. Enregistrer sa clé personnelle, lancer un scan puis une optimisation : le suivi doit indiquer la source personnelle pour les trois appels.
4. Remplacer temporairement cette clé par une valeur non valide et lancer un scan : l'erreur ne doit déclencher aucune génération via la clé partagée. Remettre ensuite la vraie clé.
5. Vérifier que la clé n'apparaît pas dans les réponses GET, le HTML, l'admin ou les métadonnées de consommation.
6. Supprimer sa clé personnelle et vérifier le retour explicite à la clé du site pour les prochaines analyses.

Sources officielles consultées le 29 septembre 2026 :
- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/gemini-api/docs/rate-limits
