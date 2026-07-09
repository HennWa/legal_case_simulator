import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import SimulatorApp from "./SimulatorApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<SimulatorApp />} />
      </Routes>
    </BrowserRouter>
  );
}