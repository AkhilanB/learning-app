# Korean Learning App

## Overview

This is a learning app for Korean language learners. It is designed to run as a progressive web app on iOS via Chrome. The site is to be deployed via GitHub Pages. The project repository is https://github.com/AkhilanB/learning-app.

Development should happen entirely on this Linux machine. This directory is the local clone of the repository.

## App flow

The app screen is very simple. A Korean sentence is shown in the center of the screen. There is a large button at the bottom of the screen to move to the next sentence. The button shows only an arrow icon (→), with the accessible label "다음". Once the reader is done reading the sentence, they move to the next sentence. Sentences keep generating infinitely.

There is no back button and no history. Each sentence is generated independently of the previous ones, so a sentence may repeat.

### Word meanings

Tapping a word in the sentence shows a small popup with the English meaning of each piece of that word. For example, tapping 학교는 shows "학교: school" and "는: topic particle", and tapping 갔어요 shows "가다: to go" and "-았어요: past tense, polite". Tapping anywhere else closes the popup. Tapping another word closes it and opens that word's popup. Tapping → closes it and moves to the next sentence in the same tap. Every vocabulary entry, particle and ending therefore has an English gloss in the data.

Each piece is shown by its label, not in its merged form, so the reader sees what the word is built from. Every vocabulary entry stores its label in the data: a stem's label is its dictionary form (가다), an ending's label is the ending with a leading hyphen (-았어요), and any other entry's label is the entry itself (학교, 는). Endings after 하 are also shown by their label, and their gloss names the merge: tapping 했어요 shows "하다: to do" and "-였어요: past tense, polite (하 + 였 → 했)". The verbal noun and 하 are separate words in the sentence, so each has its own popup (공부를: "공부: study", "를: object particle").

### Sentence Generation

Sentences are generated using a context-free grammar.

#### Terminal symbols

There is a fixed set of terminal symbols, each representing a category of words. Each terminal symbol has a corresponding list of vocabulary. Production rules contain only symbols, never literal words. A fixed word such as a particle is a category of its own, whose list may contain a single entry. Each category declares in the grammar data how its pieces join (see "Joining pieces into words"): starting a new word, attaching to the previous piece, or attaching with the vowel merge. A category that follows another (a particle or an ending) also declares what it must follow: a final consonant, a final vowel, or a bright, dark or 하 stem. Adding a category therefore needs no code change. The categories are:

- Nouns, split by whether the noun ends in a final consonant (받침):
  - `noun_ending_with_consonant` (e.g. 학생)
  - `noun_ending_with_vowel` (e.g. 학교)
- Location nouns: nouns that name a place relative to the noun before them (학교 앞, 집 위). They are split like nouns:
  - `location_noun_ending_with_consonant` (e.g. 앞, 안, 옆)
  - `location_noun_ending_with_vowel` (e.g. 뒤, 위, 아래)
- Verbal nouns: nouns that form a 하다 verb with the same meaning, and that sound natural as the object of 하다 (공부 → 공부하다, 공부를 해요). They are split like nouns:
  - `verbal_noun_ending_with_consonant` (e.g. 생각, 운동)
  - `verbal_noun_ending_with_vowel` (e.g. 공부, 준비)
- Verb stems, split by whether the verb takes an object and by the vowel of the stem's last syllable. A final consonant on that syllable does not matter (받, 좋 and 얇 count as bright stems: 얇다 → 얇아요):
  - `stem_bright_object`: last vowel ㅏ, ㅑ or ㅗ, takes an object (e.g. 받, 보)
  - `stem_bright_no_object`: last vowel ㅏ, ㅑ or ㅗ, no object (e.g. 가, 좋)
  - `stem_dark_object`: any other last vowel, takes an object (e.g. 먹, 마시)
  - `stem_dark_no_object`: any other last vowel, no object (e.g. 있, 서)
  - `stem_ha`: 하 only (irregular stem). It takes a verbal noun as its object (공부를 해요). It is not part of the bright categories even though its vowel is ㅏ.
- Particles, split by the noun ending they follow:
  - `topic_after_consonant`: 은
  - `topic_after_vowel`: 는
  - `object_after_consonant`: 을
  - `object_after_vowel`: 를
