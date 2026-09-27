import {test} from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import {unzipSync,strFromU8} from 'fflate';
import {buildDocx} from '../lib/docx';
test('Word export is editable text, preserves accents and avoids tables/floating boxes',async()=>{
 const blob=await buildDocx({nom:'Élodie Exemple',titre:'Développeuse',contact:{ville:'Rennes',telephone:'',email:'exemple@example.com',portfolio:''},profil:'Développement vérifié.',experiences:[{poste:'Développeuse',entreprise:'Exemple',dates:'2022 – 2025',puces:['Maintenir 3 applications.']}],competences:['React'],formation:[]});
 const buffer=Buffer.from(await blob.arrayBuffer());const raw=await mammoth.extractRawText({buffer});
 for(const text of ['Élodie Exemple','2022 – 2025','Maintenir 3 applications.','React'])assert.ok(raw.value.includes(text));
 const xml=strFromU8(unzipSync(buffer)['word/document.xml']);assert.ok(!xml.includes('<w:tbl>'));assert.ok(!xml.includes('txbxContent'));
});
