// Shared by the tests: the app's data files, and the sentences the grammar
// can derive.

import { readFileSync } from 'node:fs';

import { isNonterminal } from '../site/generator.js';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

export const grammar = readJson('../site/data/grammar.json');
export const vocabulary = readJson('../site/data/vocabulary.json');
export const words = vocabulary.words;

// The fewest terminal symbols each symbol can expand to. A non-terminal that
// cannot be fully expanded into terminals gets no entry.
export function minimumLengths(grammar) {
  const lengths = new Map();
  for (const rules of Object.values(grammar.rules)) {
    for (const symbol of rules.flat()) {
      if (!isNonterminal(grammar, symbol)) lengths.set(symbol, 1);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [nonterminal, rules] of Object.entries(grammar.rules)) {
      for (const rule of rules) {
        if (!rule.every((symbol) => lengths.has(symbol))) continue;
        const length = rule.reduce((sum, symbol) => sum + lengths.get(symbol), 0);
        if (!lengths.has(nonterminal) || length < lengths.get(nonterminal)) {
          lengths.set(nonterminal, length);
          changed = true;
        }
      }
    }
  }
  return lengths;
}

// Every terminal sequence of at most maxSymbols symbols that the grammar
// derives from its start symbol. No rule shrinks an expression, so an
// expression whose symbols cannot expand to maxSymbols or fewer is dropped.
export function derivations(grammar, maxSymbols) {
  const lengths = minimumLengths(grammar);
  const lowerBound = (symbols) => symbols.reduce((sum, symbol) => sum + (lengths.get(symbol) ?? Infinity), 0);
  const results = [];
  const seen = new Set();
  const pending = [[grammar.start]];
  while (pending.length > 0) {
    const symbols = pending.pop();
    const key = symbols.join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    const i = symbols.findIndex((symbol) => isNonterminal(grammar, symbol));
    if (i < 0) {
      results.push(symbols);
      continue;
    }
    for (const rule of grammar.rules[symbols[i]]) {
      const next = [...symbols.slice(0, i), ...rule, ...symbols.slice(i + 1)];
      if (lowerBound(next) <= maxSymbols) pending.push(next);
    }
  }
  return results;
}
