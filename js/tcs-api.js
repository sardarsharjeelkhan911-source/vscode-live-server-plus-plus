/**
 * Mock TCS/Courier adapter.
 *
 * TODO (real integration):
 * 1) Set API base URL from secure environment variables.
 * 2) Inject secure credentials/tokens from backend, never from frontend source.
 * 3) Replace mock responses with real fetch calls and response mapping.
 */

function simulateNetwork(delay = 350) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function maybeThrowError() {
  if (Math.random() < 0.03) {
    throw new Error("Courier service temporarily unavailable. Please retry.");
  }
}

export async function createShipment(order) {
  await simulateNetwork();
  maybeThrowError();

  // Future payload example for real TCS API mapping.
  const shipmentPayload = {
    orderId: order.id,
    customerName: order.customerName,
    phone: order.customerPhone,
    address: order.address,
    city: order.city,
    codAmount: order.total,
    products: order.items.map((item) => ({ name: item.name, qty: item.qty, amount: item.lineTotal }))
  };

  return {
    success: true,
    trackingNumber: `TRK-${Date.now().toString().slice(-8)}`,
    status: "Booked",
    payloadPreview: shipmentPayload
  };
}

export async function getTrackingStatus(trackingNumber) {
  await simulateNetwork(250);
  maybeThrowError();

  const statuses = ["Booked", "Shipped", "Out for Delivery", "Delivered"];
  const index = trackingNumber.length % statuses.length;

  return {
    success: true,
    trackingNumber,
    status: statuses[index],
    updatedAt: new Date().toISOString()
  };
}

export async function cancelShipment(trackingNumber) {
  await simulateNetwork(250);
  maybeThrowError();

  return {
    success: true,
    trackingNumber,
    status: "Cancelled"
  };
}
