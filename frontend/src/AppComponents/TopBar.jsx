import {
  useEffect,
  useRef,
  useState,
} from "react";

import logo from "../assets/logos/logo.png";

import {
  useCasendraAuth,
} from "../auth/useCasendraAuth";

import {
  fetchCurrentUser,
} from "../api/auth";


export default function TopBar({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateCase,
  activeTab,
  onTabChange,
}) {
  /*
   * =======================================================
   * AUTH
   * =======================================================
   */

  const {
    currentUser,
    logout,
    getAccessToken,
  } = useCasendraAuth();


  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const [
    caseDropdownOpen,
    setCaseDropdownOpen,
  ] = useState(false);


  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);


  const [
    profileUser,
    setProfileUser,
  ] = useState(
    currentUser
  );


  const [
    profileUsageLoading,
    setProfileUsageLoading,
  ] = useState(false);


  /*
   * =======================================================
   * REFS
   * =======================================================
   */

  const caseDropdownRef =
    useRef(null);


  const profileDropdownRef =
    useRef(null);


  /*
   * =======================================================
   * SELECTED CASE
   * =======================================================
   */

  const selectedCase =
    cases.find(
      (currentCase) =>
        currentCase.id === selectedCaseId
    ) ?? null;


  /*
   * =======================================================
   * KEEP PROFILE USER IN SYNC
   * =======================================================
   */

  useEffect(
    () => {
      setProfileUser(
        currentUser
      );
    },
    [
      currentUser,
    ],
  );


  /*
   * =======================================================
   * CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
   * =======================================================
   */

  useEffect(() => {
    function handleClickOutside(
      event
    ) {
      /*
       * Case selector
       */
      if (
        caseDropdownRef.current &&
        !caseDropdownRef.current.contains(
          event.target
        )
      ) {
        setCaseDropdownOpen(
          false
        );
      }


      /*
       * Profile menu
       */
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(
          event.target
        )
      ) {
        setProfileMenuOpen(
          false
        );
      }
    }


    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setCaseDropdownOpen(
          false
        );

        setProfileMenuOpen(
          false
        );
      }
    }


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );


      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  /*
   * =======================================================
   * TABS
   * =======================================================
   */

  const tabs = [
    {
      id: "graph",
      label: "Graph",
    },
    {
      id: "documents",
      label: "Documents",
    },
    {
      id: "actors",
      label: "Actors",
    },
  ];


  /*
   * =======================================================
   * PROFILE MENU
   * =======================================================
   */

  const handleProfileMenuClick =
    async () => {
      const willOpen =
        !profileMenuOpen;

      setProfileMenuOpen(
        willOpen
      );


      /*
       * Only one TopBar dropdown
       * should be open at a time.
       */
      setCaseDropdownOpen(
        false
      );


      /*
       * Nothing else to do when
       * closing the profile menu.
       */
      if (!willOpen) {
        return;
      }


      /*
       * Refresh /auth/me whenever
       * the profile menu opens.
       *
       * This ensures that the node
       * usage reflects nodes created
       * during the current session.
       */
      setProfileUsageLoading(
        true
      );


      try {
        const accessToken =
          await getAccessToken();


        const refreshedUser =
          await fetchCurrentUser(
            accessToken
          );


        setProfileUser(
          refreshedUser
        );

      } catch (error) {
        /*
         * Keep the previously loaded
         * user data visible if refreshing
         * the usage information fails.
         */
        console.error(
          "Failed to refresh profile usage:",
          error
        );

      } finally {
        setProfileUsageLoading(
          false
        );
      }
    };


  /*
   * =======================================================
   * NODE USAGE
   * =======================================================
   */

  const nodesCreated =
    profileUser?.nodes_created ?? 0;


  const nodeLimit =
    profileUser?.node_limit ?? null;


  const nodeUsagePercentage =
    nodeLimit !== null
      ? (
        Math.min(
          100,
          Math.max(
            0,
            (
              nodesCreated
              /
              Math.max(
                nodeLimit,
                1
              )
            )
            * 100
          )
        )
      )
      : 0;


  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  const handleLogout =
    async () => {
      /*
       * Close the menu before Auth0
       * redirects the browser.
       */
      setProfileMenuOpen(
        false
      );


      try {
        await logout();

      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      }
    };


  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <header
      style={{
        flexShrink: 0,
        height: 56,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",

        background:
          "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",

        borderBottom:
          "1px solid rgba(192,132,151,0.25)",

        position: "relative",
        zIndex: 2000,
      }}
    >
      {/*
       * ===================================================
       * LEFT
       * ===================================================
       */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 0,
        }}
      >
        <img
          src={logo}
          alt="Casendra"
          style={{
            flexShrink: 0,
            height: 28,
            width: "auto",
          }}
        />


        {/*
         * =================================================
         * CASE SELECTOR
         * =================================================
         */}

        <div
          ref={
            caseDropdownRef
          }
          style={{
            position: "relative",
            width: 280,
            flexShrink: 0,
          }}
        >
          <button
            type="button"

            onClick={() => {
              setCaseDropdownOpen(
                (
                  current
                ) => !current
              );

              /*
               * Only one TopBar dropdown
               * should be open at a time.
               */
              setProfileMenuOpen(
                false
              );
            }}

            aria-haspopup="menu"

            aria-expanded={
              caseDropdownOpen
            }

            style={{
              width: "100%",
              minHeight: 34,

              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,

              background:
                "rgba(192,132,151,0.12)",

              border:
                "1px solid rgba(192,132,151,0.35)",

              color: "#f4ecee",

              borderRadius: 8,

              padding:
                "7px 12px",

              cursor: "pointer",

              fontSize: 13,
            }}
          >
            <span
              style={{
                minWidth: 0,

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

                whiteSpace:
                  "nowrap",
              }}
            >
              {
                selectedCase
                  ? selectedCase.title
                  : "Select case"
              }
            </span>


            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                opacity: 0.8,
              }}
            >
              {
                caseDropdownOpen
                  ? "▲"
                  : "▼"
              }
            </span>
          </button>


          {
            caseDropdownOpen &&
            (
              <div
                role="menu"

                style={{
                  position:
                    "absolute",

                  top:
                    "calc(100% + 7px)",

                  left: 0,

                  width: "100%",

                  maxHeight:
                    360,

                  overflowY:
                    "auto",

                  background:
                    "#20161a",

                  border:
                    "1px solid rgba(192,132,151,0.35)",

                  borderRadius:
                    8,

                  zIndex:
                    3000,

                  boxShadow:
                    "0 8px 20px rgba(0,0,0,.35)",
                }}
              >
                {
                  cases.length === 0
                    ? (
                      <div
                        style={{
                          padding:
                            "12px",

                          color:
                            "rgba(244,236,238,0.55)",

                          fontSize:
                            12,
                        }}
                      >
                        No cases available
                      </div>
                    )
                    : (
                      cases.map(
                        (
                          currentCase
                        ) => (
                          <button
                            type="button"

                            role="menuitem"

                            key={
                              currentCase.id
                            }

                            onClick={() => {
                              onSelectCase(
                                currentCase.id
                              );

                              setCaseDropdownOpen(
                                false
                              );
                            }}

                            style={{
                              width:
                                "100%",

                              display:
                                "block",

                              padding:
                                "10px 12px",

                              border:
                                "none",

                              background:
                                currentCase.id ===
                                selectedCaseId
                                  ? "rgba(192,132,151,.12)"
                                  : "transparent",

                              color:
                                currentCase.id ===
                                selectedCaseId
                                  ? "#c08497"
                                  : "#f4ecee",

                              fontFamily:
                                "inherit",

                              fontSize:
                                13,

                              textAlign:
                                "left",

                              cursor:
                                "pointer",

                              transition:
                                "background .15s",
                            }}

                            onMouseEnter={(
                              event
                            ) => {
                              event
                                .currentTarget
                                .style
                                .background =
                                  "rgba(192,132,151,.15)";
                            }}

                            onMouseLeave={(
                              event
                            ) => {
                              event
                                .currentTarget
                                .style
                                .background =
                                  currentCase.id ===
                                  selectedCaseId
                                    ? "rgba(192,132,151,.12)"
                                    : "transparent";
                            }}
                          >
                            {
                              currentCase.title
                            }
                          </button>
                        )
                      )
                    )
                }


                <div
                  style={{
                    borderTop:
                      "1px solid rgba(192,132,151,0.25)",
                  }}
                />


                <button
                  type="button"

                  role="menuitem"

                  onClick={() => {
                    setCaseDropdownOpen(
                      false
                    );

                    onCreateCase();
                  }}

                  style={{
                    width: "100%",

                    display:
                      "block",

                    padding:
                      "10px 12px",

                    border:
                      "none",

                    background:
                      "transparent",

                    color:
                      "#c08497",

                    fontFamily:
                      "inherit",

                    fontSize:
                      13,

                    fontWeight:
                      600,

                    textAlign:
                      "left",

                    cursor:
                      "pointer",
                  }}

                  onMouseEnter={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "rgba(192,132,151,.15)";
                  }}

                  onMouseLeave={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "transparent";
                  }}
                >
                  + New Case
                </button>
              </div>
            )
          }
        </div>
      </div>


      {/*
       * ===================================================
       * CENTER TABS
       * ===================================================
       */}

      <nav
        aria-label="Case sections"

        style={{
          position:
            "absolute",

          left:
            "50%",

          top:
            0,

          bottom:
            0,

          transform:
            "translateX(-50%)",

          display:
            "flex",

          alignItems:
            "stretch",

          gap:
            4,
        }}
      >
        {
          tabs.map(
            (
              tab
            ) => {
              const isActive =
                activeTab ===
                tab.id;


              return (
                <button
                  type="button"

                  key={
                    tab.id
                  }

                  onClick={() =>
                    onTabChange(
                      tab.id
                    )
                  }

                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }

                  style={{
                    position:
                      "relative",

                    minWidth:
                      92,

                    padding:
                      "0 16px",

                    border:
                      "none",

                    background:
                      isActive
                        ? "rgba(192,132,151,0.11)"
                        : "transparent",

                    color:
                      isActive
                        ? "#f3dce4"
                        : "rgba(244,236,238,0.62)",

                    fontFamily:
                      "inherit",

                    fontSize:
                      12,

                    fontWeight:
                      isActive
                        ? 650
                        : 500,

                    cursor:
                      "pointer",

                    transition:
                      "background 150ms ease, color 150ms ease",
                  }}

                  onMouseEnter={(
                    event
                  ) => {
                    if (
                      !isActive
                    ) {
                      event
                        .currentTarget
                        .style
                        .background =
                          "rgba(192,132,151,0.07)";

                      event
                        .currentTarget
                        .style
                        .color =
                          "#f4ecee";
                    }
                  }}

                  onMouseLeave={(
                    event
                  ) => {
                    if (
                      !isActive
                    ) {
                      event
                        .currentTarget
                        .style
                        .background =
                          "transparent";

                      event
                        .currentTarget
                        .style
                        .color =
                          "rgba(244,236,238,0.62)";
                    }
                  }}
                >
                  {
                    tab.label
                  }


                  {
                    isActive &&
                    (
                      <span
                        style={{
                          position:
                            "absolute",

                          left:
                            14,

                          right:
                            14,

                          bottom:
                            0,

                          height:
                            2,

                          borderRadius:
                            "2px 2px 0 0",

                          background:
                            "#c08497",
                        }}
                      />
                    )
                  }
                </button>
              );
            }
          )
        }
      </nav>


      {/*
       * ===================================================
       * RIGHT
       * ===================================================
       */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            10,
        }}
      >
        <button
          type="button"
          style={
            buttonStyle
          }
        >
          Share with Your Lawyer
        </button>


        {/*
         * =================================================
         * PROFILE DROPDOWN
         * =================================================
         */}

        <div
          ref={
            profileDropdownRef
          }

          style={{
            position:
              "relative",
          }}
        >
          <button
            type="button"

            aria-haspopup="menu"

            aria-expanded={
              profileMenuOpen
            }

            onClick={
              handleProfileMenuClick
            }

            style={{
              ...buttonStyle,

              display:
                "flex",

              alignItems:
                "center",

              gap:
                7,
            }}
          >
            <ProfileIcon />

            <span>
              Profile
            </span>

            <span
              style={{
                fontSize:
                  8,

                opacity:
                  0.7,

                marginLeft:
                  1,
              }}
            >
              {
                profileMenuOpen
                  ? "▲"
                  : "▼"
              }
            </span>
          </button>


          {
            profileMenuOpen &&
            (
              <div
                role="menu"

                style={{
                  position:
                    "absolute",

                  top:
                    "calc(100% + 7px)",

                  right:
                    0,

                  width:
                    230,

                  background:
                    "#20161a",

                  border:
                    "1px solid rgba(192,132,151,0.35)",

                  borderRadius:
                    8,

                  overflow:
                    "hidden",

                  zIndex:
                    3000,

                  boxShadow:
                    "0 8px 24px rgba(0,0,0,.4)",
                }}
              >
                {/*
                 * NODE USAGE
                 */}

                <div
                  style={{
                    padding:
                      "12px 14px",

                    background:
                      "rgba(192,132,151,0.055)",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "space-between",

                      gap:
                        12,
                    }}
                  >
                    <span
                      style={{
                        color:
                          "rgba(244,236,238,0.58)",

                        fontSize:
                          11,

                        fontWeight:
                          500,
                      }}
                    >
                      Node usage
                    </span>


                    {
                      profileUsageLoading
                        ? (
                          <span
                            style={{
                              color:
                                "rgba(244,236,238,0.45)",

                              fontSize:
                                11,
                            }}
                          >
                            Updating...
                          </span>
                        )
                        : (
                          <span
                            style={{
                              color:
                                "#f3dce4",

                              fontSize:
                                11,

                              fontWeight:
                                650,

                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              profileUser
                                ? (
                                  nodeLimit ===
                                    null
                                    ? (
                                      `${nodesCreated} nodes used`
                                    )
                                    : (
                                      `${nodesCreated} of ${nodeLimit} nodes used`
                                    )
                                )
                                : "—"
                            }
                          </span>
                        )
                    }
                  </div>


                  {
                    profileUser &&
                    nodeLimit !==
                      null &&
                    (
                      <div
                        style={{
                          width:
                            "100%",

                          height:
                            4,

                          marginTop:
                            9,

                          overflow:
                            "hidden",

                          borderRadius:
                            999,

                          background:
                            "rgba(192,132,151,0.14)",
                        }}
                      >
                        <div
                          style={{
                            width:
                              `${nodeUsagePercentage}%`,

                            height:
                              "100%",

                            borderRadius:
                              999,

                            background:
                              "#c08497",

                            transition:
                              "width 180ms ease",
                          }}
                        />
                      </div>
                    )
                  }


                  {
                    profileUser &&
                    nodeLimit ===
                      null &&
                    (
                      <div
                        style={{
                          marginTop:
                            5,

                          color:
                            "rgba(244,236,238,0.40)",

                          fontSize:
                            10,
                        }}
                      >
                        Unlimited
                      </div>
                    )
                  }
                </div>


                {/*
                 * SEPARATOR
                 */}

                <div
                  style={{
                    height:
                      1,

                    background:
                      "rgba(192,132,151,0.20)",

                    margin:
                      "0 10px",
                  }}
                />


                {/*
                 * SETTINGS
                 *
                 * Placeholder only.
                 * Intentionally has no action yet.
                 */}

                <button
                  type="button"

                  role="menuitem"

                  onClick={() => {
                    /*
                     * Settings intentionally
                     * not implemented yet.
                     */
                  }}

                  style={
                    profileMenuItemStyle
                  }

                  onMouseEnter={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "rgba(192,132,151,.12)";
                  }}

                  onMouseLeave={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "transparent";
                  }}
                >
                  <SettingsIcon />

                  <span>
                    Settings
                  </span>
                </button>


                {/*
                 * SEPARATOR
                 */}

                <div
                  style={{
                    height:
                      1,

                    background:
                      "rgba(192,132,151,0.20)",

                    margin:
                      "0 10px",
                  }}
                />


                {/*
                 * LOGOUT
                 */}

                <button
                  type="button"

                  role="menuitem"

                  onClick={
                    handleLogout
                  }

                  style={{
                    ...profileMenuItemStyle,

                    color:
                      "#e2a1b3",
                  }}

                  onMouseEnter={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "rgba(192,132,151,.12)";
                  }}

                  onMouseLeave={(
                    event
                  ) => {
                    event
                      .currentTarget
                      .style
                      .background =
                        "transparent";
                  }}
                >
                  <LogoutIcon />

                  <span>
                    Logout
                  </span>
                </button>
              </div>
            )
          }
        </div>
      </div>
    </header>
  );
}


