const ADMIN_SESSION_KEY = "mystore.admin.session";
const ADMIN_CREDENTIALS_KEY = "mystore.admin.credentials";

function parseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getStoredCredentials() {
  const credentials = parseJSON(localStorage.getItem(ADMIN_CREDENTIALS_KEY));
  if (credentials?.username && credentials?.passwordHash) {
    return credentials;
  }
  return null;
}

async function hashPassword(password) {
  const content = new TextEncoder().encode(String(password || ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function loginAdmin(username, password) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "");
  const existing = getStoredCredentials();

  if (!existing) {
    if (!normalizedUsername || !normalizedPassword) {
      throw new Error("Enter username and password to initialize demo admin login.");
    }
    const passwordHash = await hashPassword(normalizedPassword);
    localStorage.setItem(
      ADMIN_CREDENTIALS_KEY,
      JSON.stringify({ username: normalizedUsername, passwordHash })
    );
  } else {
    const inputHash = await hashPassword(normalizedPassword);
    if (normalizedUsername !== existing.username || inputHash !== existing.passwordHash) {
      throw new Error("Invalid login credentials.");
    }
  }

  const session = {
    username: normalizedUsername,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminSession() {
  return parseJSON(localStorage.getItem(ADMIN_SESSION_KEY));
}

export function isAdminLoggedIn() {
  return Boolean(getAdminSession());
}

export function isAdminConfigured() {
  return Boolean(getStoredCredentials());
}
