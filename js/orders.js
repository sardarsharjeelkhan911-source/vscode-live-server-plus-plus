import { generateId, getCollection, setCollection } from "./storage.js";
import { getProducts } from "./products.js";

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned"
];

export function createOrder(orderInput) {
  const orders = getCollection("orders");
  const createdAt = new Date().toISOString();
  const order = {
    id: orderInput.id || `MS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    reference: generateId("ord"),
    customerName: orderInput.customerName,
    customerPhone: orderInput.customerPhone,
    customerEmail: orderInput.customerEmail,
    city: orderInput.city,
    address: orderInput.address,
    notes: orderInput.notes || "",
    items: orderInput.items,
    subtotal: orderInput.subtotal,
    delivery: orderInput.delivery,
    total: orderInput.total,
    status: orderInput.status || "Pending",
    trackingNumber: orderInput.trackingNumber || null,
    shipmentStatus: orderInput.shipmentStatus || "Awaiting pickup",
    statusHistory: [
      {
        status: orderInput.status || "Pending",
        timestamp: createdAt,
        note: "Order placed"
      }
    ],
    createdAt,
    updatedAt: createdAt
  };

  orders.unshift(order);
  setCollection("orders", orders);
  return order;
}

export function listOrders() {
  return getCollection("orders").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function findOrderById(orderId) {
  return listOrders().find((order) => order.id.toLowerCase() === orderId.trim().toLowerCase()) || null;
}

export function filterOrders({ query = "", status = "" } = {}) {
  const q = query.trim().toLowerCase();
  return listOrders().filter((order) => {
    const queryPass =
      !q ||
      [order.id, order.customerName, order.customerPhone].some((field) => field.toLowerCase().includes(q));
    const statusPass = !status || order.status === status;
    return queryPass && statusPass;
  });
}

export function updateOrderStatus(orderId, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const orders = listOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    throw new Error("Order not found.");
  }

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  orders[index].statusHistory.push({
    status,
    timestamp: orders[index].updatedAt,
    note: `Status changed to ${status}`
  });

  setCollection("orders", orders);
  return orders[index];
}

export function getDashboardMetrics() {
  const orders = listOrders();
  const products = getProducts({ includeInactive: true });

  const statusCount = (status) => orders.filter((order) => order.status === status).length;
  const totalSales = orders
    .filter((order) => !["Cancelled", "Returned"].includes(order.status))
    .reduce((acc, order) => acc + order.total, 0);

  return {
    totalSales,
    totalOrders: orders.length,
    pendingOrders: statusCount("Pending"),
    deliveredOrders: statusCount("Delivered"),
    returnedOrders: statusCount("Returned"),
    cancelledOrders: statusCount("Cancelled"),
    totalProducts: products.length,
    lowStockProducts: products.filter((product) => product.stock <= 5).length
  };
}

export function getSalesReport() {
  const orders = listOrders();
  const productSales = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSales.get(item.productId) || { name: item.name, qty: 0, amount: 0 };
      current.qty += item.qty;
      current.amount += item.lineTotal;
      productSales.set(item.productId, current);
    });
  });

  const bestSellingProducts = [...productSales.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return {
    totalSales: orders.reduce((acc, order) => acc + order.total, 0),
    numberOfOrders: orders.length,
    deliveredOrders: orders.filter((order) => order.status === "Delivered").length,
    cancelledOrders: orders.filter((order) => order.status === "Cancelled").length,
    returnedOrders: orders.filter((order) => order.status === "Returned").length,
    bestSellingProducts
  };
}