- Verb endings, split by the stem category they follow:
  - `present_after_bright`: 아요
  - `present_after_dark`: 어요
  - `present_after_ha`: 여요
  - `past_after_bright`: 았어요
  - `past_after_dark`: 었어요
  - `past_after_ha`: 였어요
- Pronouns, split like nouns so they can take the right particle:
  - `pronoun_ending_with_consonant` (e.g. 그것, 이것)
  - `pronoun_ending_with_vowel` (e.g. 저, 우리)

Descriptive verbs (e.g. 좋다) count as verbs that take no object. Nouns, location nouns, verbal nouns and pronouns ending in ㄹ are kept in the "ending with a consonant" categories. Whether a word ends in ㄹ can always be read from its last syllable, so these categories can be split by code later, when particles like (으)로 are added, without sorting the words again by hand.

#### 하다 verbs

A 하다 verb is never stored as one stem. It is split into its verbal noun and 하. For example, 공부하다 is stored as 공부 (`verbal_noun_ending_with_vowel`) plus the 하 stem, and appears as 공부를 해요. This is the form common in written Korean. Verbal nouns are also nouns, so the grammar lets them appear wherever ordinary nouns can (공부는 좋아요). Only verbal nouns can be the object of 하.

A 하다 word can be split only if its first part is a verbal noun, as defined under "Vocabulary". Every other 하다 word is excluded for now. This covers words whose first part is not a standalone noun (깨끗하다, 좋아하다), words whose first part is a noun with the same spelling but a different meaning (대하다, and 위하다, where 위 means "above"), descriptive verbs (중요하다, 필요하다: 필요를 해요 is wrong), and verbs whose X를 하다 form sounds unnatural (의미하다).

#### Production rules

The rules are layered. Intermediate non-terminals group the phrases, so that each choice (subject type, whether there is an object, tense, and so on) is made separately. The initial rule set is:

- (start) → (topic_phrase) (predicate)
- (topic_phrase) → (nominal_ending_with_consonant) (topic_after_consonant) | (nominal_ending_with_vowel) (topic_after_vowel)
- (object_phrase) → (nominal_ending_with_consonant) (object_after_consonant) | (nominal_ending_with_vowel) (object_after_vowel)
- (verbal_noun_object_phrase) → (verbal_noun_ending_with_consonant) (object_after_consonant) | (verbal_noun_ending_with_vowel) (object_after_vowel)
- (nominal_ending_with_consonant) → (noun_ending_with_consonant) | (verbal_noun_ending_with_consonant) | (pronoun_ending_with_consonant) | (location_phrase_ending_with_consonant)
- (nominal_ending_with_vowel) → (noun_ending_with_vowel) | (verbal_noun_ending_with_vowel) | (pronoun_ending_with_vowel) | (location_phrase_ending_with_vowel)
- (location_phrase_ending_with_consonant) → (reference_noun) (location_noun_ending_with_consonant)
- (location_phrase_ending_with_vowel) → (reference_noun) (location_noun_ending_with_vowel)
- (reference_noun) → (noun_ending_with_consonant) | (noun_ending_with_vowel)
- (predicate) → (intransitive_verb) | (transitive_predicate)
- (transitive_predicate) → (object_phrase) (transitive_verb) | (verbal_noun_object_phrase) (ha_verb)
- (intransitive_verb) → (stem_bright_no_object) (bright_ending) | (stem_dark_no_object) (dark_ending)
- (transitive_verb) → (stem_bright_object) (bright_ending) | (stem_dark_object) (dark_ending)
- (ha_verb) → (stem_ha) (ha_ending)
- (bright_ending) → (present_after_bright) | (past_after_bright)
- (dark_ending) → (present_after_dark) | (past_after_dark)
- (ha_ending) → (present_after_ha) | (past_after_ha)

`|` separates alternative rules for the same non-terminal. Each alternative is a separate rule for the uniform choice.

Every sentence has a topic. Written Korean usually states the subject, so sentences without a topic are not generated. Pronouns may be objects (저를, 그것을), as is common in written Korean.

Rules pair each noun category with the matching particle category, and each stem category with the matching ending category. Rules with an object particle use only stems that take an object.

