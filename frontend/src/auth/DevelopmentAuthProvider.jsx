import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { fetchCurrentUser } from "../api/auth";
import { AuthContext } from "./AuthContext";


export default function DevelopmentAuthProvider({
  children,
}) {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user =
          await fetchCurrentUser(null);

        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error(
          "Failed to load development user:",
          error
        );

        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    // No login necessary in development mode.
  }, []);

  const logout = useCallback(async () => {
    // No logout necessary in development mode.
  }, []);

  const getAccessToken =
    useCallback(async () => {
      return null;
    }, []);

  const value = {
    isAuthenticated:
      currentUser !== null,

    isLoading,
    currentUser,

    login,
    logout,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}