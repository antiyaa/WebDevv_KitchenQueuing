
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

window.completedOrders = [];
let sortMode = "priority";

function renderKitchenQueue() {
  const ticketList = document.getElementById("ticket-list");
  const completedList = document.getElementById("completed-list");
  document.getElementById("pending-count").textContent = `${window.orders.length} pending`;
  
  ticketList.innerHTML = "";
  completedList.innerHTML = "";

  if (window.orders.length === 0) {
    ticketList.innerHTML = `<div class="empty-state">No active orders in the queue.</div>`;
  }

  let displayOrders = [...window.orders];
  
  if (sortMode === "amount") {
    displayOrders.sort((a, b) => b.total - a.total);
  } else if (sortMode === "table") {
    displayOrders.sort((a, b) => a.table.localeCompare(b.table));
  } else if (sortMode === "longest") {
    displayOrders.sort((a, b) => a.createdAt - b.createdAt);
  }

  displayOrders.forEach((order, index) => renderTicket(order, ticketList, false));
  window.completedOrders.forEach(order => renderTicket(order, completedList, true));

  if (sortMode === "priority") {
    $("#ticket-list").sortable({
      handle: ".drag-handle",
      update: function(event, ui) {
        // Map DOM reordering back to window.orders
        const newOrderIds = $(this).sortable("toArray", { attribute: "data-id" });
        window.orders = newOrderIds.map(id => window.orders.find(o => o.id == id));
      }
    }).disableSelection();
  } else {
    if ($("#ticket-list").hasClass("ui-sortable")) {
      $("#ticket-list").sortable("destroy");
    }
  }
}

function renderTicket(order, container, isCompleted) {
  const waitMinutes = Math.floor((Date.now() - order.createdAt) / 60000);
  let agingClass = "";
  if (!isCompleted) {
    if (waitMinutes >= 6) agingClass = "urgent";
    else if (waitMinutes >= 3) agingClass = "warning";
  }

  const itemsHtml = order.items.map(i => `${i.qty}x ${i.name}`).join("<br>");
  
  const ticketHtml = `
    <div class="ticket ${agingClass}" data-id="${order.id}">
      <div class="ticket-top">
        <div class="ticket-id">
          <span class="drag-handle" style="cursor: grab; color: var(--muted);">⋮⋮</span>
          <span class="ticket-num">#${order.id.toString().slice(-3)}</span>
        </div>
        <div class="ticket-meta">
          <span class="ticket-table">${order.table}</span>
          <span class="ticket-time">${waitMinutes} min ago</span>
          <span class="urgent-tag">Urgent</span>
          <span class="warning-tag" style="display:none;">Warning</span>
        </div>
      </div>
      <div class="ticket-items">${itemsHtml}</div>
      <div class="ticket-bottom">
        <span class="ticket-total">₱${order.total}</span>
        ${!isCompleted ? `<button class="btn-ready" onclick="markReady(${order.id})">MARK AS READY</button>` : ''}
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', ticketHtml);
}

function markReady(id) {
  const index = window.orders.findIndex(o => o.id === id);
  if (index > -1) {
    const [completed] = window.orders.splice(index, 1);
    window.completedOrders.push(completed);
    renderKitchenQueue();
  }
}

document.querySelectorAll('.sort-tabs .tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.sort-tabs .tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    sortMode = e.target.dataset.sort;
    renderKitchenQueue();
  });
});

// Refresh every 20 seconds for aging indicator
setInterval(renderKitchenQueue, 20000);

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
