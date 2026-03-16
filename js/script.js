/* =========================
   DATA
   =========================
   Εδώ βρίσκονται τα αρχικά cards data.
   Κάθε card είναι object με id, category, title, content.
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
   Παίρνουμε references από το HTML
   ώστε να τα χρησιμοποιούμε με JavaScript.
*/
const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");

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
   - null  => create mode
   - number => edit mode

   openedCardId:
   - null  => καμία ανοιχτή
   - number => ποια card είναι ανοιχτή
*/
let editingCardId = null;
let openedCardId = null;

/* =========================
   RENDER CARDS
   =========================
   Αυτή η function "ζωγραφίζει" τα cards στη σελίδα.
   Δέχεται προαιρετικά data, ώστε να μπορούμε
   να κάνουμε render και filtered results από search.
*/
function renderCards(data = cards) {
  /* Καθαρίζουμε πρώτα το container */
  cardsContainer.innerHTML = "";

  /* Αν δεν υπάρχουν αποτελέσματα, δείχνουμε μήνυμα */
  if (data.length === 0) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No cards found</h3>
        <p>Try a different search term.</p>
      </div>
    `;
    return;
  }

  /* Δημιουργούμε κάθε item της λίστας */
  data.forEach((card) => {
    const cardElement = document.createElement("article");
    cardElement.classList.add("card");
    cardElement.dataset.id = card.id;

    /* 
      Αν το openedCardId είναι ίδιο με το id της card,
      τότε η card θα εμφανιστεί ανοιχτή.
    */
    const isOpen = openedCardId === card.id;

    /* 
      Το card έχει:
      - button/header που πατιέται
      - body που ανοίγει/κλείνει
    */
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

    /* Βρίσκουμε τα επιμέρους buttons μέσα στην card */
    const toggleBtn = cardElement.querySelector(".card-toggle");
    const editBtn = cardElement.querySelector(".edit-btn");
    const deleteBtn = cardElement.querySelector(".delete-btn");

    /* 
      TOGGLE CARD
      Αν πατήσεις τον τίτλο:
      - αν είναι ήδη ανοιχτή, κλείνει
      - αλλιώς ανοίγει αυτή και κλείνουν οι άλλες
    */
    toggleBtn.addEventListener("click", () => {
      if (openedCardId === card.id) {
        openedCardId = null;
      } else {
        openedCardId = card.id;
      }

      /* 
         Αν υπάρχει active search,
         ξανακάνουμε render τα filtered αποτελέσματα.
         Αλλιώς όλη τη λίστα.
      */
      applySearch();
    });

    /* EDIT BUTTON */
    editBtn.addEventListener("click", () => {
      editCard(card.id);
    });

    /* DELETE BUTTON */
    deleteBtn.addEventListener("click", () => {
      deleteCard(card.id);
    });

    /* Βάζουμε το item μέσα στο container */
    cardsContainer.appendChild(cardElement);
  });
}

/* =========================
   SEARCH
   =========================
   Φιλτράρει τα cards βάσει:
   - title
   - category
   - content

   Και κάνει render μόνο τα matching cards.
*/
function applySearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  /* Αν δεν έχει γραφτεί τίποτα, δείξε όλες τις cards */
  if (!searchTerm) {
    renderCards(cards);
    return;
  }

  /* Φιλτράρουμε τα cards */
  const filteredCards = cards.filter((card) => {
    return (
      card.title.toLowerCase().includes(searchTerm) ||
      card.category.toLowerCase().includes(searchTerm) ||
      card.content.toLowerCase().includes(searchTerm)
    );
  });

  /* 
     Προαιρετικά: αν υπάρχει μόνο 1 αποτέλεσμα,
     το ανοίγουμε αυτόματα.
  */
  if (filteredCards.length === 1) {
    openedCardId = filteredCards[0].id;
  } else if (!filteredCards.some((card) => card.id === openedCardId)) {
    /* 
       Αν το ανοιχτό card δεν υπάρχει πια στα αποτελέσματα,
       το κλείνουμε.
    */
    openedCardId = null;
  }

  renderCards(filteredCards);
}

/* =========================
   MODAL FUNCTIONS
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
   Βρίσκει το σωστό id, σβήνει από το array
   και ξανακάνει render.
*/
function deleteCard(id) {
  const index = cards.findIndex((card) => card.id === id);

  if (index !== -1) {
    cards.splice(index, 1);

    /* Αν ήταν ανοιχτή η ίδια card, την κλείνουμε */
    if (openedCardId === id) {
      openedCardId = null;
    }

    applySearch();
  }
}

/* =========================
   EDIT CARD
   =========================
   Γεμίζει το modal με τα υπάρχοντα data
   και ανοίγει το modal σε edit mode.
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
   Ανοίγει άδειο modal για create mode.
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

    /* Ανοίγουμε αυτόματα τη νέα card */
    openedCardId = newCard.id;
  } else {
    const cardToUpdate = cards.find((card) => card.id === editingCardId);

    if (cardToUpdate) {
      cardToUpdate.category = categoryInput.value.trim();
      cardToUpdate.title = titleInput.value.trim();
      cardToUpdate.content = contentInput.value.trim();

      /* Ανοίγουμε την edited card μετά το save */
      openedCardId = cardToUpdate.id;
    }
  }

  closeModal();
  applySearch();
});

/* =========================
   SEARCH INPUT LISTENER
   =========================
   Κάθε φορά που γράφεις στο search,
   φιλτράρονται live τα cards.
*/
searchInput.addEventListener("input", applySearch);

/* =========================
   INITIAL RENDER
   =========================
   Πρώτο render όταν φορτώνει η σελίδα.
*/
renderCards();