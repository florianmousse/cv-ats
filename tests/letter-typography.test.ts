import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLetterTypography} from '../lib/letter-typography';
import {composeLetter,letterSectionsSchema,externalPrompt} from '../lib/candidature-prompts';

test('letter elisions use apostrophes while compound words and links stay intact',()=>{
 const source='J-ai travaillé avec l-équipe et d-autres collègues. Qu-il s-agisse d-une mission ou d’un échange — j’apporte mon savoir-faire. Peut-être aurons-nous rendez-vous ?';
 const corrected="J'ai travaillé avec l'équipe et d'autres collègues. Qu'il s'agisse d'une mission ou d'un échange - j'apporte mon savoir-faire. Peut-être aurons-nous rendez-vous ?";
 assert.equal(normalizeLetterTypography(source),corrected);
 const protectedText='Jean-Pierre d-Artagnan, Cesson-Sévigné, front-end, l-equipe@example.test https://example.test/l-entreprise www.l-entreprise.fr l-entreprise.fr 2024-2026 A-1';
 assert.equal(normalizeLetterTypography(protectedText),protectedText);
 assert.equal(normalizeLetterTypography(corrected),corrected);
});

test('generated letter paragraphs are repaired before composition and audit',()=>{
 const paragraphs=letterSectionsSchema.parse({je:'J-ai développé des interfaces React avec l-équipe chargée des tests.',vous:'L-entreprise recherche une contribution au suivi des demandes et à leur traitement.',nous:'Je propose d-utiliser ce savoir-faire pour améliorer les interfaces. Je vous remercie.'});
 const letter=composeLetter(paragraphs);
 assert.ok(letter.includes("J'ai développé"));assert.ok(letter.includes("L'entreprise"));assert.ok(letter.includes("d'utiliser ce savoir-faire"));
 assert.equal(letter.split('\n\n').length,4);
 assert.ok(externalPrompt('letter','CV','Annonce').includes('jamais par un tiret'));
});
