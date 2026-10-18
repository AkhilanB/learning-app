#!/usr/bin/env node
// Extracts candidate words from the National Institute of Korean Language
// learner vocabulary list (vocabulary/korean-learner-vocabulary-2003.txt),
// most frequent first. This is the fixed starting point for the one-time
// sorting step described in DESIGN.md ("Vocabulary"): run it, then sort the
// candidates into categories by hand and commit the result as
// site/data/vocabulary.json.
//
// Usage:
//   node scripts/extract-candidates.js --pos 명 [--limit 300]
//       Entries with the given parts of speech (comma-separated), in rank
//       order. Columns: rank, word, part of speech, note (풀이), level, and
//       the entry as written in the file (with its homograph number).
//   node scripts/extract-candidates.js --hada [--limit 100]
//       Nouns whose 하다 verb is also in the list (verbal-noun candidates), in
//       order of the smaller of the two ranks. Columns: combined rank, noun,
//       noun rank, noun note, verb rank, verb note, noun entry, verb entry.
//
// Entries without a rank are never candidates and are left out.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../vocabulary/korean-learner-vocabulary-2003.txt', import.meta.url));

export function parseList(bytes) {
  // CP949 (Windows-949) is what the WHATWG "euc-kr" decoder implements.
  const text = new TextDecoder('euc-kr').decode(bytes);
  const lines = text.split(/\r?\n/);
  const entries = [];
  // Line 1 is the header and line 2 is blank.
  for (const line of lines.slice(2)) {
    if (line === '') continue;
    const [rank, entry, pos, note, level] = line.split('\t');
    entries.push({
      rank: rank === '' ? null : Number(rank),
      word: entry.replace(/\d+$/, ''),
      entry,
      pos,
      note: note ?? '',
      level: level ?? '',
    });
  }
  return entries;
}

function byRank(a, b) {
  return a.rank - b.rank;
}

function main(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args.set(argv[i].slice(2), next);
        i++;
      } else {
        args.set(argv[i].slice(2), true);
      }
    }
  }
  const limit = args.has('limit') ? Number(args.get('limit')) : Infinity;
  const entries = parseList(readFileSync(FILE)).filter((e) => e.rank !== null);
  const rows = [];

  if (args.has('hada')) {
    const verbs = entries.filter((e) => e.pos === '동');
    for (const noun of entries.filter((e) => e.pos === '명')) {
      for (const verb of verbs.filter((v) => v.word === noun.word + '하다')) {
        rows.push({
          rank: Math.min(noun.rank, verb.rank),
          cells: [noun.word, noun.rank, noun.note, verb.rank, verb.note, noun.entry, verb.entry],
        });
      }
    }
  } else if (args.has('pos')) {
    const wanted = new Set(String(args.get('pos')).split(','));
    for (const e of entries.filter((e) => wanted.has(e.pos))) {
      rows.push({ rank: e.rank, cells: [e.word, e.pos, e.note, e.level, e.entry] });
    }
  } else {
    console.error('Usage: extract-candidates.js --pos 명[,동,...] [--limit N] | --hada [--limit N]');
    process.exit(2);
  }

  // Array.prototype.sort is stable, so ties keep the file's order.
  rows.sort(byRank);
  for (const row of rows.slice(0, limit)) {
    console.log([row.rank, ...row.cells].join('\t'));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
