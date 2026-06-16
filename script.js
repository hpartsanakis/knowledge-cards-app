const STORAGE_KEY = "knowledge-cards-app.cards";
const TIMER_KEY = "knowledge-cards-app.timer";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUPABASE_TABLE = "knowledge_cards";

const sampleCards = [
  {
    id: crypto.randomUUID(),
    title: "CRUD",
    category: "JavaScript",
    content: "Create, Read, Update und Delete sind die vier Basisaktionen fuer datengetriebene Apps.",
    tags: ["crud", "app", "basis"],
    favorite: true,
    review: createReviewState(Date.now() - DAY_IN_MS),
    createdAt: Date.now() - 3000
  },
  {
    id: crypto.randomUUID(),
    title: "LocalStorage",
    category: "Browser",
    content: "localStorage speichert Textdaten dauerhaft im Browser. Vor dem Speichern werden Objekte mit JSON.stringify umgewandelt.",
    tags: ["browser", "storage", "json"],
    favorite: false,
    review: createReviewState(Date.now()),
    createdAt: Date.now() - 2000
  },
  {
    id: crypto.randomUUID(),
    title: "CSS Grid",
    category: "Frontend",
    content: "Grid eignet sich fuer zweidimensionale Layouts. Mit auto-fill und minmax entstehen flexible Kartenraster.",
    tags: ["css", "layout"],
    favorite: false,
    review: createReviewState(Date.now() + DAY_IN_MS),
    createdAt: Date.now() - 1000
  }
];

let cards = normalizeCards(loadCards());
let showFavoritesOnly = false;
let showDueOnly = false;
let timerState = loadTimerState();
let timerId = null;
let supabaseClient = null;
let currentUser = null;
let syncInProgress = false;
let studyQueue = [];
let studyIndex = 0;
let answerVisible = false;

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
const dueCount = document.querySelector("#dueCount");
const favoriteCount = document.querySelector("#favoriteCount");
const categoryCount = document.querySelector("#categoryCount");
const deleteDialog = document.querySelector("#deleteDialog");
const deleteDialogText = document.querySelector("#deleteDialogText");
const dueFilter = document.querySelector("#dueFilter");
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
const studyAnswerText = document.querySelector("#studyAnswerText");
const revealAnswerButton = document.querySelector("#revealAnswerButton");
const skipStudyButton = document.querySelector("#skipStudyButton");
const studyRating = document.querySelector("#studyRating");

let pendingDeleteId = "";

