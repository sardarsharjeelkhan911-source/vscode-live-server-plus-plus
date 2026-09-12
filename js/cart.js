import { getSettings } from "./storage.js";
import { getProductById } from "./products.js";

const CART_KEY = "mystore.cart";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getCartItems() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((acc, item) => acc + item.qty, 0);
}

export function addToCart(productId, qty = 1) {
  const product = getProductById(productId);
  if (!product || !product.active) {
    throw new Error("Product is not available.");
  }

  const items = readCart();
  const index = items.findIndex((item) => item.productId === productId);
  const nextQty = Math.max(1, Number(qty));

  if (index === -1) {
    if (nextQty > product.stock) {
      throw new Error("Requested quantity is not available.");
    }
    items.push({ productId, qty: nextQty });
  } else {
    const merged = items[index].qty + nextQty;
    if (merged > product.stock) {
      throw new Error("Requested quantity is not available.");
    }
    items[index].qty = merged;
  }

  writeCart(items);
  return items;
}

export function updateCartItem(productId, qty) {
  const parsedQty = Number(qty);
  const product = getProductById(productId);
  if (!product) {
    throw new Error("Product not found.");
  }

  if (parsedQty <= 0) {
    return removeCartItem(productId);
  }

  if (parsedQty > product.stock) {
    throw new Error("Requested quantity is not available.");
  }

  const items = readCart().map((item) => (item.productId === productId ? { ...item, qty: parsedQty } : item));
  writeCart(items);
  return items;
}

export function removeCartItem(productId) {
  const items = readCart().filter((item) => item.productId !== productId);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}

export function getCartDetails(itemsOverride = null) {
  const sourceItems = itemsOverride || readCart();
  const details = sourceItems
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product || !product.active) return null;
      const unitPrice = product.discountPrice || product.price;
      return {
        productId: product.id,
        name: product.name,
        image: product.image,
        qty: item.qty,
        stock: product.stock,
        unitPrice,
        lineTotal: unitPrice * item.qty
      };
    })
    .filter(Boolean);

  const subtotal = details.reduce((acc, item) => acc + item.lineTotal, 0);
  const delivery = subtotal > 0 ? Number(getSettings().deliveryCharge || 0) : 0;
  return {
    items: details,
    subtotal,
    delivery,
    total: subtotal + delivery
  };
}
