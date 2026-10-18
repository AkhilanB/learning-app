// Hangul syllables split into their letters (initial consonant, vowel, final
// consonant) and put back together, and the vowel merge between a verb stem
// and an ending (DESIGN.md, "Joining pieces into words").

const FIRST_SYLLABLE = 0xac00;
const LAST_SYLLABLE = 0xd7a3;
const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const VOWELS = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
// '' stands for no final consonant.
const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

export function isSyllable(character) {
  if (typeof character !== 'string' || character.length !== 1) return false;
  const code = character.codePointAt(0);
  return code >= FIRST_SYLLABLE && code <= LAST_SYLLABLE;
}

export function decompose(syllable) {
  if (!isSyllable(syllable)) {
    throw new RangeError(`Not a Hangul syllable: ${JSON.stringify(syllable)}`);
  }
  const index = syllable.codePointAt(0) - FIRST_SYLLABLE;
  return {
    initial: INITIALS[Math.floor(index / (VOWELS.length * FINALS.length))],
    vowel: VOWELS[Math.floor(index / FINALS.length) % VOWELS.length],
    final: FINALS[index % FINALS.length],
  };
}

export function compose(initial, vowel, final) {
  const i = INITIALS.indexOf(initial);
  const v = VOWELS.indexOf(vowel);
  const f = FINALS.indexOf(final);
  if (i < 0 || v < 0 || f < 0) {
    throw new RangeError(`Not Hangul letters: ${JSON.stringify([initial, vowel, final])}`);
  }
  return String.fromCodePoint(FIRST_SYLLABLE + (i * VOWELS.length + v) * FINALS.length + f);
}

export function lastSyllable(word) {
  return decompose(word.at(-1));
}

export function hasFinalConsonant(word) {
  return lastSyllable(word).final !== '';
}

export function lastVowel(word) {
  return lastSyllable(word).vowel;
}

// Stem's last vowel followed by the ending's first vowel, mapped to the vowel
// of the merged syllable. A pair that is not listed does not merge
// (쉬 + 어요 → 쉬어요).
const MERGED_VOWELS = new Map([
  ['ㅏㅏ', 'ㅏ'], // 가 + 아요 → 가요, 가 + 았어요 → 갔어요
  ['ㅓㅓ', 'ㅓ'], // 서 + 어요 → 서요
  ['ㅗㅏ', 'ㅘ'], // 오 + 아요 → 와요, 보 + 았어요 → 봤어요
  ['ㅜㅓ', 'ㅝ'], // 주 + 어요 → 줘요
  ['ㅣㅓ', 'ㅕ'], // 마시 + 어요 → 마셔요
  ['ㅐㅓ', 'ㅐ'], // 보내 + 어요 → 보내요
  ['ㅔㅓ', 'ㅔ'], // 세 + 어요 → 세요
  ['ㅕㅓ', 'ㅕ'], // 켜 + 어요 → 켜요, 켜 + 었어요 → 켰어요
  ['ㅚㅓ', 'ㅙ'], // 되 + 어요 → 돼요, 되 + 었어요 → 됐어요
  ['ㅏㅕ', 'ㅐ'], // 하 + 여요 → 해요, 하 + 였어요 → 했어요 (only 하 takes 여)
]);

// The vowels a stem may end in when its last syllable has no final consonant:
// those the merge table covers, including ㅟ, which it lists as not merging.
export const STEM_VOWELS = new Set(['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅣ', 'ㅐ', 'ㅔ', 'ㅕ', 'ㅚ', 'ㅟ']);

// Attaches an ending to a stem. When the stem ends in a vowel and the ending
// starts with a bare vowel (아, 어, 여), the two syllables merge into one, and
// the ending's final consonant (ㅆ in 았/었) becomes the merged syllable's.
export function merge(stem, ending) {
  const stemEnd = lastSyllable(stem);
  const endingStart = decompose(ending[0]);
  const vowel = MERGED_VOWELS.get(stemEnd.vowel + endingStart.vowel);
  if (stemEnd.final !== '' || endingStart.initial !== 'ㅇ' || vowel === undefined) {
    return stem + ending;
  }
  return stem.slice(0, -1) + compose(stemEnd.initial, vowel, endingStart.final) + ending.slice(1);
}
