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

{result && (
  <div style={{
    marginTop: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: "12px 16px",
    borderRadius: "10px",
    width: "100%",
    boxSizing: "border-box"
  }}>
    {/* テキスト表示領域（3カラム幅固定） */}
    <div style={{
      display: "flex",
      justify: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      fontWeight: "bold",
      width: "100%"
    }}>
      {/* Player 1（左端揃え） */}
      <div style={{ color: "#66b0ff", fontSize: "15px", flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>
        Player 1 <span style={{ fontSize: "18px", marginLeft: "4px" }}>
          {(result.p1Win ?? (result.p1Equity - (result.tie || 0) / 2)).toFixed(1)}%
        </span>
      </div>

      {/* Chop（中央揃え） */}
      <div style={{ flex: "0 0 auto", textAlign: "center", padding: "0 8px" }}>
        {(result.tie ?? 0) > 0.05 && (
          <div style={{
            color: "#d1d1ce",
            backgroundColor: "rgba(132, 132, 132, 0.25)",
            border: "1px solid rgba(113, 113, 112, 0.5)",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}>
            Chop {result.tie.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Player 2（右端揃え） */}
      <div style={{ color: "#ff6b6b", fontSize: "15px", flex: 1, textAlign: "right", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: "18px", marginRight: "4px" }}>
          {(result.p2Win ?? (result.p2Equity - (result.tie || 0) / 2)).toFixed(1)}%
        </span> Player 2
      </div>
    </div>

    {/* 3分割バー (青: P1勝率 / 灰: Chop率 / 赤: P2勝率) */}
    <div style={{
      display: "flex",
      height: "12px",
      width: "100%",
      borderRadius: "6px",
      overflow: "hidden",
      backgroundColor: "#1e293b"
    }}>
      {/* P1 勝率 */}
      <div style={{
        width: `${result.p1Win ?? (result.p1Equity - (result.tie || 0) / 2)}%`,
        backgroundColor: "#2563eb",
        transition: "width 0.3s ease"
      }} />

      {/* Chop */}
      {(result.tie ?? 0) > 0 && (
        <div style={{
          width: `${result.tie}%`,
          backgroundColor: "#929292",
          transition: "width 0.3s ease"
        }} />
      )}

      {/* P2 勝率 */}
      <div style={{
        width: `${result.p2Win ?? (result.p2Equity - (result.tie || 0) / 2)}%`,
        backgroundColor: "#ef4444",
        transition: "width 0.3s ease"
      }} />
    </div>
  </div>
)}
    </>
  );
}