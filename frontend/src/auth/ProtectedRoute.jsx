import {
  useEffect,
  useRef,
} from "react";

import {
  useCasendraAuth,
} from "./useCasendraAuth";


export default function ProtectedRoute({
  children,
}) {
  const {
    authStatus,
    isAuth0Authenticated,
    login,
    logout,
  } = useCasendraAuth();


  const loginStartedRef =
    useRef(false);


  useEffect(
    () => {
      /*
       * Automatically start Auth0 login
       * only when there genuinely is no
       * Auth0 session.
       *
       * If Auth0 already has a session
       * but /auth/me returned 401,
       * automatically redirecting again
       * could create a loop.
       */
      if (
        authStatus ===
          "unauthenticated" &&
        !isAuth0Authenticated &&
        !loginStartedRef.current
      ) {
        loginStartedRef.current =
          true;

        login();
      }
    },
    [
      authStatus,
      isAuth0Authenticated,
      login,
    ],
  );


  if (
    authStatus ===
    "loading"
  ) {
    return (
      <div>
        Loading...
      </div>
    );
  }


  if (
    authStatus ===
    "forbidden"
  ) {
    return (
      <AccessDenied
        onLogout={
          logout
        }
      />
    );
  }


  if (
    authStatus ===
      "unauthenticated" &&
    isAuth0Authenticated
  ) {
    return (
      <AuthenticationProblem
        onLogout={
          logout
        }
      />
    );
  }


  if (
    authStatus ===
    "unauthenticated"
  ) {
    return (
      <div>
        Redirecting to login...
      </div>
    );
  }


  if (
    authStatus ===
    "error"
  ) {
    return (
      <AuthenticationError
        onLogout={
          logout
        }
      />
    );
  }


  if (
    authStatus !==
    "authenticated"
  ) {
    return null;
  }


  return children;
}


function AccessDenied({
  onLogout,
}) {
  return (
    <main
      style={
        styles.page
      }
    >
      <section
        style={
          styles.card
        }
      >
        <div
          style={
            styles.badge
          }
        >
          Access denied
        </div>

        <h1
          style={
            styles.title
          }
        >
          Casendra access is
          not enabled
        </h1>

        <p
          style={
            styles.text
          }
        >
          Your identity was
          authenticated successfully,
          but this account does not
          currently have access to
          Casendra.
        </p>

        <button
          type="button"
          style={
            styles.button
          }
          onClick={
            onLogout
          }
        >
          Sign out
        </button>
      </section>
    </main>
  );
}


function AuthenticationProblem({
  onLogout,
}) {
  return (
    <main
      style={
        styles.page
      }
    >
      <section
        style={
          styles.card
        }
      >
        <div
          style={
            styles.badge
          }
        >
          Authentication required
        </div>

        <h1
          style={
            styles.title
          }
        >
          Your session could
          not be verified
        </h1>

        <p
          style={
            styles.text
          }
        >
          Auth0 has an active
          session, but Casendra
          could not validate the
          access token.
        </p>

        <button
          type="button"
          style={
            styles.button
          }
          onClick={
            onLogout
          }
        >
          Sign out and try again
        </button>
      </section>
    </main>
  );
}


function AuthenticationError({
  onLogout,
}) {
  return (
    <main
      style={
        styles.page
      }
    >
      <section
        style={
          styles.card
        }
      >
        <div
          style={
            styles.badge
          }
        >
          Authentication error
        </div>

        <h1
          style={
            styles.title
          }
        >
          Casendra could not
          verify your account
        </h1>

        <p
          style={
            styles.text
          }
        >
          An unexpected error
          occurred while loading
          your account.
        </p>

        <button
          type="button"
          style={
            styles.button
          }
          onClick={
            onLogout
          }
        >
          Sign out
        </button>
      </section>
    </main>
  );
}


const styles = {
  page: {
    minHeight:
      "100vh",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "32px",

    background:
      "#140d10",

    color:
      "#f7eef1",
  },

  card: {
    width:
      "min(520px, 100%)",

    padding:
      "36px",

    border:
      (
        "1px solid "
        + "rgba(192, 132, 151, 0.35)"
      ),

    borderRadius:
      "18px",

    background:
      "#1d1317",

    boxShadow:
      (
        "0 24px 60px "
        + "rgba(0, 0, 0, 0.35)"
      ),
  },

  badge: {
    display:
      "inline-block",

    marginBottom:
      "16px",

    fontSize:
      "13px",

    fontWeight:
      700,

    color:
      "#dba6b5",

    textTransform:
      "uppercase",

    letterSpacing:
      "0.08em",
  },

  title: {
    margin:
      "0 0 14px",

    fontSize:
      "30px",

    lineHeight:
      1.15,
  },

  text: {
    margin:
      "0 0 26px",

    color:
      "#cdbec3",

    lineHeight:
      1.6,
  },

  button: {
    border:
      "none",

    borderRadius:
      "10px",

    padding:
      "11px 18px",

    fontWeight:
      700,

    cursor:
      "pointer",

    background:
      "#c08497",

    color:
      "#140d10",
  },
};