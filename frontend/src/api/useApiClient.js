import { useMemo } from "react";

import { useCasendraAuth }
  from "../auth/useCasendraAuth";

import { createApiClient }
  from "./apiClient";


export function useApiClient() {
  const {
    getAccessToken,
  } = useCasendraAuth();

  return useMemo(
    () => createApiClient(getAccessToken),
    [getAccessToken]
  );
}