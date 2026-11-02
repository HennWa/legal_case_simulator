
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
import ProtectedRoute from "./auth/ProtectedRoute";

import "./MobileLandscape.css";


const LANDING_ONLY =
  import.meta.env.VITE_LANDING_ONLY === "true";


const SimulatorApp = LANDING_ONLY
  ? null
  : lazy(() => import("./SimulatorApp"));


/*
 * =========================================================
 * MOBILE LANDSCAPE NOTICE
 * =========================================================
 */

function RotateDeviceNotice() {
  return (
    <div
      className="casendra-rotate-notice"
      role="status"
      aria-live="polite"
    >
      <div className="casendra-rotate-notice__content">
        <div
          className="casendra-rotate-notice__phone"
          aria-hidden="true"
        >
          <span className="casendra-rotate-notice__phone-screen" />
        </div>

        <h1>Please rotate your phone</h1>

        <p>
          Casendra's case simulator is designed for
          landscape viewing on small screens.
        </p>
      </div>
    </div>
  );
}


/*
 * =========================================================
 * SIMULATOR ROUTE
 * =========================================================
 */

function SimulatorRoute() {
  if (LANDING_ONLY || !SimulatorApp) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute>
      <RotateDeviceNotice />
      <SimulatorApp />
    </ProtectedRoute>
  );
}


/*
 * =========================================================
 * MAIN APPLICATION
 * =========================================================
 */

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
            element={<SimulatorRoute />}
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
