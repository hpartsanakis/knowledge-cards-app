const STORAGE_KEY = "knowledge-cards-app.cards";
const TIMER_KEY = "knowledge-cards-app.timer";
const SUPABASE_TABLE = "knowledge_cards";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LEITNER_INTERVALS = {
  1: 0,
  2: 2,
  3: 7,
  4: 14,
  5: 35
};

const sampleCards = [
  {
    id: crypto.randomUUID(),
    title: "CRUD",
    category: "JavaScript",
    content: "Create, Read, Update und Delete sind die vier Basisaktionen fuer datengetriebene Apps.",
    tags: ["crud", "app", "basis"],
    favorite: true,
    review: createReviewState(),
    createdAt: Date.now() - 3000
  },
  {
    id: crypto.randomUUID(),
    title: "LocalStorage",
    category: "Browser",
    content: "localStorage speichert Textdaten dauerhaft im Browser. Vor dem Speichern werden Objekte mit JSON.stringify umgewandelt.",
    tags: ["browser", "storage", "json"],
    favorite: false,
    review: createReviewState(),
    createdAt: Date.now() - 2000
  },
  {
    id: crypto.randomUUID(),
    title: "CSS Grid",
    category: "Frontend",
    content: "Grid eignet sich fuer zweidimensionale Layouts. Mit auto-fill und minmax entstehen flexible Kartenraster.",
    tags: ["css", "layout"],
    favorite: false,
    review: createReviewState(),
    createdAt: Date.now() - 1000
  }
];

let cards = normalizeCards(loadCards());
let showFavoritesOnly = false;
let timerState = loadTimerState();
let timerId = null;
let supabaseClient = null;
let currentUser = null;
let syncInProgress = false;
let studyQueue = [];
let studyIndex = 0;
let answerVisible = false;
let testActive = false;

const form = document.querySelector("#cardForm");
const cardIdInput = document.querySelector("#cardId");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const contentInput = document.querySelector("#content");
const tagsInput = document.querySelector("#tags");
const favoriteInput = document.querySelector("#favorite");
const saveButton = document.querySelector("#saveButton");
const resetButton = document.querySelector("#resetButton");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const favoriteFilter = document.querySelector("#favoriteFilter");
const cardsGrid = document.querySelector("#cardsGrid");
const emptyState = document.querySelector("#emptyState");
const cardTemplate = document.querySelector("#cardTemplate");
const totalCount = document.querySelector("#totalCount");
const openCount = document.querySelector("#openCount");
const favoriteCount = document.querySelector("#favoriteCount");
const categoryCount = document.querySelector("#categoryCount");
const deleteDialog = document.querySelector("#deleteDialog");
const deleteDialogText = document.querySelector("#deleteDialogText");
const timerDisplay = document.querySelector("#timerDisplay");
const pomodoroMode = document.querySelector("#pomodoroMode");
const timerNote = document.querySelector("#timerNote");
const focusMinutesInput = document.querySelector("#focusMinutes");
const breakMinutesInput = document.querySelector("#breakMinutes");
const timerStart = document.querySelector("#timerStart");
const timerPause = document.querySelector("#timerPause");
const timerReset = document.querySelector("#timerReset");
const authTitle = document.querySelector("#authTitle");
const syncStatus = document.querySelector("#syncStatus");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const startStudyButton = document.querySelector("#startStudyButton");
const studySession = document.querySelector("#studySession");
const studySummary = document.querySelector("#studySummary");
const studyCategorySelect = document.querySelector("#studyCategorySelect");
const studyModeSelect = document.querySelector("#studyModeSelect");
const studyProgress = document.querySelector("#studyProgress");
const studyCategory = document.querySelector("#studyCategory");
const studyQuestion = document.querySelector("#studyQuestion");
const studyAnswer = document.querySelector("#studyAnswer");
const studyUserAnswer = document.querySelector("#studyUserAnswer");
const studyUserAnswerText = document.querySelector("#studyUserAnswerText");
const studyAnswerText = document.querySelector("#studyAnswerText");
const revealAnswerButton = document.querySelector("#revealAnswerButton");
const skipStudyButton = document.querySelector("#skipStudyButton");
const studyRating = document.querySelector("#studyRating");

let pendingDeleteId = "";

