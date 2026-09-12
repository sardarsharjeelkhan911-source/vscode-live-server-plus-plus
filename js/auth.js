import { getSettings } from "./storage.js";

const ADMIN_SESSION_KEY = "mystore.admin.session";

export function loginAdmin(username, password) {
  const credentials = getSettings().adminCredentials;
  const isValid = username === credentials.username && password === credentials.password;
  if (!isValid) {
    throw new Error("Invalid login credentials.");
  }

  const session = {
    username,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return null;
  }
}

export function isAdminLoggedIn() {
  return Boolean(getAdminSession());
}
