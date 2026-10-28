# Éditeur de CV - version 1.5

## Parcours

1. Déposer ou coller le CV et l'annonce. Le scan reste disponible sans annonce.
2. Lancer l'optimisation : Gemini propose une version adaptée, puis un second appel vérifie la fidélité au parcours.
3. Dans l'éditeur, ajuster identité, titre, profil, expériences, compétences et formations. Les expériences et formations peuvent être ajoutées, retirées ou réordonnées. Annuler/rétablir conserve jusqu'à 50 modifications ; réinitialiser revient à la version à l'ouverture de l'éditeur.
4. Choisir un modèle Essentiel, Classique ou Éditorial, une couleur et une densité. L'aperçu HTML est continu ; « PDF exact » génère le même document que le téléchargement. Le lecteur intégré dépend du navigateur ; un lien permet aussi d'ouvrir le PDF.
5. Comparer avec le texte source et vérifier les termes de l'offre. Le repérage utilise les listes métier locales, complétables manuellement : il ne constitue pas un score ATS et ne reconnaît pas tous les synonymes.
6. Exporter le PDF, le Word modifiable ou copier le texte. Word reprend les modifications du contenu dans sa mise en page simple, sans reproduire les réglages graphiques du PDF.
7. « Enregistrer une version » ouvre le formulaire et présélectionne l'annonce ainsi que le CV édité et son style. Donner un nom et confirmer l'enregistrement. Chaque sauvegarde est une nouvelle version privée ; aucun enregistrement automatique.

Les modifications manuelles ne sont pas auditées par Gemini. Relire les faits, dates et chiffres avant l'envoi. L'édition, les aperçus et les exports n'effectuent aucun appel IA ; scan et optimisation conservent les règles de quota existantes. Changer les textes source ou relancer une analyse demande confirmation avant de remplacer un CV en cours d'édition. Quitter ou actualiser l'onglet fait perdre les modifications non enregistrées.

## Diagnostic

Les nouveaux scans peuvent détailler cinq critères sur 20 : identité, rubriques, structure textuelle, précision et pertinence. Le serveur recalcule le total à partir des critères. En l'absence d'annonce, le dernier critère porte sur la clarté du CV. Les anciens résultats sans critères restent acceptés.

Les corrections se filtrent par priorité. Un extrait n'est présenté que s'il est retrouvé dans le texte source après normalisation des espaces. Les pistes de correction restent des propositions à vérifier ; aucun score futur ni résultat de recrutement n'est promis. L'analyse du texte extrait n'évalue pas la mise en page originale.

## Navigation et compte

La barre principale contient l'atelier et le menu « Mon espace ». Ce dernier rassemble IA/consommation, sécurité, administration selon le rôle et déconnexion. Les aides et les mots-clés sont accessibles dans l'atelier.

Mon compte comporte deux panneaux : IA et consommation (clé personnelle, aide de création, modèle avancé, quota), et Sécurité (mot de passe). Les liens directs `/compte#ia` et `/compte#securite` sélectionnent le bon panneau. Le changement de mot de passe obligatoire reste prioritaire à la première connexion.

## Stockage et mise à jour

Les sauvegardes utilisent le JSON existant avec un champ facultatif `presentation` validé strictement. Les sauvegardes antérieures restent lisibles et reçoivent le style par défaut. Aucune nouvelle table ni migration 004 : conserver les migrations 001, 002 et 003, puis déployer la nouvelle version.

Les quotas de la clé partagée sont définis par l'administrateur ; une clé personnelle reste prioritaire et ne consomme pas ce quota interne. Voir [QUOTAS-IA.md](QUOTAS-IA.md).

## Inspirations et périmètre

[Reactive Resume](https://github.com/reactive-resume/reactive-resume) inspire l'édition structurée et la prévisualisation. Le rapport Ready4Jobs fourni en HTML inspire les critères et les conseils contextualisés. Aucun code de ces produits n'est incorporé. L'éditeur est intégré au parcours CV–annonce de cette application ; il ne reproduit pas l'ensemble des modèles, sections personnalisées ou fonctions de partage de Reactive Resume.

## Vérification locale

Tests de modification, ordre, historique, validation des styles, compatibilité des anciennes versions, mots-clés, extraits et extraction du texte d'un véritable PDF généré. Vérification visuelle avec données fictives des écrans ordinateur et mobile (390 px), des onglets, de l'enregistrement et du rechargement d'un CV édité avec son style.

Les services de l'aperçu sont simulés dans un environnement temporaire retiré avant livraison. Aucun appel payant, modification de compte réel, migration hébergée ou déploiement n'est effectué par ces vérifications.
