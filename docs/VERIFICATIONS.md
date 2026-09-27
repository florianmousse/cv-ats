# Vérifications

Vérifications effectuées pour cette archive :

- `npm run build` : compilation Next.js de production réussie, page principale et deux routes API détectées.
- `npm run typecheck` et `npm run lint` : vérification des types et du code.
- `npm test` : quatre groupes de tests passent (appel REST Gemini, erreurs de quota/modèle/contenu, validation du CV, parcours scan/optimisation et audit).
- Les tests remplacent explicitement les réponses Gemini dans le processus de test ; l’application livrée ne contient aucun mode factice et ne retourne pas ces données aux visiteurs.
- Les trois exports PDF et l’extraction PDF/DOCX sont conservés de la version précédemment vérifiée : texte extrait, PDF sans texte détecté, polices et rendu contrôlés. La limite d’import est adaptée de 5 à 4 Mo pour Vercel.

**Non testé sans tes accès :** appel réel à Gemini avec ta clé, quotas de ton projet, déploiement effectif sur ton compte Vercel. Ces étapes sont à vérifier après configuration. Aucune clé réelle n’est incluse dans le ZIP.

Pour relancer les contrôles :

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Si `npm run typecheck` est exécuté avant le premier démarrage/compilation, Next.js peut ne pas avoir encore créé `next-env.d.ts` : exécuter d’abord `npm run build` ou `npm run dev`.
