/* =========================
   DATA
   =========================
   Τα αρχικά cards της εφαρμογής.
*/
const cards = [
  {
    id: 1,
    category: "JavaScript",
    title: "Variables",
    content: "let creates a block-scoped variable that can be updated later."
  },
  {
    id: 2,
    category: "HTML",
    title: "Semantic Tags",
    content: "Semantic HTML tags like header, main, section and article improve structure."
  },
  {
    id: 3,
    category: "CSS",
    title: "Flexbox",
    content: "display: flex helps align items in rows or columns."
  }
];

/* =========================
   DOM ELEMENTS
   =========================
   Παίρνουμε references από το HTML.
*/
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

/* =========================
   APP STATE
   =========================
   editingCardId:
   - null   => create mode
   - number => edit mode

   openedCardId:
   - null   => καμία ανοιχτή card
   - number => ποια card είναι ανοιχτή
*/
let editingCardId = null;
let openedCardId = null;

/* =========================
   SORT CARDS
   =========================
   Ταξινομεί το array ανάλογα με το dropdown.
*/
function sortCards(data) {
  const mode = sortSelect.value;
  const sorted = [...data];

  if (mode === "az") {
    sorted.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
  }

  if (mode === "za") {
    sorted.sort((a, b) =>
      b.title.localeCompare(a.title, undefined, { sensitivity: "base" })
    );
  }

  if (mode === "newest") {
    sorted.sort((a, b) => b.id - a.id);
  }

  if (mode === "category") {
    sorted.sort((a, b) =>
      a.category.localeCompare(b.category, undefined, { sensitivity: "base" })
    );
  }

  return sorted;
}

/* =========================
   RENDER CARDS
   =========================
   Ζωγραφίζει τη λίστα των cards.
   Δέχεται προαιρετικά filtered data.
*/
function renderCards(data = cards) {
  /* Πρώτα κάνουμε sorting */
  data = sortCards(data);

  /* Καθαρίζουμε το container */
  cardsContainer.innerHTML = "";

  /* Αν δεν υπάρχουν αποτελέσματα */
  if (data.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No cards found</h3>
        <p>Try a different search term.</p>
      </div>
    `;
    return;
  }

  /* Δημιουργούμε κάθε card */
  data.forEach((card) => {
    const cardElement = document.createElement("article");
    cardElement.classList.add("card");
    cardElement.dataset.id = card.id;

    /* Ελέγχουμε αν η συγκεκριμένη card είναι ανοιχτή */
    const isOpen = openedCardId === card.id;

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

    /* Παίρνουμε τα κουμπιά της card */
    const toggleBtn = cardElement.querySelector(".card-toggle");
    const editBtn = cardElement.querySelector(".edit-btn");
    const deleteBtn = cardElement.querySelector(".delete-btn");

    /* Άνοιγμα / κλείσιμο card */
    toggleBtn.addEventListener("click", () => {
      if (openedCardId === card.id) {
        openedCardId = null;
      } else {
        openedCardId = card.id;
      }

      applySearch();
    });

    /* Edit card */
    editBtn.addEventListener("click", () => {
      editCard(card.id);
    });

    /* Delete card */
    deleteBtn.addEventListener("click", () => {
      deleteCard(card.id);
    });

    cardsContainer.appendChild(cardElement);
  });
}

/* =========================
   SEARCH
   =========================
   Φιλτράρει cards με βάση:
   - title
   - category
   - content
*/
function applySearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  /* Αν το search είναι κενό, δείξε όλα τα cards */
  if (!searchTerm) {
    renderCards(cards);
    return;
  }

  /* Φιλτράρουμε */
  const filteredCards = cards.filter((card) => {
    return (
      card.title.toLowerCase().includes(searchTerm) ||
      card.category.toLowerCase().includes(searchTerm) ||
      card.content.toLowerCase().includes(searchTerm)
    );
  });

  /* Αν υπάρχει μόνο 1 αποτέλεσμα, άνοιξέ το */
  if (filteredCards.length === 1) {
    openedCardId = filteredCards[0].id;
  } else if (!filteredCards.some((card) => card.id === openedCardId)) {
    /* Αν το ανοιχτό card δεν υπάρχει στα αποτελέσματα, κλείσ' το */
    openedCardId = null;
  }

  renderCards(filteredCards);
}

/* =========================
   MODAL
   =========================
   Άνοιγμα / κλείσιμο modal
*/
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

/* =========================
   DELETE CARD
   =========================
   Σβήνει card από το array.
*/
function deleteCard(id) {
  const index = cards.findIndex((card) => card.id === id);

  if (index !== -1) {
    cards.splice(index, 1);

    if (openedCardId === id) {
      openedCardId = null;
    }

    applySearch();
  }
}

/* =========================
   EDIT CARD
   =========================
   Γεμίζει το modal με τα υπάρχοντα δεδομένα.
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

/* =========================
   ADD CARD BUTTON
   =========================
   Ανοίγει το modal για create mode.
*/
addCardBtn.addEventListener("click", () => {
  editingCardId = null;
  cardForm.reset();
  openModal();
});

/* =========================
   CLOSE MODAL BUTTON
   ========================= */
closeModalBtn.addEventListener("click", closeModal);

/* =========================
   FORM SUBMIT
   =========================
   Αν editingCardId === null:
   -> create new card

   Αλλιώς:
   -> update existing card
*/
cardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (editingCardId === null) {
    const newCard = {
      id: Date.now(),
      category: categoryInput.value.trim(),
      title: titleInput.value.trim(),
      content: contentInput.value.trim()
    };

    cards.push(newCard);

    /* Άνοιξε αυτόματα τη νέα card */
    openedCardId = newCard.id;
  } else {
    const cardToUpdate = cards.find((card) => card.id === editingCardId);

    if (cardToUpdate) {
      cardToUpdate.category = categoryInput.value.trim();
      cardToUpdate.title = titleInput.value.trim();
      cardToUpdate.content = contentInput.value.trim();

      /* Άνοιξε την edited card */
      openedCardId = cardToUpdate.id;
    }
  }

  closeModal();
  applySearch();
});

/* =========================
   SEARCH LISTENER
   =========================
   Live filtering όσο γράφεις.
*/
searchInput.addEventListener("input", applySearch);

/* =========================
   SORT LISTENER
   =========================
   Όταν αλλάζει το sort dropdown,
   ξανακάνουμε render με το σωστό sorting.
*/
sortSelect.addEventListener("change", applySearch);

/* =========================
   INITIAL RENDER
   ========================= */
renderCards();