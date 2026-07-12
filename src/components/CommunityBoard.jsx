import React from "react";
import PlayingCard from "./PlayingCard";

const miniLabelStyle = {
  display: "block", fontSize: "9px", color: "#cbd5e1", textAlign: "center", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px"
};
const dividerStyle = {
  width: "1px", height: "35px", backgroundColor: "rgba(255, 255, 255, 0.25)", margin: "0 2px", alignSelf: "flex-start", marginTop: "13px"
};

export default function CommunityBoard({ board, isLoading, activeSlot, setActiveSlot, getSlotStyle, outs, SUITS }) {
  const renderOutCard = (cardKey) => {
    const rank = cardKey[0] === "T" ? "10" : cardKey[0];
    const suitKey = cardKey[1];
    const suit = SUITS.find(s => s.key === suitKey);
    return (
      <span key={cardKey} style={{
        display: "inline-block", backgroundColor: "white", color: suit ? suit.color : "#333", padding: "2px 5px", borderRadius: "4px", border: "1px solid #cbd5e1", fontWeight: "bold", fontSize: "11px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        {suit ? suit.symbol : ""}{rank}
      </span>
    );
  };

  return (
    <div style={{ marginBottom: "5px", textAlign: "center", width: "100%" }}>
      <h3 style={{ borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: "6px", color: "#ffc107", marginTop: 0, fontSize: "13px", letterSpacing: "1px" }}>
        COMMUNITY BOARD
      </h3>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "flex-start", marginTop: "12px", width: "100%", maxWidth: "360px", margin: "12px auto 0" }}>
        {/* Flop 1 ~ 3 */}
        {[0, 1, 2].map((idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
            <div className="card-slot" onClick={() => !isLoading && setActiveSlot({ target: "board", index: idx })} style={getSlotStyle("board", idx)}>
              <PlayingCard cardKey={board[idx]} />
            </div>
            <span style={miniLabelStyle}>Flop {idx + 1}</span>
          </div>
        ))}
        
        <div style={dividerStyle} />
        
        {/* Turn */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
          <div className="card-slot" onClick={() => !isLoading && setActiveSlot({ target: "board", index: 3 })} style={getSlotStyle("board", 3)}>
            <PlayingCard cardKey={board[3]} />
          </div>
          <span style={miniLabelStyle}>Turn</span>
        </div>
        
        <div style={dividerStyle} />
        
        {/* River */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
          <div className="card-slot" onClick={() => !isLoading && setActiveSlot({ target: "board", index: 4 })} style={getSlotStyle("board", 4)}>
            <PlayingCard cardKey={board[4]} />
          </div>
          <span style={miniLabelStyle}>River</span>
        </div>
      </div>

      {outs && (outs.p1.length > 0 || outs.p2.length > 0) && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "10px", textAlign: "left" }}>
          {outs.p1.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#66b0ff", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>P1アウツ ({outs.p1.length}):</span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{outs.p1.map(renderOutCard)}</div>
            </div>
          )}
          {outs.p2.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#ff6b6b", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>P2アウツ ({outs.p2.length}):</span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{outs.p2.map(renderOutCard)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}