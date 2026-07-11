import { Link } from "react-router-dom";

import logo from "./assets/logos/logo.png";
import caseGraphImage from "./assets/landing/case_graph.png";

import "./LandingPage.css";

const features = [
  {
    icon: <GraphIcon />,
    number: "01",
    title: "Interactive Case Graph",
    text: "Explore legal states, possible actions and alternative outcomes in a clear visual structure.",
  },
  {
    icon: <DocumentIcon />,
    number: "02",
    title: "Documents & Evidence",
    text: "Keep contracts, correspondence, evidence and generated documents connected to the relevant case step.",
  },
  {
    icon: <VerificationIcon />,
    number: "03",
    title: "Legal Verification",
    text: "Compare actions and case states with relevant laws, requirements and legal references.",
  },
  {
    icon: <DeadlineIcon />,
    number: "04",
    title: "Deadlines & Next Steps",
    text: "Identify important deadlines and understand which actions may follow from the current situation.",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Describe the situation",
    text: "Create a case, add the involved actors and provide the relevant background information.",
  },
  {
    number: "02",
    title: "Build the legal graph",
    text: "Casendra structures the situation into legal states, actions and possible developments.",
  },
  {
    number: "03",
    title: "Explore your options",
    text: "Review alternative paths, legal references, documents, deadlines and possible outcomes.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" id="top">
        <div className="landing-hero-grid" aria-hidden="true" />

        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />

        <header className="landing-header">
          <a
            href="#top"
            className="landing-brand"
            aria-label="Casendra home"
          >
            <span className="landing-brand-logo">
              <img src={logo} alt="Casendra" />
            </span>
          </a>

          <nav className="landing-navigation" aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
          </nav>

          <Link to="/app" className="header-app-link">
            Open Application
            <ArrowIcon />
          </Link>
        </header>

        <div className="hero-layout">
          <div className="hero-content">
            <div className="hero-status">
              <span className="hero-status-dot" />
              AI-assisted legal case exploration
            </div>

            <p className="hero-eyebrow">
              Graph-based legal reasoning
            </p>

            <h1>
              See where your
              <span> legal case </span>
              could lead.
            </h1>

            <p className="hero-description">
              Casendra turns complex legal situations into an understandable
              visual process. Explore possible actions, legal requirements,
              deadlines and alternative outcomes in one connected workspace.
            </p>

            <div className="hero-actions">
              <Link to="/app" className="primary-landing-button">
                Start a Case
                <ArrowIcon />
              </Link>

              <a href="#platform" className="secondary-landing-button">
                See how it works
                <DownArrowIcon />
              </a>
            </div>

            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <CheckIcon />
                <span>Structured reasoning</span>
              </div>

              <div className="hero-trust-item">
                <CheckIcon />
                <span>Legal references</span>
              </div>

              <div className="hero-trust-item">
                <CheckIcon />
                <span>Alternative paths</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="graph-window">
              <div className="graph-window-header">
                <div className="graph-window-title">
                  <span className="graph-window-icon">
                    <GraphSmallIcon />
                  </span>

                  <div>
                    <strong>Case Simulation</strong>
                    <span>Employment law · Germany</span>
                  </div>
                </div>

                <div className="window-controls" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="graph-window-body">
                <div className="graph-grid" aria-hidden="true" />

                <img
                  src={caseGraphImage}
                  alt="Preview of a legal case graph"
                  className="case-graph-image"
                />

                <div className="graph-floating-card graph-floating-card-top">
                  <span className="floating-card-icon floating-card-icon-law">
                    §
                  </span>

                  <span>
                    <small>Legal reference</small>
                    <strong>§ 623 BGB</strong>
                  </span>
                </div>

                <div className="graph-floating-card graph-floating-card-bottom">
                  <span className="floating-card-icon">
                    <CheckIcon />
                  </span>

                  <span>
                    <small>Verification</small>
                    <strong>Legal check complete</strong>
                  </span>
                </div>

                <div
                  className="graph-pulse graph-pulse-one"
                  aria-hidden="true"
                />
                <div
                  className="graph-pulse graph-pulse-two"
                  aria-hidden="true"
                />
              </div>

              <div className="graph-window-footer">
                <div className="graph-metric">
                  <span>Case states</span>
                  <strong>08</strong>
                </div>

                <div className="graph-metric">
                  <span>Possible actions</span>
                  <strong>12</strong>
                </div>

                <div className="graph-metric">
                  <span>References</span>
                  <strong>06</strong>
                </div>
              </div>
            </div>

            <div className="hero-decorative-label hero-label-one">
              Explore alternatives
            </div>

            <div className="hero-decorative-label hero-label-two">
              Understand consequences
            </div>
          </div>
        </div>

        <div className="hero-bottom-strip">
          <span>From complex facts</span>

          <span className="hero-strip-line" />

          <strong>to a clear legal process</strong>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-content platform-layout">
          <div className="platform-heading">
            <p className="section-eyebrow">The platform</p>

            <h2>
              Legal reasoning becomes easier when you can
              <span> see the whole path.</span>
            </h2>
          </div>

          <div className="platform-copy">
            <p>
              Legal situations rarely consist of one isolated question. Each
              action can introduce new requirements, documents, deadlines and
              possible responses.
            </p>

            <p>
              Casendra connects these elements as a graph, helping you inspect
              the current state while keeping the broader development of the
              case visible.
            </p>

            <div className="platform-highlight">
              <span className="platform-highlight-icon">
                <LayersIcon />
              </span>

              <p>
                Every node represents a legal state. Every connection
                represents an action that can change the course of the case.
              </p>
            </div>
          </div>
        </div>

        <div className="section-content platform-metrics">
          <Metric
            value="One"
            label="connected case workspace"
          />

          <Metric
            value="Clear"
            label="visual decision paths"
          />

          <Metric
            value="Relevant"
            label="laws and references"
          />

          <Metric
            value="Actionable"
            label="next steps and deadlines"
          />
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-content">
          <div className="section-heading-centered">
            <p className="section-eyebrow">Built for clarity</p>

            <h2>Everything relevant to your case, connected.</h2>

            <p>
              Move between the overview and the legal details without losing
              the context of the complete case.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <Feature key={feature.number} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-content">
          <div className="workflow-heading">
            <div>
              <p className="section-eyebrow">How it works</p>

              <h2>
                From an initial situation to an explorable legal scenario.
              </h2>
            </div>

            <p>
              Casendra builds a structured representation of your case and
              helps you investigate how different decisions may affect its
              development.
            </p>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step, index) => (
              <WorkflowStep
                key={step.number}
                {...step}
                isLast={index === workflowSteps.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="landing-cta-glow" aria-hidden="true" />

        <div className="section-content landing-cta-content">
          <div>
            <p className="section-eyebrow">Start exploring</p>

            <h2>Bring structure to your legal case.</h2>

            <p>
              Create a case, map possible developments and investigate your
              legal options in one visual workspace.
            </p>
          </div>

          <Link to="/app" className="cta-large-button">
            Open Casendra
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span className="footer-logo">
            <img src={logo} alt="Casendra" />
          </span>

          <p>
            Graph-based legal case simulation for clearer decisions.
          </p>
        </div>

        <div className="landing-footer-links">
          <a href="#platform">Platform</a>
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <Link to="/app">Application</Link>
        </div>

        <p className="landing-footer-note">
          Casendra does not replace professional legal advice.
        </p>
      </footer>
    </main>
  );
}

function Metric({ value, label }) {
  return (
    <div className="platform-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Feature({ icon, number, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-card-top">
        <div className="feature-icon" aria-hidden="true">
          {icon}
        </div>

        <span className="feature-number">{number}</span>
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <span className="feature-card-line" aria-hidden="true" />
    </article>
  );
}

function WorkflowStep({ number, title, text, isLast }) {
  return (
    <article className="workflow-step">
      <div className="workflow-step-marker">
        <span>{number}</span>

        {!isLast && (
          <div className="workflow-connector" aria-hidden="true">
            <span />
          </div>
        )}
      </div>

      <div className="workflow-step-content">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      role="presentation"
      focusable="false"
    >
      <path d="M4 10H16" />
      <path d="M11 5L16 10L11 15" />
    </svg>
  );
}

function DownArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      role="presentation"
      focusable="false"
    >
      <path d="M10 3V16" />
      <path d="M5 11L10 16L15 11" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      role="presentation"
      focusable="false"
    >
      <path d="M4 10L8 14L16 6" />
    </svg>
  );
}

function GraphSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      role="presentation"
      focusable="false"
    >
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.2 10.9L15.8 7.1" />
      <path d="M8.2 13.1L15.8 16.9" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      role="presentation"
      focusable="false"
    >
      <path d="M12 3L21 8L12 13L3 8Z" />
      <path d="M3 12L12 17L21 12" />
      <path d="M3 16L12 21L21 16" />
    </svg>
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

function DeadlineIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
    >
      <rect x="11" y="15" width="42" height="39" rx="6" />
      <path d="M20 9V21" />
      <path d="M44 9V21" />
      <path d="M11 27H53" />
      <circle cx="32" cy="40" r="8" />
      <path d="M32 35V40L36 43" />
    </svg>
  );
}