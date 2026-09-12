const ADMIN_SESSION_KEY = "mystore.admin.session";
const ADMIN_CREDENTIALS_KEY = "mystore.admin.credentials";

function parseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function generateDemoCredentials() {
  return {
    username: "admin",
    password: `demo-${Math.random().toString(36).slice(2, 10)}`
  };
}

function ensureDemoCredentials() {
  const existing = parseJSON(localStorage.getItem(ADMIN_CREDENTIALS_KEY));
  if (existing?.username && existing?.password) {
    return existing;
  }
  const seeded = generateDemoCredentials();
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(seeded));
  return seeded;
}

export function loginAdmin(username, password) {
  const credentials = ensureDemoCredentials();
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

export function getDemoAdminCredentials() {
  return { ...ensureDemoCredentials() };
}