/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const buttonStyle = {
  minHeight:
    32,

  background:
    "rgba(192,132,151,0.12)",

  border:
    "1px solid rgba(192,132,151,0.35)",

  color:
    "#f4ecee",

  padding:
    "6px 10px",

  borderRadius:
    8,

  fontFamily:
    "inherit",

  fontSize:
    12,

  cursor:
    "pointer",
};


const profileMenuItemStyle = {
  width:
    "100%",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    10,

  padding:
    "11px 13px",

  border:
    "none",

  background:
    "transparent",

  color:
    "#f4ecee",

  fontFamily:
    "inherit",

  fontSize:
    13,

  textAlign:
    "left",

  cursor:
    "pointer",

  transition:
    "background 150ms ease",
};


/*
 * =========================================================
 * ICONS
 * =========================================================
 *
 * Inline SVGs avoid introducing another
 * frontend dependency just for three small icons.
 */

function ProfileIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path
        d="M4.5 20c.8-4 3.2-6 7.5-6s6.7 2 7.5 6"
      />
    </svg>
  );
}


function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path
        d="
          M19.4 15
          a1.7 1.7 0 0 0 .34 1.88
          l.06.06
          a2 2 0 1 1-2.83 2.83
          l-.06-.06
          A1.7 1.7 0 0 0 15 19.4
          a1.7 1.7 0 0 0-1 .6
          1.7 1.7 0 0 0-.4 1.1
          V21.2
          a2 2 0 1 1-4 0
          v-.09
          A1.7 1.7 0 0 0 8.6 19.5
          a1.7 1.7 0 0 0-1.88.34
          l-.06.06
          a2 2 0 1 1-2.83-2.83
          l.06-.06
          A1.7 1.7 0 0 0 4.2 15
          a1.7 1.7 0 0 0-.6-1
          1.7 1.7 0 0 0-1.1-.4
          H2.4
          a2 2 0 1 1 0-4
          h.09
          A1.7 1.7 0 0 0 4.1 8.6
          a1.7 1.7 0 0 0-.34-1.88
          l-.06-.06
          a2 2 0 1 1 2.83-2.83
          l.06.06
          A1.7 1.7 0 0 0 8.5 4.2
          a1.7 1.7 0 0 0 1-.6
          1.7 1.7 0 0 0 .4-1.1
          V2.4
          a2 2 0 1 1 4 0
          v.09
          A1.7 1.7 0 0 0 15 4.1
          a1.7 1.7 0 0 0 1.88-.34
          l.06-.06
          a2 2 0 1 1 2.83 2.83
          l-.06.06
          A1.7 1.7 0 0 0 19.4 8.5
          a1.7 1.7 0 0 0 .6 1
          1.7 1.7 0 0 0 1.1.4
          h.09
          a2 2 0 1 1 0 4
          h-.09
          A1.7 1.7 0 0 0 19.4 15
          Z
        "
      />
    </svg>
  );
}


function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      />

      <path
        d="M16 17l5-5-5-5"
      />

      <path
        d="M21 12H9"
      />
    </svg>
  );
}