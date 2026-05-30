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

  const stateData = Object.entries(statistics.states).map(
    ([state, range]) => ({
      state,
      start: new Date(range.start),
      end: new Date(range.end),
    })
  );

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

      {/* 🕒 STATE TIMELINE */}
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
          State Timeline
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {stateData.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                {s.state}
              </div>

              <div
                style={{
                  height: 10,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    background:
                      "linear-gradient(90deg, #c08497, #f3d6dc)",
                    opacity: 0.85,
                  }}
                />
              </div>

              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                {s.start.toDateString()} → {s.end.toDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}