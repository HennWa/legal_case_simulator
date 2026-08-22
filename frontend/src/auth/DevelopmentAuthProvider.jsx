import { AuthContext } from "./AuthContext";


export default function DevelopmentAuthProvider({
  children,
}) {
  const value = {
    isAuthenticated: true,
    isLoading: false,

    login: async () => {
      // No login necessary in development mode.
    },

    logout: async () => {
      // No logout necessary in development mode.
    },

    getAccessToken: async () => {
      // Development backend does not require an Auth0 token.
      return null;
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}