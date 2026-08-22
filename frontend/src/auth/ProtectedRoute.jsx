import { useEffect, useRef } from "react";

import { useCasendraAuth } from "./useCasendraAuth";


export default function ProtectedRoute({
  children,
}) {
  const {
    isAuthenticated,
    isLoading,
    login,
  } = useCasendraAuth();

  const loginStartedRef = useRef(false);

  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      !loginStartedRef.current
    ) {
      loginStartedRef.current = true;
      login();
    }
  }, [
    isAuthenticated,
    isLoading,
    login,
  ]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return children;
}