import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken, clearAuthToken, authAPI } from "../api/client";
import { registerForPushNotificationsAsync } from "../utils/notifications";

interface User {
  id: number;
  email: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (
    email: string,
    password: string,
    language?: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);
        // Verify token by fetching profile
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
        } catch (error: any) {
          // If 401 unauthorized, token is invalid - clear it
          if (error?.response?.status === 401) {
            console.warn("Token is invalid or expired, clearing...");
            clearAuthToken();
            await AsyncStorage.removeItem("authToken");
            setToken(null);
            setUser(null);
          } else {
            // For other errors (network, etc), keep token and try again later
            console.warn("Could not verify token with server:", error?.message);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      clearAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPushToken = useCallback(async () => {
    if (!token) return;
    try {
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) {
        await authAPI.updatePushToken(expoPushToken);
      }
    } catch (error) {
      console.warn("Failed to register push token:", error);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (token) {
      registerPushToken();
    }
  }, [token, registerPushToken]);

  const register = useCallback(
    async (email: string, password: string, language = "en") => {
      setIsLoading(true);
      try {
        const response = await authAPI.register(email, password, language);
        setUser(response.data.user);
        setToken(response.data.token);
        setAuthToken(response.data.token);
        await AsyncStorage.setItem("authToken", response.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      setUser(response.data.user);
      setToken(response.data.token);
      setAuthToken(response.data.token);
      await AsyncStorage.setItem("authToken", response.data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    clearAuthToken();
    await AsyncStorage.removeItem("authToken");
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      await authAPI.changePassword(oldPassword, newPassword);
    },
    [],
  );

  const updateLanguage = useCallback(async (language: string) => {
    const response = await authAPI.updateLanguage(language);
    setUser(response.data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        register,
        login,
        logout,
        changePassword,
        updateLanguage,
        loadUser,
      }}
    >
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
