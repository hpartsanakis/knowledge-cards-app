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
    content: "display:flex helps align items in rows or columns.",
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

function renderCards() {
  cardsContainer.innerHTML = "";

  cards.forEach((card) => {
    const cardElement = document.createElement("article");

    cardElement.classList.add("card");

    cardElement.innerHTML = `
      <div class="card-header">
        <span class="card-category">${card.category}</span>
        <h2 class="card-title">${card.title}</h2>
      </div>

      <p class="card-content">
        ${card.content}
      </p>

      <div class="card-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    cardsContainer.appendChild(cardElement);
  });
}

function openModal() {
  cardModal.classList.remove("hidden");
}

function closeModal() {
  cardModal.classList.add("hidden");
  cardForm.reset();
}

addCardBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);

cardForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const newCard = {
    id: Date.now(),
    category: categoryInput.value,
    title: titleInput.value,
    content: contentInput.value,
  };

  cards.push(newCard);
  renderCards();
  closeModal();
});

renderCards();
