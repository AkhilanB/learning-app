// The grammar and vocabulary data in site/data/.

import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_SYMBOLS, isNonterminal } from '../site/generator.js';
import { STEM_VOWELS, hasFinalConsonant, isSyllable, lastSyllable } from '../site/hangul.js';
import { derivations, grammar, minimumLengths, vocabulary, words } from './data.js';

const JOINS = new Set(['word', 'attach', 'merge']);
const FOLLOWS = new Set(['consonant', 'vowel', 'bright', 'dark', 'ha']);
const BRIGHT_VOWELS = new Set(['ㅏ', 'ㅑ', 'ㅗ']);
// A stem whose last syllable has one of these vowels and a final consonant is
// excluded (DESIGN.md, "Joining pieces into words").
const EXCLUDED_CLOSED_VOWELS = new Set(['ㅘ', 'ㅛ']);

const { categories } = grammar;
const nonterminals = Object.keys(grammar.rules);
const sequences = derivations(grammar, MAX_SYMBOLS);

const isHa = (word) => word.at(-1) === '하';

// What a word must look like for a category with this `follows` to come after it.
const REQUIREMENTS = {
  consonant: (word) => hasFinalConsonant(word),
  vowel: (word) => !hasFinalConsonant(word),
  bright: (word) => BRIGHT_VOWELS.has(lastSyllable(word).vowel) && !isHa(word),
  dark: (word) => !BRIGHT_VOWELS.has(lastSyllable(word).vowel),
  ha: (word) => isHa(word),
};

// Endings are the words of categories that attach with the vowel merge; stems
// are the words of categories an ending can follow.
const endingCategories = new Set(Object.keys(categories).filter((name) => categories[name].join === 'merge'));
const stemCategories = new Set();
for (const sequence of sequences) {
  for (let i = 1; i < sequence.length; i++) {
    if (endingCategories.has(sequence[i])) stemCategories.add(sequence[i - 1]);
  }
}

test('grammar: the start symbol is a non-terminal', () => {
  assert.ok(isNonterminal(grammar, grammar.start));
});

test('grammar: no rule has an empty right-hand side', () => {
  for (const [nonterminal, rules] of Object.entries(grammar.rules)) {
    assert.ok(rules.length > 0, `${nonterminal} has no rules`);
    for (const rule of rules) {
      assert.ok(Array.isArray(rule) && rule.length > 0, `${nonterminal} has an empty rule`);
    }
  }
});

test('grammar: every symbol in a rule is a non-terminal or a category with vocabulary', () => {
  for (const [nonterminal, rules] of Object.entries(grammar.rules)) {
    for (const symbol of rules.flat()) {
      if (isNonterminal(grammar, symbol)) continue;
      assert.ok(Object.hasOwn(categories, symbol), `${symbol} (in ${nonterminal}) is not a category`);
      assert.ok(words[symbol]?.length > 0, `${symbol} has no vocabulary`);
    }
  }
});

test('grammar: categories, rules and vocabulary lists name the same symbols', () => {
  const used = new Set(Object.values(grammar.rules).flat(2));
  for (const name of Object.keys(categories)) {
    assert.ok(!isNonterminal(grammar, name), `${name} is both a category and a non-terminal`);
    assert.ok(used.has(name), `category ${name} is not used by any rule`);
    assert.ok(Object.hasOwn(words, name), `category ${name} has no vocabulary list`);
  }
  for (const name of Object.keys(words)) {
    assert.ok(Object.hasOwn(categories, name), `vocabulary list ${name} is not a category`);
  }
});

test('grammar: each category declares how it joins, and what it follows exactly when it attaches', () => {
  for (const [name, category] of Object.entries(categories)) {
    assert.ok(JOINS.has(category.join), `${name}: join is ${category.join}`);
    if (category.join === 'word') {
      assert.equal(category.follows, undefined, `${name} starts a word but declares follows`);
    } else {
      assert.ok(FOLLOWS.has(category.follows), `${name}: follows is ${category.follows}`);
    }
  }
});

test('grammar: every non-terminal can be fully expanded into terminals', () => {
  const lengths = minimumLengths(grammar);
  for (const nonterminal of nonterminals) {
    assert.ok(lengths.has(nonterminal), `${nonterminal} cannot be expanded into terminals`);
  }
});

test('grammar: the start symbol derives a sentence of at most 30 symbols', () => {
  assert.ok(minimumLengths(grammar).get(grammar.start) <= MAX_SYMBOLS);
  assert.ok(sequences.length > 0);
});

test('grammar: every sentence starts with a piece that starts a word', () => {
  for (const sequence of sequences) {
    assert.equal(categories[sequence[0]].join, 'word', sequence.join(' '));
  }
});

test('grammar: every particle and ending follows what it declares, for every word that can come before it', () => {
  for (const sequence of sequences) {
    for (let i = 1; i < sequence.length; i++) {
      const { follows } = categories[sequence[i]];
      if (!follows) continue;
      for (const entry of words[sequence[i - 1]]) {
        assert.ok(
          REQUIREMENTS[follows](entry.word),
          `${entry.word} (${sequence[i - 1]}) cannot be followed by ${sequence[i]} (${follows})`,
        );
      }
    }
  }
});

test('vocabulary: credits the source', () => {
  assert.match(vocabulary.source, /국립국어원/);
});

test('vocabulary: every entry is Hangul syllables with a label and a gloss', () => {
  for (const [name, entries] of Object.entries(words)) {
    for (const entry of entries) {
      const letters = [...entry.word];
      assert.ok(letters.length > 0 && letters.every(isSyllable), `${name}: ${JSON.stringify(entry.word)} is not Hangul`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `${name}: ${entry.word} has no label`);
      assert.ok(typeof entry.gloss === 'string' && entry.gloss.trim().length > 0, `${name}: ${entry.word} has no gloss`);
    }
  }
});

test('vocabulary: a stem\'s label is its dictionary form, an ending\'s label has a leading hyphen, any other label is the entry', () => {
  assert.ok(stemCategories.size > 0 && endingCategories.size > 0);
  for (const [name, entries] of Object.entries(words)) {
    for (const entry of entries) {
      let expected = entry.word;
      if (stemCategories.has(name)) expected = `${entry.word}다`;
      else if (endingCategories.has(name)) expected = `-${entry.word}`;
      assert.equal(entry.label, expected, `${name}: ${entry.word}`);
    }
  }
});

test('vocabulary: no stem ends in an excluded vowel', () => {
  for (const name of stemCategories) {
    for (const entry of words[name]) {
      const { vowel, final } = lastSyllable(entry.word);
      if (final === '') {
        assert.ok(STEM_VOWELS.has(vowel), `${name}: ${entry.word} ends in ${vowel}`);
      } else {
        assert.ok(!EXCLUDED_CLOSED_VOWELS.has(vowel), `${name}: ${entry.word} has ${vowel} with a final consonant`);
      }
    }
  }
});

test('vocabulary: no category lists the same entry twice', () => {
  for (const [name, entries] of Object.entries(words)) {
    const keys = entries.map((entry) => `${entry.word}\u0000${entry.gloss}`);
    assert.equal(new Set(keys).size, keys.length, `${name} has a duplicate entry`);
  }
});

test('vocabulary: ranks, where given, are positive integers', () => {
  for (const [name, entries] of Object.entries(words)) {
    for (const entry of entries) {
      if (entry.rank === undefined) continue;
      assert.ok(Number.isInteger(entry.rank) && entry.rank > 0, `${name}: ${entry.word} has rank ${entry.rank}`);
    }
  }
});
