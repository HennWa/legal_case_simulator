import { lazy, Suspense } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LandingPage from "./LandingPage";
import Impressum from "./Impressum";
import PrivacyPolicy from "./PrivacyPolicy";


const LANDING_ONLY =
  import.meta.env.VITE_LANDING_ONLY === "true";


const SimulatorApp = LANDING_ONLY
  ? null
  : lazy(() => import("./SimulatorApp"));


function ProtectedSimulatorRoute() {
  if (LANDING_ONLY || !SimulatorApp) {
    return <Navigate to="/" replace />;
  }

  return <SimulatorApp />;
}


export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/impressum"
            element={<Impressum />}
          />

          <Route
              path="/privacy"
              element={<PrivacyPolicy />}
          />

          <Route
            path="/app"
            element={<ProtectedSimulatorRoute />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}