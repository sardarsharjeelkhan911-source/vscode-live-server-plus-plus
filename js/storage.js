const DB_KEY = "mystore.db";
const SCHEMA_VERSION = 1;

const seedCategories = [
  { id: "cat-electronics", name: "Electronics" },
  { id: "cat-fashion", name: "Fashion" },
  { id: "cat-home", name: "Home" },
  { id: "cat-beauty", name: "Beauty" }
];

const seedProducts = [
  {
    id: "prod-1",
    name: "Wireless Headphones",
    image: "assets/placeholder.svg",
    price: 6500,
    discountPrice: 5600,
    stock: 14,
    categoryId: "cat-electronics",
    description: "Comfort-fit headphones with deep bass and 20-hour battery.",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "prod-2",
    name: "Smart Watch",
    image: "assets/placeholder.svg",
    price: 7200,
    discountPrice: 6800,
    stock: 8,
    categoryId: "cat-electronics",
    description: "Track health, notifications, and fitness from your wrist.",
    active: true,
    createdAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "prod-3",
    name: "Casual Sneakers",
    image: "assets/placeholder.svg",
    price: 3900,
    discountPrice: null,
    stock: 20,
    categoryId: "cat-fashion",
    description: "Daily-wear sneakers with breathable upper and soft sole.",
    active: true,
    createdAt: "2026-01-03T00:00:00.000Z"
  },
  {
    id: "prod-4",
    name: "Desk Lamp",
    image: "assets/placeholder.svg",
    price: 2100,
    discountPrice: 1800,
    stock: 11,
    categoryId: "cat-home",
    description: "Minimal modern desk lamp with warm white adjustable light.",
    active: true,
    createdAt: "2026-01-04T00:00:00.000Z"
  },
  {
    id: "prod-5",
    name: "Skin Care Kit",
    image: "assets/placeholder.svg",
    price: 4300,
    discountPrice: 3990,
    stock: 6,
    categoryId: "cat-beauty",
    description: "Beginner-friendly complete day and night skin care routine.",
    active: true,
    createdAt: "2026-01-05T00:00:00.000Z"
  }
];

function defaultData() {
  return {
    meta: { schemaVersion: SCHEMA_VERSION, initializedAt: new Date().toISOString() },
    settings: {
      storeName: "MyStore",
      currency: "PKR",
      deliveryCharge: 250,
      lowStockThreshold: 5,
      adminCredentials: {
        username: "admin",
        password: "admin123"
      }
    },
    categories: seedCategories,
    products: seedProducts,
    customers: [],
    orders: []
  };
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function initStorage() {
  const existing = safeParse(localStorage.getItem(DB_KEY));
  if (!existing) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultData()));
    return;
  }
  migrate(existing);
}

function migrate(data) {
  if (!data.meta) {
    data.meta = { schemaVersion: 0 };
  }

  if ((data.meta.schemaVersion || 0) < SCHEMA_VERSION) {
    const merged = { ...defaultData(), ...data };
    merged.meta.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(DB_KEY, JSON.stringify(merged));
  }
}

export function getDB() {
  initStorage();
  return safeParse(localStorage.getItem(DB_KEY)) || defaultData();
}

export function setDB(nextData) {
  localStorage.setItem(DB_KEY, JSON.stringify(nextData));
}

export function updateDB(mutator) {
  const current = getDB();
  const draft = structuredClone(current);
  mutator(draft);
  setDB(draft);
  return draft;
}

export function getCollection(name) {
  const db = getDB();
  return structuredClone(db[name] || []);
}

export function setCollection(name, value) {
  updateDB((draft) => {
    draft[name] = value;
  });
}

export function getSettings() {
  return getDB().settings;
}

export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

initStorage();
