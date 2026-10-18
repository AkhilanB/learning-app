import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STEM_VOWELS,
  compose,
  decompose,
  hasFinalConsonant,
  isSyllable,
  lastVowel,
  merge,
} from '../site/hangul.js';

test('isSyllable accepts exactly one Hangul syllable', () => {
  assert.equal(isSyllable('가'), true);
  assert.equal(isSyllable('힣'), true);
  assert.equal(isSyllable('ㄱ'), false);
  assert.equal(isSyllable('a'), false);
  assert.equal(isSyllable('가나'), false);
  assert.equal(isSyllable(''), false);
});

test('decompose splits a syllable into its letters', () => {
  assert.deepEqual(decompose('가'), { initial: 'ㄱ', vowel: 'ㅏ', final: '' });
  assert.deepEqual(decompose('아'), { initial: 'ㅇ', vowel: 'ㅏ', final: '' });
  assert.deepEqual(decompose('앉'), { initial: 'ㅇ', vowel: 'ㅏ', final: 'ㄵ' });
  assert.deepEqual(decompose('했'), { initial: 'ㅎ', vowel: 'ㅐ', final: 'ㅆ' });
  assert.deepEqual(decompose('힣'), { initial: 'ㅎ', vowel: 'ㅣ', final: 'ㅎ' });
});

test('decompose rejects anything that is not one Hangul syllable', () => {
  assert.throws(() => decompose('a'), RangeError);
  assert.throws(() => decompose('ㅏ'), RangeError);
  assert.throws(() => decompose('가나'), RangeError);
});

test('compose inverts decompose for every syllable', () => {
  for (let code = 0xac00; code <= 0xd7a3; code++) {
    const syllable = String.fromCodePoint(code);
    const { initial, vowel, final } = decompose(syllable);
    assert.equal(compose(initial, vowel, final), syllable);
  }
});

test('compose rejects letters that are not Hangul letters', () => {
  assert.throws(() => compose('a', 'ㅏ', ''), RangeError);
  assert.throws(() => compose('ㄱ', 'ㄱ', ''), RangeError);
  assert.throws(() => compose('ㄱ', 'ㅏ', 'ㄸ'), RangeError);
});

test('hasFinalConsonant and lastVowel read the last syllable of a word', () => {
  assert.equal(hasFinalConsonant('학생'), true);
  assert.equal(hasFinalConsonant('학교'), false);
  assert.equal(hasFinalConsonant('물'), true);
  assert.equal(lastVowel('마시'), 'ㅣ');
  assert.equal(lastVowel('만들'), 'ㅡ');
  assert.equal(lastVowel('좋'), 'ㅗ');
});

test('merge follows the vowel merge table', () => {
  assert.equal(merge('가', '아요'), '가요');
  assert.equal(merge('가', '았어요'), '갔어요');
  assert.equal(merge('서', '어요'), '서요');
  assert.equal(merge('오', '아요'), '와요');
  assert.equal(merge('보', '았어요'), '봤어요');
  assert.equal(merge('주', '어요'), '줘요');
  assert.equal(merge('마시', '어요'), '마셔요');
  assert.equal(merge('보내', '어요'), '보내요');
  assert.equal(merge('세', '어요'), '세요');
  assert.equal(merge('켜', '어요'), '켜요');
  assert.equal(merge('켜', '었어요'), '켰어요');
  assert.equal(merge('되', '어요'), '돼요');
  assert.equal(merge('되', '었어요'), '됐어요');
  assert.equal(merge('쉬', '어요'), '쉬어요');
  assert.equal(merge('하', '여요'), '해요');
  assert.equal(merge('하', '였어요'), '했어요');
});

test('merge does not merge after a stem ending in a consonant', () => {
  assert.equal(merge('먹', '어요'), '먹어요');
  assert.equal(merge('받', '았어요'), '받았어요');
  assert.equal(merge('살', '아요'), '살아요');
  assert.equal(merge('읽', '었어요'), '읽었어요');
  assert.equal(merge('앉', '아요'), '앉아요');
});

test('merge carries the ending\'s final consonant into the merged syllable', () => {
  assert.equal(merge('나오', '았어요'), '나왔어요');
  assert.equal(merge('내', '었어요'), '냈어요');
  assert.equal(merge('서', '었어요'), '섰어요');
  assert.equal(merge('가지', '었어요'), '가졌어요');
});

test('merge leaves an ending that starts with a consonant alone', () => {
  assert.equal(merge('가', '고'), '가고');
  assert.equal(merge('가', '세요'), '가세요');
});

test('STEM_VOWELS are the stem vowels the merge table covers', () => {
  assert.deepEqual([...STEM_VOWELS].sort(), ['ㅏ', 'ㅐ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅗ', 'ㅚ', 'ㅜ', 'ㅟ', 'ㅣ'].sort());
});
