import React from "react";
import ReactDOM from "react-dom/client";
import {
  Auth0Provider,
} from "@auth0/auth0-react";

import App from "./App";

import Auth0AuthProvider
  from "./auth/Auth0AuthProvider";

import DevelopmentAuthProvider
  from "./auth/DevelopmentAuthProvider";

import "./index.css";


const AUTH_MODE =
  import.meta.env.VITE_AUTH_MODE;


function validateAuthConfiguration() {
  if (
    AUTH_MODE !== "development" &&
    AUTH_MODE !== "auth0"
  ) {
    throw new Error(
      "Invalid VITE_AUTH_MODE. " +
      "Expected 'development' or 'auth0'."
    );
  }


  /*
   * Vite sets import.meta.env.PROD=true
   * for production builds.
   *
   * Development authentication must never
   * be used in such a build.
   */
  if (
    import.meta.env.PROD &&
    AUTH_MODE !== "auth0"
  ) {
    throw new Error(
      "Production frontend builds must " +
      "use VITE_AUTH_MODE=auth0."
    );
  }


  if (AUTH_MODE === "auth0") {
    const requiredVariables = [
      "VITE_AUTH0_DOMAIN",
      "VITE_AUTH0_CLIENT_ID",
      "VITE_AUTH0_AUDIENCE",
    ];

    for (
      const variableName
      of requiredVariables
    ) {
      if (
        !import.meta.env[
          variableName
        ]
      ) {
        throw new Error(
          `${variableName} is required ` +
          "when VITE_AUTH_MODE=auth0."
        );
      }
    }
  }
}


validateAuthConfiguration();


function Root() {
  if (
    AUTH_MODE === "development"
  ) {
    return (
      <DevelopmentAuthProvider>
        <App />
      </DevelopmentAuthProvider>
    );
  }


  const handleRedirectCallback =
    (appState) => {
      const returnTo =
        appState?.returnTo ?? "/";

      window.history.replaceState(
        {},
        document.title,
        returnTo
      );
    };


  return (
    <Auth0Provider
      domain={
        import.meta.env
          .VITE_AUTH0_DOMAIN
      }
      clientId={
        import.meta.env
          .VITE_AUTH0_CLIENT_ID
      }
      authorizationParams={{
        redirect_uri:
          window.location.origin,

        audience:
          import.meta.env
            .VITE_AUTH0_AUDIENCE,
      }}
      onRedirectCallback={
        handleRedirectCallback
      }
    >
      <Auth0AuthProvider>
        <App />
      </Auth0AuthProvider>
    </Auth0Provider>
  );
}


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);