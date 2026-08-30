import React from "react";
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
  return (
    <div style={{ marginTop: "15px", textAlign: "center" }}>
      <div style={{ fontSize: "11px", color: "#f8fafc", fontWeight: "bold", letterSpacing: "0.5px", marginBottom: "6px" }}>
        Exposed Cards
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
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
    </div>
  );
}