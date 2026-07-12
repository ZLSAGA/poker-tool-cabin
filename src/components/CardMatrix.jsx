import React from "react";

const secondaryBtnStyle = {
  backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px"
};

export default function CardMatrix({ isLoading, history, handleUndo, activeSlot, handleClearSlot, handleClearAll, RANKS, SUITS, usedCards, handleSelectCard }) {
  return (
    <div style={{ flex: "1", minWidth: "280px", width: "100%", backgroundColor: "white", padding: "18px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", position: "sticky", top: "20px", opacity: isLoading ? 0.6 : 1, overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
        <h4 style={{ margin: 0, color: "#334155", fontSize: "14px", fontWeight: "bold" }}>カードマトリックス</h4>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={handleUndo} disabled={history.length === 0 || isLoading} style={{ ...secondaryBtnStyle, backgroundColor: (history.length === 0 || isLoading) ? "#f1f5f9" : "#e0f2fe", color: (history.length === 0 || isLoading) ? "#94a3b8" : "#0369a1", border: (history.length === 0 || isLoading) ? "1px solid #cbd5e1" : "1px solid #bae6fd", cursor: isLoading ? "not-allowed" : "pointer" }}>
            戻る ({history.length})
          </button>
          <button onClick={handleClearSlot} disabled={!activeSlot || isLoading} style={{ ...secondaryBtnStyle, cursor: isLoading ? "not-allowed" : "pointer" }}>枠を空に</button>
          <button onClick={handleClearAll} disabled={isLoading} style={{...secondaryBtnStyle, backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", cursor: isLoading ? "not-allowed" : "pointer"}}>全消去</button>
        </div>
      </div>

      {activeSlot ? (
        <div style={{ fontSize: "12px", color: "#d97706", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px", fontWeight: "bold" }}>
          選択中: {activeSlot.target === "board" ? `ボード (スロット${activeSlot.index + 1})` : `Player ${activeSlot.target === "p1" ? "1" : "2"} (${activeSlot.index + 1}枚目)`}
        </div>
      ) : (
        <div style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f8fafc", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px" }}>
          スタックを選択してください
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {RANKS.map(rank => (
          <div key={rank} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <div style={{ width: "20px", fontWeight: "bold", color: "#64748b", textAlign: "center", fontSize: "13px" }}>{rank === "T" ? "10" : rank}</div>
            {SUITS.map(suit => {
              const cardKey = `${rank}${suit.key}`;
              const isUsed = usedCards.includes(cardKey);
              return (
                <button
                  key={cardKey}
                  onClick={() => handleSelectCard(cardKey)}
                  disabled={isUsed || isLoading}
                  style={{
                    flex: 1, padding: "clamp(3px, 1.2vw, 7px) 0", fontSize: "clamp(10px, 1.2vw, 13px)", fontWeight: "bold", borderRadius: "5px", border: "1px solid #cbd5e1", backgroundColor: isUsed ? "#e2e8f0" : "white", color: isUsed ? "#94a3b8" : suit.color, cursor: (isUsed || isLoading) ? "not-allowed" : "pointer", transition: "all 0.1s ease", boxShadow: isUsed ? "none" : "0 1px 3px rgba(0,0,0,0.05)", textDecoration: isUsed ? "line-through" : "none"
                  }}
                >
                  {suit.symbol}{rank === "T" ? "10" : rank}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}