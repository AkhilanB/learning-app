# Vocabulary selection

How the entries in `site/data/vocabulary.json` were chosen from the 국립국어원 list (`korean-learner-vocabulary-2003.txt`), following DESIGN.md ("Vocabulary"). The candidates came from `scripts/extract-candidates.js`, which lists the entries of a part of speech in rank order, and were sorted by hand (by an LLM agent) on 2026-10-17. Every included entry keeps its rank in `vocabulary.json`, so the included words of a part of speech are the ranked candidates up to the cutoff given below, minus the words listed here with the reason they were left out.

To redo the selection after a change of target or rule, rerun the script and walk the list again from the top, reusing these notes for the words already judged.

## Ordinary nouns (명): 20, ranks 12–120

Candidates: `node scripts/extract-candidates.js --pos 명`. The first 20 ordinary nouns were taken; the cutoff fell at 세계 (rank 120). Nouns up to that rank that were not taken:

| Rank | Word | Why not |
|---|---|---|
| 28 | 말 (speech) | verbal noun |
| 29 | 일 | verbal noun |
| 60 | 속 | location noun |
| 64 | 앞 | location noun |
| 75 | 생각 | verbal noun |
| 87 | 뒤 | location noun |
| 106 | 어머니 | kinship term for an elder (honorific) |
| 115 | 전 (前) | needs a word before it |
| 116 | 곳 | needs a modifier before it (이곳, 어떤 곳); it does not stand alone as a topic or object |
| 118 | 안 | location noun |

