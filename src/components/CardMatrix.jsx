import React from "react";

const secondaryBtnStyle = {
  backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px"
};

export default function CardMatrix({ isOpen, onClose, isLoading, activeSlot, RANKS, SUITS, usedCards, handleSelectCard }) {
  if (!isOpen || !activeSlot) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
        backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", 
        alignItems: "center", zIndex: 1000 
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          backgroundColor: "white", padding: "20px", borderRadius: "12px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "460px", width: "92%", 
          maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", opacity: isLoading ? 0.6 : 1 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
          <h4 style={{ margin: 0, color: "#1e293b", fontSize: "15px", fontWeight: "bold" }}>カードを選択</h4>
          <button onClick={onClose} style={{ ...secondaryBtnStyle, backgroundColor: "#64748b", color: "white", border: "none" }}>閉じる</button>
        </div>

        <div style={{ fontSize: "12px", color: "#d97706", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px", fontWeight: "bold" }}>
          選択中: {activeSlot.target === "board" ? `ボード (スロット${activeSlot.index + 1})` : `Player ${activeSlot.target === "p1" ? "1" : "2"} (${activeSlot.index + 1}枚目)`}
        </div>

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
                      flex: 1, padding: "8px 0", fontSize: "12px", fontWeight: "bold", borderRadius: "5px", border: "1px solid #cbd5e1", backgroundColor: isUsed ? "#e2e8f0" : "white", color: isUsed ? "#94a3b8" : suit.color, cursor: (isUsed || isLoading) ? "not-allowed" : "pointer", transition: "all 0.1s ease", boxShadow: isUsed ? "none" : "0 1px 3px rgba(0,0,0,0.05)", textDecoration: isUsed ? "line-through" : "none"
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
    </div>
  );
}