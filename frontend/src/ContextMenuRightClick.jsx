import React, { useState } from "react";

export default function ContextMenuRightClick({
  x,
  y,
  nodeId,
  potentialNextStates = [],
  onClose,
  onAdd,
  onAddByAction,
  onDeactivate,
  onDelete,
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const hasActions =
    Array.isArray(potentialNextStates) && potentialNextStates.length > 0;

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
        minWidth: "210px",
        boxShadow: "0 6px 18px rgba(156, 88, 102, 0.15)",
        zIndex: 9999,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        color: "#2d2d2d",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Add Step" onClick={() => onAdd(nodeId)} />

      <MenuItem
        label="Add node by Action"
        rightIcon="›"
        disabled={!hasActions}
        onClick={() => {
          if (hasActions) {
            setActionMenuOpen((open) => !open);
          }
        }}
      />

      {actionMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: 42,
            left: "calc(100% + 8px)",
            background: "#ffffff",
            border: "1px solid #e7d6da",
            borderRadius: "14px",
            padding: "6px",
            minWidth: "260px",
            maxWidth: "360px",
            maxHeight: "320px",
            overflowY: "auto",
            boxShadow: "0 6px 18px rgba(156, 88, 102, 0.15)",
            zIndex: 10000,
          }}
        >
          {potentialNextStates.map((action, index) => (
            <MenuItem
              key={`${action}-${index}`}
              label={action}
              onClick={() => onAddByAction(nodeId, action)}
            />
          ))}
        </div>
      )}

      <MenuItem
        label="Deactivate Step"
        onClick={() => onDeactivate(nodeId)}
      />

      <MenuItem
        label="Delete Step"
        danger
        onClick={() => onDelete(nodeId)}
      />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger = false,
  disabled = false,
  rightIcon = null,
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();

        if (!disabled && onClick) {
          onClick();
        }
      }}
      style={{
        padding: "9px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.2px",
        color: disabled
          ? "#aaa"
          : danger
            ? "#b24a5a"
            : "#2d2d2d",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;

        e.currentTarget.style.background = "#f3e6e9";
        e.currentTarget.style.color = danger ? "#9c2f42" : "#9c5866";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = disabled
          ? "#aaa"
          : danger
            ? "#b24a5a"
            : "#2d2d2d";
      }}
    >
      <span>{label}</span>
      {rightIcon && <span>{rightIcon}</span>}
    </div>
  );
}