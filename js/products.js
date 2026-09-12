import { generateId, getCollection, getSettings, setCollection } from "./storage.js";

export function getProducts({ includeInactive = true } = {}) {
  const products = getCollection("products");
  return includeInactive ? products : products.filter((p) => p.active);
}

export function getActiveProducts() {
  return getProducts({ includeInactive: false });
}

export function getProductById(id) {
  return getProducts().find((product) => product.id === id) || null;
}

export function saveProduct(input) {
  const products = getProducts();
  const now = new Date().toISOString();
  const normalized = {
    id: input.id || generateId("prod"),
    name: input.name.trim(),
    image: input.image.trim() || "assets/placeholder.svg",
    price: Number(input.price),
    discountPrice: input.discountPrice ? Number(input.discountPrice) : null,
    stock: Number(input.stock),
    categoryId: input.categoryId,
    description: input.description.trim(),
    active: input.active !== false,
    createdAt: input.createdAt || now,
    updatedAt: now
  };

  const index = products.findIndex((product) => product.id === normalized.id);
  if (index === -1) {
    products.unshift(normalized);
  } else {
    products[index] = { ...products[index], ...normalized };
  }

  setCollection("products", products);
  return normalized;
}

export function deleteProduct(productId) {
  const products = getProducts().filter((product) => product.id !== productId);
  setCollection("products", products);
}

export function toggleProductActive(productId) {
  const products = getProducts().map((product) =>
    product.id === productId ? { ...product, active: !product.active, updatedAt: new Date().toISOString() } : product
  );
  setCollection("products", products);
}

export function decreaseStock(productId, quantity) {
  const products = getProducts();
  const index = products.findIndex((product) => product.id === productId);
  if (index === -1) {
    throw new Error("Product not found.");
  }
  if (products[index].stock < quantity) {
    throw new Error(`Only ${products[index].stock} items left for ${products[index].name}.`);
  }
  products[index].stock -= quantity;
  products[index].updatedAt = new Date().toISOString();
  setCollection("products", products);
}

export function increaseStock(productId, quantity) {
  const products = getProducts();
  const index = products.findIndex((product) => product.id === productId);
  if (index === -1) {
    return;
  }
  products[index].stock += quantity;
  products[index].updatedAt = new Date().toISOString();
  setCollection("products", products);
}

export function getLowStockProducts() {
  const threshold = getSettings().lowStockThreshold;
  return getProducts({ includeInactive: true }).filter((product) => product.stock <= threshold);
}

export function getCategories() {
  return getCollection("categories");
}

export function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Category name is required.");
  }
  const categories = getCategories();
  const exists = categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    throw new Error("Category already exists.");
  }
  const category = { id: generateId("cat"), name: trimmed };
  categories.push(category);
  setCollection("categories", categories);
  return category;
}

export function updateCategory(categoryId, name) {
  const trimmed = name.trim();
  const categories = getCategories();
  const duplicate = categories.some(
    (category) => category.id !== categoryId && category.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    throw new Error("Category already exists.");
  }
  const updated = categories.map((category) =>
    category.id === categoryId ? { ...category, name: trimmed } : category
  );
  setCollection("categories", updated);
}

export function deleteCategory(categoryId) {
  const products = getProducts().map((product) =>
    product.categoryId === categoryId ? { ...product, categoryId: "uncategorized" } : product
  );
  setCollection("products", products);

  const categories = getCategories().filter((category) => category.id !== categoryId);
  const hasUncategorized = categories.some((category) => category.id === "uncategorized");
  if (!hasUncategorized) {
    categories.push({ id: "uncategorized", name: "Uncategorized" });
  }
  setCollection("categories", categories);
}

export function searchAndFilterProducts({ query = "", categoryId = "", sort = "latest", includeInactive = false } = {}) {
  let products = getProducts({ includeInactive });

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    products = products.filter((product) =>
      [product.name, product.description].some((field) => field.toLowerCase().includes(q))
    );
  }

  if (categoryId) {
    products = products.filter((product) => product.categoryId === categoryId);
  }

  if (sort === "price-asc") {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sort === "price-desc") {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sort === "name") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return products;
}
