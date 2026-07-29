import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./Sidebar.css";


const PROFILE_FIELDS = [
  {
    key: "cooperativeness",
    label: "Cooperation",
  },
  {
    key: "assertiveness",
    label: "Assertiveness",
  },
  {
    key: "trust_in_opponent",
    label: "Trust",
  },
  {
    key: "flexibility",
    label: "Flexibility",
  },
  {
    key: "emotionality",
    label: "Emotionality",
  },
  {
    key: "current_goal_satisfaction",
    label: "Goal satisfaction",
  },
];


export default function Sidebar({ selectedNode }) {
  const [
    selectedActorId,
    setSelectedActorId,
  ] = useState(null);

  const actorProfiles = useMemo(
    () =>
      Array.isArray(
        selectedNode?.actor_negotiation_profiles
      )
        ? selectedNode.actor_negotiation_profiles
        : [],
    [selectedNode]
  );

  useEffect(() => {
    if (actorProfiles.length === 0) {
      setSelectedActorId(null);
      return;
    }

    const currentSelectionStillExists =
      actorProfiles.some(
        (actorProfile) =>
          actorProfile.actor_id ===
          selectedActorId
      );

    if (!currentSelectionStillExists) {
      setSelectedActorId(
        actorProfiles[0].actor_id
      );
    }
  }, [
    actorProfiles,
    selectedActorId,
  ]);

  const selectedActorProfile =
    useMemo(
      () =>
        actorProfiles.find(
          (actorProfile) =>
            actorProfile.actor_id ===
            selectedActorId
        ) ??
        actorProfiles[0] ??
        null,
      [
        actorProfiles,
        selectedActorId,
      ]
    );

  const radarData = useMemo(() => {
    const profile =
      selectedActorProfile
        ?.negotiation_profile;

    if (!profile) {
      return [];
    }

    return PROFILE_FIELDS.map(
      ({ key, label }) => ({
        characteristic: label,
        value: clampProfileValue(
          profile[key]
        ),
        fullMark: 100,
      })
    );
  }, [selectedActorProfile]);

  const actorData = useMemo(
    () =>
      Object.entries(
        selectedNode?.financial_info ??
          selectedNode?.payment_info ??
          {}
      ).map(
        ([
          actorName,
          financialInfo,
        ]) => {
          const expenses =
            financialInfo?.expenses ?? [];

          const income =
            financialInfo?.income ?? [];

          const totalExpenses =
            financialInfo?.total_expenses ??
            expenses.reduce(
              (sum, expense) =>
                sum +
                (Number(
                  expense?.amount
                ) || 0),
              0
            );

          const totalIncome =
            financialInfo?.total_income ??
            income.reduce(
              (sum, incomeItem) =>
                sum +
                (Number(
                  incomeItem?.amount
                ) || 0),
              0
            );

          return {
            name: actorName,
            expenses:
              Number(totalExpenses) || 0,
            income:
              Number(totalIncome) || 0,
          };
        }
      ),
    [selectedNode]
  );

  const timeline = useMemo(
    () =>
      Object.entries(
        selectedNode?.state_periods ??
          {}
      )
        .map(([state, range]) => {
          const start = new Date(
            range?.start
          ).getTime();

          const end = new Date(
            range?.end
          ).getTime();

          return {
            state,
            start,
            end,
            duration: end - start,
          };
        })
        .filter(
          (item) =>
            Number.isFinite(
              item.start
            ) &&
            Number.isFinite(
              item.end
            ) &&
            item.end >= item.start
        )
        .sort(
          (firstItem, secondItem) =>
            firstItem.start -
            secondItem.start
        ),
    [selectedNode]
  );

  const {
    minTime,
    totalDuration,
  } = useMemo(() => {
    if (timeline.length === 0) {
      return {
        minTime: 0,
        totalDuration: 0,
      };
    }

    const starts = timeline.map(
      (item) => item.start
    );

    const ends = timeline.map(
      (item) => item.end
    );

    const earliestStart =
      Math.min(...starts);

    const latestEnd =
      Math.max(...ends);

    return {
      minTime: earliestStart,
      totalDuration:
        latestEnd - earliestStart,
    };
  }, [timeline]);

  return (
    <div className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__eyebrow">
          Legal analytics
        </div>

        <h2 className="sidebar__title">
          Case overview
        </h2>

        <p className="sidebar__subtitle">
          Current node and selected path
        </p>
      </header>

            <SidebarSection
        title="Procedural timeline"
        subtitle="Selected path"
        className="sidebar__section--timeline"
      >
        {!selectedNode ? (
          <EmptyState>
            Click a node to view its
            procedural timeline.
          </EmptyState>
        ) : timeline.length === 0 ? (
          <EmptyState>
            No timeline data is available
            for this path.
          </EmptyState>
        ) : (
          <div className="sidebar__timeline">
            {timeline.map(
              (
                timelineItem,
                index
              ) => {
                const offset =
                  totalDuration > 0
                    ? ((timelineItem.start -
                        minTime) /
                        totalDuration) *
                      100
                    : 0;

                const width =
                  totalDuration > 0
                    ? (timelineItem.duration /
                        totalDuration) *
                      100
                    : 100;

                return (
                  <div
                    key={`${timelineItem.state}-${index}`}
                    className="sidebar__timeline-item"
                  >
                    <div className="sidebar__timeline-name">
                      {
                        timelineItem.state
                      }
                    </div>

                    <div className="sidebar__timeline-track">
                      <div
                        className="sidebar__timeline-bar"
                        style={{
                          left: `${clampPercentage(
                            offset
                          )}%`,
                          width: `${Math.max(
                            1,
                            clampPercentage(
                              width
                            )
                          )}%`,
                          background:
                            getTimelineColor(
                              timelineItem.state,
                              index
                            ),
                        }}
                      />
                    </div>

                    <div className="sidebar__timeline-dates">
                      {formatDate(
                        timelineItem.start
                      )}
                      {" → "}
                      {formatDate(
                        timelineItem.end
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </SidebarSection>

      <SidebarSection
        title="Actor financials"
        subtitle="Selected path"
      >
        {!selectedNode ? (
          <EmptyState>
            Click a node to view actor
            financials.
          </EmptyState>
        ) : actorData.length === 0 ? (
          <EmptyState>
            No actor financial data is
            available for this path.
          </EmptyState>
        ) : (
          <div className="sidebar__bar-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={actorData}
                margin={{
                  top: 8,
                  right: 4,
                  bottom: 4,
                  left: -12,
                }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#9f8c92"
                  tick={{
                    fill: "#d9c7cc",
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={{
                    stroke:
                      "rgba(217, 199, 204, 0.2)",
                  }}
                />

                <YAxis
                  stroke="#9f8c92"
                  tick={{
                    fill: "#d9c7cc",
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    formatCurrency(
                      value
                    ),
                    name ===
                    "expenses"
                      ? "Expenses"
                      : "Income",
                  ]}
                  contentStyle={{
                    backgroundColor:
                      "#21161a",
                    border:
                      "1px solid rgba(192, 132, 151, 0.45)",
                    borderRadius: 10,
                    color: "#f4ecee",
                    boxShadow:
                      "0 12px 30px rgba(0, 0, 0, 0.28)",
                  }}
                  labelStyle={{
                    color: "#f4ecee",
                    fontWeight: 600,
                  }}
                  itemStyle={{
                    color: "#eadde1",
                  }}
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#c08497"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#80606a"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SidebarSection>


      <SidebarSection
        title="Negotiation profile"
        subtitle="Current node"
      >
        {!selectedNode ? (
          <EmptyState>
            Click a node to view actor
            negotiation profiles.
          </EmptyState>
        ) : actorProfiles.length ===
          0 ? (
          <EmptyState>
            No actor profiles are
            available for this node.
          </EmptyState>
        ) : (
          <>
            <div
              className="sidebar__actor-tabs"
              role="tablist"
              aria-label="Select actor"
            >
              {actorProfiles.map(
                (actorProfile) => {
                  const isActive =
                    actorProfile.actor_id ===
                    selectedActorProfile
                      ?.actor_id;

                  return (
                    <button
                      key={
                        actorProfile.actor_id
                      }
                      type="button"
                      role="tab"
                      aria-selected={
                        isActive
                      }
                      className={[
                        "sidebar__actor-tab",
                        isActive
                          ? "sidebar__actor-tab--active"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        setSelectedActorId(
                          actorProfile.actor_id
                        )
                      }
                    >
                      <span className="sidebar__actor-tab-name">
                        {
                          actorProfile.actor_name
                        }
                      </span>

                      {actorProfile.actor_role && (
                        <span className="sidebar__actor-tab-role">
                          {
                            actorProfile.actor_role
                          }
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            <div className="sidebar__profile-meta">
              <div>
                <span className="sidebar__meta-label">
                  Actor
                </span>
                <strong>
                  {
                    selectedActorProfile
                      ?.actor_name
                  }
                </strong>
              </div>

              {selectedActorProfile
                ?.actor_role && (
                <div>
                  <span className="sidebar__meta-label">
                    Role
                  </span>
                  <strong>
                    {
                      selectedActorProfile.actor_role
                    }
                  </strong>
                </div>
              )}
            </div>

            {!selectedActorProfile
              ?.negotiation_profile ? (
              <div className="sidebar__not-applicable">
                <span className="sidebar__not-applicable-icon">
                  —
                </span>

                <div>
                  <strong>
                    Not applicable
                  </strong>
                  <p>
                    This actor has no
                    negotiation profile at
                    the current node.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="sidebar__radar-chart">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <RadarChart
                      data={radarData}
                      outerRadius="68%"
                    >
                      <PolarGrid
                        stroke="rgba(232, 211, 217, 0.25)"
                      />

                      <PolarAngleAxis
                        dataKey="characteristic"
                        tick={{
                          fill: "#eadde1",
                          fontSize: 10,
                        }}
                      />

                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tickCount={6}
                        tick={{
                          fill: "#a9939a",
                          fontSize: 9,
                        }}
                        axisLine={false}
                      />

                      <Radar
                        name={
                          selectedActorProfile
                            ?.actor_name
                        }
                        dataKey="value"
                        stroke="#d79caf"
                        fill="#c08497"
                        fillOpacity={0.38}
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#f6e8ed",
                          stroke: "#c08497",
                          strokeWidth: 1.5,
                        }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${value} / 100`,
                          "Score",
                        ]}
                        contentStyle={{
                          backgroundColor:
                            "#21161a",
                          border:
                            "1px solid rgba(192, 132, 151, 0.45)",
                          borderRadius: 10,
                          color: "#f4ecee",
                          boxShadow:
                            "0 12px 30px rgba(0, 0, 0, 0.28)",
                        }}
                        labelStyle={{
                          color: "#f4ecee",
                          fontWeight: 600,
                        }}
                        itemStyle={{
                          color: "#eadde1",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="sidebar__profile-values">
                  {radarData.map(
                    (profileItem) => (
                      <div
                        key={
                          profileItem.characteristic
                        }
                        className="sidebar__profile-value"
                      >
                        <span>
                          {
                            profileItem.characteristic
                          }
                        </span>
                        <strong>
                          {
                            profileItem.value
                          }
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {selectedActorProfile
              ?.intermediate_goal && (
              <div className="sidebar__goal-card">
                <span className="sidebar__meta-label">
                  Intermediate goal
                </span>
                <p>
                  {
                    selectedActorProfile.intermediate_goal
                  }
                </p>
              </div>
            )}
          </>
        )}
      </SidebarSection>

      <footer className="sidebar__footer">
        Confidential · Internal case
        intelligence system
      </footer>
    </div>
  );
}


function SidebarSection({
  title,
  subtitle,
  className = "",
  children,
}) {
  return (
    <section
      className={[
        "sidebar__section",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="sidebar__section-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && (
            <span>{subtitle}</span>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}


function EmptyState({ children }) {
  return (
    <div className="sidebar__empty-state">
      {children}
    </div>
  );
}


function clampProfileValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, numericValue)
  );
}


function clampPercentage(value) {
  return Math.min(
    100,
    Math.max(0, value)
  );
}


function formatCurrency(value) {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(Number(value) || 0);
}


function formatDate(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "Unknown date";
  }

  return new Date(
    timestamp
  ).toLocaleDateString("de-DE");
}


function getTimelineColor(
  stateName,
  index
) {
  const normalizedState = stateName
    .toLowerCase()
    .trim();

  if (
    normalizedState === "paid" ||
    normalizedState.includes(
      "completed"
    ) ||
    normalizedState.includes(
      "resolved"
    )
  ) {
    return "#c08497";
  }

  if (
    normalizedState.includes(
      "waiting"
    ) ||
    normalizedState.includes(
      "pending"
    )
  ) {
    return "#bfa3aa";
  }

  const fallbackColors = [
    "#5a3a42",
    "#765561",
    "#8f6b75",
    "#a67987",
    "#b58e99",
  ];

  return fallbackColors[
    index %
      fallbackColors.length
  ];
}