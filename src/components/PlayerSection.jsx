import React from "react";
import PlayingCard from "./PlayingCard";

const playerSelectStyle = {
  width: "100%", padding: "4px 6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "11px", backgroundColor: "white", color: "#1e293b", cursor: "pointer", outline: "none"
};
const closeBtnStyle = {
  position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#000000", color: "white", border: "1px solid white", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.2)", padding: 0, lineHeight: 1
};

function RangeCardPlaceholder({ label }) {
  return (
    <div className="card-slot" style={{
      width: "100%", maxWidth: "75px", minWidth: "40px", aspectRatio: "3 / 4.2", backgroundColor: "#2c3e50", borderRadius: "8px", boxShadow: "0 3px 8px rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", border: "2px solid #ecf0f1", color: "white", fontWeight: "bold", fontSize: "14px", userSelect: "none", boxSizing: "border-box"
    }}>
      {label}
    </div>
  );
}

export default function PlayerSection({ isLoading, p1Select, setP1Select, p2Select, setP2Select, p1Hand, p2Hand, setActiveSlot, getSlotStyle, getRangeLabel, result, handleClearSpecificSlot }) {
  const renderPlayer = (id, selectValue, setSelectValue, hand, target) => (
    <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "10px 6px", borderRadius: "10px", width: "49%", minWidth: "0" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Player {id}</h4>
      <select disabled={isLoading} value={selectValue} onChange={(e) => setSelectValue(e.target.value)} style={playerSelectStyle}>
        <option value="custom">カスタムハンド</option>
        <option value="strong">レンジ: 強 (11%)</option>
        <option value="medium">レンジ: 標準 (20%)</option>
        <option value="weak">レンジ: 弱 (35%)</option>
        <option value="any">レンジ: Any (100%)</option>
        <option value="myRange">マイレンジ</option>
      </select>
      <div style={{ display: "flex", justifyContent: "center", gap: "6%", marginTop: "8px", width: "100%" }}>
        {selectValue === "custom" ? (
          <>
            <div className="card-slot" onClick={() => !isLoading && setActiveSlot({ target, index: 0 })} style={getSlotStyle(target, 0)}>
              <PlayingCard cardKey={hand[0]} />
              {hand[0] && (
                <button onClick={(e) => { e.stopPropagation(); handleClearSpecificSlot(target, 0); }} style={closeBtnStyle}>×</button>
              )}
            </div>
            <div className="card-slot" onClick={() => !isLoading && setActiveSlot({ target, index: 1 })} style={getSlotStyle(target, 1)}>
              <PlayingCard cardKey={hand[1]} />
              {hand[1] && (
                <button onClick={(e) => { e.stopPropagation(); handleClearSpecificSlot(target, 1); }} style={closeBtnStyle}>×</button>
              )}
            </div>
          </>
        ) : (
          <>
            <RangeCardPlaceholder label={getRangeLabel(selectValue)} />
            <RangeCardPlaceholder label={getRangeLabel(selectValue)} />
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginTop: "25px", flexWrap: "nowrap" }}>
        {renderPlayer(1, p1Select, setP1Select, p1Hand, "p1")}
        {renderPlayer(2, p2Select, setP2Select, p2Hand, "p2")}
      </div>

      {result && !isLoading && (
        <div style={{ marginTop: "25px", backgroundColor: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "13px", fontWeight: "bold" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#66b0ff" }}>Player 1</span>
              <span style={{ color: "white", fontSize: "16px" }}>{result.p1Equity.toFixed(1)}%</span>
            </div>
            {(100 - result.p1Equity - result.p2Equity) > 0.1 && (
              <span style={{ color: "#cbd5e1", fontSize: "11px" }}>Tie: {(100 - result.p1Equity - result.p2Equity).toFixed(1)}%</span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "white", fontSize: "16px" }}>{result.p2Equity.toFixed(1)}%</span>
              <span style={{ color: "#ff6b6b" }}>Player 2</span>
            </div>
          </div>
          <div style={{ width: "100%", height: "16px", backgroundColor: "#cbd5e1", borderRadius: "8px", display: "flex", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
            <div style={{ width: `${result.p1Equity}%`, backgroundColor: "#3b82f6", transition: "width 0.8s" }} />
            <div style={{ width: `${Math.max(0, 100 - result.p1Equity - result.p2Equity)}%`, backgroundColor: "#64748b", transition: "width 0.8s" }} />
            <div style={{ width: `${result.p2Equity}%`, backgroundColor: "#ef4444", transition: "width 0.8s" }} />
          </div>
        </div>
      )}
    </>
  );
}