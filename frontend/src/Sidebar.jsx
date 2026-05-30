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
  // -------------------------
  // Actor chart data
  // -------------------------
  const actorData = Object.entries(statistics.actors).map(
    ([name, values]) => ({
      name,
      paid: values.paid,
      received: values.received,
    })
  );

  // -------------------------
  // Gantt timeline preprocessing
  // -------------------------
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
        gap: 18,
        padding: 16,
        boxSizing: "border-box",
        color: "#f5e9ec",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0, fontSize: 16 }}>Legal Analytics</h2>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Graph statistics overview
        </div>
      </div>

      {/* 📊 ACTOR CHART */}
      <div
        style={{
          height: 240,
          background: "rgba(0,0,0,0.15)",
          border: "1px solid #c08497",
          borderRadius: 10,
          padding: 10,
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.8 }}>
          Payments by Actor
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={actorData}>
            <XAxis dataKey="name" stroke="#f5e9ec" />
            <YAxis stroke="#f5e9ec" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#2b0f1a",
                border: "1px solid #c08497",
                color: "#f5e9ec",
              }}
            />
            <Bar dataKey="paid" fill="#c08497" />
            <Bar dataKey="received" fill="#f3d6dc" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🕒 GANTT TIMELINE */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(0,0,0,0.15)",
          border: "1px solid #c08497",
          borderRadius: 10,
          padding: 10,
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 10, opacity: 0.8 }}>
          State Timeline (Gantt)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {timeline.map((t, i) => {
            const offset = ((t.start - minTime) / total) * 100;
            const width = (t.duration / total) * 100;

            return (
              <div key={i}>
                {/* state label */}
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  {t.state}
                </div>

                {/* gantt bar background */}
                <div
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* actual time segment */}
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
                          ? "#f3d6dc"
                          : "#6b2c3a",
                      borderRadius: 6,
                    }}
                  />
                </div>

                {/* time labels */}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                  {new Date(t.start).toDateString()} →{" "}
                  {new Date(t.end).toDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}