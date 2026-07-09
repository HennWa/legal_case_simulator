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
  const [manualAction, setManualAction] = useState("");

  const hasActions =
    Array.isArray(potentialNextStates) && potentialNextStates.length > 0;

  const submitManualAction = () => {
    const cleanedAction = manualAction.trim();

    if (!cleanedAction) return;

    onAddByAction(nodeId, cleanedAction);
  };

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
        onClick={() => setActionMenuOpen((open) => !open)}
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
            padding: "8px",
            minWidth: "300px",
            maxWidth: "380px",
            maxHeight: "360px",
            overflowY: "auto",
            boxShadow: "0 6px 18px rgba(156, 88, 102, 0.15)",
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "6px 8px 8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#9c5866",
              borderBottom: "1px solid #f0dce1",
              marginBottom: "6px",
            }}
          >
            Choose or enter next action
          </div>

          {hasActions ? (
            potentialNextStates.map((action, index) => (
              <MenuItem
                key={`${action}-${index}`}
                label={action}
                onClick={() => onAddByAction(nodeId, action)}
              />
            ))
          ) : (
            <div
              style={{
                padding: "8px",
                fontSize: "12px",
                color: "#888",
              }}
            >
              No predefined actions available.
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid #f0dce1",
              marginTop: "8px",
              paddingTop: "8px",
            }}
          >
            <input
              value={manualAction}
              onChange={(e) => setManualAction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitManualAction();
                }

                if (e.key === "Escape" && onClose) {
                  onClose();
                }
              }}
              placeholder="Enter custom action..."
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #e7d6da",
                outline: "none",
                fontSize: "13px",
                color: "#2d2d2d",
                marginBottom: "8px",
              }}
            />

            <button
              onClick={submitManualAction}
              disabled={!manualAction.trim()}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(192,132,151,0.45)",
                background: manualAction.trim()
                  ? "rgba(192,132,151,0.16)"
                  : "#f4f4f4",
                color: manualAction.trim() ? "#9c5866" : "#aaa",
                cursor: manualAction.trim() ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Request next node
            </button>
          </div>
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