form.addEventListener("submit", handleSubmit);
resetButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
studyCategorySelect.addEventListener("change", updateStudySummary);
studyModeSelect.addEventListener("change", updateStudySummary);
favoriteFilter.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  favoriteFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
  render();
});
dueFilter.addEventListener("click", () => {
  showDueOnly = !showDueOnly;
  dueFilter.setAttribute("aria-pressed", String(showDueOnly));
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
        review: createReviewState(Date.now()),
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

  emptyState.hidden = visibleCards.length > 0;
  cardsGrid.hidden = visibleCards.length === 0;
  updateStats();
  updateStudySummary();
}

function getVisibleCards() {
  const searchTerm = normalize(searchInput.value);
  const selectedCategory = categoryFilter.value;

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
      const matchesDue = !showDueOnly || isDue(card);

      return matchesSearch && matchesCategory && matchesFavorite && matchesDue;
    })
    .sort((a, b) => {
      const dueDiff = a.review.dueAt - b.review.dueAt;
      return dueDiff || (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
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
      review: calculateNextReview(card.review, rating),
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

  if (studyQueue.length === 0) {
    studySession.hidden = false;
    studyProgress.textContent = "0 / 0";
    studyCategory.textContent = "";
    studyQuestion.textContent = studyModeSelect.value === "review"
      ? "Keine faelligen Karten in dieser Auswahl"
      : "Noch keine Karten in dieser Auswahl";
    studyAnswer.hidden = true;
    studyRating.hidden = true;
    revealAnswerButton.hidden = true;
    skipStudyButton.hidden = true;
    scrollStudySessionIntoView();
    return;
  }

  studySession.hidden = false;
  revealAnswerButton.hidden = false;
  skipStudyButton.hidden = false;
  renderStudyCard();
  scrollStudySessionIntoView();
}

function getStudyQueue() {
  const selectedCategory = studyCategorySelect.value;
  const studyMode = studyModeSelect.value;
  const cardsInCategory = cards.filter((card) => (
    selectedCategory === "all" || card.category === selectedCategory
  ));

  if (studyMode === "learn") {
    return [...cardsInCategory].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }

  return cardsInCategory
    .filter(isDue)
    .sort((a, b) => a.review.dueAt - b.review.dueAt);
}

function renderStudyCard() {
  const card = studyQueue[studyIndex];
  if (!card) {
    studyProgress.textContent = `${studyQueue.length} / ${studyQueue.length}`;
    studyCategory.textContent = "";
    studyQuestion.textContent = "Lerneinheit abgeschlossen";
    studyAnswer.hidden = true;
    studyRating.hidden = true;
    revealAnswerButton.hidden = true;
    skipStudyButton.hidden = true;
    updateStudySummary();
    return;
  }

  answerVisible = false;
  studyProgress.textContent = `${studyIndex + 1} / ${studyQueue.length}`;
  studyCategory.textContent = card.category;
  studyQuestion.textContent = card.title;
  studyAnswerText.textContent = card.content;
  studyAnswer.hidden = true;
  studyRating.hidden = true;
  revealAnswerButton.hidden = false;
  revealAnswerButton.textContent = "Antwort zeigen";
  skipStudyButton.hidden = false;
}

function revealStudyAnswer() {
  answerVisible = true;
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

function calculateNextReview(review, rating) {
  const current = normalizeReviewState(review);
  const intervalMap = {
    again: 0,
    hard: Math.max(1, Math.round(current.interval * 1.2)),
    good: Math.max(1, Math.round(current.interval * current.ease)),
    easy: Math.max(2, Math.round(current.interval * (current.ease + 0.7)))
  };
  const easeChange = {
    again: -0.25,
    hard: -0.12,
    good: 0.03,
    easy: 0.15
  };
  const interval = intervalMap[rating] ?? 1;
  const nextDue = rating === "again"
    ? Date.now() + 10 * 60 * 1000
    : startOfToday() + interval * DAY_IN_MS;

  return {
    dueAt: nextDue,
    interval,
    ease: Math.min(3, Math.max(1.3, current.ease + easeChange[rating])),
    repetitions: rating === "again" ? 0 : current.repetitions + 1,
    lapses: current.lapses + (rating === "again" ? 1 : 0),
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
  dueCount.textContent = cards.filter(isDue).length;
  favoriteCount.textContent = cards.filter((card) => card.favorite).length;
  categoryCount.textContent = categories.size;
}

function updateStudySummary() {
  const selectedCategory = studyCategorySelect.value;
  const studyMode = studyModeSelect.value;
  const scopedCards = cards.filter((card) => (
    selectedCategory === "all" || card.category === selectedCategory
  ));
  const dueCards = scopedCards.filter(isDue).length;
  const categoryText = selectedCategory === "all" ? "" : ` in ${selectedCategory}`;

  if (studyMode === "learn") {
    studySummary.textContent = scopedCards.length === 1
      ? `1 Karte zum Anlernen${categoryText}`
      : `${scopedCards.length} Karten zum Anlernen${categoryText}`;
    return;
  }

  studySummary.textContent = dueCards === 1
    ? "1 Karte faellig"
    : `${dueCards} Karten faellig${categoryText}`;
}

function updateCardReviewMeta(node, card) {
  const dueLabel = node.querySelector(".due-label");
  const reviewCount = node.querySelector(".review-count");
  const due = isDue(card);

  dueLabel.textContent = due ? "Faellig" : `Faellig ${formatDueDate(card.review.dueAt)}`;
  dueLabel.classList.toggle("is-due", due);
  reviewCount.textContent = `${card.review.repetitions} Wiederholungen`;
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

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("de-DE");
}

function isDue(card) {
  return normalizeReviewState(card.review).dueAt <= Date.now();
}

function createReviewState(dueAt) {
  return {
    dueAt,
    interval: 1,
    ease: 2.2,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null
  };
}

function normalizeReviewState(review) {
  return {
    ...createReviewState(Date.now()),
    ...(review || {})
  };
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

function formatDueDate(timestamp) {
  const dueDate = new Date(timestamp);
  const today = startOfToday();
  const tomorrow = today + DAY_IN_MS;

  if (timestamp < tomorrow && timestamp >= today) return "heute";
  if (timestamp >= tomorrow && timestamp < tomorrow + DAY_IN_MS) return "morgen";

  return dueDate.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit"
  });
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
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
