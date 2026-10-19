import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_SYMBOLS,
  choosePieces,
  expand,
  generateSentence,
  joinWords,
  sentenceText,
} from '../site/generator.js';
import { grammar, words } from './data.js';

// A random function that returns the given values in order.
function sequence(values) {
  let i = 0;
  return () => {
    assert.ok(i < values.length, 'ran out of random values');
    return values[i++];
  };
}

const toy = {
  start: 'S',
  categories: {},
  rules: {
    S: [['A', 'B']],
    A: [['a1'], ['a2']],
    B: [['b1'], ['b2'], ['b3']],
  },
};

test('expand rewrites the leftmost non-terminal with a uniformly chosen rule', () => {
  // S has one rule, A two and B three; a value v picks rule floor(v * count).
  assert.deepEqual(expand(toy, sequence([0.5, 0.99, 0.4])), ['a2', 'b2']);
  assert.deepEqual(expand(toy, sequence([0, 0, 0.67])), ['a1', 'b3']);
  assert.deepEqual(expand(toy, sequence([0.1, 0.49, 0.33])), ['a1', 'b1']);
});

test('expand works leftmost first, even when a rule puts a non-terminal first', () => {
  const nested = {
    start: 'S',
    categories: {},
    rules: {
      S: [['A', 'x']],
      A: [['B', 'y'], ['z']],
      B: [['p'], ['q']],
    },
  };
  // S → A x; A → B y; B → q.
  assert.deepEqual(expand(nested, sequence([0, 0, 0.9])), ['q', 'y', 'x']);
});

test('expand discards an expansion past 30 symbols and restarts', () => {
  const recursive = { start: 'S', categories: {}, rules: { S: [['S', 'S'], ['x']] } };
  // Rule 0 thirty times grows the expression to 31 symbols, which is
  // discarded; the restart then picks rule 1.
  const random = sequence([...Array(30).fill(0), 0.9]);
  assert.deepEqual(expand(recursive, random), ['x']);
  assert.throws(() => random(), /ran out/, 'exactly 31 random values are used');
});

test('expand never returns more than 30 symbols', () => {
  const recursive = { start: 'S', categories: {}, rules: { S: [['S', 'S'], ['x']] } };
  for (let i = 0; i < 300; i++) {
    const symbols = expand(recursive);
    assert.ok(symbols.length >= 1 && symbols.length <= MAX_SYMBOLS);
    assert.ok(symbols.every((symbol) => symbol === 'x'));
  }
});

test('choosePieces replaces each terminal with a uniformly chosen word of its category', () => {
  const vocabulary = { A: [{ word: 'a' }, { word: 'b' }, { word: 'c' }], B: [{ word: 'only' }] };
  assert.deepEqual(choosePieces(['A', 'B', 'A', 'A'], vocabulary, sequence([0, 0.5, 0.5, 0.99])), [
    { category: 'A', word: 'a' },
    { category: 'B', word: 'only' },
    { category: 'A', word: 'b' },
    { category: 'A', word: 'c' },
  ]);
});

test('choosePieces fails on a terminal without vocabulary', () => {
  assert.throws(() => choosePieces(['Z'], {}, () => 0), /No vocabulary for Z/);
  assert.throws(() => choosePieces(['Z'], { Z: [] }, () => 0), /No vocabulary for Z/);
});

const categories = {
  noun: { join: 'word' },
  particle: { join: 'attach', follows: 'vowel' },
  stem: { join: 'word' },
  ending: { join: 'merge', follows: 'bright' },
};

test('joinWords starts a word for "word" pieces, attaches particles and merges endings', () => {
  const pieces = [
    { category: 'noun', word: '학교', label: '학교', gloss: 'school' },
    { category: 'particle', word: '는', label: '는', gloss: 'topic particle' },
    { category: 'stem', word: '가', label: '가다', gloss: 'to go' },
    { category: 'ending', word: '았어요', label: '-았어요', gloss: 'past tense, polite' },
  ];
  const joined = joinWords(pieces, categories);
  assert.deepEqual(joined.map((word) => word.text), ['학교는', '갔어요']);
  assert.deepEqual(joined[0].pieces, pieces.slice(0, 2));
  assert.deepEqual(joined[1].pieces, pieces.slice(2));
});

test('joinWords keeps a verbal noun and 하 as separate words', () => {
  const pieces = [
    { category: 'noun', word: '공부', label: '공부', gloss: 'study' },
    { category: 'particle', word: '를', label: '를', gloss: 'object particle' },
    { category: 'stem', word: '하', label: '하다', gloss: 'to do' },
    { category: 'ending', word: '였어요', label: '-였어요', gloss: 'past tense, polite (하 + 였 → 했)' },
  ];
  assert.deepEqual(joinWords(pieces, categories).map((word) => word.text), ['공부를', '했어요']);
});

test('joinWords builds the future and the purpose construction', () => {
  const pieces = [
    { category: 'noun', word: '그것', label: '그것', gloss: 'that (thing)' },
    { category: 'particle', word: '을', label: '을', gloss: 'object particle' },
    { category: 'stem', word: '먹', label: '먹다', gloss: 'to eat' },
    { category: 'ending', word: '으러', label: '-으러', gloss: 'in order to' },
    { category: 'stem', word: '가', label: '가다', gloss: 'to go' },
    { category: 'ending', word: '을', label: '-을', gloss: 'future' },
    { category: 'noun', word: '거예요', label: '거예요', gloss: 'future, polite' },
  ];
  const joined = joinWords(pieces, categories);
  assert.deepEqual(joined.map((word) => word.text), ['그것을', '먹으러', '갈', '거예요']);
  assert.deepEqual(joined[2].pieces, pieces.slice(4, 6));
});

test('joinWords does not merge a particle with the noun before it', () => {
  const pieces = [
    { category: 'noun', word: '저', label: '저', gloss: 'I' },
    { category: 'particle', word: '는', label: '는', gloss: 'topic particle' },
  ];
  assert.deepEqual(joinWords(pieces, categories).map((word) => word.text), ['저는']);
});

test('sentenceText separates words with spaces and ends with a period', () => {
  assert.equal(sentenceText([{ text: '학교는' }, { text: '갔어요' }]), '학교는 갔어요.');
  assert.equal(sentenceText([{ text: '학교' }, { text: '앞은' }, { text: '공부를' }, { text: '했어요' }]), '학교 앞은 공부를 했어요.');
});

test('generateSentence with the app data gives Hangul words with a space between them and a period after the last', () => {
  for (let i = 0; i < 300; i++) {
    const sentence = generateSentence(grammar, words);
    assert.match(sentenceText(sentence), /^[가-힣]+( [가-힣]+)*\.$/);
    assert.ok(sentence.length >= 2);
    for (const word of sentence) {
      assert.ok(word.pieces.length >= 1);
      for (const piece of word.pieces) {
        assert.ok(piece.label.length > 0 && piece.gloss.length > 0);
      }
    }
  }
});