form.addEventListener("submit", handleSubmit);
resetButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
studyCategorySelect?.addEventListener("change", updateStudySummary);
studyModeSelect?.addEventListener("change", render);
favoriteFilter.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  favoriteFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
  render();
});
deleteDialog.addEventListener("close", handleDeleteDialogClose);
focusMinutesInput.addEventListener("change", updateTimerDurations);
breakMinutesInput.addEventListener("change", updateTimerDurations);
timerStart.addEventListener("click", startTimer);
timerPause.addEventListener("click", pauseTimer);
timerReset.addEventListener("click", resetTimer);
authForm.addEventListener("submit", signIn);
signUpButton.addEventListener("click", signUp);
signOutButton.addEventListener("click", signOut);
startStudyButton.addEventListener("click", startStudySession);
revealAnswerButton.addEventListener("click", revealStudyAnswer);
skipStudyButton.addEventListener("click", skipStudyCard);
studyRating.addEventListener("click", handleStudyRating);

initializeTimerControls();
render();
registerServiceWorker();
initializeSupabase();

function handleSubmit(event) {
  event.preventDefault();

  const cardData = {
    title: titleInput.value.trim(),
    category: categoryInput.value.trim(),
    content: contentInput.value.trim(),
    tags: parseTags(tagsInput.value),
    favorite: favoriteInput.checked
  };

  if (!cardData.title || !cardData.category || !cardData.content) {
    return;
  }

  const editingId = cardIdInput.value;

  if (editingId) {
    cards = cards.map((card) => (
      card.id === editingId
        ? { ...card, ...cardData, updatedAt: Date.now() }
        : card
    ));
  } else {
    cards = [
      {
        id: crypto.randomUUID(),
        ...cardData,
        review: createReviewState(),
        createdAt: Date.now()
      },
      ...cards
    ];
  }

  saveCards();
  syncCardsToCloud();
  resetForm();
  render();
}

function render() {
  updateCategoryFilter();
  updateStudyCategoryOptions();
  const visibleCards = getVisibleCards();
  cardsGrid.innerHTML = "";

  visibleCards.forEach((card) => {
    const node = cardTemplate.content.cloneNode(true);
    const article = node.querySelector(".knowledge-card");
    const favoriteButton = node.querySelector(".favorite-button");

    article.dataset.id = card.id;
    node.querySelector(".card-category").textContent = card.category;
    node.querySelector(".card-title").textContent = card.title;
    node.querySelector(".card-content").textContent = card.content;
    updateCardReviewMeta(node, card);

    favoriteButton.textContent = card.favorite ? "★" : "☆";
    favoriteButton.classList.toggle("active", card.favorite);
    favoriteButton.addEventListener("click", () => toggleFavorite(card.id));

    const tagList = node.querySelector(".tag-list");
    card.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = `#${tag}`;
      tagList.append(tagElement);
    });

    node.querySelector(".edit-button").addEventListener("click", () => editCard(card.id));
    node.querySelector(".delete-button").addEventListener("click", () => deleteCard(card.id));
    node.querySelector(".review-again").addEventListener("click", () => reviewCard(card.id, "again"));
    node.querySelector(".review-hard").addEventListener("click", () => reviewCard(card.id, "hard"));
    node.querySelector(".review-good").addEventListener("click", () => reviewCard(card.id, "good"));
    node.querySelector(".review-easy").addEventListener("click", () => reviewCard(card.id, "easy"));
    cardsGrid.append(node);
  });

  emptyState.hidden = testActive || visibleCards.length > 0;
  cardsGrid.hidden = testActive || visibleCards.length === 0;
  updateStats();
  updateStudySummary();
}

