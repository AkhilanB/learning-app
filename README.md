# Learn Korean!

A reader for Korean learners: one grammatical Korean sentence at a time, generated from a context-free grammar, with the English meaning of each word a tap away. It runs as a progressive web app (add it to the home screen from Chrome on iOS 16.4 or later) and works offline after the first visit.

Site: https://akhilanb.github.io/learning-app/

## How it works

- `site/` is the whole app: plain HTML, CSS and JavaScript (ES modules), no build step. Only this directory is published.
- `site/data/grammar.json` holds the word categories and the production rules; `site/data/vocabulary.json` holds the words of each category with their English glosses. Both can grow without code changes.
- `site/generator.js` expands the grammar (uniform rule choice, leftmost non-terminal first, restart past 30 symbols), picks words and joins them into the sentence; `site/hangul.js` splits and recombines Hangul syllables for the vowel merge between a verb stem and its ending.
- `site/sw.js` caches every file for offline use. The deploy workflow writes the commit SHA into its cache name, so each deploy fills a new cache that takes over on the next launch.

`DESIGN.md` describes the app, the grammar and the vocabulary selection in full.

## Development

Node 24 or later.

- `npm test` runs the tests (`node --test`): the merge rules, the generation procedure, the grammar and vocabulary data, and the service worker's file list.
- `node scripts/extract-candidates.js --pos 명` lists candidate words from the source vocabulary list in rank order; `vocabulary/SELECTION.md` records how the current words were chosen from them.
- `python3 scripts/render-icons.py` renders the icons (needs Pillow; the font is in `scripts/fonts/`).
- To try the app locally, serve `site/` over HTTP, for example `python3 -m http.server -d site 8000`, and open http://localhost:8000/.

Every push to `main` runs the tests and, if they pass, publishes `site/` to GitHub Pages (`.github/workflows/deploy.yml`). The repository's Pages source must be set to "GitHub Actions".

## Vocabulary source

The words come from 한국어 학습용 어휘 목록 (Korean learner vocabulary list, 2003) by 국립국어원 (National Institute of Korean Language). The list is kept unchanged in `vocabulary/`, with its source URL and download date in `vocabulary/SOURCE.md`. It is published under 공공누리 (KOGL) Type 1, which allows any use with attribution.

## License

The app's code is licensed under the GNU General Public License v3 (`LICENSE`). The vocabulary list stays under its own KOGL Type 1 license, and the icon font Gugi (`scripts/fonts/`) under the SIL Open Font License.
