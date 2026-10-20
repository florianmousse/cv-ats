# Revue du dépôt de référence

Dépôt demandé : https://github.com/sosoj92/cv-ats

Version examinée le 27 septembre 2026 : commit `c2f6a9cf0d11f763a979f910830c99b11bc376f2` (clone en lecture seule). La revue porte sur le README et les sources de l’application, notamment la page, les routes d’optimisation, le client Gemini, la construction Word et le limiteur de débit. Le README comporte encore des mentions de Claude/Anthropic alors que le code utilise Gemini : les sources ont servi de référence pour le fonctionnement.

## Idées retenues

| Idée observée | Adaptation dans cette version |
| --- | --- |
| Export Word modifiable (`lib/buildDocx.ts`, `/api/export`) | Nouveau bouton **Télécharger en Word**, implémenté indépendamment dans `lib/docx.ts`, généré dans le navigateur à partir du JSON existant. Une colonne, paragraphes standards, pas de tableau/image/zone flottante, sans nouvel appel IA. |
| Limitation des requêtes (`lib/rateLimit.ts`) | Le dépôt signale la limite de son compteur en mémoire par instance. Un suivi persistant a été ajouté en 1.2 ; depuis 1.3, tous les plafonds et la limitation de fréquence internes ont été retirés à la demande du propriétaire. Le suivi reste dans Supabase, sans seuil bloquant. |
| Sortie JSON et détection d’une réponse tronquée | Fonctionnalités déjà présentes ; conservées, avec validation Zod, contrôle des champs et audit de fidélité. |
| Erreurs et états de chargement distincts | Conservés et étendus aux sauvegardes, à la consommation et à la gestion des clés personnelles. |

## Choix conservés

- Le dépôt désactive le thinking avec un réglage destiné à Gemini 2.5. Ce paramètre n’est pas appliqué aveuglément à tous les modèles configurables de notre version. Le suivi enregistre les tokens de réflexion quand ils sont fournis.
- Notre audit de fidélité est conservé malgré son deuxième appel : le réduire uniquement pour économiser du quota affaiblirait la règle d’honnêteté demandée.
- Le parsing existant tolère déjà un JSON entouré de texte ; une réponse invalide ou tronquée reste refusée, sans « réparer » arbitrairement les informations d’un CV.
- Pas de reprise automatique après une erreur de quota : chaque nouvelle tentative est volontaire.

Aucun fichier source du dépôt de référence n’est redistribué dans cette archive. Les ajouts sont une implémentation propre des idées fonctionnelles, adaptée à l’architecture et aux accès privés existants.
