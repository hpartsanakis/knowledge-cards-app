/* =========================================
   1. DATA
========================================= */

const cards = [
  {
    id: 1,
    collection: "photos",
    category: "Street",
    title: "Blue Hour in Frankfurt",
    content: "Best moment was 10 minutes after sunset near the river.",
    image: null
  },
  {
    id: 2,
    collection: "recipes",
    category: "Dinner",
    title: "Greek Chicken Bowl",
    content: "Chicken, rice, cucumber, tomato, yogurt sauce.",
    image: null
  },
  {
    id: 3,
    collection: "travel",
    category: "Norway",
    title: "Tromsø Harbour",
    content: "Perfect location for blue hour photos and night reflections.",
    image: null
  }
];

/* Load saved cards from localStorage */
const savedCards = localStorage.getItem("knowledgeCards");

if (savedCards) {
  const parsedCards = JSON.parse(savedCards);
  cards.length = 0;
  cards.push(...parsedCards);
}

/* =========================================
   2. DOM ELEMENTS
========================================= */

const cardsContainer = document.getElementById("cardsContainer");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const addCardBtn = document.getElementById("addCardBtn");
const installBtn = document.getElementById("installBtn");

const cardModal = document.getElementById("cardModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cardForm = document.getElementById("cardForm");

const categoryInput = document.getElementById("categoryInput");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const imageInput = document.getElementById("imageInput");
const modalTitle = document.getElementById("modalTitle");

const collectionButtons = document.querySelectorAll(".collection-btn");

/* =========================================
   3. APP STATE
========================================= */

let editingCardId = null;
let openedCardId = null;
let activeCollection = "photos";
let deferredPrompt = null;

/* =========================================
   4. HELPER FUNCTIONS
========================================= */

function saveCards() {
  localStorage.setItem("knowledgeCards", JSON.stringify(cards));
}

function getCardsByActiveCollection() {
  return cards.filter((card) => card.collection === activeCollection);
}

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

function convertImageToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================
   5. RENDER FUNCTIONS
========================================= */

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
        ${card.image ? `<img src="${card.image}" alt="${card.title}" class="card-image">` : ""}

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
  imageInput.value = "";
  editingCardId = null;
}

/* =========================================
   8. CRUD FUNCTIONS
========================================= */

function deleteCard(id) {
  const index = cards.findIndex((card) => card.id === id);

  if (index !== -1) {
    cards.splice(index, 1);

    if (openedCardId === id) {
      openedCardId = null;
    }

    saveCards();
    applyFiltersAndRender();
  }
}

function editCard(id) {
  const cardToEdit = cards.find((card) => card.id === id);

  if (!cardToEdit) return;

  categoryInput.value = cardToEdit.category;
  titleInput.value = cardToEdit.title;
  contentInput.value = cardToEdit.content;

  editingCardId = id;
  openModal();
}

async function createCard() {
  let imageData = null;

  if (imageInput.files[0]) {
    imageData = await convertImageToBase64(imageInput.files[0]);
  }

  const newCard = {
    id: Date.now(),
    collection: activeCollection,
    category: categoryInput.value.trim(),
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
    image: imageData
  };

  cards.push(newCard);
  openedCardId = newCard.id;
  saveCards();
}

async function updateCard() {
  const cardToUpdate = cards.find((card) => card.id === editingCardId);

  if (!cardToUpdate) return;

  cardToUpdate.category = categoryInput.value.trim();
  cardToUpdate.title = titleInput.value.trim();
  cardToUpdate.content = contentInput.value.trim();

  if (imageInput.files[0]) {
    cardToUpdate.image = await convertImageToBase64(imageInput.files[0]);
  }

  openedCardId = cardToUpdate.id;
  saveCards();
}

/* =========================================
   9. EVENT LISTENERS
========================================= */

addCardBtn.addEventListener("click", () => {
  editingCardId = null;
  cardForm.reset();
  imageInput.value = "";
  openModal();
});

closeModalBtn.addEventListener("click", closeModal);

cardForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (editingCardId === null) {
    await createCard();
  } else {
    await updateCard();
  }

  closeModal();
  applyFiltersAndRender();
});

searchInput.addEventListener("input", () => {
  applyFiltersAndRender();
});

sortSelect.addEventListener("change", () => {
  applyFiltersAndRender();
});

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
   10. PWA INSTALL BUTTON
========================================= */

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    console.log("App installed");
  }

  deferredPrompt = null;
  installBtn.style.display = "none";
});

/* =========================================
   11. INITIAL START
========================================= */

applyFiltersAndRender();

/* =========================================
   12. SERVICE WORKER
========================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}