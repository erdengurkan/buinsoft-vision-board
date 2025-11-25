import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string | null;
  userRole?: string | null;
  avatar?: string | null;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "buinsoft_user_v2";
const TOKEN_KEY = "buinsoft_token";
const SESSION_VERSION_KEY = "buinsoft_session_version";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const LEGACY_KEYS = ["buinsoft_user"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    // Drop legacy keys silently so users aren't stuck with stale sessions
    LEGACY_KEYS.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    const storedVersion = localStorage.getItem(SESSION_VERSION_KEY);
    if (storedVersion && storedVersion !== APP_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    localStorage.setItem(SESSION_VERSION_KEY, APP_VERSION);

    // Check for token first (new JWT system)
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (storedToken && stored) {
      try {
        const userData = JSON.parse(stored);
        // Parse Date strings back to Date objects
        if (userData.createdAt) {
          userData.createdAt = new Date(userData.createdAt);
        }
        setUserState(userData);
        setTokenState(storedToken);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
      setIsLoading(false);
    } else if (stored && !storedToken) {
      // Legacy user data without token - migrate it
      // Keep user data so Login page can pre-fill email
      try {
        const userData = JSON.parse(stored);
        if (userData.createdAt) {
          userData.createdAt = new Date(userData.createdAt);
        }
        // Keep user data temporarily for email pre-fill, but clear it after login
        setUserState(userData);
        console.log("⚠️ Legacy user data found without token. Email will be pre-filled on login page.");
      } catch (error) {
        console.error("Failed to parse legacy user from localStorage:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const setUser = (userData: User | null, newToken: string | null) => {
    setUserState(userData);
    setTokenState(newToken);
    if (userData && newToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(SESSION_VERSION_KEY, APP_VERSION);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    setUser(null, null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

