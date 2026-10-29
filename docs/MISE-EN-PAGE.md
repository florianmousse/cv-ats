# Mise en page et récupération des rubriques - 1.10.0

- Les termes de l'annonce et les listes personnalisées utilisent la largeur disponible : grille adaptative sur ordinateur et deux colonnes sur mobile.
- Six modèles à une colonne : Essentiel, Classique, Éditorial, Synthèse, Repères et Signature. Les trois derniers sont des créations locales inspirées des possibilités de personnalisation de Reactive Resume, sans copie de ses composants.
- Le PDF est recalculé localement après une pause de saisie. Son nombre de pages vient du moteur qui produit le fichier exporté, pas de la hauteur de l'aperçu HTML. Les résultats devenus obsolètes sont masqués et les URL temporaires libérées.
- Au-delà d'une page : conseils et boutons pour resserrer les espacements, réduire de 1 ou 2 points lorsque la limite de 9 pt le permet, ou réduire les marges. Chaque réglage passe par Annuler/Rétablir, le cache et les sauvegardes. Rien n'est supprimé pour imposer une page.
- Les e-mails, URL HTTP(S), portfolios et liens de projet sont cliquables dans le PDF et l'aperçu. Les noms de technologies comme Node.js ne deviennent pas des liens. Aucun script ou lien de fichier local n'est accepté.

## Pourquoi les rubriques restaient vides

Ajouter les champs au schéma ne remplit pas rétroactivement les anciennes propositions. De plus, adapter une proposition déjà incomplète réutilisait son texte et pouvait remplacer le texte source conservé.

Les anciens brouillons sont désormais complétés une seule fois depuis leur source, pour les rubriques vides reconnues par un titre explicite (langues, intérêts, projets, certifications, qualités, engagements, publications). Les suppressions effectuées ensuite ne sont pas annulées au rechargement. Le texte source est conservé pendant les adaptations successives. Les nouvelles réponses IA sont également complétées avant leur audit de fidélité, sans appel supplémentaire.

Le bouton « Compléter depuis le CV source » permet une récupération explicite et annulable. Il ne remplace pas les rubriques déjà remplies. Le repérage local est conservateur : une extraction désordonnée, un titre inhabituel ou une source déjà amputée ne permet pas une reconstruction certaine. Les langues récupérées conservent leur formulation ; aucune conversion de niveau n'est inventée. Les détails non structurés restent dans leur texte à relire.

## Vérifications

Tests sur les six PDF : nombre réel de pages, annotations de liens, conservation des rubriques et du texte, réglages bornés et réduction effective du nombre de pages. Tests de récupération locale, migration du cache, suppression volontaire et route IA avec fournisseur simulé. Contrôle visuel des pages rendues et du parcours dans le navigateur : grille large/mobile, récupération, pagination, réduction, annulation et reprise du cache. Aucune requête IA réelle ni migration SQL supplémentaire.

## Références consultées le 28 octobre 2026

- [Reactive Resume : fonctionnalités et personnalisation](https://github.com/reactive-resume/reactive-resume#features)
- [Reactive Resume : principes de conception](https://github.com/reactive-resume/reactive-resume/blob/main/DESIGN.md)
- [pdfmake : liens PDF](https://pdfmake.github.io/docs/0.3/document-definition-object/links/)

Autres idées utiles repérées pour une évolution ultérieure : classement des versions par étiquettes, export/import JSON et filtres de modèles. Elles ne sont pas incluses dans cette version.