function getVisibleCards() {
  const searchTerm = normalize(searchInput.value);
  const selectedCategory = categoryFilter.value;
  const studyMode = getStudyMode();

  return cards
    .filter((card) => {
      const searchableText = normalize([
        card.title,
        card.category,
        card.content,
        card.tags.join(" ")
      ].join(" "));

      const matchesSearch = searchableText.includes(searchTerm);
      const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;
      const matchesFavorite = !showFavoritesOnly || card.favorite;
      const matchesMode = studyMode === "learn" || isReadyToReview(card);

      return matchesSearch && matchesCategory && matchesFavorite && matchesMode;
    })
    .sort((a, b) => {
      const boxDiff = normalizeReviewState(a.review).box - normalizeReviewState(b.review).box;
      return boxDiff || (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });
}

function editCard(id) {
  const card = cards.find((item) => item.id === id);
  if (!card) return;

  cardIdInput.value = card.id;
  titleInput.value = card.title;
  categoryInput.value = card.category;
  contentInput.value = card.content;
  tagsInput.value = card.tags.join(", ");
  favoriteInput.checked = card.favorite;
  saveButton.textContent = "Aktualisieren";
  titleInput.focus();
}

function deleteCard(id) {
  const card = cards.find((item) => item.id === id);
  if (!card) return;

  pendingDeleteId = id;
  deleteDialogText.textContent = `"${card.title}" wird dauerhaft entfernt.`;
  deleteDialog.showModal();
}

function handleDeleteDialogClose() {
  if (deleteDialog.returnValue !== "delete" || !pendingDeleteId) {
    pendingDeleteId = "";
    return;
  }

  cards = cards.filter((item) => item.id !== pendingDeleteId);
  deleteCardFromCloud(pendingDeleteId);
  pendingDeleteId = "";
  saveCards();
  resetForm();
  render();
}

function toggleFavorite(id) {
  cards = cards.map((card) => (
    card.id === id
      ? { ...card, favorite: !card.favorite, updatedAt: Date.now() }
      : card
  ));
  saveCards();
  syncCardsToCloud();
  render();
}

function reviewCard(id, rating) {
  cards = cards.map((card) => {
    if (card.id !== id) return card;
    return {
      ...card,
      review: calculateCardStatus(card.review, rating),
      updatedAt: Date.now()
    };
  });
  saveCards();
  syncCardsToCloud();
  render();
}

function startStudySession() {
  studyQueue = getStudyQueue();
  studyIndex = 0;
  answerVisible = false;
  testActive = true;

  if (studyQueue.length === 0) {
    studySession.hidden = false;
    studyProgress.textContent = "0 / 0";
    studyCategory.textContent = "";
    studyQuestion.textContent = getStudyMode() === "normal"
      ? "Keine Karte ist gerade bereit"
      : "Noch keine Karten in dieser Auswahl";
    studyAnswer.hidden = true;
    studyUserAnswer.value = "";
    studyUserAnswer.hidden = true;
    studyRating.hidden = true;
    revealAnswerButton.hidden = true;
    skipStudyButton.hidden = true;
    render();
    scrollStudySessionIntoView();
    return;
  }

  studySession.hidden = false;
  revealAnswerButton.hidden = false;
  skipStudyButton.hidden = false;
  renderStudyCard();
  render();
  scrollStudySessionIntoView();
}

function getStudyQueue() {
  const selectedCategory = getStudyCategory();
  const studyMode = getStudyMode();
  const cardsInCategory = cards.filter((card) => (
    selectedCategory === "all" || card.category === selectedCategory
  ));

  const sortedCards = [...cardsInCategory]
    .sort((a, b) => normalizeReviewState(a.review).box - normalizeReviewState(b.review).box);

  if (studyMode === "learn") {
    return sortedCards;
  }

  const readyCards = sortedCards.filter(isReadyToReview);
  return readyCards.length > 0 ? readyCards : sortedCards;
}

function renderStudyCard() {
  const card = studyQueue[studyIndex];
  if (!card) {
    studyProgress.textContent = `${studyQueue.length} / ${studyQueue.length}`;
    studyCategory.textContent = "";
    studyQuestion.textContent = "Lerneinheit abgeschlossen";
    studyAnswer.hidden = true;
    studyUserAnswer.value = "";
    studyUserAnswer.hidden = true;
    studyRating.hidden = true;
    revealAnswerButton.hidden = true;
    skipStudyButton.hidden = true;
    testActive = false;
    render();
    updateStudySummary();
    return;
  }

  answerVisible = false;
  studyProgress.textContent = `${studyIndex + 1} / ${studyQueue.length}`;
  studyCategory.textContent = card.category;
  studyQuestion.textContent = card.title;
  studyAnswerText.textContent = card.content;
  studyUserAnswer.value = "";
  studyUserAnswer.hidden = false;
  studyAnswer.hidden = true;
  studyRating.hidden = true;
  revealAnswerButton.hidden = false;
  revealAnswerButton.textContent = "Antwort vergleichen";
  skipStudyButton.hidden = false;
  studyUserAnswer.focus();
}

function revealStudyAnswer() {
  answerVisible = true;
  studyUserAnswerText.textContent = studyUserAnswer.value.trim() || "Keine Antwort eingegeben.";
  studyAnswer.hidden = false;
  studyRating.hidden = false;
  revealAnswerButton.hidden = true;
}

function skipStudyCard() {
  if (studyQueue.length === 0) return;
  studyIndex = (studyIndex + 1) % studyQueue.length;
  renderStudyCard();
}

function handleStudyRating(event) {
  const rating = event.target.dataset.rating;
  if (!rating || !answerVisible) return;

  const card = studyQueue[studyIndex];
  if (!card) return;

  reviewCard(card.id, rating);
  studyQueue.splice(studyIndex, 1);

  if (rating === "again" || rating === "hard") {
    studyQueue.push({
      ...card,
      review: calculateCardStatus(card.review, rating),
      updatedAt: Date.now()
    });
  }

  if (studyIndex >= studyQueue.length) {
    studyIndex = 0;
  }
  renderStudyCard();
}

function scrollStudySessionIntoView() {
  studySession.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function calculateCardStatus(review, rating) {
  const current = normalizeReviewState(review);
  const success = rating === "good" || rating === "easy";
  const nextBox = success ? Math.min(5, current.box + 1) : 1;

  return {
    box: nextBox,
    nextReviewAt: calculateNextReviewAt(nextBox, success),
    repetitions: current.repetitions + 1,
    attempts: current.attempts + 1,
    lastRating: rating,
    lastReviewedAt: Date.now()
  };
}

function resetForm() {
  form.reset();
  cardIdInput.value = "";
  saveButton.textContent = "Speichern";
}

function updateStats() {
  const categories = new Set(cards.map((card) => card.category));
  totalCount.textContent = cards.length;
  openCount.textContent = cards.filter(isReadyToReview).length;
  favoriteCount.textContent = cards.filter((card) => card.favorite).length;
  categoryCount.textContent = categories.size;
}

function updateStudySummary() {
  const selectedCategory = getStudyCategory();
  const studyMode = getStudyMode();
  const scopedCards = cards.filter((card) => (
    selectedCategory === "all" || card.category === selectedCategory
  ));
  const openCards = scopedCards.filter(isReadyToReview).length;
  const categoryText = selectedCategory === "all" ? "" : ` in ${selectedCategory}`;

  if (studyMode === "learn") {
    studySummary.textContent = scopedCards.length === 1
      ? `1 Karte zum Anlernen${categoryText}`
      : `${scopedCards.length} Karten zum Anlernen${categoryText}`;
    return;
  }

  if (openCards === 0 && scopedCards.length > 0) {
    studySummary.textContent = `0 bereit · ${scopedCards.length} Karten im Stapel${categoryText}`;
    return;
  }

  studySummary.textContent = openCards === 1
    ? `1 Karte bereit${categoryText}`
    : `${openCards} Karten bereit${categoryText}`;
}

function updateCardReviewMeta(node, card) {
  const statusLabel = node.querySelector(".status-label");
  const reviewCount = node.querySelector(".review-count");
  const review = normalizeReviewState(card.review);
  const ready = isReadyToReview(card);

  statusLabel.textContent = `Fach ${review.box}`;
  statusLabel.classList.toggle("is-learned", !ready);
  reviewCount.textContent = ready ? "Bereit" : `Wieder ${formatReviewDate(review.nextReviewAt)}`;
}

function updateCategoryFilter() {
  const currentValue = categoryFilter.value;
  const categories = [...new Set(cards.map((card) => card.category))].sort((a, b) => a.localeCompare(b));

  categoryFilter.innerHTML = '<option value="all">Alle Kategorien</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });

  categoryFilter.value = categories.includes(currentValue) ? currentValue : "all";
}

function updateStudyCategoryOptions() {
  if (!studyCategorySelect) return;

  const currentValue = studyCategorySelect.value;
  const categories = [...new Set(cards.map((card) => card.category))].sort((a, b) => a.localeCompare(b));

  studyCategorySelect.innerHTML = '<option value="all">Alle Kategorien</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    studyCategorySelect.append(option);
  });

  studyCategorySelect.value = categories.includes(currentValue) ? currentValue : "all";
}

