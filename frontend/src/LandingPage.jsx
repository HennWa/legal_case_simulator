import { Link } from "react-router-dom";
import logo from "./assets/logos/logo.png";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-logo">
          <img src={logo} alt="Casendra" />
        </div>

        <div className="hero-content">
          <h1>Legal Case Simulation</h1>
          <p>
            Your legal case simulator helps you understand your case and take
            the right decisions.
          </p>

          <div className="hero-cta">
            <span>Ready to try your case simulation?</span>
            <Link to="/app" className="get-started-button">
              Get Started
            </Link>
          </div>
        </div>

        <div className="case-graph-preview">
          <div className="preview-card card-1">State 1<br />Case opened</div>
          <div className="preview-card card-2">State 2<br />Claim reviewed</div>
          <div className="preview-card card-3">State 3<br />Deadline checked</div>
          <div className="preview-card card-4">State 4<br />Legal options</div>
        </div>
      </section>

      <section className="about-section">
        <h2>What is Casendra?</h2>
        <p>
          Casendra is an event-graph based legal case simulator that helps you
          understand possible next steps, risks, documents, deadlines and legal
          references in your case.
        </p>
      </section>

      <section className="features-section">
        <h2>What You Get?</h2>

        <div className="feature-grid">
          <Feature icon="✥" title="Case Overview" text="Visualize your legal case as a process graph with timelines and options." />
          <Feature icon="▰" title="Document Generator" text="Generate legal documents, letters and case summaries." />
          <Feature icon="▤" title="Legal Verification" text="Check states and actions against relevant legal references." />
          <Feature icon="◯" title="Case Storage" text="Store all your documents, facts, references and decisions in one place." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}