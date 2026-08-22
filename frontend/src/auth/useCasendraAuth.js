import { useContext } from "react";

import { AuthContext } from "./AuthContext";


export function useCasendraAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "useCasendraAuth must be used inside an authentication provider."
    );
  }

  return context;
}