import React from "react";

export default function ContextMenuRightClick({
  x,
  y,
  nodeId,
  onClose,
  onAdd,
  onDeactivate,
  onDelete,
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,

        background: "#ffffff",
        border: "1px solid #e7d6da",
        borderRadius: "14px",

        padding: "6px",
        minWidth: "190px",

        boxShadow: "0 6px 18px rgba(156, 88, 102, 0.15)",

        zIndex: 9999,

        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        color: "#2d2d2d",
      }}
    >
      <MenuItem label="Add node" onClick={() => onAdd(nodeId)} />
      <MenuItem
        label="Deactivate node"
        onClick={() => onDeactivate(nodeId)}
      />
      <MenuItem
        label="Delete node"
        danger
        onClick={() => onDelete(nodeId)}
      />
    </div>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "9px 10px",
        cursor: "pointer",
        borderRadius: "10px",

        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.2px",

        color: danger ? "#b24a5a" : "#2d2d2d",

        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f3e6e9";
        e.currentTarget.style.color = danger ? "#9c2f42" : "#9c5866";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "#b24a5a" : "#2d2d2d";
      }}
    >
      {label}
    </div>
  );
}