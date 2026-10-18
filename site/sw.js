// Service worker: caches every file of the app so it works offline after the
// first visit, and serves from the cache first.

// The deploy workflow replaces the placeholder with the commit SHA, so each
// deploy fills a new cache. The new version takes over on the next launch
// (no skipWaiting), never while a sentence is on screen.
const VERSION = '__VERSION__';
const CACHE_PREFIX = 'learn-korean-';
const CACHE = CACHE_PREFIX + VERSION;

// Every file in site/, plus the directory URL that the app opens at.
// Kept as a JSON array on its own lines: test/service-worker.test.js reads it.
const FILES = [
  "./",
  "apple-touch-icon.png",
  "app.js",
  "data/grammar.json",
  "data/vocabulary.json",
  "generator.js",
  "hangul.js",
  "icon-192.png",
  "icon-512.png",
  "index.html",
  "manifest.webmanifest",
  "style.css",
  "sw.js"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Bypass the browser's HTTP cache, so a new cache never mixes old and
      // new files (GitHub Pages serves files with max-age=600).
      cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(event.request).then((cached) => cached ?? fetch(event.request)),
    ),
  );
});
