import React from "react";

// 標準的なハンドの強さ順（PokerStove / Equilab準拠の169通りすべてを網羅）
const HAND_RANKING_ORDER = [
  "AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "AKo", "AQo", "77", "KJs", 
  "QJs", "JTs", "AJo", "ATo", "KQo", "66", "55", "KTs", "QTs", "J9s", "T9s", "98s", "A9s", "A8s", 
  "A7s", "A5s", "A6s", "A4s", "A3s", "A2s", "KJo", "QJo", "JTo", "KTo", "QTo", "44", "33", "22", "K9s", 
  "Q9s", "J8s", "T8s", "97s", "87s", "76s", "65s", "54s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", 
  "K2s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s", 
  "T7s", "T6s", "T5s", "T4s", "T3s", "T2s", "96s", "95s", "94s", "93s", "92s", "86s", "85s", "84s", 
  "83s", "82s", "75s", "74s", "73s", "72s", "64s", "63s", "62s", "53s", "52s", "43s", "42s", "32s", 
  "A9o", "K9o", "Q9o", "J9o", "T9o", "98o", "87o", "76o", "65o", "54o", "A8o", "A7o", "A6o", "A5o", 
  "A4o", "A3o", "A2o", "K8o", "K7o", "K6o", "K5o", "K4o", "K3o", "K2o", "Q8o", "Q7o", "Q6o", "Q5o", 
  "Q4o", "Q3o", "Q2o", "J8o", "J7o", "J6o", "J5o", "J4o", "J3o", "J2o", "T8o", "T7o", "T6o", "T5o", 
  "T4o", "T3o", "T2o", "97o", "96o", "95o", "94o", "93o", "92o", "86o", "85o", "84o", "83o", "82o", 
  "75o", "74o", "73o", "72o", "64o", "63o", "62o", "53o", "52o", "43o", "42o", "32o"
];

// ハンド表記からコンボ数を返す関数
const getComboCount = (hand) => {
  if (hand.length === 2) return 6;    // ポケットペア
  if (hand.endsWith("s")) return 4;   // スーテッド
  if (hand.endsWith("o")) return 12;  // オフスーテッド
  return 0;
};

export default function RangeModal({ isRangeModalOpen, setIsRangeModalOpen, myRange, setMyRange, RANKS }) {
  if (!isRangeModalOpen) return null;

  // 現在選択されている全ハンドの合計コンボ数と％を計算
  const currentCombos = myRange.reduce((sum, hand) => sum + getComboCount(hand), 0);
  const currentPercentage = ((currentCombos / 1326) * 100).toFixed(1);

  // 指定された上位％に最も近くなるようハンドを自動選択する関数
  const handleSelectPercentage = (pct) => {
    const targetCombos = 1326 * (pct / 100);
    let total = 0;
    const newRange = [];
    
    for (const hand of HAND_RANKING_ORDER) {
      const c = getComboCount(hand);
      if (total + c <= targetCombos) {
        newRange.push(hand);
        total += c;
      } else {
        break;
      }
    }
    setMyRange(newRange);
  };

  // 単一ハンドのトグル切り替え
  const handleToggleHand = (handKey) => {
    if (myRange.includes(handKey)) {
      setMyRange(prev => prev.filter(h => h !== handKey));
    } else {
      setMyRange(prev => [...prev, handKey]);
    }
  };

  const btnStyle = {
    padding: "6px 12px", fontSize: "12px", fontWeight: "bold", border: "1px solid #cbd5e1",
    borderRadius: "6px", backgroundColor: "white", color: "#334155", cursor: "pointer",
    transition: "all 0.1s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };

  return (
    <div 
      onClick={() => setIsRangeModalOpen(false)} 
      style={{ 
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
        backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", 
        alignItems: "center", zIndex: 1100 
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          backgroundColor: "white", padding: "20px", borderRadius: "12px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "520px", width: "95%", 
          maxHeight: "95vh", overflowY: "auto", boxSizing: "border-box" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px", fontWeight: "bold" }}>マイレンジ設定</h3>
          <button onClick={() => setIsRangeModalOpen(false)} style={{ ...btnStyle, backgroundColor: "#2563eb", color: "white", border: "none" }}>保存して閉じる</button>
        </div>

        <div style={{ backgroundColor: "#f1f5f9", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "center", fontSize: "13px", color: "#1e293b", fontWeight: "bold", border: "1px solid #e2e8f0" }}>
          現在の選択レンジ: <span style={{ color: "#2563eb", fontSize: "16px" }}>{currentPercentage}%</span> 
          <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>({currentCombos} / 1326 コンボ)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", minWidth: "75px" }}>上位を選択:</span>
            {[10, 20, 30, 50, 70].map(pct => (
              <button key={pct} onClick={() => handleSelectPercentage(pct)} style={btnStyle}>
                {pct}%
              </button>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", minWidth: "75px" }}>種類別選択:</span>
            <button onClick={() => setMyRange(HAND_RANKING_ORDER.filter(h => h.length === 2))} style={btnStyle}>ポケットペアのみ</button>
            <button onClick={() => setMyRange(HAND_RANKING_ORDER.filter(h => h.endsWith("s")))} style={btnStyle}>スーテッドのみ</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", minWidth: "75px" }}>全体操作:</span>
            <button onClick={() => setMyRange([...HAND_RANKING_ORDER])} style={{ ...btnStyle, color: "#16a34a", borderColor: "#bbf7d0" }}>全選択 (100%)</button>
            <button onClick={() => setMyRange([])} style={{ ...btnStyle, color: "#dc2626", borderColor: "#fca5a5" }}>全消去 (0%)</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {RANKS.map((rowRank, rowIndex) => (
            <div key={rowRank} style={{ display: "flex", gap: "3px" }}>
              {RANKS.map((colRank, colIndex) => {
                let handKey = "";
                const isPair = rowIndex === colIndex;
                const isSuited = rowIndex < colIndex;

                if (isPair) {
                  handKey = rowRank + colRank;
                } else if (isSuited) {
                  handKey = rowRank + colRank + "s";
                } else {
                  handKey = colRank + rowRank + "o";
                }

                const isSelected = myRange.includes(handKey);
                
                let bgColor = "white";
                if (isSelected) {
                  bgColor = isPair ? "#fef08a" : isSuited ? "#bbf7d0" : "#fed7aa";
                }

                return (
                  <button
                    key={handKey}
                    onClick={() => handleToggleHand(handKey)}
                    style={{
                      flex: 1, aspectRatio: "1", padding: 0, fontSize: "9px", fontWeight: "bold",
                      border: "1px solid #cbd5e1", borderRadius: "3px", backgroundColor: bgColor,
                      color: isSelected ? "#1e293b" : "#64748b", cursor: "pointer",
                      boxShadow: isSelected ? "inset 0 0 4px rgba(0,0,0,0.15)" : "none",
                      transition: "all 0.05s ease"
                    }}
                  >
                    {handKey}
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