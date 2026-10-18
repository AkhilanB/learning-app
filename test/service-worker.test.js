import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteDir = fileURLToPath(new URL('../site/', import.meta.url));
const source = readFileSync(path.join(siteDir, 'sw.js'), 'utf8');

function cachedFiles() {
  const match = source.match(/const FILES = (\[[^\]]*\]);/);
  assert.ok(match, 'sw.js has no FILES array');
  return JSON.parse(match[1]);
}

test('the service worker caches every file in site/ plus ./, and nothing else', () => {
  const files = readdirSync(siteDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(siteDir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'));
  assert.deepEqual([...cachedFiles()].sort(), ['./', ...files].sort());
});

test('the service worker has the version placeholder that the deploy workflow replaces', () => {
  assert.match(source, /^const VERSION = '__VERSION__';$/m);
});
