import React from "react";

const calcBtnStyle = {
  width: "100%", backgroundColor: "#2563eb", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)", transition: "all 0.2s ease"
};
const secondaryBtnStyle = {
  backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer"
};

export default function RangeModal({ isRangeModalOpen, setIsRangeModalOpen, myRange, setMyRange, RANKS }) {
  if (!isRangeModalOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "550px", width: "90%", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#1e293b" }}>マイレンジ編集 (13×13)</h3>
          <button onClick={() => setMyRange([])} style={{ ...secondaryBtnStyle, backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5" }}>全解除</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {RANKS.map((rowRank, rowIndex) => (
            <div key={rowRank} style={{ display: "flex", gap: "3px" }}>
              {RANKS.map((colRank, colIndex) => {
                let handStr = rowIndex === colIndex ? rowRank + colRank : rowIndex < colIndex ? rowRank + colRank + "s" : colRank + rowRank + "o";
                const isSelected = myRange.includes(handStr);
                return (
                  <button
                    key={handStr}
                    onClick={() => isSelected ? setMyRange(myRange.filter(h => h !== handStr)) : setMyRange([...myRange, handStr])}
                    style={{
                      flex: 1, aspectRatio: "1/1", fontSize: "clamp(8px, 1.5vw, 10px)", fontWeight: "bold", border: "1px solid #e2e8f0", borderRadius: "4px", cursor: "pointer",
                      backgroundColor: rowIndex === colIndex ? (isSelected ? "#22c55e" : "#ffedd5") : rowIndex < colIndex ? (isSelected ? "#3b82f6" : "#eff6ff") : (isSelected ? "#eab308" : "#fef9c3"),
                      color: isSelected ? "white" : "#334155", padding: 0
                    }}
                  >
                    {handStr}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setIsRangeModalOpen(false)} style={{ ...calcBtnStyle, width: "auto", padding: "8px 24px", fontSize: "14px", backgroundColor: "#475569" }}>確定して閉じる</button>
        </div>
      </div>
    </div>
  );
}