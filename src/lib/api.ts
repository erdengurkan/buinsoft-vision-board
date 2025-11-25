const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "buinsoft_token";

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Handle 401 response - token expired or invalid
const handleUnauthorized = (): void => {
  removeToken();
  // Redirect to login
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
};

// API request wrapper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  overrideToken?: string | null
): Promise<Response> => {
  const token = overrideToken !== undefined ? overrideToken : getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }

  return response;
};

// API methods
const api = {
  get: async <T = any>(endpoint: string, options?: { token?: string | null }): Promise<T> => {
    const response = await apiRequest(endpoint, { method: "GET" }, options?.token);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    return response.json();
  },

  post: async <T = any>(endpoint: string, data?: any, options?: { token?: string | null }): Promise<T> => {
    const response = await apiRequest(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }, options?.token);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    return response.json();
  },

  patch: async <T = any>(endpoint: string, data?: any, options?: { token?: string | null }): Promise<T> => {
    const response = await apiRequest(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }, options?.token);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    return response.json();
  },

  delete: async <T = any>(endpoint: string, options?: { token?: string | null }): Promise<T> => {
    const response = await apiRequest(endpoint, { method: "DELETE" }, options?.token);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    // Handle empty response
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  },
};

export default api;
export { api };


