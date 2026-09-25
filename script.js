
const menu = [
  { id: 1, name: "Sin Again (Sinigang)", price: 260 },
  { id: 2, name: "Big Bangus Theory",     price: 120 },
  { id: 3, name: "Adobest",  price: 150 },
  { id: 4, name: "Sisig-arily",    price: 80  },
  { id: 5, name: "Tea-nakpan", price: 90  },
];

let quantities = {};         


window.orders = window.orders || [];

const tableSelect   = document.getElementById("table-select");
const menuListEl     = document.getElementById("menu-list");
const totalAmountEl  = document.getElementById("order-total-amount");
const sendBtn        = document.getElementById("send-to-kitchen");

function renderMenu() {
  menuListEl.innerHTML = "";

  menu.forEach((item) => {
    if (quantities[item.id] === undefined) quantities[item.id] = 0;

    const li = document.createElement("li");
    li.className = "menu-row";
    li.innerHTML = `
      <div>
        <div class="menu-name">${item.name}</div>
        <div class="menu-price">₱${item.price}</div>
      </div>
      <div class="stepper">
        <button class="dec" data-id="${item.id}" aria-label="Decrease quantity">-</button>
        <span class="qty" id="qty-${item.id}">${quantities[item.id]}</span>
        <button class="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
      </div>
    `;
    menuListEl.appendChild(li);
  });
}

menuListEl.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("inc")) {
    quantities[id]++;
  } else if (e.target.classList.contains("dec") && quantities[id] > 0) {
    quantities[id]--;
  } else {
    return;
  }

  document.getElementById(`qty-${id}`).textContent = quantities[id];
  updateTotal();
});

function buildCart() {
  return menu
    .filter((item) => quantities[item.id] > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: quantities[item.id],
    }));
}

function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateTotal() {
  const cart = buildCart();
  const total = calculateTotal(cart);

  totalAmountEl.textContent = `₱${total}`;
  sendBtn.disabled = cart.length === 0;
}

function createOrder() {
  const cart = buildCart();
  if (cart.length === 0) return null;

  return {
    id: Date.now(),         
    table: tableSelect.value,
    items: cart,
    total: calculateTotal(cart),
    status: "pending",       
    createdAt: Date.now(),
  };
}

function resetOrderForm() {
  quantities = {};
  renderMenu();
  updateTotal();
}

sendBtn.addEventListener("click", () => {
  const order = createOrder();
  if (!order) return;

  window.orders.push(order);

  // If the Kitchen Queue team's script.js defines this function,
  // call it so the new ticket shows up immediately.
  if (typeof renderKitchenQueue === "function") {
    renderKitchenQueue();
  }

  resetOrderForm();
});

/* ---------- 11. Initial render ---------- */
renderMenu();
updateTotal();