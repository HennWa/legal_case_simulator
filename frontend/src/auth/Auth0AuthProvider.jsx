import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuth0,
} from "@auth0/auth0-react";

import {
  CurrentUserRequestError,
  fetchCurrentUser,
} from "../api/auth";

import {
  AuthContext,
} from "./AuthContext";


export default function Auth0AuthProvider({
  children,
}) {
  const {
    isAuthenticated:
      isAuth0Authenticated,

    isLoading:
      isAuth0Loading,

    loginWithRedirect,

    logout:
      auth0Logout,

    getAccessTokenSilently,
  } = useAuth0();


  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    authStatus,
    setAuthStatus,
  ] = useState("loading");


  const [
    authError,
    setAuthError,
  ] = useState(null);


  const login =
    useCallback(
      async () => {
        try {
          await loginWithRedirect({
            appState: {
              returnTo:
                "/app",
            },
          });

        } catch (error) {
          console.error(
            "Auth0 login redirect failed:",
            error,
          );

          setAuthError(
            error,
          );

          setAuthStatus(
            "error",
          );
        }
      },
      [
        loginWithRedirect,
      ],
    );


  const logout =
    useCallback(
      async () => {
        await auth0Logout({
          logoutParams: {
            returnTo:
              window.location.origin,
          },
        });
      },
      [
        auth0Logout,
      ],
    );


  const getAccessToken =
    useCallback(
      async () => {
        return (
          await getAccessTokenSilently()
        );
      },
      [
        getAccessTokenSilently,
      ],
    );


  useEffect(
    () => {
      /*
       * Auth0 itself is still resolving
       * its session.
       */
      if (isAuth0Loading) {
        setAuthStatus(
          "loading",
        );

        return;
      }


      /*
       * No Auth0 session exists.
       *
       * ProtectedRoute may now start
       * the login redirect.
       */
      if (
        !isAuth0Authenticated
      ) {
        setCurrentUser(
          null,
        );

        setAuthError(
          null,
        );

        setAuthStatus(
          "unauthenticated",
        );

        return;
      }


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
          const token =
            await (
              getAccessTokenSilently()
            );


          const user =
            await fetchCurrentUser(
              token,
            );


          if (cancelled) {
            return;
          }


          setCurrentUser(
            user,
          );

          setAuthStatus(
            "authenticated",
          );

        } catch (error) {
          console.error(
            "Failed to load Casendra user:",
            error,
          );


          if (cancelled) {
            return;
          }


          setCurrentUser(
            null,
          );

          setAuthError(
            error,
          );


          /*
           * 403:
           *
           * Auth0 authentication worked,
           * but Casendra does not permit
           * this identity.
           *
           * Do NOT start another login
           * redirect.
           */
          if (
            error instanceof
              CurrentUserRequestError &&
            error.status === 403
          ) {
            setAuthStatus(
              "forbidden",
            );

            return;
          }


          /*
           * 401:
           *
           * Auth0 believes a session
           * exists, but the backend does
           * not accept the access token.
           *
           * We represent this separately
           * from forbidden access.
           *
           * ProtectedRoute will NOT
           * automatically redirect again
           * while Auth0 still has a
           * session, avoiding a loop.
           */
          if (
            error instanceof
              CurrentUserRequestError &&
            error.status === 401
          ) {
            setAuthStatus(
              "unauthenticated",
            );

            return;
          }


          /*
           * Network errors, backend 500,
           * configuration problems, etc.
           */
          setAuthStatus(
            "error",
          );
        }
      }


      loadCurrentUser();


      return () => {
        cancelled =
          true;
      };
    },
    [
      isAuth0Authenticated,
      isAuth0Loading,
      getAccessTokenSilently,
    ],
  );


  const value = {
    authStatus,

    authError,

    isAuth0Authenticated,

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
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}