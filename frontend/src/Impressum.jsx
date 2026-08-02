import { Link } from "react-router-dom";

import logo from "./assets/logos/logo.png";

export default function Impressum() {
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

        <Link to="/" style={styles.backLink}>
          Back to landing page
        </Link>
      </header>

      <section style={styles.content}>
        <p style={styles.eyebrow}>
          Legal information
        </p>

        <h1 style={styles.heading}>
          Impressum
        </h1>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            Angaben gemäß § 5 DDG
          </h2>

          <address style={styles.address}>
            Henning Wagner
            <br />
            Dantestr. 25
            <br />
            80637 Munich
            <br />
            Germany
          </address>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeading}>
            Kontakt
          </h2>

          <p style={styles.paragraph}>
            E-Mail:{" "}
            <a
              href="mailto:saif.oppspring@gmail.com"
              style={styles.emailLink}
            >
              saif.oppspring@gmail.com
            </a>
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
    borderBottom: "1px solid rgba(117, 85, 97, 0.16)",
  },

  brand: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
  },

  logo: {
    display: "block",
    width: "auto",
    height: "30px",
  },

  backLink: {
    color: "#765361",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
  },

  content: {
    width: "min(100%, 760px)",
    margin: "0 auto",
    paddingTop: "80px",
  },

  eyebrow: {
    margin: "0 0 14px",
    color: "#9b6d7e",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },

  heading: {
    margin: "0 0 58px",
    color: "#30242a",
    fontSize: "clamp(42px, 7vw, 68px)",
    fontWeight: 730,
    lineHeight: 1.05,
    letterSpacing: "-0.045em",
  },

  section: {
    marginTop: "40px",
    paddingTop: "28px",
    borderTop: "1px solid rgba(117, 85, 97, 0.16)",
  },

  sectionHeading: {
    margin: "0 0 18px",
    color: "#4c3941",
    fontSize: "18px",
    fontWeight: 700,
  },

  address: {
    color: "#62545a",
    fontSize: "15px",
    fontStyle: "normal",
    lineHeight: 1.8,
  },

  paragraph: {
    margin: 0,
    color: "#62545a",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  emailLink: {
    color: "#895d6d",
    fontWeight: 600,
    textDecoration: "none",
  },
};