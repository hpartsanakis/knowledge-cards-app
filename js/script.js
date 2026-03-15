const cards = [
  {
    id: 1,
    category: "JavaScript",
    title: "Variables",
    content: "let creates a block-scoped variable that can be updated later.",
  },
  {
    id: 2,
    category: "HTML",
    title: "Semantic Tags",
    content:
      "Semantic HTML tags like header, main, section and article improve structure.",
  },
  {
    id: 3,
    category: "CSS",
    title: "Flexbox",
    content: "display: flex helps align items in rows or columns.",
  },
];

const cardsContainer = document.getElementById("cardsContainer");
const addCardBtn = document.getElementById("addCardBtn");
const cardModal = document.getElementById("cardModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cardForm = document.getElementById("cardForm");
const categoryInput = document.getElementById("categoryInput");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const modalTitle = document.getElementById("modalTitle");

let editingCardId = null;

function renderCards() {
  cardsContainer.innerHTML = "";

  cards.forEach((card) => {
    const cardElement = document.createElement("article");
    cardElement.classList.add("card");
    cardElement.dataset.id = card.id;

    cardElement.innerHTML = `
      <div class="card-header">
        <span class="card-category">${card.category}</span>
        <h2 class="card-title">${card.title}</h2>
      </div>

      <p class="card-content">${card.content}</p>

      <div class="card-actions">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `;

    const editBtn = cardElement.querySelector(".edit-btn");
    const deleteBtn = cardElement.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => {
      editCard(card.id);
    });

    deleteBtn.addEventListener("click", () => {
      deleteCard(card.id);
    });

    cardsContainer.appendChild(cardElement);
  });
}

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

function deleteCard(id) {
  const index = cards.findIndex((card) => card.id === id);

  if (index !== -1) {
    cards.splice(index, 1);
    renderCards();
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

addCardBtn.addEventListener("click", () => {
  editingCardId = null;
  cardForm.reset();
  openModal();
});

closeModalBtn.addEventListener("click", closeModal);

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (editingCardId === null) {
    const newCard = {
      id: Date.now(),
      category: categoryInput.value.trim(),
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
    };

    cards.push(newCard);
  } else {
    const cardToUpdate = cards.find((card) => card.id === editingCardId);

    if (cardToUpdate) {
      cardToUpdate.category = categoryInput.value.trim();
      cardToUpdate.title = titleInput.value.trim();
      cardToUpdate.content = contentInput.value.trim();
    }
  }

  renderCards();
  closeModal();
});

renderCards();
