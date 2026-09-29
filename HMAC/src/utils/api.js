export const API_BASE = "http://localhost:8000/api/v1";

// Authorization header for the JWT saved at login (empty when signed out).
export const authHeaders = () => {
  let token = null;
  try {
    token = localStorage.getItem("access_token");
  } catch {
    // Storage unavailable: treat as signed out.
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isAuthError = (error) => [401, 403].includes(error?.response?.status);