function getStudyCategory() {
  return studyCategorySelect?.value || "all";
}

function getStudyMode() {
  return studyModeSelect?.value || "normal";
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("de-DE");
}

function isReadyToReview(card) {
  return normalizeReviewState(card.review).nextReviewAt <= Date.now();
}

function createReviewState() {
  return {
    box: 1,
    nextReviewAt: Date.now(),
    repetitions: 0,
    attempts: 0,
    lastRating: null,
    lastReviewedAt: null
  };
}

function normalizeReviewState(review) {
  const previousReview = review || {};
  const legacyLearned = Boolean(previousReview.learned);
  const previousBox = Number.isFinite(Number(previousReview.box)) ? Number(previousReview.box) : 1;
  const baseBox = Math.min(5, Math.max(1, previousBox));
  const box = legacyLearned ? Math.max(2, baseBox) : baseBox;
  const nextReviewAt = Number(previousReview.nextReviewAt)
    || Number(previousReview.dueAt)
    || (legacyLearned ? calculateNextReviewAt(Math.max(2, box), true) : Date.now());

  return {
    ...createReviewState(),
    ...previousReview,
    box,
    nextReviewAt,
    repetitions: Number.isFinite(Number(previousReview.repetitions)) ? Number(previousReview.repetitions) : 0,
    attempts: Number.isFinite(Number(previousReview.attempts)) ? Number(previousReview.attempts) : 0
  };
}