A location noun never stands alone: it always follows a reference noun, and the particle after it matches the location noun's ending (학교 앞은, 집 위를). The reference noun is always an ordinary noun. Verbal nouns are excluded because they name actions, not places (공부 앞). Pronouns are excluded because 저 takes the possessive form 제 before a location noun (제 앞, not 저 앞). Location phrases do not nest (집 앞 옆 is not generated).

#### Generation procedure

Sentences are generated as follows: start with the start symbol. Then uniformly at random select a production rule that applies. In the resulting expression, take the leftmost non-terminal symbol, uniformly select an applicable production rule, then apply it. Continue the process until all symbols are terminal. The grammar is context-free and no rule shrinks the expression, so the expansion order does not change which sentences are generated or how often.

Because each rule is chosen uniformly, the sentence types are not equally common, and this is intended. For example, a quarter of all sentences end in a verbal noun object with 하 (공부를 해요), and a quarter of all topics, and a quarter of the objects of verbs other than 하, are pronouns, so each pronoun appears much more often than each noun.

Rules may refer back to themselves (recursion). If the expression ever grows longer than 30 symbols, it is discarded and generation restarts from the start symbol. Choices therefore stay exactly uniform. No rule may have an empty right-hand side, so an expression never shrinks. A test must check that the start symbol can derive a sentence of at most 30 symbols, so that a restart can always succeed. It must also check that every non-terminal can be fully expanded into terminals.

Once all symbols are terminal, replace each terminal symbol uniformly at random with a word from its corresponding vocabulary.

#### Joining pieces into words

After word selection, the pieces are joined into the displayed sentence:

- Nouns (including location nouns and verbal nouns), pronouns and verb stems begin a new word, separated from the previous word by a space.
- Particles and endings attach to the previous piece with no space.
- When an ending that starts with a vowel (아/어/여) attaches to a stem ending in a vowel, the syllables merge:

  | Stem's last vowel | Merge | Example |
  |---|---|---|
  | ㅏ | 아 is dropped | 가 + 아요 → 가요, 가 + 았어요 → 갔어요 |
  | ㅓ | 어 is dropped | 서 + 어요 → 서요 |
  | ㅗ | ㅗ + 아 → ㅘ | 오 + 아요 → 와요, 보 + 았어요 → 봤어요 |
  | ㅜ | ㅜ + 어 → ㅝ | 주 + 어요 → 줘요 |
  | ㅣ | ㅣ + 어 → ㅕ | 마시 + 어요 → 마셔요 |
  | ㅐ | 어 is dropped | 보내 + 어요 → 보내요 |
  | ㅔ | 어 is dropped | 세 + 어요 → 세요 |
  | ㅕ | 어 is dropped | 켜 + 어요 → 켜요, 켜 + 었어요 → 켰어요 |
  | ㅚ | ㅚ + 어 → ㅙ | 되 + 어요 → 돼요, 되 + 었어요 → 됐어요 |
  | ㅟ | no merge | 쉬 + 어요 → 쉬어요 |
  | 하 | 하 + 여 → 해 | 하 + 여요 → 해요, 하 + 였어요 → 했어요 |

- Stems ending in a consonant do not merge (먹 + 어요 → 먹어요, 받 + 았어요 → 받았어요). A final consonant carried by the ending (ㅆ in 았/었) becomes the final consonant of the merged syllable.
- Stems that end in a vowel not listed in the table are excluded for now. These vowels are ㅑ, ㅒ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ and ㅡ (for ㅡ, see "Grammar scope"). Stems whose last syllable has the vowel ㅘ or ㅛ and a final consonant are also excluded. The list has no such stem.
- Particles never merge with the noun or pronoun before them. Contractions such as 저는 → 전 are not applied.
- The sentence ends with a period, placed directly after the last word. The period is not a piece and has no gloss.

The merging works on Hangul syllables by splitting them into their letters (initial, vowel, final) and recombining them.

#### Grammar scope

