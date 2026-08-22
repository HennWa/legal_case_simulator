import { useAuth0 } from "@auth0/auth0-react";

import { AuthContext } from "./AuthContext";


export default function Auth0AuthProvider({
  children,
}) {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

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

  const value = {
    isAuthenticated,
    isLoading,
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