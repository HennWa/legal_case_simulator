import { Link } from "react-router-dom";

import logo from "./assets/logos/logo.png";
import caseGraphImage from "./assets/landing/case_graph.png";

import "./LandingPage.css";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-logo">
          <img src={logo} alt="Casendra" />
        </div>

        <div className="hero-content">
          <p className="hero-eyebrow">
            Understand your legal options
          </p>

          <h1>Legal Case Simulation</h1>

          <p className="hero-description">
            Casendra helps you understand your legal case, explore possible
            next steps and make better-informed decisions.
          </p>

          <div className="hero-cta">
            <span className="hero-cta-label">
              Ready to simulate your case?
            </span>

            <Link to="/app" className="get-started-button">
              Get Started
            </Link>
          </div>
        </div>

        <div
          className="case-graph-preview"
          aria-hidden="true"
        >
          <img
            src={caseGraphImage}
            alt=""
            className="case-graph-image"
          />
        </div>
      </section>

      <section className="about-section">
        <div className="section-content">
          <p className="section-eyebrow">The platform</p>

          <h2>What is Casendra?</h2>

          <p className="about-text">
            Casendra is a graph-based legal case simulation platform. It helps
            you visualize how a legal situation may develop, understand
            possible actions and identify relevant documents, deadlines and
            legal references.
          </p>
        </div>
      </section>

      <section className="features-section">
        <div className="section-content">
          <p className="section-eyebrow">Features</p>

          <h2>What You Get</h2>

          <div className="feature-grid">
            <Feature
              icon={<GraphIcon />}
              title="Case Overview"
              text="Visualize your legal case as a structured process graph with possible actions and outcomes."
            />

            <Feature
              icon={<DocumentIcon />}
              title="Document Generator"
              text="Create case summaries, letters and other legal documents based on your simulation."
            />

            <Feature
              icon={<VerificationIcon />}
              title="Legal Verification"
              text="Check case states and legal actions against relevant laws and legal references."
            />

            <Feature
              icon={<StorageIcon />}
              title="Case Storage"
              text="Keep your case information, documents, references and decisions together in one place."
            />
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <img src={logo} alt="Casendra" />

        <p>
          Legal case simulation for clearer decisions.
        </p>
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-icon" aria-hidden="true">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </article>
  );
}

function GraphIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
    >
      <circle cx="14" cy="32" r="7" />
      <circle cx="32" cy="14" r="7" />
      <circle cx="50" cy="32" r="7" />
      <circle cx="32" cy="50" r="7" />

      <path d="M19 27L27 19" />
      <path d="M37 19L45 27" />
      <path d="M45 37L37 45" />
      <path d="M27 45L19 37" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
    >
      <path d="M17 8H39L49 18V56H17Z" />
      <path d="M39 8V18H49" />
      <path d="M24 29H42" />
      <path d="M24 37H42" />
      <path d="M24 45H36" />
    </svg>
  );
}

function VerificationIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
    >
      <path d="M32 7L51 14V29C51 42 43 52 32 57C21 52 13 42 13 29V14Z" />
      <path d="M22 31L29 38L43 23" />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
    >
      <ellipse cx="32" cy="14" rx="20" ry="8" />
      <path d="M12 14V32C12 36 21 40 32 40C43 40 52 36 52 32V14" />
      <path d="M12 32V50C12 54 21 58 32 58C43 58 52 54 52 50V32" />
    </svg>
  );
}