import { Link } from "react-router-dom";

import logo from "./assets/logos/logo.png";

export default function PrivacyPolicy() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <Link
          to="/"
          style={styles.brand}
          aria-label="Back to Casendra landing page"
        >
          <img
            src={logo}
            alt="Casendra"
            style={styles.logo}
          />
        </Link>

        <Link
          to="/"
          style={styles.backLink}
        >
          Back to landing page
        </Link>
      </header>

      <section style={styles.content}>
        <p style={styles.eyebrow}>
          Privacy
        </p>

        <h1 style={styles.heading}>
          Privacy Policy
        </h1>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            1. Controller
          </h2>

          <p style={styles.paragraph}>
            The controller responsible for processing personal data on this
            website is:
          </p>

          <address style={styles.address}>
            Henning Wagner
            <br />
            Dantestr. 25
            <br />
            80637 Munich
            <br />
            Germany
            <br />
            <br />
            E-Mail:
            <br />
            <a
              href="mailto:saif.oppspring@gmail.com"
              style={styles.emailLink}
            >
              saif.oppspring@gmail.com
            </a>
          </address>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            2. Hosting
          </h2>

          <p style={styles.paragraph}>
            This website is hosted by Vercel. When visiting this website,
            technical information such as your IP address, browser type,
            operating system, date and time of access, and requested pages may
            be processed by the hosting provider to ensure the secure and stable
            operation of the website.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            3. Cookies
          </h2>

          <p style={styles.paragraph}>
            This website does not use analytics, marketing or tracking cookies.
            Only technically necessary functionality may be used to provide the
            website.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            4. Purpose of Processing
          </h2>

          <p style={styles.paragraph}>
            Personal data is processed solely to provide the website securely,
            maintain its functionality and protect it against misuse.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            5. Legal Basis
          </h2>

          <p style={styles.paragraph}>
            Processing is based on Art. 6(1)(f) GDPR (legitimate interest in
            operating a secure and reliable website).
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            6. Your Rights
          </h2>

          <p style={styles.paragraph}>
            Under the GDPR you have the right to request information about your
            personal data, request correction or deletion, restrict processing,
            object to processing where applicable, and lodge a complaint with
            your competent supervisory authority.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            7. Changes
          </h2>

          <p style={styles.paragraph}>
            This privacy policy may be updated whenever the functionality of the
            website changes or additional services are introduced.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "0 24px 80px",
    background:
      "linear-gradient(180deg, #f8f4f5 0%, #ede8ea 100%)",
    color: "#30242a",
    fontFamily: "inherit",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "min(100%, 1100px)",
    minHeight: "82px",
    margin: "0 auto",
    borderBottom: "1px solid rgba(117,85,97,.16)",
  },

  brand: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
  },

  logo: {
    height: "30px",
  },

  backLink: {
    color: "#765361",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "13px",
  },

  content: {
    width: "min(100%,760px)",
    margin: "0 auto",
    paddingTop: "80px",
  },

  eyebrow: {
    color: "#9b6d7e",
    fontWeight: 700,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    fontSize: "11px",
    marginBottom: "14px",
  },

  heading: {
    fontSize: "clamp(42px,7vw,68px)",
    marginBottom: "60px",
    lineHeight: 1.05,
  },

  section: {
    borderTop: "1px solid rgba(117,85,97,.16)",
    paddingTop: "28px",
    marginTop: "40px",
  },

  sectionHeading: {
    marginBottom: "18px",
  },

  paragraph: {
    lineHeight: 1.8,
    color: "#62545a",
  },

  address: {
    fontStyle: "normal",
    lineHeight: 1.8,
    color: "#62545a",
  },

  emailLink: {
    color: "#895d6d",
    textDecoration: "none",
  },
};