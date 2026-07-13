import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Sidebar({ selectedNode }) {
  // --------------------------------------------------
  // PAYMENT DATA
  // --------------------------------------------------
  const actorData = Object.entries(
    selectedNode?.payment_info || {}
  ).map(([actorName, paymentInfo]) => ({
    name: actorName,
    paid: Number(paymentInfo?.paid) || 0,
    received: Number(paymentInfo?.received) || 0,
  }));

  // --------------------------------------------------
  // STATE TIMELINE DATA
  // --------------------------------------------------
  const timeline = Object.entries(
    selectedNode?.state_periods || {}
  )
    .map(([state, range]) => {
      const start = new Date(range?.start).getTime();
      const end = new Date(range?.end).getTime();

      return {
        state,
        start,
        end,
        duration: end - start,
      };
    })
    .filter(
      (item) =>
        Number.isFinite(item.start) &&
        Number.isFinite(item.end) &&
        item.end >= item.start
    )
    .sort((a, b) => a.start - b.start);

  const timelineStarts = timeline.map((item) => item.start);
  const timelineEnds = timeline.map((item) => item.end);

  const minTime =
    timeline.length > 0 ? Math.min(...timelineStarts) : 0;

  const maxTime =
    timeline.length > 0 ? Math.max(...timelineEnds) : 0;

  const totalDuration = maxTime - minTime;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 18,
        gap: 16,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#f4ecee",
        background:
          "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          paddingBottom: 12,
          borderBottom:
            "1px solid rgba(192,132,151,0.25)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: 0.6,
            opacity: 0.7,
          }}
        >
          LEGAL ANALYTICS
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Case Overview
        </h2>

        <div
          style={{
            fontSize: 12,
            opacity: 0.6,
          }}
        >
          Graph statistics overview
        </div>
      </div>

      {/* ---------------------------------------------
          ACTOR CHART
      --------------------------------------------- */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          border:
            "1px solid rgba(192, 132, 151, 0.25)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            marginBottom: 8,
            opacity: 0.8,
          }}
        >
          Actors (Selected Path)
        </div>

        {!selectedNode ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
            }}
          >
            Click a node to view actor financials
          </div>
        ) : actorData.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
            }}
          >
            No actor payment data for this path
          </div>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={actorData}>
                <XAxis
                  dataKey="name"
                  stroke="#d9c7cc"
                  tick={{
                    fill: "#d9c7cc",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  stroke="#d9c7cc"
                  tick={{
                    fill: "#d9c7cc",
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === "paid" ? "Paid" : "Received",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1b1216",
                    border:
                      "1px solid rgba(192,132,151,0.4)",
                    borderRadius: 8,
                    color: "#f4ecee",
                  }}
                  labelStyle={{
                    color: "#f4ecee",
                  }}
                  itemStyle={{
                    color: "#f4ecee",
                  }}
                />

                <Bar
                  dataKey="paid"
                  name="Paid"
                  fill="#c08497"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="received"
                  name="Received"
                  fill="#8f6b75"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ---------------------------------------------
          TIMELINE
      --------------------------------------------- */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          borderRadius: 12,
          border:
            "1px solid rgba(192, 132, 151, 0.25)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            marginBottom: 12,
            opacity: 0.8,
          }}
        >
          Procedural Timeline (Selected Path)
        </div>

        {!selectedNode ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
            }}
          >
            Click a node to view its procedural timeline
          </div>
        ) : timeline.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
            }}
          >
            No timeline data for this path
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {timeline.map((timelineItem, index) => {
              const offset =
                totalDuration > 0
                  ? ((timelineItem.start - minTime) /
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
                >
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      opacity: 0.85,
                    }}
                  >
                    {timelineItem.state}
                  </div>

                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background:
                        "rgba(255,255,255,0.06)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: `${Math.max(
                          0,
                          Math.min(offset, 100)
                        )}%`,
                        width: `${Math.max(
                          1,
                          Math.min(width, 100)
                        )}%`,
                        height: "100%",
                        background:
                          getTimelineColor(
                            timelineItem.state,
                            index
                          ),
                        borderRadius: 999,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 6,
                      opacity: 0.5,
                    }}
                  >
                    {formatDate(timelineItem.start)}
                    {" → "}
                    {formatDate(timelineItem.end)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          fontSize: 11,
          opacity: 0.5,
          paddingTop: 10,
          borderTop:
            "1px solid rgba(192,132,151,0.2)",
        }}
      >
        Confidential • Internal Case Intelligence System
      </div>
    </div>
  );
}

function formatDate(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "Unknown date";
  }

  return new Date(timestamp).toLocaleDateString();
}

function getTimelineColor(stateName, index) {
  const normalizedState = stateName
    .toLowerCase()
    .trim();

  if (
    normalizedState === "paid" ||
    normalizedState.includes("completed") ||
    normalizedState.includes("resolved")
  ) {
    return "#c08497";
  }

  if (
    normalizedState.includes("waiting") ||
    normalizedState.includes("pending")
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
    index % fallbackColors.length
  ];
}