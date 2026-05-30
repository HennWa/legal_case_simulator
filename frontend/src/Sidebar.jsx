import statistics from "./data/statistics.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Sidebar() {
  const actorData = Object.entries(statistics.actors).map(
    ([name, values]) => ({
      name,
      paid: values.paid,
      received: values.received,
    })
  );

  const timeline = Object.entries(statistics.states).map(
    ([state, range]) => {
      const start = new Date(range.start).getTime();
      const end = new Date(range.end).getTime();

      return {
        state,
        start,
        end,
        duration: end - start,
      };
    }
  );

  const minTime = Math.min(...timeline.map((t) => t.start));
  const maxTime = Math.max(...timeline.map((t) => t.end));
  const total = maxTime - minTime;

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
        background: "linear-gradient(180deg, #1b1216 0%, #140d10 100%)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          paddingBottom: 12,
          borderBottom: "1px solid rgba(192, 132, 151, 0.25)",
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: 0.6, opacity: 0.7 }}>
          LEGAL ANALYTICS
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Case Overview
        </h2>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          Structured event intelligence
        </div>
      </div>

      {/* ACTOR PANEL */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(192, 132, 151, 0.25)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 10, opacity: 0.8 }}>
          Financial Flow by Actor
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actorData}>
              <XAxis dataKey="name" stroke="#d9c7cc" />
              <YAxis stroke="#d9c7cc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1b1216",
                  border: "1px solid rgba(192,132,151,0.4)",
                  borderRadius: 8,
                  color: "#f4ecee",
                }}
              />
              <Bar dataKey="paid" fill="#c08497" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" fill="#8f6b75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TIMELINE PANEL */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(192, 132, 151, 0.25)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 12, opacity: 0.8 }}>
          Procedural Timeline
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {timeline.map((t, i) => {
            const offset = ((t.start - minTime) / total) * 100;
            const width = (t.duration / total) * 100;

            return (
              <div key={i}>
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 6,
                    opacity: 0.85,
                  }}
                >
                  {t.state}
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `${offset}%`,
                      width: `${width}%`,
                      height: "100%",
                      background:
                        t.state === "paid"
                          ? "#c08497"
                          : t.state === "waiting for payment"
                          ? "#bfa3aa"
                          : "#5a3a42",
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
                  {new Date(t.start).toLocaleDateString()} →{" "}
                  {new Date(t.end).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          fontSize: 11,
          opacity: 0.5,
          paddingTop: 10,
          borderTop: "1px solid rgba(192, 132, 151, 0.2)",
        }}
      >
        Confidential • Internal Case Intelligence System
      </div>
    </div>
  );
}