import { clearCart, getCartDetails } from "./cart.js";
import { upsertCustomer } from "./customers.js";
import { createOrder } from "./orders.js";
import { getProductById, decreaseStock, increaseStock } from "./products.js";
import { createShipment } from "./tcs-api.js";
import { getSettings } from "./storage.js";

const phoneRegex = /^\+?\d{10,15}$/;

export function validateCheckoutInput(input) {
  const requiredFields = ["name", "phone", "email", "city", "address"];
  const missingField = requiredFields.find((field) => !input[field]?.trim());
  if (missingField) {
    throw new Error("Please fill all required customer fields.");
  }
  if (!phoneRegex.test(input.phone.trim())) {
    throw new Error("Invalid phone number format.");
  }
}

function buildSummary(buyNowItem = null) {
  if (buyNowItem) {
    const product = getProductById(buyNowItem.productId);
    if (!product || !product.active) {
      throw new Error("Selected product is not available.");
    }
    const qty = Number(buyNowItem.qty || 1);
    if (qty < 1 || qty > product.stock) {
      throw new Error("Selected quantity is out of stock.");
    }

    const unitPrice = product.discountPrice || product.price;
    const subtotal = unitPrice * qty;
    const delivery = subtotal > 0 ? Number(getSettings().deliveryCharge || 0) : 0;
    return {
      items: [
        {
          productId: product.id,
          name: product.name,
          image: product.image,
          qty,
          unitPrice,
          lineTotal: subtotal
        }
      ],
      subtotal,
      delivery,
      total: subtotal + delivery,
      source: "buyNow"
    };
  }

  const cartSummary = getCartDetails();
  if (!cartSummary.items.length) {
    throw new Error("Your cart is empty.");
  }
  return { ...cartSummary, source: "cart" };
}

export function getCheckoutSummary(buyNowItem = null) {
  return buildSummary(buyNowItem);
}

export async function placeOrder(customerInput, buyNowItem = null) {
  validateCheckoutInput(customerInput);
  const summary = buildSummary(buyNowItem);

  summary.items.forEach((item) => {
    const product = getProductById(item.productId);
    if (!product || product.stock < item.qty) {
      throw new Error(`Out of stock: ${item.name}`);
    }
  });

  summary.items.forEach((item) => decreaseStock(item.productId, item.qty));
  let customer;
  try {
    customer = upsertCustomer(customerInput);
  } catch (error) {
    summary.items.forEach((item) => increaseStock(item.productId, item.qty));
    throw error;
  }

  const baseOrder = {
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    city: customer.city,
    address: customer.address,
    notes: customerInput.notes || "",
    items: summary.items,
    subtotal: summary.subtotal,
    delivery: summary.delivery,
    total: summary.total,
    status: "Pending"
  };

  let shipment;
  try {
    shipment = await createShipment({ id: "TEMP", ...baseOrder });
  } catch (error) {
    summary.items.forEach((item) => increaseStock(item.productId, item.qty));
    throw new Error(`Shipment booking failed: ${error.message}`);
  }

  let order;
  try {
    order = createOrder({
      ...baseOrder,
      trackingNumber: shipment.trackingNumber,
      shipmentStatus: shipment.status
    });
  } catch (error) {
    summary.items.forEach((item) => increaseStock(item.productId, item.qty));
    throw error;
  }

  if (summary.source === "cart") {
    clearCart();
  }

  return order;
}
