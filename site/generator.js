// Sentence generation (DESIGN.md, "Sentence Generation"): expand the grammar's
// start symbol into terminal symbols, replace each terminal with a word from
// its category, and join the pieces into words.
//
// grammar:    { start, categories: { name: { join, follows? } }, rules: { nonterminal: [[symbol, ...], ...] } }
//             join is "word" (starts a new word), "attach" (no space, no
//             merge) or "merge" (no space, vowel merge with the stem).
// vocabulary: { category: [{ word, label, gloss }, ...] }
// random:     a function returning a number in [0, 1), like Math.random.

import { merge } from './hangul.js';

// An expansion that grows past this many symbols is discarded and restarted.
export const MAX_SYMBOLS = 30;

export function isNonterminal(grammar, symbol) {
  return Object.hasOwn(grammar.rules, symbol);
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

// Expands the start symbol, always rewriting the leftmost non-terminal with a
// uniformly chosen rule, and returns the terminal symbols.
export function expand(grammar, random = Math.random) {
  for (;;) {
    const symbols = [grammar.start];
    let i = 0;
    while (i < symbols.length && symbols.length <= MAX_SYMBOLS) {
      if (isNonterminal(grammar, symbols[i])) {
        symbols.splice(i, 1, ...pick(grammar.rules[symbols[i]], random));
      } else {
        i++;
      }
    }
    if (symbols.length <= MAX_SYMBOLS) return symbols;
  }
}

// Replaces each terminal symbol with a uniformly chosen word of its category.
export function choosePieces(symbols, vocabulary, random = Math.random) {
  return symbols.map((category) => {
    const entries = vocabulary[category];
    if (!entries?.length) throw new Error(`No vocabulary for ${category}`);
    return { category, ...pick(entries, random) };
  });
}

// Joins pieces into words: [{ text, pieces }]. text is the word as displayed;
// pieces are the entries it was built from, for the word popup.
export function joinWords(pieces, categories) {
  const words = [];
  for (const piece of pieces) {
    const { join } = categories[piece.category];
    if (join === 'word' || words.length === 0) {
      words.push({ text: piece.word, pieces: [piece] });
    } else {
      const word = words.at(-1);
      word.text = join === 'merge' ? merge(word.text, piece.word) : word.text + piece.word;
      word.pieces.push(piece);
    }
  }
  return words;
}

export function generateSentence(grammar, vocabulary, random = Math.random) {
  const symbols = expand(grammar, random);
  return joinWords(choosePieces(symbols, vocabulary, random), grammar.categories);
}

// The sentence as text: words separated by spaces, with a period directly
// after the last word.
export function sentenceText(words) {
  return `${words.map((word) => word.text).join(' ')}.`;
}
