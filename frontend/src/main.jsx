import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App";
import Auth0AuthProvider from "./auth/Auth0AuthProvider";
import DevelopmentAuthProvider from "./auth/DevelopmentAuthProvider";
import "./index.css";


const AUTH_MODE =
  import.meta.env.VITE_AUTH_MODE ?? "development";


function Root() {
  if (AUTH_MODE === "auth0") {
    return (
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
      >
        <Auth0AuthProvider>
          <App />
        </Auth0AuthProvider>
      </Auth0Provider>
    );
  }

  return (
    <DevelopmentAuthProvider>
      <App />
    </DevelopmentAuthProvider>
  );
}


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);