Judgment calls among the included words: 때, 경우, 정도 and 다음 are time or degree nouns that often take a modifier but also stand alone as a topic or object (때를 기다려요, 경우가 달라요), so they stay. 눈 is the body part (the list's note is 신체의 일부) and 점 is 點.

Next candidates past the cutoff, for a larger target (these were included when the target was 50): 학교 (125), 정부 (136), 돈 (140), 국가 (141), 날 (143), 여성 (146), 친구 (147), 마음 (148), 관계 (152), 남자 (154), 몸 (156), 얼굴 (157), 지역 (162), 모습 (164), 물 (165), 이번 (172), 길 (173), 지금 (176), 방법 (179), 우리나라 (181), 처음 (184), 손 (185), 그때 (187), 과정 (188), 삶 (189), 교육 (198), 경제 (200), 예술 (205), 역사 (208), 결과 (211), then 내용 (212), 책 (215), 시장 (218), 힘 (224), 나라 (226), 의미 (228; an ordinary noun, since 의미를 해요 is unnatural), 자리 (229), 정치 (234), 국민 (235), 생명 (236). 이번, 지금, 처음 and 그때 are time nouns that stand alone, like 때 (이번은 달라요). Already judged beyond the cutoff: 위 (122), 운동 (123), 생활 (174) and 이야기 (197) are location or verbal nouns; 대통령 (128) refers to a respected person, so as a topic it would need -(으)시-; 후 (149) and 이상 (194) need a word before them, like 전; 아버지 (153) is a kinship term for an elder, like 어머니; 사이 (178) is a location noun that needs two nouns and is excluded altogether; 선생님 (204) is honorific (-님); 얘기 (237) is the spoken form of 이야기 and is left out like 그거; 엄마 (240) and 아빠 (379) refer to the parents, like 어머니 and 아버지; 이후 (270) needs a word before it, like 후; 교수 (371) and 선생 (518) refer to teachers, like 선생님; 언니 (497) is a kinship term for an elder sibling, which does not take -(으)시-, so it would be included; 끝 (333) is the end or edge of a thing, not a place relative to it, so it is an ordinary noun.

## Location nouns (명): 10, ranks 60–652

Nouns that name a place relative to the noun before them, in rank order: 속 (60), 앞 (64), 뒤 (87), 안 (118), 위 (122), 밖 (257), 가운데 (264), 옆 (444), 아래 (453), 밑 (652). 사이 (178) is excluded (it needs two nouns) and 끝 (333) is not a location noun (see above). Next candidates: 주변 (654), 주위 (743), 중앙 (872), 근처 (1151).

## Verbal nouns: 10, combined ranks 28–305

Candidates: `node scripts/extract-candidates.js --hada`, which pairs each noun with its 하다 verb and ranks the pair by the smaller of the two ranks. The first 10 pairs in which the noun and the verb are the same word and X을/를 해요 is natural were taken; the cutoff fell at 이용 (305). Pairs up to that rank that were not taken:

| Rank | Noun | Why not |
|---|---|---|
| 24 | 대 | 대하다 (對-) is not "to do 대" |
| 32 | 말 (horse) | 말하다 is from 말 (speech) |
| 33 | 위 | 위하다 (爲-) is not from 위 (above) or 위 (胃) |
| 60 | 속 | 속하다 (屬-) is not from 속 (inside) |
| 78 | 통 | 통하다 (通-) is not from 통 (桶) |
| 115 | 전 | 전하다 (傳-) is not from 전 (前) |
| 228 | 의미 | 의미를 해요 is unnatural (DESIGN.md) |
| 237 | 얘기 | spoken form of 이야기 |
| 296 | 뜻 | 뜻을 해요 is unnatural (뜻하다 means "to mean") |

Next candidates: 활동 (309), 조사 (336), 사랑 (373), 전화 (375), 계획 (400), 발전 (416), 행동 (445), 노래 (487), 공부 (490), 노력 (494). Already judged among the later pairs: 관련 (420) is unnatural as 관련을 해요 (DESIGN.md); 기술 (328) pairs 技術 with 記述, two different words; 비 (448), 향 (419), 못 (495), 면 (643), 인 (731), 정 (803), 피 (818) and 반 (834) are not the nouns of their 하다 verbs.

## Verbs and descriptive verbs (동, 형): 20 entries, ranks 4–93

Candidates: `node scripts/extract-candidates.js --pos 동,형`. Entries were taken in rank order until the count reached 20, a verb used both with and without an object counting twice; the cutoff fell at 보이다 (93, passive). 하다 (2) is the `stem_ha` category and is not counted. Entries up to the cutoff that were not taken:

| Rank | Word | Why not |
|---|---|---|
| 16 | 아니다 | negative copula |
| 24 | 대하다 | 하다 verb whose first part is not a verbal noun |
| 32 | 말하다 | enters as 말 + 하다 |
| 33 | 위하다 | 하다 verb whose first part is not a verbal noun |
| 38 | 그렇다 | ㅎ irregular |
| 39 | 크다 | ㅡ stem |
| 51 | 따르다 | 르 irregular |
| 58 | 생각하다 | enters as 생각 + 하다 |
| 59 | 모르다 | 르 irregular |
| 76 | 어떻다 | ㅎ irregular |
| 78 | 통하다 | 하다 verb whose first part is not a verbal noun |
| 79 | 그러다 | contracted verb (그래요) |
| 88 | 듣다 | ㄷ irregular |

Object use: motion verbs take a place as an object (학교를 가요, 집을 나가요), so 가다, 오다 and 나오다 are each in an object category and a no-object category. 살다 is kept without an object (삶을 살다 is a set phrase). 들다 (91) is "to enter" and 보이다 (93) is the passive "to be seen". 있다 (동, 888) is past the cutoff, so only 있다 (형) is included.

Next candidates past the cutoff, for a larger target (these were included when the target was 50): 가지다 (94), 지나다 (97; with and without an object), 주다 (101), 나다 (104), 들다 (130, to lift), 들어가다 (158; with and without an object), 나타나다 (160), 만나다 (166), 내다 (167), 보이다 (168, causative: to show), 앉다 (183), 찾다 (191), 나가다 (196; with and without an object), 사다 (199), 잡다 (202), 서다 (206), 읽다 (209), 일어나다 (216), 넣다 (219), 느끼다 (222), 밝히다 (230), 죽다 (231), 내리다 (243; with and without an object), 생기다 (253), 들어오다 (256; with and without an object), then 작다 (259), 타다 (260), 보내다 (265), 두다 (266), 높다 (277), 다니다 (284), 열다 (287), 남다 (290), 기다리다 (298). Already judged beyond the cutoff: 시작하다 (131) and 사용하다 (254) enter through their verbal nouns; 의하다 (110) is a 하다 verb whose first part is not a verbal noun; 이러하다 (113), 중요하다 (220) and 필요하다 (251) are 하다 descriptive verbs; 다르다 (163) and 부르다 (227) are 르 irregulars; 쓰다 (169, 175) is a ㅡ stem; 새롭다 (180), 어렵다 (223) and 쉽다 (246) are ㅂ irregulars; 갖다 (190) has the 해요 form 가져요, not 갖아요; 짓다 (247) is a ㅅ irregular; 이렇다 (105) is a ㅎ irregular; 묻다 (289, to ask) is a ㄷ irregular.

## Pronouns (대): 16, level A

All level A pronouns, minus the exceptions in DESIGN.md: the interrogatives (뭐, 누구, 무엇, 어디, 언제) and 아무; the spoken contractions (거, 그거, 이거, 저거); 저04; the 반말 pronouns 너 and 나; and the honorific 그분, 이분 and 여러분. Included: 우리, 그, 이, 저, 여기, 거기, 저기 (ending in a vowel) and 그것, 이것, 이곳, 그곳, 이쪽, 저쪽, 그쪽, 저것, 저곳 (ending in a consonant).
