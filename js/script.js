/* =========================================
   1. DATA
   =========================================
   Τα αρχικά δεδομένα της εφαρμογής.
   Κάθε card ανήκει σε μία collection.
========================================= */

const cards = [
  {
    id: 1,
    collection: "photos",
    category: "Street",
    title: "Blue Hour in Frankfurt",
    content: "Best moment was 10 minutes after sunset near the river.",
  },
  {
    id: 2,
    collection: "recipes",
    category: "Dinner",
    title: "Greek Chicken Bowl",
    content: "Chicken, rice, cucumber, tomato, yogurt sauce.",
  },
  {
    id: 3,
    collection: "travel",
    category: "Norway",
    title: "Tromsø Harbour",
    content: "Perfect location for blue hour photos and night reflections.",
  },
];

/* Load saved cards from browser */
const savedCards = localStorage.getItem("knowledgeCards");

if (savedCards) {
  const parsedCards = JSON.parse(savedCards);

  cards.length = 0;
  cards.push(...parsedCards);
}

/* =========================================
   2. DOM ELEMENTS
   =========================================
   Παίρνουμε references από το HTML
   για να δουλεύουμε με JavaScript.
========================================= */

const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const addCardBtn = document.getElementById("addCardBtn");
const cardModal = document.getElementById("cardModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cardForm = document.getElementById("cardForm");

const categoryInput = document.getElementById("categoryInput");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const modalTitle = document.getElementById("modalTitle");

const collectionButtons = document.querySelectorAll(".collection-btn");

/* =========================================
   3. APP STATE
   =========================================
   Εδώ κρατάμε την κατάσταση της εφαρμογής.

   editingCardId:
   - null   => create mode
   - number => edit mode

   openedCardId:
   - null   => καμία ανοιχτή card
   - number => ποια card είναι ανοιχτή

   activeCollection:
   - ποια collection βλέπει ο χρήστης τώρα
========================================= */

let editingCardId = null;
let openedCardId = null;
let activeCollection = "photos";

/* =========================================
   4. HELPER FUNCTIONS
   =========================================
   Μικρές βοηθητικές functions.
========================================= */

/* 
   Επιστρέφει τα cards της ενεργής collection.
*/
function getCardsByActiveCollection() {
  return cards.filter((card) => card.collection === activeCollection);
}

/*
   Ταξινομεί τα cards σύμφωνα με το sort dropdown.
*/
function sortCards(data) {
  const mode = sortSelect.value;
  const sorted = [...data];

  if (mode === "az") {
    sorted.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }

  if (mode === "za") {
    sorted.sort((a, b) =>
      b.title.localeCompare(a.title, undefined, { sensitivity: "base" }),
    );
  }

  if (mode === "newest") {
    sorted.sort((a, b) => b.id - a.id);
  }

  if (mode === "category") {
    sorted.sort((a, b) =>
      a.category.localeCompare(b.category, undefined, { sensitivity: "base" }),
    );
  }

  return sorted;
}

/* Save cards to browser */
function saveCards() {
  localStorage.setItem("knowledgeCards", JSON.stringify(cards));
}

/* =========================================
   5. RENDER FUNCTIONS
   =========================================
   Functions που "ζωγραφίζουν" το UI.
========================================= */

/*
   Δημιουργεί και εμφανίζει τα cards στη σελίδα.
*/
function renderCards(data = []) {
  const sortedData = sortCards(data);

  cardsContainer.innerHTML = "";

  if (sortedData.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No cards found</h3>
        <p>Try a different search term.</p>
      </div>
    `;
    return;
  }

  sortedData.forEach((card) => {
    const cardElement = document.createElement("article");
    const isOpen = openedCardId === card.id;

    cardElement.classList.add("card");
    cardElement.dataset.id = card.id;

    cardElement.innerHTML = `
      <div class="card-top">
        <button type="button" class="card-toggle">
          <span class="card-category">${card.category}</span>
          <span class="card-title">${card.title}</span>
        </button>
      </div>

      <div class="card-body ${isOpen ? "" : "hidden-content"}">
        <p class="card-content">${card.content}</p>

        <div class="card-actions">
          <button type="button" class="edit-btn">Edit</button>
          <button type="button" class="delete-btn">Delete</button>
        </div>
      </div>
    `;

    const toggleBtn = cardElement.querySelector(".card-toggle");
    const editBtn = cardElement.querySelector(".edit-btn");
    const deleteBtn = cardElement.querySelector(".delete-btn");

    toggleBtn.addEventListener("click", () => {
      if (openedCardId === card.id) {
        openedCardId = null;
      } else {
        openedCardId = card.id;
      }

      applyFiltersAndRender();
    });

    editBtn.addEventListener("click", () => {
      editCard(card.id);
    });

    deleteBtn.addEventListener("click", () => {
      deleteCard(card.id);
    });

    cardsContainer.appendChild(cardElement);
  });
}

/* =========================================
   6. FILTER / SEARCH LOGIC
   =========================================
   Εδώ φιλτράρουμε τα cards με βάση:
   - active collection
   - search input
   και μετά κάνουμε render.
========================================= */

function applyFiltersAndRender() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  let filteredCards = getCardsByActiveCollection();

  if (searchTerm) {
    filteredCards = filteredCards.filter((card) => {
      return (
        card.title.toLowerCase().includes(searchTerm) ||
        card.category.toLowerCase().includes(searchTerm) ||
        card.content.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (filteredCards.length === 1) {
    openedCardId = filteredCards[0].id;
  } else if (!filteredCards.some((card) => card.id === openedCardId)) {
    openedCardId = null;
  }

  renderCards(filteredCards);
}

/* =========================================
   7. MODAL FUNCTIONS
   =========================================
   Άνοιγμα / κλείσιμο modal.
========================================= */

function openModal() {
  if (editingCardId === null) {
    modalTitle.textContent = "Add New Card";
  } else {
    modalTitle.textContent = "Edit Card";
  }

  cardModal.classList.remove("hidden");
}

function closeModal() {
  cardModal.classList.add("hidden");
  cardForm.reset();
  editingCardId = null;
}

/* =========================================
   8. CRUD FUNCTIONS
   =========================================
   Create / Update / Delete / Edit prep
========================================= */

/*
   Διαγραφή card
*/
function deleteCard(id) {
  const index = cards.findIndex((card) => card.id === id);

  if (index !== -1) {
    cards.splice(index, 1);

    if (openedCardId === id) {
      openedCardId = null;
    }

    applyFiltersAndRender();
  }

  saveCards();
}

/*
   Προετοιμασία edit:
   γεμίζει το modal με τα τωρινά δεδομένα
*/
function editCard(id) {
  const cardToEdit = cards.find((card) => card.id === id);

  if (!cardToEdit) return;

  categoryInput.value = cardToEdit.category;
  titleInput.value = cardToEdit.title;
  contentInput.value = cardToEdit.content;

  editingCardId = id;
  openModal();
}

/*
   Create new card
*/
function createCard() {
  const newCard = {
    id: Date.now(),
    collection: activeCollection,
    category: categoryInput.value.trim(),
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
  };

  cards.push(newCard);
  saveCards();
  openedCardId = newCard.id;
}

/*
   Update existing card
*/
function updateCard() {
  const cardToUpdate = cards.find((card) => card.id === editingCardId);

  if (!cardToUpdate) return;

  cardToUpdate.category = categoryInput.value.trim();
  cardToUpdate.title = titleInput.value.trim();
  cardToUpdate.content = contentInput.value.trim();

  openedCardId = cardToUpdate.id;

  saveCards();
}

/* =========================================
   9. EVENT LISTENERS
   =========================================
   Εδώ συνδέουμε events με functions.
========================================= */

/*
   Add Card button
*/
addCardBtn.addEventListener("click", () => {
  editingCardId = null;
  cardForm.reset();
  openModal();
});

/*
   Close modal button
*/
closeModalBtn.addEventListener("click", closeModal);

/*
   Form submit
   - create mode
   - edit mode
*/
cardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (editingCardId === null) {
    createCard();
  } else {
    updateCard();
  }

  closeModal();
  applyFiltersAndRender();
});

/*
   Search input
*/
searchInput.addEventListener("input", () => {
  applyFiltersAndRender();
});

/*
   Sort dropdown
*/
sortSelect.addEventListener("change", () => {
  applyFiltersAndRender();
});

/*
   Collection buttons
*/
collectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCollection = button.dataset.collection;
    openedCardId = null;
    searchInput.value = "";

    collectionButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    applyFiltersAndRender();
  });
});

/* =========================================
   10. INITIAL START
   =========================================
   Τι γίνεται όταν φορτώνει η σελίδα.
========================================= */

applyFiltersAndRender();
