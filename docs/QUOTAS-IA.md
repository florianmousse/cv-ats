# Quotas de la clé du site — version 1.4

## Activer la mise à jour

1. Dans Supabase → SQL Editor, exécuter tout `supabase/migrations/003_shared_key_quotas.sql` après 001 et 002. Sur un projet neuf, exécuter **001 → 002 → 003**. Ne pas rejouer une ancienne migration seule après 003.
2. Déployer le code mis à jour. La nouvelle RPC `cvats_admit_run` est absente avant 003 : le serveur refuse alors les analyses au lieu d’utiliser les anciennes règles illimitées.
3. Dans **Administration → Budget IA**, définir le plafond quotidien global et le quota mensuel par défaut. Les valeurs initiales sont **100 appels/jour pour le site** et **10 appels/mois par compte**.
4. Dans **Comptes et accès**, définir une exception mensuelle ou vider le champ pour suivre la valeur par défaut. La valeur **0** impose une clé personnelle. Les administrateurs sont soumis aux mêmes règles.
5. Vérifier que `API_KEY_ENCRYPTION_SECRET` est configuré pour permettre aux utilisateurs d’enregistrer leur clé dans **Mon compte**. Conserver le secret existant ; ne pas en générer un nouveau si des clés sont déjà chiffrées.

Les anciens réglages de la version 1.2 restent historiques : ils ne sont pas réactivés. Les nouvelles valeurs initiales sont définies dans les nouvelles tables. Les comptes, sauvegardes, clés et historiques sont conservés. Les appels partagés déjà effectués dans la période courante comptent immédiatement. Réexécuter 003 conserve les réglages et exceptions de la version 1.4.

## Ce que limite le quota

| Action | Appels réservés sur la clé du site |
| --- | --- |
| Scan | 1 |
| Optimisation et contrôle de fidélité | 2 |
| Import, mots-clés locaux, sauvegarde, export | 0 |
| Analyse avec une clé personnelle | 0 sur le quota interne ; appels suivis séparément |

Le quota est exprimé en **appels Gemini**, pas en analyses, tokens ou euros. Une optimisation nécessite deux appels disponibles dès son admission. Une tentative échouée reste comptée si elle a été envoyée ; la clôture restitue les appels jamais tentés. Un arrêt brutal conserve la réservation par prudence. Le compteur « utilisés ou réservés » peut donc dépasser le nombre d’appels observés. La réservation est atomique et partagée entre toutes les instances serveur.

Le plafond quotidien est partagé entre tous les comptes. Le quota mensuel est propre à chaque personne. Renouvellement : minuit **UTC** chaque jour et le premier du mois à 00:00 UTC. Une baisse ne réinitialise pas les compteurs et ne coupe pas une analyse déjà admise. Les requêtes bloquées renvoient HTTP 429 avant tout appel Gemini, avec une invitation à configurer une clé personnelle.

Une clé personnelle est toujours prioritaire, y compris si le quota partagé est épuisé. Une erreur sur cette clé ne déclenche jamais de repli vers la clé du site. Les limites et frais éventuels du projet Google restent applicables. Enregistrer une autre clé du même projet Google ne crée pas un quota Google indépendant.

Les paramètres sont réservés aux routes admin authentifiées, protégées contre les requêtes intersites. Les rôles navigateur n’ont aucun accès direct aux tables ni aux RPC de quota. Les données suivies ne contiennent ni CV, ni annonce, ni clé API.

## Vérifications

`npm test` couvre les permissions, valeurs invalides, quota nul, réservation double, restitution du second appel inutilisé, admissions concurrentes, périodes expirées, anciens points d’entrée, absence de repli de clé et exemption des clés personnelles. La migration est exécutée dans PostgreSQL embarqué (PGlite), sans connexion au projet Supabase réel ni appel Gemini payant.

Après déploiement, vérifier les réglages avec un compte de test. Le test local ne remplace pas l’application de la migration sur le projet Supabase cible.
