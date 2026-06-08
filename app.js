/* ================================
   Kanji Flash Card - Main App
   ================================ */

// ---------- Parse raw data ----------
function parseKanjiData(raw, level) {
  const lines = raw.trim().split('\n');
  return lines.map(line => {
    const [kanji, kun, on, meaning] = line.split('|').map(s => s.trim());
    return { kanji, kunyomi: kun, onyomi: on, meaning, level };
  });
}

// All kanji combined
const allKanji = [
  ...parseKanjiData(n5Raw, 'N5'),
  ...parseKanjiData(n4Raw, 'N4'),
  ...parseKanjiData(n3Raw, 'N3'),
  ...parseKanjiData(n2Raw, 'N2'),
  ...parseKanjiData(n1Raw, 'N1')
];

// ---------- State ----------
let currentLevel = 'N5';
let currentDeck = [];         // filtered cards
let currentIndex = 0;
let isFlipped = false;
let knownSet = new Set();    // kanji characters marked as known
let filterMode = 'all';     // 'all' | 'unknown'

// ---------- DOM Elements ----------
const flashcard = document.getElementById('flashcard');
const kanjiCharEl = document.getElementById('kanjiChar');
const kunReadingEl = document.getElementById('kunReading');
const onReadingEl = document.getElementById('onReading');
const meaningEl = document.getElementById('meaning');
const counterEl = document.getElementById('counter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const knownToggleBtn = document.getElementById('knownToggleBtn');
const filterBtn = document.getElementById('filterBtn');
const levelBtns = document.querySelectorAll('.level-btn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// ---------- Load preferences ----------
function loadKnown() {
  const stored = localStorage.getItem('kanjiKnown');
  if (stored) {
    knownSet = new Set(JSON.parse(stored));
  }
}

function saveKnown() {
  localStorage.setItem('kanjiKnown', JSON.stringify([...knownSet]));
}

function loadTheme() {
  const dark = localStorage.getItem('darkMode');
  if (dark === 'true') {
    document.body.classList.add('dark');
    themeIcon.textContent = '🌙';
  } else {
    document.body.classList.remove('dark');
    themeIcon.textContent = '☀️';
  }
}

function saveTheme(isDark) {
  localStorage.setItem('darkMode', isDark);
}

// ---------- Deck management ----------
function buildDeck() {
  let deck = allKanji.filter(k => k.level === currentLevel);
  if (filterMode === 'unknown') {
    deck = deck.filter(k => !knownSet.has(k.kanji));
  }
  return deck;
}

function resetDeck() {
  currentDeck = buildDeck();
  currentIndex = 0;
  isFlipped = false;
  flashcard.classList.remove('flipped');
  if (currentDeck.length > 0) {
    displayCard();
  } else {
    kanjiCharEl.textContent = '—';
    kunReadingEl.textContent = '';
    onReadingEl.textContent = '';
    meaningEl.textContent = 'No cards';
    counterEl.textContent = 'Card 0 of 0';
  }
}

function displayCard() {
  if (currentDeck.length === 0) return;
  const card = currentDeck[currentIndex];
  kanjiCharEl.textContent = card.kanji;
  kunReadingEl.textContent = card.kunyomi;
  onReadingEl.textContent = card.onyomi;
  meaningEl.textContent = card.meaning;
  counterEl.textContent = `Card ${currentIndex + 1} of ${currentDeck.length}`;
  // Update known button text
  const isKnown = knownSet.has(card.kanji);
  knownToggleBtn.textContent = isKnown ? '✅ Known' : '⬜ Mark Known';
  // Reset flip state
  isFlipped = false;
  flashcard.classList.remove('flipped');
}

// ---------- Card Flip ----------
flashcard.addEventListener('click', () => {
  if (currentDeck.length === 0) return;
  isFlipped = !isFlipped;
  flashcard.classList.toggle('flipped', isFlipped);
});

// Allow keyboard flip
flashcard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    flashcard.click();
  }
});

// ---------- Navigation ----------
prevBtn.addEventListener('click', () => {
  if (currentDeck.length === 0) return;
  currentIndex = (currentIndex - 1 + currentDeck.length) % currentDeck.length;
  displayCard();
});

nextBtn.addEventListener('click', () => {
  if (currentDeck.length === 0) return;
  currentIndex = (currentIndex + 1) % currentDeck.length;
  displayCard();
});

shuffleBtn.addEventListener('click', () => {
  if (currentDeck.length < 2) return;
  // Fisher-Yates shuffle
  for (let i = currentDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
  }
  currentIndex = 0;
  displayCard();
});

// ---------- Known/Unknown ----------
knownToggleBtn.addEventListener('click', () => {
  if (currentDeck.length === 0) return;
  const kanji = currentDeck[currentIndex].kanji;
  if (knownSet.has(kanji)) {
    knownSet.delete(kanji);
  } else {
    knownSet.add(kanji);
  }
  saveKnown();
  displayCard(); // refresh button text
});

filterBtn.addEventListener('click', () => {
  filterMode = filterMode === 'all' ? 'unknown' : 'all';
  filterBtn.textContent = filterMode === 'all' ? 'All' : 'Unknown';
  resetDeck();
});

// ---------- Level Selection ----------
levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    filterMode = 'all';
    filterBtn.textContent = 'All';
    resetDeck();
  });
});

// ---------- Theme Toggle ----------
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeIcon.textContent = isDark ? '🌙' : '☀️';
  saveTheme(isDark);
});

// ---------- Keyboard Shortcuts ----------
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    flashcard.click();
  }
  if (e.key === 'r' || e.key === 'R') shuffleBtn.click();
  if (e.key === 'k' || e.key === 'K') knownToggleBtn.click();
});

// ---------- Initialization ----------
loadKnown();
loadTheme();
resetDeck();
