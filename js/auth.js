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
  if (credentials?.username && credentials?.password) {
    return credentials;
  }
  return null;
}

export function loginAdmin(username, password) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "");
  const existing = getStoredCredentials();

  if (!existing) {
    if (!normalizedUsername || !normalizedPassword) {
      throw new Error("Enter username and password to initialize demo admin login.");
    }
    localStorage.setItem(
      ADMIN_CREDENTIALS_KEY,
      JSON.stringify({ username: normalizedUsername, password: normalizedPassword })
    );
  } else if (normalizedUsername !== existing.username || normalizedPassword !== existing.password) {
    throw new Error("Invalid login credentials.");
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
