import { generateSentence } from './generator.js';

const sentenceElement = document.getElementById('sentence');
const popupElement = document.getElementById('popup');
const nextButton = document.getElementById('next');

const DATA_FILES = ['data/grammar.json', 'data/vocabulary.json'];
const POPUP_MARGIN = 8;

let data = null; // { grammar, vocabulary } once loaded
let loading = false;
const piecesOfWord = new WeakMap(); // word button → its pieces
let selectedWord = null;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    const [grammar, vocabulary] = await Promise.all(DATA_FILES.map(fetchJson));
    data = { grammar, vocabulary };
    showSentence();
  } catch {
    sentenceElement.lang = 'en';
    sentenceElement.textContent = 'Could not load. Check your connection.';
  } finally {
    loading = false;
  }
}

function showSentence() {
  closePopup();
  const words = generateSentence(data.grammar, data.vocabulary.words);
  const nodes = [];
  words.forEach((word, index) => {
    if (index > 0) nodes.push(' ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word';
    button.textContent = word.text;
    piecesOfWord.set(button, word.pieces);
    nodes.push(button);
  });
  nodes.push('.');
  sentenceElement.lang = 'ko';
  sentenceElement.replaceChildren(...nodes);
}

function openPopup(wordButton) {
  closePopup();
  selectedWord = wordButton;
  wordButton.classList.add('selected');

  const list = document.createElement('dl');
  for (const piece of piecesOfWord.get(wordButton)) {
    const line = document.createElement('div');
    const term = document.createElement('dt');
    term.lang = 'ko';
    term.textContent = piece.label;
    const meaning = document.createElement('dd');
    meaning.lang = 'en';
    meaning.textContent = piece.gloss;
    line.append(term, meaning);
    list.append(line);
  }
  popupElement.replaceChildren(list);
  popupElement.hidden = false;

  // Below the word, centered on it and kept on screen; above it if the button
  // would be covered.
  const word = wordButton.getBoundingClientRect();
  const popup = popupElement.getBoundingClientRect();
  const maxLeft = window.innerWidth - popup.width - POPUP_MARGIN;
  const left = Math.min(Math.max(word.left + word.width / 2 - popup.width / 2, POPUP_MARGIN), maxLeft);
  let top = word.bottom + POPUP_MARGIN;
  if (top + popup.height > nextButton.getBoundingClientRect().top - POPUP_MARGIN) {
    top = word.top - popup.height - POPUP_MARGIN;
  }
  popupElement.style.left = `${left}px`;
  popupElement.style.top = `${top}px`;
}

function closePopup() {
  popupElement.hidden = true;
  selectedWord?.classList.remove('selected');
  selectedWord = null;
}

document.addEventListener('click', (event) => {
  const wordButton = event.target.closest('.word');
  if (wordButton) {
    openPopup(wordButton);
  } else {
    closePopup();
  }
});

nextButton.addEventListener('click', () => {
  if (data) {
    showSentence();
  } else {
    load();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

load();
