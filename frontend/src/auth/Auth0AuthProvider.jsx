import {
  useCallback,
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

  const login = useCallback(async () => {
    console.log("Starting Auth0 login redirect");

    try {
      await loginWithRedirect({
        appState: {
          returnTo: "/app",
        },
      });
    } catch (error) {
      console.error(
        "Auth0 login redirect failed:",
        error
      );
    }
  }, [loginWithRedirect]);

  const logout = useCallback(async () => {
    await auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }, [auth0Logout]);

  const getAccessToken =
    useCallback(async () => {
      return await getAccessTokenSilently();
    }, [getAccessTokenSilently]);

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