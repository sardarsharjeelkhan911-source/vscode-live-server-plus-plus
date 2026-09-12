import { getCollection, setCollection } from "./storage.js";
import { listOrders } from "./orders.js";

export function getCustomers() {
  return getCollection("customers");
}

export function findCustomerByPhone(phone) {
  return getCustomers().find((customer) => customer.phone === phone) || null;
}

export function upsertCustomer(customerInput) {
  const customers = getCustomers();
  const index = customers.findIndex((customer) => customer.phone === customerInput.phone);
  const record = {
    id: customers[index]?.id || `cust-${Date.now()}`,
    name: customerInput.name.trim(),
    phone: customerInput.phone.trim(),
    email: customerInput.email.trim(),
    city: customerInput.city.trim(),
    address: customerInput.address.trim(),
    notes: customerInput.notes?.trim() || "",
    updatedAt: new Date().toISOString()
  };

  if (index === -1) {
    customers.push({ ...record, createdAt: record.updatedAt });
  } else {
    customers[index] = { ...customers[index], ...record };
  }

  setCollection("customers", customers);
  return findCustomerByPhone(record.phone);
}

export function listCustomersWithStats() {
  const customers = getCustomers();
  const orders = listOrders();

  return customers.map((customer) => {
    const customerOrders = orders.filter((order) => order.customerPhone === customer.phone);
    return {
      ...customer,
      totalOrders: customerOrders.length,
      totalSpending: customerOrders.reduce((acc, order) => acc + order.total, 0)
    };
  });
}