The first version covers present and past tense in the polite 해요 style only. Every verb with irregular conjugation is excluded, except 하다. A verb is irregular if its 해요 forms do not follow the joining rules above. The irregular types include ㅂ, ㄷ, ㅅ, 르, ㅎ and 우 irregulars (e.g. 푸다 → 퍼요), and the contracted verbs 그러다, 이러다 and 저러다 (그러다 → 그래요, not 그러요). This list gives examples and is not complete. Stems ending in ㅡ (e.g. 쓰다), the copula 이다 and its negative 아니다 are also excluded for now. Regular stems ending in ㅂ, ㄷ or ㅅ (e.g. 입다, 받다, 웃다) and ㄹ stems (e.g. 살다 → 살아요) conjugate regularly in the 해요 style, so they are included. Interrogative pronouns (뭐, 누구, 무엇, 무어, 어디, 언제) are excluded, because no question forms are generated.

Subject honorification (-(으)시-) is not generated. A topic that refers to a respected person needs it (선생님은 가세요, not 선생님은 가요), so honorific nouns and pronouns are excluded. These include words ending in -님 or -분 (선생님, 그분, 이분), 여러분, and kinship terms for elders such as 어머니, 아버지 and 할머니. Honorific verbs, which honor their subject (계시다, 주무시다, 잡수시다), are excluded for the same reason: no topic refers to a respected person, so they would always clash (저는 주무세요). Verbs whose object must be a respected person (모시다) are excluded too, since no object refers to one. Humble verbs whose respected person is a recipient left unstated, such as 드리다 (저는 그것을 드려요), are kept. The 반말 pronouns 너 and 나 are also excluded, because they clash with the polite 해요 endings (너는 가요, 나는 가요). With 해요 endings, the first person singular is 저.

Note that this is intended to generate a small subset of possible Korean sentences (since Korean is not context-free, and we will use a limited vocab size and list of production rules). Moreover, this will not generate semantically meaningful sentences, only ones that are grammatically correct. This is intended.

### Vocabulary

Vocabulary comes from the National Institute of Korean Language (국립국어원) list 한국어 학습용 어휘 목록 (Korean learner vocabulary list, published May 2003, 5,965 words). Its download page is https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70. That page is HTML; the file itself is linked from it as https://www.korean.go.kr/common/download.do?file_path=etcData&c_file_name=b73a8438-4713-4436-8481-ec26fd0dce2a_0.txt&o_file_name=한국어 학습용 어휘 목록.txt. The file is tab-separated text in CP949 encoding with CRLF line endings. Its first line is a header, followed by a blank line and one line per word. Its columns are frequency rank (순위), word (단어), part of speech (품사), Chinese characters or a note (풀이) and level (등급, A–C). Homograph numbers in the word column are dropped (하다01 → 하다).

The 순위 values are ranks from a larger frequency count, not positions 1–5,965: they are not consecutive and go up to 57,151. A smaller number means more frequent. 68 entries have no rank (63 proper nouns (고), 3 bound forms (불), 1 numeral (수) and 1 noun (명)); entries without a rank are never chosen. A word may appear with more than one part of speech; for example 하다 is listed both as a verb (동) and as an auxiliary verb (보). Only the parts of speech named below are used.

The list is published under 공공누리 (KOGL) Type 1. This allows any use, including commercial use, as long as the source is credited. The repository keeps the downloaded file unchanged, with its source URL and download date. The README and the vocabulary data file credit 국립국어원 as the source. The app screen itself shows no credit.

Choose words by frequency rank, most frequent first, among those that fit a category. Skip words excluded by the grammar scope. The selection is:

