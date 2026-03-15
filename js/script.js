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

renderCards();
