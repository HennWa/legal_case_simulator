import {
  useEffect,
  useState,
} from "react";

import { useAuth0 } from "@auth0/auth0-react";

import { fetchCurrentUser } from "../api/auth";
import { AuthContext } from "./AuthContext";


export default function Auth0AuthProvider({
  children,
}) {
  const {
    isAuthenticated: isAuth0Authenticated,
    isLoading: isAuth0Loading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [currentUser, setCurrentUser] =
    useState(null);

  const [isUserLoading, setIsUserLoading] =
    useState(false);

  const login = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/app",
      },
    });
  };

  const logout = async () => {
    await auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const getAccessToken = async () => {
    return await getAccessTokenSilently();
  };

  useEffect(() => {
    if (
      isAuth0Loading ||
      !isAuth0Authenticated
    ) {
      return;
    }

    let cancelled = false;

    async function loadCurrentUser() {
      setIsUserLoading(true);

      try {
        const token =
          await getAccessTokenSilently();

        const user =
          await fetchCurrentUser(token);

        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error(
          "Failed to load Casendra user:",
          error
        );

        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsUserLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [
    isAuth0Authenticated,
    isAuth0Loading,
    getAccessTokenSilently,
  ]);

  const value = {
    isAuthenticated:
      isAuth0Authenticated &&
      currentUser !== null,

    isLoading:
      isAuth0Loading ||
      isUserLoading,

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