- About 50 nouns (명), not counting location nouns or verbal nouns. A noun that cannot stand alone as a topic or object, because it needs a word before it, is excluded. Examples are 전 (前), 후 (後), 동안 and 이상 (以上). Honorific nouns are excluded (see "Grammar scope").
- About 10 location nouns (명): nouns that name a place relative to the noun before them, such as 앞, 뒤, 위, 아래, 안, 밖, 속 and 옆. A location noun is in this category only, never also an ordinary noun. 사이 is excluded, because it needs two nouns (학교와 집 사이).
- About 10 verbal nouns. A verbal noun is a noun (명) whose 하다 verb is also in the list as a verb (동) with the same meaning, and which sounds natural as the object of 하다. For example, 공부 (명) and 공부하다 (동) give 공부를 해요. Matching spelling alone is not enough. The noun and the verb must be the same word: 기술 (技術, technique) is not the noun of 기술하다 (記述, to describe), 위 (above) is not the noun of 위하다, and 말 (horse) is not the noun of 말하다, though 말 (speech) is. The 풀이 column (Chinese characters or a note) helps tell them apart. A noun whose X를 하다 form sounds unnatural, such as 의미 (의미를 해요) or 관련 (관련을 해요), is not a verbal noun. A noun that is not a verbal noun may still be an ordinary noun. A verbal noun is a verbal noun only, never also an ordinary noun. A verbal noun's rank is the smaller (more frequent) of the noun's rank and its 하다 verb's rank, so it is chosen if either form is common. For 운동 (rank 123) and 운동하다 (rank 4,822), the rank is 123.
- About 50 verbs and descriptive verbs (동, 형). A verb in both the object and the no-object categories counts twice. Honorific verbs are excluded (see "Grammar scope"). 하다 itself is the `stem_ha` category. Other 하다 verbs are not counted here: they enter only through their verbal noun, or are excluded (see "하다 verbs").
- The pronouns (대) of level A, with these exceptions:
  - the interrogatives (뭐, 누구, 무엇, 어디, 언제) and 아무;
  - the spoken contractions 거 (of 것), 그거, 이거 and 저거. 거 cannot stand alone, and the others are spoken forms, while the app follows written Korean (그것, 이것 and 저것 are kept);
  - 저04 (that over there). It is rare as a pronoun, and readers take 저는 and 저를 as 저03 (I);
  - the 반말 pronouns 너 and 나, and the honorific pronouns 그분, 이분 and 여러분 (see "Grammar scope").

The counts above are approximate targets. Every terminal category must have at least one word. If a noun, location noun, verbal noun or verb category is still empty once its target is reached, keep going down the frequency list, adding only words that fit the empty category, until it has one.

Words that become identical once homograph numbers are dropped stay separate entries, each with its own gloss and category, for example 말01 (speech) and 말05 (horse), or 이03 (tooth) and 이05 (this). Each entry is checked against the grammar scope on its own: 걷다 (to roll up) is regular and included, while 걷다 (to walk) is a ㄷ irregular and excluded. A word listed under two parts of speech (동 and 형) is also two entries, unless both land in the same category with the same meaning. Then they are one entry, whose rank is the smaller of the two, so the word is not chosen twice as often and does not show the same popup under two entries. For example, 늦다 (동, rank 3,630; 형, rank 949) is one entry, "to be late", with rank 949, while 있다 stays two entries, 있다 (동) "to stay" and 있다 (형) "to exist, to have". A verb takes an object if it can be used with 을/를, including a place with a motion verb (학교를 가다, 집을 나가다, 학교를 다니다). A verb that is used both with and without an object is put in both categories, as two separate words, each with its own gloss.

An LLM agent sorts each word into its category (final consonant or not; stem vowel; takes an object or not; ordinary, location or verbal noun; included or excluded by the grammar scope) and writes its English gloss. Stems also keep their dictionary form (가 → 가다) for the word popup.

This sorting is a one-time development step; nothing is sorted while the app runs. A script extracts the candidate words from the downloaded file in rank order, the same way every time. The agent's sorting and glosses are committed as data, so a changed target or rule is redone starting from that script.

## Implementation