function calculateNextReviewAt(box, success) {
  if (!success) return Date.now();
  return startOfToday() + LEITNER_INTERVALS[box] * DAY_IN_MS;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatReviewDate(timestamp) {
  const today = startOfToday();
  const tomorrow = today + DAY_IN_MS;

  if (timestamp < tomorrow) return "heute";
  if (timestamp < tomorrow + DAY_IN_MS) return "morgen";

  return new Date(timestamp).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit"
  });
}

function normalizeCards(items) {
  const normalizedCards = items.map((card) => ({
    ...card,
    review: normalizeReviewState(card.review),
    tags: Array.isArray(card.tags) ? card.tags : []
  }));
  saveCards(normalizedCards);
  return normalizedCards;
}

function initializeTimerControls() {
  focusMinutesInput.value = timerState.focusMinutes;
  breakMinutesInput.value = timerState.breakMinutes;
  renderTimer();
}

function updateTimerDurations() {
  timerState.focusMinutes = clampNumber(focusMinutesInput.value, 5, 90, 25);
  timerState.breakMinutes = clampNumber(breakMinutesInput.value, 1, 30, 5);
  focusMinutesInput.value = timerState.focusMinutes;
  breakMinutesInput.value = timerState.breakMinutes;
  if (!timerState.running) {
    timerState.remainingSeconds = getModeMinutes() * 60;
  }
  saveTimerState();
  renderTimer();
}

function startTimer() {
  if (timerState.running) return;
  timerState.running = true;
  timerState.endsAt = Date.now() + timerState.remainingSeconds * 1000;
  saveTimerState();
  timerId = setInterval(tickTimer, 1000);
  renderTimer();
}

function pauseTimer() {
  if (!timerState.running) return;
  timerState.remainingSeconds = Math.max(0, Math.ceil((timerState.endsAt - Date.now()) / 1000));
  timerState.running = false;
  timerState.endsAt = null;
  clearInterval(timerId);
  saveTimerState();
  renderTimer();
}

function resetTimer() {
  timerState.running = false;
  timerState.endsAt = null;
  timerState.remainingSeconds = getModeMinutes() * 60;
  clearInterval(timerId);
  saveTimerState();
  renderTimer();
}

function tickTimer() {
  timerState.remainingSeconds = Math.max(0, Math.ceil((timerState.endsAt - Date.now()) / 1000));

  if (timerState.remainingSeconds === 0) {
    timerState.mode = timerState.mode === "focus" ? "break" : "focus";
    timerState.completedFocusSessions += timerState.mode === "break" ? 1 : 0;
    timerState.remainingSeconds = getModeMinutes() * 60;
    timerState.endsAt = Date.now() + timerState.remainingSeconds * 1000;
  }

  saveTimerState();
  renderTimer();
}

function renderTimer() {
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  pomodoroMode.textContent = timerState.mode === "focus" ? "Fokus" : "Pause";
  timerNote.textContent = timerState.mode === "focus"
    ? `${timerState.completedFocusSessions} Fokus-Einheiten abgeschlossen`
    : "Kurze Pause, dann weiter mit der naechsten Karte.";
}

function getModeMinutes() {
  return timerState.mode === "focus" ? timerState.focusMinutes : timerState.breakMinutes;
}

function loadTimerState() {
  const defaultState = {
    mode: "focus",
    focusMinutes: 25,
    breakMinutes: 5,
    remainingSeconds: 25 * 60,
    running: false,
    endsAt: null,
    completedFocusSessions: 0
  };

  try {
    const parsedState = JSON.parse(localStorage.getItem(TIMER_KEY));
    return { ...defaultState, ...(parsedState || {}), running: false, endsAt: null };
  } catch {
    return defaultState;
  }
}

