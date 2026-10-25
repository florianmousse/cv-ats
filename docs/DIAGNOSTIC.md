# Diagnostic éditorial et comparaison à l’offre — 1.8

## Ce qui change

Le scan demande désormais dix axes de relecture : orthographe/grammaire, typographie du texte, volume/précision, formulations d’expérience, réalisations/preuves, structure/titre, chronologie, compétences/outils, adéquation à l’offre et clarté/répétitions. Chaque axe affiche une conclusion ; une réponse incomplète de l’IA reste explicitement « Non conclu ». Les corrections se filtrent par axe et priorité.

L’avertissement sur l’absence d’analyse visuelle reste dans l’introduction. Il n’a plus sa place dans les corrections. Les anciens JSON de scan restent acceptés ; les champs supplémentaires sont facultatifs, bornés et validés.

## Deux sources de constats

- La relecture IA examine les fautes et formulations dans leur contexte, les faits et les exigences propres à tout métier. La consigne demande des extraits exacts et des corrections concrètes, sans imposer un nombre de défauts.
- Des règles locales complètent chaque scan : petit lexique explicite de coquilles courantes, lettres espacées, casse de certains outils, nombre de mots, repérage de phrases d’expérience courtes/longues et de formulations génériques. Elles restent disponibles même si l’IA renvoie un diagnostic peu fourni. Leur origine est affichée.

Ces règles locales ne constituent pas un correcteur orthographique complet. Le repérage des phrases utilise des rubriques et débuts de missions français et peut manquer des formulations. Les retours à la ligne sont rapprochés lorsque possible, sans déduire la mise en page originale.

Les seuils de 300 mots pour examiner un texte court, 6 mots pour une phrase courte et 38 mots pour une phrase longue sont des repères éditoriaux transparents. Ils ne sont pas des standards ATS et n’entraînent aucune déduction automatique de score. Une phrase brève peut être pertinente ; un résultat qualitatif peut suffire, sans mesure chiffrée inventée. Le nouveau score applique le barème explicite ci-dessous ; les anciens résultats restent affichables.

## Termes et exigences

Les listes métier couvrent davantage de langages, frameworks, tests, outils de livraison, infrastructure, cloud, sécurité, missions, langues et qualités. La vue « Dans mon annonce » est proposée par défaut. Les termes spécifiques extraits par le scan complètent les listes locales ; le vocabulaire reste non exhaustif.

Le rapprochement respecte les frontières des mots et des variantes explicitement équivalentes : ReactJS/React.js/React, Gitlab/GitLab, autonome/autonomie. JavaScript ne prouve pas Java, React Native ne prouve pas React web, PHPUnit ne prouve pas JUnit, AngularJS ne prouve pas Angular. Une intégration continue seule ne valide pas tout le cycle CI/CD. Les versions restent distinctes de la technologie générique.

Le relevé d’exigences distingue technologies, versions, durées d’expérience, missions, langues, qualités et contexte. Il conserve un extrait de l’offre et, lorsqu’elle est disponible, une preuve textuelle du CV. Les durées et versions apparaissent en premier.

- **Mention repérée** : le texte comporte une mention ; cela ne valide pas un niveau de maîtrise.
- **À préciser** : le contexte ou les preuves ne suffisent pas, notamment pour une durée d’utilisation.
- **Non documenté** : le CV fourni ne documente pas l’élément ; ce n’est pas un jugement sur les compétences réelles.

Les durées ne sont jamais déduites d’une simple liste de compétences. Les citations de l’IA absentes des sources sont écartées ; un statut positif sans preuve est dégradé. Les alternatives (« ReactJS ou Angular »), minimums et équivalents doivent être relus dans leur contexte ; un mot cité dans l’offre n’est pas nécessairement obligatoire. Aucune compétence n’est ajoutée automatiquement au CV.

## Coût, données et livraison

Le scan garde **un appel Gemini**. La consigne et la réponse peuvent utiliser davantage de tokens ; les contrôles locaux n’utilisent aucune API. Le suivi et les quotas existants s’appliquent sans changement. Aucune migration supplémentaire après 003.

Les tests utilisent un cas synthétique anonymisé : aucun nom, adresse, téléphone ou employeur réel de l’exemple utilisateur n’est ajouté aux fixtures. Les données de l’aperçu visuel sont fictives, sans appel Gemini réel. Les règles, le traitement de réponses IA simulées et l’interface sont vérifiés localement ; l’exhaustivité et la qualité d’une réponse Gemini réelle ne sont pas garanties par ces tests.

## Contrôles mécaniques et données du fichier

Nos 14 contrôles sont : texte extrait, pages, e-mail, téléphone, expériences/projets, formation, compétences, ordre des expériences, cohérence des périodes, lettres espacées, caractères de remplacement, longueur des phrases, lignes répétées et description des projets. Ce n’est pas une reproduction des 14 contrôles propriétaires de Ready4Jobs : leur liste et leur barème détaillés ne sont pas publics dans la page de méthode consultée.

Les règles ont trois états : vérification effectuée, à examiner et non vérifiable ici. Un résultat positif ne couvre que la règle décrite, pas toute la rubrique. Les dates sont volontairement limitées aux périodes numériques année–année ; les autres formats, les durées par technologie et les chevauchements demandent une relecture. Les noms de rubriques reconnaissent un petit ensemble français/anglais. Le téléphone est facultatif, et les projets peuvent remplacer les expériences pour un profil débutant.

