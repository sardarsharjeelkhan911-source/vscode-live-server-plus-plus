import { addToCart, getCartCount, getCartDetails, removeCartItem, updateCartItem } from "./cart.js";
import { getCheckoutSummary, normalizePhone, placeOrder } from "./checkout.js";
import { listCustomersWithStats } from "./customers.js";
import { isAdminConfigured, loginAdmin, logoutAdmin, isAdminLoggedIn } from "./auth.js";
import {
  ORDER_STATUSES,
  filterOrders,
  findOrderById,
  getDashboardMetrics,
  getSalesReport,
  updateOrderStatus
} from "./orders.js";
import {
  addCategory,
  deleteCategory,
  deleteProduct,
  getActiveProducts,
  getCategories,
  getLowStockProducts,
  getProductById,
  getProducts,
  saveProduct,
  searchAndFilterProducts,
  toggleProductActive,
  updateCategory
} from "./products.js";

const page = document.body.dataset.page;

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function updateCartBadge() {
  document.querySelectorAll("#cartCount").forEach((node) => {
    node.textContent = String(getCartCount());
  });
}

function setupSharedUI() {
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      mobileBtn.setAttribute("aria-expanded", String(navLinks.classList.contains("open")));
    });
  }

  const searchForm = document.getElementById("navbarSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = searchForm.querySelector("input[name='q']");
      if (input && input.value.trim()) {
        window.location.href = `shop.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  updateCartBadge();
}

function productCard(product) {
  const price = product.discountPrice || product.price;
  return `
    <article class="product-card">
      <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" />
      <h3>${escapeHTML(product.name)}</h3>
      <div>
        <span class="price">${formatCurrency(price)}</span>
        ${product.discountPrice ? `<span class="old-price">${formatCurrency(product.price)}</span>` : ""}
      </div>
      <p class="stock">Stock: ${product.stock}</p>
      <div class="product-card-actions">
        <a class="btn btn-secondary" href="product.html?id=${encodeURIComponent(product.id)}">View</a>
        <button class="btn btn-primary" data-action="add-cart" data-id="${escapeHTML(product.id)}" type="button">Add to Cart</button>
      </div>
    </article>
  `;
}

function bindAddToCart(root = document) {
  root.querySelectorAll("[data-action='add-cart']").forEach((button) => {
    button.addEventListener("click", () => {
      try {
        addToCart(button.dataset.id, 1);
        updateCartBadge();
        showToast("Added to cart");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function renderHomePage() {
  const products = getActiveProducts();
  const featured = products.slice(0, 4);
  const latest = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const categories = getCategories();

  document.getElementById("featuredProducts").innerHTML = featured.map(productCard).join("");
  document.getElementById("latestProducts").innerHTML = latest.map(productCard).join("");
  document.getElementById("categoryGrid").innerHTML = categories
    .map((category) => `<a class="category-chip" href="shop.html?category=${encodeURIComponent(category.id)}">${escapeHTML(category.name)}</a>`)
    .join("");
  bindAddToCart();
}

function renderShopPage() {
  const params = new URLSearchParams(window.location.search);
  const searchInput = document.getElementById("shopSearch");
  const categorySelect = document.getElementById("shopCategory");
  const sortSelect = document.getElementById("shopSort");
  const grid = document.getElementById("shopProducts");

  const categories = getCategories();
  categorySelect.innerHTML = `<option value="">All Categories</option>${categories
    .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
    .join("")}`;

  searchInput.value = params.get("q") || "";
  categorySelect.value = params.get("category") || "";

  const draw = () => {
    const products = searchAndFilterProducts({
      query: searchInput.value,
      categoryId: categorySelect.value,
      sort: sortSelect.value,
      includeInactive: false
    });

    grid.innerHTML = products.length
      ? products.map(productCard).join("")
      : `<div class="empty-state">No products found for current filters.</div>`;
    bindAddToCart(grid);
  };

  [searchInput, categorySelect, sortSelect].forEach((control) => control.addEventListener("input", draw));
  sortSelect.addEventListener("change", draw);
  draw();
}

function renderProductPage() {
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get("id") || "");
  const details = document.getElementById("productDetails");
  const relatedRoot = document.getElementById("relatedProducts");

  if (!product || !product.active) {
    details.innerHTML = `<div class="empty-state">Product not found.</div>`;
    return;
  }

  details.innerHTML = `
    <section class="card">
      <div class="checkout-grid">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" />
        <div>
          <h1>${escapeHTML(product.name)}</h1>
          <p>${escapeHTML(product.description)}</p>
          <p><strong>${formatCurrency(product.discountPrice || product.price)}</strong>
            ${product.discountPrice ? `<span class="old-price">${formatCurrency(product.price)}</span>` : ""}
          </p>
          <p class="stock">Available stock: ${product.stock}</p>
          <label for="productQty">Quantity</label>
          <input id="productQty" type="number" min="1" max="${product.stock}" value="1" />
          <div class="product-card-actions">
            <button id="productAddCart" class="btn btn-primary" type="button">Add to Cart</button>
            <button id="productBuyNow" class="btn btn-secondary" type="button">Buy Now</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const qtyInput = document.getElementById("productQty");
  document.getElementById("productAddCart").addEventListener("click", () => {
    try {
      addToCart(product.id, Number(qtyInput.value));
      updateCartBadge();
      showToast("Added to cart");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("productBuyNow").addEventListener("click", () => {
    const qty = Number(qtyInput.value);
    window.location.href = `checkout.html?buyNow=${encodeURIComponent(product.id)}&qty=${qty}`;
  });

  const related = getActiveProducts()
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, 4);
  relatedRoot.innerHTML = related.length ? related.map(productCard).join("") : `<p>No related products.</p>`;
  bindAddToCart(relatedRoot);
}

function renderCartPage() {
  const root = document.getElementById("cartContent");

  const draw = () => {
    const summary = getCartDetails();

    if (!summary.items.length) {
      root.innerHTML = `<div class="empty-state">Your cart is empty. <a href="shop.html">Shop now</a></div>`;
      updateCartBadge();
      return;
    }

    root.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
            <tbody>
              ${summary.items
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHTML(item.name)}</td>
                      <td>${formatCurrency(item.unitPrice)}</td>
                      <td>
                        <button class="btn btn-secondary" data-action="dec" data-id="${escapeHTML(item.productId)}" type="button">-</button>
                        <span>${item.qty}</span>
                        <button class="btn btn-secondary" data-action="inc" data-id="${escapeHTML(item.productId)}" type="button">+</button>
                      </td>
                      <td>${formatCurrency(item.lineTotal)}</td>
                      <td><button class="btn btn-danger" data-action="remove" data-id="${escapeHTML(item.productId)}" type="button">Remove</button></td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <aside class="card">
        <p>Subtotal: <strong>${formatCurrency(summary.subtotal)}</strong></p>
        <p>Delivery: <strong>${formatCurrency(summary.delivery)}</strong></p>
        <p>Grand Total: <strong>${formatCurrency(summary.total)}</strong></p>
        <a class="btn btn-secondary" href="shop.html">Continue Shopping</a>
        <a class="btn btn-primary" href="checkout.html">Proceed to Checkout</a>
      </aside>
    `;

    root.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.dataset.id;
        const action = button.dataset.action;
        const current = summary.items.find((item) => item.productId === productId);

        try {
          if (action === "inc") {
            updateCartItem(productId, current.qty + 1);
          } else if (action === "dec") {
            updateCartItem(productId, current.qty - 1);
          } else if (action === "remove") {
            removeCartItem(productId);
          }
          draw();
          updateCartBadge();
        } catch (error) {
          showToast(error.message);
        }
      });
    });
  };

  draw();
}

function renderCheckoutPage() {
  const form = document.getElementById("checkoutForm");
  const summaryRoot = document.getElementById("checkoutSummary");
  const confirmation = document.getElementById("orderConfirmation");
  const params = new URLSearchParams(window.location.search);

  const buyNow = params.get("buyNow")
    ? {
        productId: params.get("buyNow"),
        qty: Number(params.get("qty") || 1)
      }
    : null;

  let summary;
  try {
    summary = getCheckoutSummary(buyNow);
  } catch (error) {
    form.classList.add("hidden");
    summaryRoot.innerHTML = `<div class="empty-state">${escapeHTML(error.message)} <a href="shop.html">Go to Shop</a></div>`;
    return;
  }

  summaryRoot.innerHTML = `
    <h2>Order Summary</h2>
    <ul class="order-items">
      ${summary.items
        .map((item) => `<li><span>${escapeHTML(item.name)} x ${item.qty}</span><strong>${formatCurrency(item.lineTotal)}</strong></li>`)
        .join("")}
    </ul>
    <hr />
    <p>Subtotal: <strong>${formatCurrency(summary.subtotal)}</strong></p>
    <p>Delivery: <strong>${formatCurrency(summary.delivery)}</strong></p>
    <p>Total: <strong>${formatCurrency(summary.total)}</strong></p>
  `;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Placing order...";

    const payload = {
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      city: form.city.value,
      address: form.address.value,
      notes: form.notes.value
    };

    try {
      const order = await placeOrder(payload, buyNow);
      confirmation.classList.remove("hidden");
      confirmation.innerHTML = `
        <h2>Order Confirmed</h2>
        <p>Thank you, <strong>${escapeHTML(order.customerName)}</strong>!</p>
        <p>Order ID: <strong>${escapeHTML(order.id)}</strong></p>
        <p>Total: <strong>${formatCurrency(order.total)}</strong></p>
        <p>Status: <strong>${escapeHTML(order.status)}</strong></p>
        <a class="btn btn-secondary" href="tracking.html">Track your order</a>
      `;
      form.classList.add("hidden");
      form.reset();
      updateCartBadge();
      showToast("Order placed successfully.");
    } catch (error) {
      showToast(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Place Order";
    }
  });
}

function renderTrackingPage() {
  const form = document.getElementById("trackingForm");
  const result = document.getElementById("trackingResult");
  const timelineStatuses = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];
  const phoneRegex = /^\+?\d{10,15}$/;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderId = document.getElementById("trackingOrderId").value.trim();
    const phone = normalizePhone(document.getElementById("trackingPhone").value);

    if (!orderId || !phone) {
      showToast("Order ID and phone are required.");
      return;
    }
    if (!phoneRegex.test(phone)) {
      showToast("Invalid phone number format.");
      return;
    }

    const order = findOrderById(orderId);
    if (!order || normalizePhone(order.customerPhone) !== phone) {
      showToast("Invalid order ID or phone number.");
      result.classList.add("hidden");
      return;
    }

    let timelineHtml = "";
    if (["Cancelled", "Returned"].includes(order.status)) {
      timelineHtml = `<li class="${order.status.toLowerCase()}">${order.status}</li>`;
    } else {
      const currentIndex = timelineStatuses.indexOf(order.status);
      timelineHtml = timelineStatuses
        .map((status, index) => `<li class="${index <= currentIndex ? "active" : ""}">${status}</li>`)
        .join("");
    }

    result.classList.remove("hidden");
    result.innerHTML = `
      <h2>Order ${escapeHTML(order.id)}</h2>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Status:</strong> ${escapeHTML(order.status)}</p>
      ${order.trackingNumber ? `<p><strong>Tracking #:</strong> ${escapeHTML(order.trackingNumber)}</p>` : ""}
      <ul class="timeline">${timelineHtml}</ul>
    `;
  });
}

function renderAdminPage() {
  const loginSection = document.getElementById("adminLoginSection");
  const dashboard = document.getElementById("adminDashboard");
  const loginForm = document.getElementById("adminLoginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  const statusFilter = document.getElementById("orderStatusFilter");
  statusFilter.innerHTML = `<option value="">All</option>${ORDER_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("")}`;
  const demoHint = document.getElementById("adminDemoHint");
  if (demoHint) {
    demoHint.textContent = isAdminConfigured()
      ? "Use your configured local demo admin credentials."
      : "First login bootstraps local demo credentials using the username/password you enter.";
  }

  function refreshAdminUI() {
    const loggedIn = isAdminLoggedIn();
    loginSection.classList.toggle("hidden", loggedIn);
    dashboard.classList.toggle("hidden", !loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);
    if (!loggedIn) return;

    const metrics = getDashboardMetrics();
    const lowStock = getLowStockProducts();
    document.getElementById("metricCards").innerHTML = [
      ["Total Sales", formatCurrency(metrics.totalSales)],
      ["Total Orders", metrics.totalOrders],
      ["Pending Orders", metrics.pendingOrders],
      ["Delivered Orders", metrics.deliveredOrders],
      ["Returned Orders", metrics.returnedOrders],
      ["Total Products", metrics.totalProducts],
      ["Low Stock Products", lowStock.length]
    ]
      .map(([label, value]) => `<article class="metric"><p>${label}</p><h3>${value}</h3></article>`)
      .join("");

    renderCategoryOptions();
    renderProductTable();
    renderCategoryList();
    renderOrdersTable();
    renderCustomersTable();
    renderReports();
  }

  function renderCategoryOptions() {
    const select = document.getElementById("productCategory");
    const categories = getCategories();
    select.innerHTML = categories.map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`).join("");
  }

  function renderProductTable() {
    const productsBody = document.getElementById("adminProductsBody");
    const products = getProducts({ includeInactive: true });

    productsBody.innerHTML = products
      .map(
        (product) => `
          <tr>
            <td>${escapeHTML(product.name)}</td>
            <td>${formatCurrency(product.discountPrice || product.price)}</td>
            <td>${product.stock}</td>
            <td>${product.active ? "Active" : "Inactive"}</td>
            <td>
              <button class="btn btn-secondary" data-action="edit-product" data-id="${escapeHTML(product.id)}" type="button">Edit</button>
              <button class="btn btn-danger" data-action="delete-product" data-id="${escapeHTML(product.id)}" type="button">Delete</button>
              <button class="btn btn-success" data-action="toggle-product" data-id="${escapeHTML(product.id)}" type="button">${
                product.active ? "Deactivate" : "Activate"
              }</button>
            </td>
          </tr>
        `
      )
      .join("");

    productsBody.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const action = button.dataset.action;
        const product = getProductById(id);

        if (action === "edit-product" && product) {
          document.getElementById("productId").value = product.id;
          document.getElementById("productName").value = product.name;
          document.getElementById("productImage").value = product.image;
          document.getElementById("productCategory").value = product.categoryId;
          document.getElementById("productPrice").value = product.price;
          document.getElementById("productDiscount").value = product.discountPrice || "";
          document.getElementById("productStock").value = product.stock;
          document.getElementById("productDescription").value = product.description;
        }

        if (action === "delete-product") {
          if (!window.confirm("Delete this product permanently?")) return;
          deleteProduct(id);
          showToast("Product deleted");
          refreshAdminUI();
        }

        if (action === "toggle-product") {
          toggleProductActive(id);
          refreshAdminUI();
        }
      });
    });
  }

  function renderCategoryList() {
    const list = document.getElementById("categoryList");
    const categories = getCategories();

    list.innerHTML = categories
      .map(
        (category) => `
          <li>
            <span>${escapeHTML(category.name)}</span>
            <span>
              <button class="btn btn-secondary" data-action="edit-category" data-id="${escapeHTML(category.id)}" type="button">Edit</button>
              <button class="btn btn-danger" data-action="delete-category" data-id="${escapeHTML(category.id)}" type="button">Delete</button>
            </span>
          </li>
        `
      )
      .join("");

    list.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const action = button.dataset.action;
        const categoriesData = getCategories();
        const item = categoriesData.find((category) => category.id === id);

        if (action === "edit-category" && item) {
          document.getElementById("categoryId").value = item.id;
          document.getElementById("categoryName").value = item.name;
        }

        if (action === "delete-category") {
          if (!window.confirm("Delete this category? Products move to Uncategorized.")) return;
          deleteCategory(id);
          showToast("Category deleted");
          refreshAdminUI();
        }
      });
    });
  }

  function renderOrdersTable() {
    const search = document.getElementById("orderSearch").value;
    const status = document.getElementById("orderStatusFilter").value;
    const orders = filterOrders({ query: search, status });
    const body = document.getElementById("ordersBody");

    body.innerHTML = orders.length
      ? orders
          .map(
            (order) => `
              <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customerName)}<br/><small>${escapeHTML(order.customerPhone)}</small></td>
                <td>${formatCurrency(order.total)}</td>
                <td><span class="badge ${order.status.toLowerCase().replace(/\s+/g, "-")}">${escapeHTML(order.status)}</span></td>
                <td>
                  <select data-action="set-status" data-id="${escapeHTML(order.id)}">
                    ${ORDER_STATUSES.map((statusOption) => `<option value="${statusOption}" ${statusOption === order.status ? "selected" : ""}>${statusOption}</option>`).join("")}
                  </select>
                  <button class="btn btn-secondary" data-action="view-order" data-id="${escapeHTML(order.id)}" type="button">View</button>
                </td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="5">No orders found.</td></tr>`;

    body.querySelectorAll("select[data-action='set-status']").forEach((select) => {
      select.addEventListener("change", () => {
        try {
          updateOrderStatus(select.dataset.id, select.value);
          showToast("Order status updated");
          refreshAdminUI();
        } catch (error) {
          showToast(error.message);
        }
      });
    });

    body.querySelectorAll("button[data-action='view-order']").forEach((button) => {
      button.addEventListener("click", () => {
        const order = findOrderById(button.dataset.id);
        if (!order) return;
        window.alert(
          `${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.address}\nItems:\n${order.items
            .map((item) => `- ${item.name} x ${item.qty}`)
            .join("\n")}`
        );
      });
    });
  }

  function renderCustomersTable() {
    const customers = listCustomersWithStats();
    document.getElementById("customersBody").innerHTML = customers.length
      ? customers
          .map(
            (customer) => `
              <tr>
                <td>${escapeHTML(customer.name)}</td>
                <td>${escapeHTML(customer.phone)}</td>
                <td>${escapeHTML(customer.email)}</td>
                <td>${escapeHTML(customer.city)}, ${escapeHTML(customer.address)}</td>
                <td>${customer.totalOrders}</td>
                <td>${formatCurrency(customer.totalSpending)}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="6">No customers yet.</td></tr>`;
  }

  function renderReports() {
    const report = getSalesReport();
    document.getElementById("salesReport").innerHTML = `
      <p>Total sales: <strong>${formatCurrency(report.totalSales)}</strong></p>
      <p>Number of orders: <strong>${report.numberOfOrders}</strong></p>
      <p>Delivered: <strong>${report.deliveredOrders}</strong></p>
      <p>Cancelled: <strong>${report.cancelledOrders}</strong></p>
      <p>Returned: <strong>${report.returnedOrders}</strong></p>
      <h3>Best-selling products</h3>
      <ul class="list">
        ${report.bestSellingProducts.map((item) => `<li><span>${escapeHTML(item.name)} (${item.qty} units)</span><span>${formatCurrency(item.amount)}</span></li>`).join("") || "<li>No sales data yet.</li>"}
      </ul>
    `;
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      loginAdmin(loginForm.adminUsername.value, loginForm.adminPassword.value);
      showToast("Welcome to admin dashboard");
      loginForm.reset();
      refreshAdminUI();
    } catch (error) {
      showToast(error.message);
    }
  });

  logoutBtn.addEventListener("click", () => {
    logoutAdmin();
    showToast("Logged out");
    refreshAdminUI();
  });

  document.getElementById("productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = {
      id: document.getElementById("productId").value || undefined,
      name: document.getElementById("productName").value,
      image: document.getElementById("productImage").value,
      categoryId: document.getElementById("productCategory").value,
      price: document.getElementById("productPrice").value,
      discountPrice: document.getElementById("productDiscount").value,
      stock: document.getElementById("productStock").value,
      description: document.getElementById("productDescription").value,
      active: true
    };

    saveProduct(payload);
    event.target.reset();
    document.getElementById("productId").value = "";
    showToast("Product saved");
    refreshAdminUI();
  });

  document.getElementById("productResetBtn").addEventListener("click", () => {
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
  });

  document.getElementById("categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("categoryId").value;
    const name = document.getElementById("categoryName").value;
    try {
      if (id) {
        updateCategory(id, name);
      } else {
        addCategory(name);
      }
      event.target.reset();
      document.getElementById("categoryId").value = "";
      showToast("Category saved");
      refreshAdminUI();
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("categoryResetBtn").addEventListener("click", () => {
    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
  });

  document.getElementById("orderSearch").addEventListener("input", renderOrdersTable);
  document.getElementById("orderStatusFilter").addEventListener("change", renderOrdersTable);

  refreshAdminUI();
}

setupSharedUI();

if (page === "home") renderHomePage();
if (page === "shop") renderShopPage();
if (page === "product") renderProductPage();
if (page === "cart") renderCartPage();
if (page === "checkout") renderCheckoutPage();
if (page === "tracking") renderTrackingPage();
if (page === "admin") renderAdminPage();
