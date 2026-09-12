const ADMIN_SESSION_KEY = "mystore.admin.session";
const DEMO_ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};

export function loginAdmin(username, password) {
  const isValid =
    username === DEMO_ADMIN_CREDENTIALS.username && password === DEMO_ADMIN_CREDENTIALS.password;
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
  return { ...DEMO_ADMIN_CREDENTIALS };
}