function saveTimerState() {
  localStorage.setItem(TIMER_KEY, JSON.stringify(timerState));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function loadCards() {
  const storedCards = localStorage.getItem(STORAGE_KEY);
  if (!storedCards) {
    return sampleCards;
  }

  try {
    const parsedCards = JSON.parse(storedCards);
    return Array.isArray(parsedCards) ? parsedCards : sampleCards;
  } catch {
    return sampleCards;
  }
}

function saveCards(nextCards = cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCards));
}

async function initializeSupabase() {
  const config = window.KNOWLEDGE_CARDS_SUPABASE || {};
  const isConfigured = Boolean(config.url && config.anonKey);

  if (!isConfigured || !window.supabase) {
    updateAuthUI("offline", "Supabase noch nicht konfiguriert.");
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  updateAuthUI("offline", "Supabase bereit. Bitte einloggen.");

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      loadCardsFromCloud();
    } else {
      updateAuthUI("offline", "Abgemeldet. Lokale Karten bleiben auf diesem Gerät.");
    }
    renderAuthState();
  });

  renderAuthState();
  if (currentUser) {
    await loadCardsFromCloud();
  }
}

async function signIn(event) {
  event.preventDefault();
  if (!supabaseClient) {
    updateAuthUI("error", "Bitte zuerst Supabase in supabase-config.js eintragen.");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) return;

  updateAuthUI("offline", "Login wird geprüft...");
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    updateAuthUI("error", error.message);
    return;
  }
  authPassword.value = "";
}

async function signUp() {
  if (!supabaseClient) {
    updateAuthUI("error", "Bitte zuerst Supabase in supabase-config.js eintragen.");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) return;

  updateAuthUI("offline", "Account wird erstellt...");
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    updateAuthUI("error", error.message);
    return;
  }
  authPassword.value = "";
  updateAuthUI("online", "Account erstellt. Falls Supabase E-Mail-Bestaetigung verlangt, bitte Postfach pruefen.");
}

async function signOut() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  currentUser = null;
  renderAuthState();
}

async function loadCardsFromCloud() {
  if (!supabaseClient || !currentUser) return;

  syncInProgress = true;
  updateAuthUI("offline", "Karten werden synchronisiert...");
  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  syncInProgress = false;

  if (error) {
    updateAuthUI("error", error.message);
    return;
  }

  if (data.length === 0 && cards.length > 0) {
    await syncCardsToCloud();
    updateAuthUI("online", "Lokale Karten wurden in die Cloud hochgeladen.");
    return;
  }

  cards = normalizeCards(data.map(cardFromRow));
  saveCards();
  render();
  updateAuthUI("online", `${cards.length} Karten synchronisiert.`);
}

async function syncCardsToCloud() {
  if (!supabaseClient || !currentUser || syncInProgress) return;

  const rows = cards.map(cardToRow);
  if (rows.length === 0) {
    updateAuthUI("online", "Cloud Sync aktuell.");
    return;
  }

  const { error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .upsert(rows, { onConflict: "id" });

  if (error) {
    updateAuthUI("error", error.message);
    return;
  }

  updateAuthUI("online", "Cloud Sync aktuell.");
}

async function deleteCardFromCloud(id) {
  if (!supabaseClient || !currentUser) return;

  const { error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    updateAuthUI("error", error.message);
  }
}

function cardToRow(card) {
  return {
    id: card.id,
    user_id: currentUser.id,
    title: card.title,
    category: card.category,
    content: card.content,
    tags: card.tags,
    favorite: card.favorite,
    review: card.review,
    created_at: toIsoDate(card.createdAt),
    updated_at: toIsoDate(card.updatedAt || card.createdAt || Date.now())
  };
}

function cardFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    tags: row.tags || [],
    favorite: row.favorite,
    review: row.review,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at)
  };
}

function toIsoDate(value) {
  const timestamp = Number(value) || Date.now();
  return new Date(timestamp).toISOString();
}

function renderAuthState() {
  const signedIn = Boolean(currentUser);
  authForm.hidden = signedIn;
  signOutButton.hidden = !signedIn;
  authTitle.textContent = signedIn ? currentUser.email : "Nicht verbunden";
  if (signedIn) {
    updateAuthUI("online", "Angemeldet. Karten werden automatisch synchronisiert.");
  }
}

function updateAuthUI(state, message) {
  syncStatus.textContent = message;
  syncStatus.classList.toggle("online", state === "online");
  syncStatus.classList.toggle("error", state === "error");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works without offline caching, for example when opened as a local file.
    });
  });
}
