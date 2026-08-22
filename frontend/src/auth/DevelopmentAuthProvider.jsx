import {
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

        console.log(
          "fetchCurrentUser returned:",
          user
        );

        if (!cancelled) {
          console.log(
            "Setting current user:",
            user
          );

          setCurrentUser(user);
        }
      } catch (error) {
        console.error(
          "Failed to load development user:",
          error
        );
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

  console.log(
    "DevelopmentAuthProvider state:",
    {
      currentUser,
      isLoading,
      isAuthenticated:
        currentUser !== null,
    }
  );

  const value = {
    isAuthenticated:
      currentUser !== null,

    isLoading,
    currentUser,

    login: async () => {
      // No login necessary in development mode.
    },

    logout: async () => {
      // No logout necessary in development mode.
    },

    getAccessToken: async () => {
      return null;
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}