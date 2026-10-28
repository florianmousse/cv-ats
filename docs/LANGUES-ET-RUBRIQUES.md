# Rubriques du CV et vérifications linguistiques - 1.9.0

## Rubriques conservées

L'éditeur dispose de champs pour les langues (niveau déclaré, certification, score, date), certifications, projets, centres d'intérêt et rubriques libres (qualités, engagements, publications…). Une formation peut aussi contenir des précisions comme un classement de promotion. Les éléments peuvent être ajoutés, modifiés, supprimés et réordonnés dans leur rubrique, avec annulation/rétablissement.

Ces données passent par le même schéma validé, le cache du dossier et les sauvegardes privées. Leur contenu est présent dans l'aperçu, le texte ATS, les exports Word/PDF, le texte utilisé par le scan et la lettre. Les sections vides ne sont pas exportées. Les anciennes sauvegardes à quatre rubriques restent lisibles ; les nouveaux titres manquants prennent leurs valeurs françaises. Aucune migration SQL supplémentaire après 004.

Les consignes de structuration et d'adaptation demandent de conserver les rubriques dans leurs champs dédiés et d'utiliser les rubriques libres pour le reste. L'audit de fidélité vérifie les omissions. Les niveaux, scores, certifications et dates des langues doivent provenir du CV ; « bilingue » ne peut pas être transformé automatiquement en C2. Une rubrique déjà perdue dans une ancienne proposition n'est pas recréée par supposition : son texte reste récupérable dans l'onglet Comparer si le CV source le contient, puis peut être ajouté manuellement.

## Portée du contrôle

Le module effectue une vérification de cohérence du texte, jamais une authentification de certificat ou une mesure réelle du niveau. Il n'appelle aucun service externe et ne consomme aucun quota IA. Il s'affiche dans l'éditeur et dans le diagnostic ; les points à vérifier alimentent aussi les corrections locales. Ces conseils ne retirent pas automatiquement de points.

- « Bilingue » est repéré avec le nom d'une langue. Il ne vaut pas automatiquement C2 et ne permet pas d'affirmer qu'un ATS rejettera le CV. Un niveau peut être autoévalué, sans certification, s'il est présenté comme tel.
- Les repères numériques intégrés couvrent **TOEIC Listening & Reading**. Les scores, sous-scores sur 495, somme, pas de 5 et limites sont vérifiés lorsqu'ils sont explicitement écrits. Un simple /990 invite à confirmer la variante. Les variantes Bridge, Speaking/Writing ou combinées ne sont pas converties par le barème L&R.
- Un total donne uniquement un repère global indicatif. ETS recommande de considérer séparément Listening et Reading. Le résultat ne mesure pas l'expression orale/écrite et ne justifie pas C2. Un niveau actuel différent d'un ancien résultat doit être distingué, pas remplacé automatiquement.
- Pour une année seule : plus de deux années calendaires complètes écoulées → résultat historique ; année courante moins deux → date exacte à vérifier ; date absente ou future → précision demandée. La durée de confirmation par ETS ne signifie pas que les compétences du candidat expirent.
- Le repérage est limité aux mentions et résultats regroupés sur une même ligne/entrée, comme dans les exports de l'éditeur. Les formats non reconnus restent à relire. Aucun barème n'est inventé pour une autre certification.

Dans l'exemple « Anglais B2 - TOEIC 930/990 - 2023 », le contrôle conserve B2, indique un repère global compatible sous réserve de la variante L&R, recommande les sous-scores et rappelle le caractère historique du résultat. « Allemand bilingue » reste une déclaration à préciser si utile, jamais une conversion automatique en C2. Le repérage de mots-clés distingue « bilingue » et les niveaux A1 à C2 ; une mention n'est pas une preuve de certification.

## Sources officielles consultées le 28 octobre 2026

- [ETS : correspondances par épreuve](https://www.ets.org/pdfs/toeic/toeic-mapping-cefr-reference.pdf)
- [ETS : interprétation du score total et limites](https://www.ets.org/content/dam/ets-org/de/pdfs/toeic/mapping-cefr-toeic-listening-reading-test.pdf)
- [ETS Global : confirmation et conservation des scores](https://www.etsglobal.org/pm/fr/help-center/mon-score/comment-les-tests-sont-ils-corriges)
- [Conseil de l'Europe : échelle globale du CECRL](https://www.coe.int/en/web/common-European-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale)
- [Conseil de l'Europe : C2 ne désigne pas automatiquement un locuteur natif](https://rm.coe.int/16802fc0b1)

## Vérification

Les tests utilisent des données fictives : compatibilité des anciennes sauvegardes, conservation de chaque rubrique dans le cache et les exports (Word XML et extraction du PDF), refus d'un niveau inventé, limites et somme des scores, repères distincts par épreuve, variantes inconnues et dates. Les appels Gemini de la route sont simulés ; les tests ne garantissent pas l'exhaustivité d'une extraction réelle par l'IA.
