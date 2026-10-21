# Diagnostic éditorial et comparaison à l’offre — 1.6

## Ce qui change

Le scan demande désormais dix axes de relecture : orthographe/grammaire, typographie du texte, volume/précision, formulations d’expérience, réalisations/preuves, structure/titre, chronologie, compétences/outils, adéquation à l’offre et clarté/répétitions. Chaque axe affiche une conclusion ; une réponse incomplète de l’IA reste explicitement « Non conclu ». Les corrections se filtrent par axe et priorité.

L’avertissement sur l’absence d’analyse visuelle reste dans l’introduction. Il n’a plus sa place dans les corrections. Les anciens JSON de scan restent acceptés ; les champs supplémentaires sont facultatifs, bornés et validés.

## Deux sources de constats

- La relecture IA examine les fautes et formulations dans leur contexte, les faits et les exigences propres à tout métier. La consigne demande des extraits exacts et des corrections concrètes, sans imposer un nombre de défauts.
- Des règles locales complètent chaque scan : petit lexique explicite de coquilles courantes, lettres espacées, casse de certains outils, nombre de mots, repérage de phrases d’expérience courtes/longues et de formulations génériques. Elles restent disponibles même si l’IA renvoie un diagnostic peu fourni. Leur origine est affichée.

Ces règles locales ne constituent pas un correcteur orthographique complet. Le repérage des phrases utilise des rubriques et débuts de missions français et peut manquer des formulations. Les retours à la ligne sont rapprochés lorsque possible, sans déduire la mise en page originale.

Les seuils de 300 mots pour examiner un texte court, 6 mots pour une phrase courte et 38 mots pour une phrase longue sont des repères éditoriaux transparents. Ils ne sont pas des standards ATS et n’entraînent aucune déduction automatique de score. Une phrase brève peut être pertinente ; un résultat qualitatif peut suffire, sans mesure chiffrée inventée. Le score conserve ses cinq critères historiques.

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