- Plain HTML, CSS and JavaScript (ES modules), with no build step and no framework.
- The grammar (categories and production rules) and the vocabulary are stored as JSON data files, separate from the code, so they can grow without code changes. The app loads them with `fetch`, not with JSON module imports, which need iOS 17.2 or later. If they cannot be loaded, which can only happen before the first visit has cached them, the screen shows "Could not load. Check your connection." in place of the sentence, in English so a beginner can read it, and tapping → retries.
- The app's files live in one directory, `site/`, and only that directory is published. The downloaded vocabulary file, the scripts, the tests and this document are not published.
- The app name is "Learn Korean!". It is used for the page title and as the manifest's `name` and `short_name`.
- The icon is simple: the Hangul syllable 한 in black, centered on a plain white square. It uses Gugi, a rounded Hangul face with bubble-like strokes, so it looks friendly and stays legible at small sizes. The font file is kept in the repository (`scripts/fonts/`, SIL Open Font License, with the license text beside it) and is not published, so the icon can be re-rendered from the repository alone. iOS does not use SVG icons, so it is provided as PNG files (180×180 apple-touch-icon, plus 192×192 and 512×512 for the manifest). A script renders them once, and the PNG files are committed.
- A web app manifest (app name, icon, standalone display) and a service worker that caches every file in `site/`, plus the directory URL `./`, so the app works offline after the first visit. The app opens at `./`, which GitHub Pages serves as `index.html`, and the cache matches by URL, so caching only `index.html` would leave the start page uncached. The service worker serves files from the cache first. When it fills a new cache, it bypasses the browser's HTTP cache (`cache: 'reload'`): GitHub Pages lets browsers keep files for 10 minutes (`Cache-Control: max-age=600`), so a new cache could otherwise mix old and new files and stay broken until the next deploy. Its cache name contains a version placeholder, which the deploy workflow replaces with the commit SHA, so each deploy creates a new cache. A new version downloads in the background and takes over on the next launch, never while a sentence is on screen; the old cache is then deleted. Adding the app to the home screen from Chrome on iOS requires iOS 16.4 or later.
- The sentence is shown in a large font, using the system Korean font, centered on the screen. A word never breaks across lines: lines wrap only at spaces (`word-break: keep-all`), since browsers otherwise break Korean between any two syllables. The layout fits iPhone screen sizes and safe areas. Double-tap zoom and text selection are disabled, so tapping → quickly never zooms the page and a long press on a word does not select text. Pinch zoom stays available. There is no dark mode: the app always uses its light colors, whatever the system setting.
- The app's code is licensed under the GNU General Public License v3; the repository's LICENSE file holds its text. The vocabulary file stays under its own KOGL Type 1 license.
- Tests run with Node's built-in test runner (`node --test`). They cover:
  - the merge rules and the generation procedure;
  - the grammar data: every symbol has rules or vocabulary, and the 30-symbol checks above pass. Categories must also pair correctly. The test lists every terminal sequence of at most 30 symbols that the grammar can derive (a finite set; while the grammar has no recursion, it is every sequence). It checks each particle and ending against the requirement it declares, using the real final consonant or stem vowel of every word that can come before it;
  - the vocabulary data, for what code can read from the Hangul. Categories that start a word (nouns, stems and so on) do not declare their own final consonant or stem vowel, so each word's final consonant and each stem's last vowel are checked by the pairing test above, against every particle or ending that can follow it. A stem is a word in a category that an ending can follow, and an ending is a word in a category that attaches with the vowel merge. Each stem's last vowel is not excluded (see "Joining pieces into words"). Each stem's label (its dictionary form) is the stem plus 다, each ending's label is the ending with a leading hyphen, and every other entry's label is the entry itself. Every entry has a gloss. Tests do not check whether a verb takes an object, or whether a gloss is accurate;
  - the service worker's list of cached files, which must match the contents of `site/` plus `./` exactly.

## Deployment

A GitHub Actions workflow runs on every push to `main`. It runs the tests on Node 24, an LTS version and the same major version as on this machine, and if they pass, writes the commit SHA into the service worker's cache name and publishes `site/` to GitHub Pages.

The site is served at https://akhilanb.github.io/learning-app/, under a subpath, so every URL the app uses is relative: the manifest's `start_url` and `scope`, the service worker registration and the data file fetches. A failing test blocks the deploy. The repository's Pages setting must have "GitHub Actions" selected as its source.

## Design Principles

When making any decisions, follow the below ISO 25010 quality properties in order from most to least important:

- Functional Suitability
- Interaction Capability
- Reliability
- Performance Efficiency
- Maintainability
- Flexibility
- Safety
- Security
- Compatibility


LLM agents make decisions as autonomously as possible: they resolve each decision with these properties, in this order, and with the rest of this document, and act on the result without asking. They ask the designer only when a decision remains ambiguous after that: these properties and this document leave several options open and nothing favors one. This holds for every change: edits to this document before implementation, the initial implementation, and all work after it.

