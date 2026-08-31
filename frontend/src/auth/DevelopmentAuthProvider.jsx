import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchCurrentUser,
} from "../api/auth";

import {
  AuthContext,
} from "./AuthContext";


export default function DevelopmentAuthProvider({
  children,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    authStatus,
    setAuthStatus,
  ] = useState(
    "loading",
  );


  const [
    authError,
    setAuthError,
  ] = useState(
    null,
  );


  useEffect(
    () => {
      let cancelled =
        false;


      async function loadCurrentUser() {
        setAuthStatus(
          "loading",
        );

        setAuthError(
          null,
        );


        try {
          const user =
            await fetchCurrentUser(
              null,
            );


          if (!cancelled) {
            setCurrentUser(
              user,
            );

            setAuthStatus(
              "authenticated",
            );
          }

        } catch (error) {
          console.error(
            "Failed to load development user:",
            error,
          );


          if (!cancelled) {
            setCurrentUser(
              null,
            );

            setAuthError(
              error,
            );

            setAuthStatus(
              "error",
            );
          }
        }
      }


      loadCurrentUser();


      return () => {
        cancelled =
          true;
      };
    },
    [],
  );


  const login =
    useCallback(
      async () => {
        /*
         * No login necessary
         * in development mode.
         */
      },
      [],
    );


  const logout =
    useCallback(
      async () => {
        /*
         * No logout necessary
         * in development mode.
         */
      },
      [],
    );


  const getAccessToken =
    useCallback(
      async () => {
        return null;
      },
      [],
    );


    const value =
      useMemo(
        () => ({
          authStatus,

          authError,

          isAuth0Authenticated:
            false,

          isAuthenticated:
            authStatus ===
            "authenticated",

          isLoading:
            authStatus ===
            "loading",

          currentUser,

          login,
          logout,
          getAccessToken,
        }),
        [
          authStatus,
          authError,
          currentUser,
          login,
          logout,
          getAccessToken,
        ],
      );


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}