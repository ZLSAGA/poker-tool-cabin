import React, { useState, useEffect } from "react";
import PlayingCard from "./PlayingCard";

const closeBtnStyle = {
  position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#000000", color: "white", border: "1px solid white", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.2)", padding: 0, lineHeight: 1
};

export default function ExposedSection({
  exposedCards,
  isLoading,
  activeSlot,
  setActiveSlot,
  getSlotStyle,
  handleClearSpecificSlot
}) {
  const count = exposedCards.filter(Boolean).length;
  const [isOpen, setIsOpen] = useState(count > 0);

  // activeSlotが"exposed"になった場合に自動で開く
  useEffect(() => {
    if (activeSlot && activeSlot.target === "exposed") {
      setIsOpen(true);
    }
  }, [activeSlot]);

  return (
    <div style={{ marginTop: "8px", textAlign: "center" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: isOpen ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.25)",
          color: "#f8fafc",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: "14px",
          padding: "3px 10px",
          fontSize: "11px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "all 0.15s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px"
        }}
      >
        <span>{isOpen ? "▲" : "▼"}</span>
        <span>Exposed Cards (マック・フォールドカード)</span>
        {count > 0 && (
          <span style={{ backgroundColor: "#2563eb", color: "white", borderRadius: "10px", padding: "1px 6px", fontSize: "10px" }}>
            {count}枚
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
          {exposedCards.map((cardKey, idx) => (
            <div key={idx} style={{ width: "42px" }}>
              <div
                className="card-slot"
                onClick={() => !isLoading && setActiveSlot({ target: "exposed", index: idx })}
                style={{
                  ...getSlotStyle("exposed", idx),
                  maxWidth: "42px"
                }}
              >
                <PlayingCard cardKey={cardKey} />
                {cardKey && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSpecificSlot("exposed", idx);
                    }}
                    style={closeBtnStyle}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}