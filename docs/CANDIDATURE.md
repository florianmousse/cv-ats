# Dossier de candidature - version 1.8

## Organisation

- **Mon CV** : texte importé ou collé, édition libre sans IA, structuration en champs, mise en page, exports et adaptation à l'offre. Après un scan, une colonne conserve ses conseils pendant l'édition. Les règles locales suivent les changements sans appel API ; un extrait disparu est indiqué « modifié, à relire », jamais automatiquement « corrigé ».
- **Diagnostic** : résultat du dernier scan, conservé avec le texte et l'annonce réellement analysés. Un changement affiche un avertissement de résultat ancien. Un nouveau scan utilise le CV de l'éditeur, pas le texte importé avant les corrections. Il ne réinitialise ni le CV ni la lettre ; un échec conserve aussi le précédent diagnostic.
- **Lettre de motivation** : notes personnelles, génération ciblée puis audit de fidélité, modification manuelle, aperçu, copie, exports Word et texte. Changer le CV ou l'annonce laisse la lettre en place avec une invitation à la relire. Une nouvelle génération demande confirmation si un brouillon existe, et ne le remplace qu'après succès.
- **Outils et IA** : consommation, clés personnelles, mots-clés, prompts prêts à copier et explications de confidentialité. Les prompts de scan, adaptation, structuration et lettre incluent les textes actuels et des consignes de fidélité. Leur création et copie ne consomment aucun appel et ne transmettent rien automatiquement à une autre IA. La réponse externe peut être recopiée dans les champs éditables ; elle n'est pas validée par l'audit du site.

Le CV structuré reste monté lorsque l'on passe au diagnostic ou à la lettre : l'historique annuler/rétablir reste disponible pendant la session. Recharger la page restaure le contenu et le style, pas l'historique d'annulation ni le fichier PDF temporaire. Importer un autre CV ou charger une version remplace le dossier après confirmation. Les boutons d'adaptation et de structuration annoncent leur coût ; corriger le texte importé ne nécessite aucune IA.

## Brouillon local

Le navigateur conserve automatiquement le texte source, la version courante, la mise en page, l'annonce, le dernier diagnostic, la lettre, les notes et l'espace actif. Chaque compte dispose d'une clé distincte ; les données sont validées à la restauration et expirent sept jours après la dernière mise à jour. Une limite de taille protège le chargement. Les fichiers PDF/DOCX d'origine, preuves d'import, clés API et jetons de connexion ne font pas partie du brouillon.

Le brouillon est stocké en clair sur l'appareil, sans synchronisation entre appareils. La case « Reprendre sur cet appareil » permet de le désactiver ; « Effacer le brouillon » vide le dossier courant sans supprimer les versions Supabase. La déconnexion explicite efface le cache courant et empêche sa réécriture par la page en cours. Si le stockage est plein ou bloqué, un message indique que le brouillon n'est pas sauvegardé. Les documents restent modifiables en mémoire.

Ce cache n'est pas une sauvegarde durable. Les versions Supabase restent volontaires et contiennent le CV et, si demandé, l'annonce et le CV structuré avec son style. La lettre et le diagnostic sont conservés dans le brouillon local seulement ; il faut exporter une lettre importante. Après restauration, les propriétés du fichier d'origine restent inconnues jusqu'à un nouvel import vérifié.

## Génération et quotas

La route d'analyse accepte scan (1 appel), optimize, structure et letter (2 appels réservés au maximum). Les deux nouvelles opérations utilisent les mêmes contrôles d'accès, quotas partagés, clé personnelle prioritaire et comptage des tokens. La lettre est générée puis auditée contre le CV ; les notes justifient la motivation, jamais une compétence ajoutée. Aucune lettre n'est envoyée à un destinataire. Un audit négatif rejette la nouvelle proposition et laisse le brouillon précédent intact. Les modifications manuelles doivent être relues.

Appliquer **004_candidature_workflows.sql après 001, 002 et 003**, puis redéployer. La migration étend les modes autorisés et réserve deux appels pour lettre/structuration, sans changer les quotas existants. Sans 004, les nouvelles opérations échouent avant l'appel fournisseur. Les comptes ordinaires ne peuvent pas invoquer les fonctions privilégiées directement. La version affichée dans le menu et la page d'administration vient de package.json (1.8.0).

## Vérifications

Tests de restauration, isolation par compte, expiration, données invalides, version courante analysée, diagnostic ancien, prompts, anglicismes, score incomplet, génération/audit de lettre et quotas SQL. Contrôle navigateur sur des données fictives : édition → scan → correction → actualisation, lettre modifiée restaurée, erreur de quota sans perte de document et copie d'un prompt contenant les corrections récentes. Aucun appel Gemini réel dans ces vérifications. La qualité de toutes les réponses réelles n'est pas garantie par des tests simulés.

## Corrections 1.8.1

La note est toujours affichée avec la mention « Score indicatif » lorsque la couverture qualitative est incomplète. Une réserve d'adéquation à l'offre ne bloque plus le score rédactionnel. Les corrections courtes et les erreurs indépendantes dans une même phrase sont conservées.

La lettre est générée en trois champs structurés JE / VOUS / NOUS, assemblés en trois paragraphes après la formule d'appel. Le second appel vérifie la fidélité au CV et aux sources, ainsi que la présence d'éléments spécifiques au parcours et à l'offre. Une proposition jugée générique est rejetée sans remplacer le brouillon. Les quotas restent inchangés (deux appels maximum).

Un panneau facultatif permet de rechercher les publications d'une entreprise puis de renseigner son nom, le lien, un court extrait vérifié par l'utilisateur et la date de publication si connue. Le site n'effectue aucune requête vers ces URLs et ne prétend pas avoir vérifié l'article. Une URL seule est refusée avant tout appel IA. Sans source, le paragraphe VOUS repose sur l'annonce. Les sources sans lien utile avec le poste sont à ignorer. Le prompt interdit les actualités inventées, les faits déduits du seul lien et les affirmations de recherche non réalisée. La date peut être historique : aucune qualification automatique de « récent ».

Ces champs sont sauvegardés dans le cache local et inclus dans le prompt exportable de lettre. Les anciens brouillons restent lisibles grâce aux valeurs par défaut. Modifier les notes ou la source après génération signale que le contexte de la lettre a changé. Aucune migration supplémentaire n'est requise après 004 pour cette version.