L’import PDF compte réellement les pages et les caractères hors espaces par page. Une page sans texte peut être volontairement vide ou contenir des images : on ne prétend pas diagnostiquer un scan. Un PDF entièrement sans texte extractible est refusé avec une explication et la possibilité de coller le texte ; il n’y a pas d’OCR. L’import DOCX atteste l’extraction de texte mais pas le nombre de pages. Colonnes, tableaux, images et ordre de lecture visuel ne sont pas vérifiés.

Ces mesures sont attestées côté serveur par HMAC, liées au compte et à l’empreinte du texte, avec une expiration d’une heure. Le secret de service existant signe une donnée avec un préfixe propre à cet usage ; il n’est jamais transmis. Le justificatif ne contient pas le CV et n’est ni enregistré ni envoyé à Gemini. Modifier le CV ou charger une sauvegarde efface l’attestation ; une preuve absente, périmée, altérée ou liée à un autre texte redevient « inconnu ». Aucun fichier n’est conservé par ce traitement.

## Barème interne cvats-3 (version 1.8)

Le serveur part de 20 points par dimension : structure/lisibilité, impact/preuves, lisibilité technique du texte, clarté/concision, complétude utile. Les constats sont fusionnés et dédupliqués avant calcul ; les retraits sont plafonnés à 20 par dimension. La somme des retraits effectifs vaut 100 moins le score calculé. Une phrase locale identifiée comme vague ne disparaît plus simplement parce qu’une autre mission a le même titre de conseil.

| Constat retenu | Retrait |
| --- | --- |
| E-mail non repéré | 6 points de complétude |
| Période numérique inversée | 5 points de structure |
| Caractère de remplacement non reconnu | 5 points de lisibilité technique |
| Coquille du lexique local | 4 points de clarté |
| Lettres espacées dans le titre | 4 points de lisibilité technique |
| Mission correspondant à une formulation explicitement vague du lexique | 6 points d’impact par formulation distincte |
| Autre constat IA étayé | 8 / 5 / 2 selon priorité élevée / moyenne / faible |
| Nombre de mots/pages seul, longueur seule, titre de rubrique non reconnu, téléphone absent, anglicisme contextuel | Conseil local sans retrait automatique |
| Adéquation à l’offre | Relevé séparé, sans retrait sur la qualité rédactionnelle |

Les défauts qualitatifs de densité peuvent désormais retirer des points lorsqu’ils sont étayés par une citation et une correction ; un simple seuil de longueur ne suffit pas. Les missions vagues sont reconnues par des formulations explicites complètes, avec ou sans puces, jamais par la seule présence de « développement ». Les anglicismes (management, feedback, reporting, deadline, challenge, skills) sont proposés comme choix contextuels en français. Noms de technologies, produits, diplômes et intitulés contractuels ne sont pas remplacés automatiquement.

La catégorie détermine la dimension ; les coûts renvoyés par l’IA sont ignorés. Aucun chiffre de réalisation n’est obligatoire. Ce barème est un choix éditorial interne, non une formule validée par un ATS commercial. Les notes 1.7 (cvats-2) et 1.8 (cvats-3) ne sont donc pas directement comparables ; les anciens résultats restent lisibles.

Les problèmes IA sans citation présente dans le CV, sans catégorie, sans correction non vide et concrète ou avec une limite visuelle comme seul constat sont écartés. Quelques formulations génériques sont filtrées ; cela ne prouve pas à soi seul la qualité sémantique de toutes les corrections. Les corrections courtes sont conservées, même s’il s’agit d’un seul mot. Pour les fautes de langue, de typographie et de clarté, deux corrections différentes d’une même phrase restent distinctes ; les véritables doublons sont fusionnés. Une information absente peut être signalée sans citation par les règles locales.

Depuis la version 1.8.1, **la note globale et les cinq notes restent visibles**. Si un axe de qualité rédactionnelle manque ou n’est pas évalué, la note est explicitement « Score indicatif » : elle peut surestimer la qualité du CV et les axes non conclus restent affichés. Une réserve motivée (« à vérifier ») est une relecture effectuée, pas un échec de calcul. L’adéquation à l’offre est exclue de ce critère de complétude puisqu’elle ne participe pas au barème. Un constat local étayé peut justifier une conclusion IA « à corriger ». Le seuil de 20 caractères qui supprimait des corrections orthographiques valides a été supprimé. Même avec une note élevée, des défauts significatifs empêchent le badge favorable. Les propriétés inconnues du fichier ne sont ni validées ni pénalisées implicitement. Un score élevé indique peu de défauts retenus, pas une preuve d’exhaustivité ou une probabilité d’embauche. Les règles locales sont reproductibles ; l’IA peut varier entre deux analyses.

## Références et limites

La séparation mécanique/qualitative et les cinq dimensions s’inspirent de la [méthode Ready4Jobs](https://www.ready4jobs.ai/fr/methode). [Greenhouse documente](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse) les difficultés d’extraction liées aux images, colonnes, tableaux, zones de texte et lettres espacées. Une extraction partielle ou échouée ne signifie pas un rejet automatique de la candidature. Aucune compatibilité certifiée avec Taleo, Workday, SuccessFactors, Talentsoft ou d’autres produits n’est revendiquée par notre application.

Tests supplémentaires : 14 contrôles reproductibles, dates ambiguës/inversées, PDF réel avec page graphique sans texte, PDF sans texte refusé, DOCX sans pagination supposée, attestation altérée/expirée/autre compte/autre texte, citations invalides, déduplication, caps et cohérence du score, absence de pénalité de longueur ou d’adéquation. Aucun appel Gemini réel pour ces vérifications.
