import {test} from 'node:test';
import assert from 'node:assert/strict';
import {containsKeyword,customKeywords} from '../lib/keywords';
test('keyword matching respects skill boundaries and literal punctuation',()=>{
 assert.equal(containsKeyword('JavaScript et NoSQL','Java'),false);
 assert.equal(containsKeyword('JavaScript et NoSQL','SQL'),false);
 assert.equal(containsKeyword('React.js, Node.js / C++ et C#','Node.js'),true);
 assert.equal(containsKeyword('NodeXjs','Node.js'),false);
 assert.equal(containsKeyword('C++','C++'),true);
 assert.equal(containsKeyword('C#','C#'),true);
 assert.equal(containsKeyword('ACCESSIBILITÉ et revue  de code','accessibilité'),true);
 assert.equal(containsKeyword('revue  de code','revue de code'),true);
 assert.equal(containsKeyword('Développeur front‑end','Développeur front-end'),true);
 assert.equal(containsKeyword('TypeScript',''),false);
});
test('custom lists are bounded and empty or duplicate terms removed',()=>{
 assert.deepEqual(customKeywords('SQL, SQL; Python\n,React'),['SQL','Python','React']);
 assert.equal(customKeywords(Array.from({length:40},(_,i)=>`term${i}`).join(',')).length,30);
});
