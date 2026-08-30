import React, { useState, useEffect } from "react";

const inputStyle = {
  width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px", backgroundColor: "#ffffff", color: "#0f172a", boxSizing: "border-box", outline: "none"
};

export default function PotOddsCalculator({ isLoading, potSize, setPotSize, callAmount, setCallAmount, equityHistory, windowSize }) {
  const pot = parseFloat(potSize) || 0;
  const call = parseFloat(callAmount) || 0;
  const totalPot = pot + call;
  const requiredEquity = totalPot > 0 ? (call / totalPot) * 100 : 0;

  // 選択中のストリート名（初期値は null）
  const [selectedStreet, setSelectedStreet] = useState(null);

  // equityHistory が更新されたら、自動的に最新（最後の）ストリートを選択
  useEffect(() => {
    if (equityHistory && equityHistory.length > 0) {
      setSelectedStreet(equityHistory[equityHistory.length - 1].label);
    }
  }, [equityHistory]);

  // 選択されたストリートのデータを取得
  const activeItem = equityHistory?.find(item => item.label === selectedStreet) || equityHistory?.[equityHistory.length - 1];

  // ウィンドウ縦幅(windowSize?.height / vh)に連動する動的スタイル計算
  const vh = windowSize?.height ? windowSize.height * 0.01 : 7.68;
  const dynamicPadding = `${Math.max(4, Math.round(vh * 0.8))}px ${Math.max(6, Math.round(vh * 1.0))}px`;
  const dynamicInnerPadding = `${Math.max(4, Math.round(vh * 0.8))}px ${Math.max(6, Math.round(vh * 1.0))}px`;
  const dynamicMarginTop = `${Math.max(4, Math.round(vh * 0.8))}px`;
  const dynamicGap = `${Math.max(4, Math.round(vh * 0.6))}px`;
  const dynamicInputPadding = `${Math.max(2, Math.round(vh * 0.5))}px ${Math.max(4, Math.round(vh * 0.8))}px`;
  const dynamicTitleFontSize = "clamp(10px, 12vh, 13px)";
  const dynamicLabelFontSize = "clamp(8.5px, 10vh, 11px)";
  const dynamicValueFontSize = "clamp(11px, 14vh, 15px)";
  const dynamicButtonFontSize = "clamp(8.5px, 10vh, 11px)";

  const inputStyle = {
    width: "100%", padding: dynamicInputPadding, borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: dynamicLabelFontSize, backgroundColor: "#ffffff", color: "#0f172a", boxSizing: "border-box", outline: "none"
  };

  return (
    <div style={{ marginTop: dynamicMarginTop, backgroundColor: "white", padding: dynamicPadding, borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", textAlign: "left", boxSizing: "border-box" }}>
      <h3 style={{ margin: `0 0 ${dynamicMarginTop} 0`, color: "#1e293b", fontSize: dynamicTitleFontSize, borderBottom: "1.5px solid #f1f5f9", paddingBottom: "0.4vh" }}>必要勝率計算機</h3>
      
      {/* 入力フォーム */}
      <div style={{ display: "flex", gap: dynamicGap, marginBottom: dynamicMarginTop }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: dynamicLabelFontSize, color: "#64748b", fontWeight: "bold", marginBottom: "0.3vh" }}>POT</label>
          <input type="number" disabled={isLoading} value={potSize} onChange={(e) => setPotSize(e.target.value)} placeholder="7" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: dynamicLabelFontSize, color: "#64748b", fontWeight: "bold", marginBottom: "0.3vh" }}>To call</label>
          <input type="number" disabled={isLoading} value={callAmount} onChange={(e) => setCallAmount(e.target.value)} placeholder="5" style={inputStyle} />
        </div>
      </div>

      {pot > 0 && call > 0 && (
        <div style={{ backgroundColor: "#f8fafc", padding: dynamicInnerPadding, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: `0 0 ${dynamicMarginTop} 0`, fontSize: dynamicLabelFontSize, color: "#334155" }}>
            必要勝率: <strong style={{ fontSize: dynamicValueFontSize, color: "#0f172a" }}>{requiredEquity.toFixed(1)}%</strong>
          </p>

          {/* ストリート選択タブ・判定結果カード (初期状態でも常に表示) */}
          {(() => {
            const displayHistory = (equityHistory && equityHistory.length > 0 && !isLoading)
              ? equityHistory
              : [{ label: "Preflop", p1: 0, p2: 0 }];
            
            const currentItem = displayHistory.find(item => item.label === selectedStreet) || displayHistory[displayHistory.length - 1];

            return (
              <div style={{ marginTop: dynamicMarginTop, paddingTop: dynamicMarginTop, borderTop: "1px dashed #cbd5e1" }}>
                
                {/* ストリート選択タブ */}
                <div style={{ display: "flex", gap: "4px", marginBottom: dynamicMarginTop, flexWrap: "wrap" }}>
                  {displayHistory.map((item) => {
                    const isSelected = currentItem?.label === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setSelectedStreet(item.label)}
                        style={{
                          padding: `${Math.max(2, Math.round(vh * 0.3))}px ${Math.max(4, Math.round(vh * 0.8))}px`,
                          fontSize: dynamicButtonFontSize,
                          fontWeight: "bold",
                          borderRadius: "4px",
                          border: "1px solid",
                          borderColor: isSelected ? "#2563eb" : "#cbd5e1",
                          backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* 選択されたストリートの判定結果カード */}
                {currentItem && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: dynamicInnerPadding,
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: dynamicGap
                    }}
                  >
                    <div style={{ fontSize: dynamicLabelFontSize, fontWeight: "bold", color: "#475569" }}>
                      {currentItem.label} の判定結果
                    </div>

                    {/* Player 1 & Player 2 横並び表示 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: dynamicGap, fontSize: dynamicLabelFontSize }}>
                      {/* Player 1 */}
                      {(() => {
                        const p1Val = currentItem.p1Equity !== undefined ? currentItem.p1Equity : (currentItem.p1 || 0);
                        const diff = p1Val - requiredEquity;
                        const isPositive = diff >= 0;
                        return (
                          <div style={{
                            backgroundColor: isPositive ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: "4px",
                            padding: `${Math.max(3, Math.round(vh * 0.5))}px ${Math.max(4, Math.round(vh * 0.8))}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "bold", color: "#2563eb" }}>P1: {p1Val.toFixed(1)}%</span>
                              <span style={{ fontWeight: "bold", fontSize: "clamp(7.5px, 9vh, 10px)", color: isPositive ? "#15803d" : "#b91c1c" }}>
                                {isPositive ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </div>
                            <div style={{ fontSize: "clamp(7.5px, 9vh, 10px)", fontWeight: "bold", color: isPositive ? "#16a34a" : "#dc2626", textAlign: "right" }}>
                              {isPositive ? "EV+" : "EV-"}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Player 2 */}
                      {(() => {
                        const p2Val = currentItem.p2Equity !== undefined ? currentItem.p2Equity : (currentItem.p2 || 0);
                        const diff = p2Val - requiredEquity;
                        const isPositive = diff >= 0;
                        return (
                          <div style={{
                            backgroundColor: isPositive ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: "4px",
                            padding: `${Math.max(3, Math.round(vh * 0.5))}px ${Math.max(4, Math.round(vh * 0.8))}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "bold", color: "#dc2626" }}>P2: {p2Val.toFixed(1)}%</span>
                              <span style={{ fontWeight: "bold", fontSize: "clamp(7.5px, 9vh, 10px)", color: isPositive ? "#15803d" : "#b91c1c" }}>
                                {isPositive ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              </span>
                            </div>
                            <div style={{ fontSize: "clamp(7.5px, 9vh, 10px)", fontWeight: "bold", color: isPositive ? "#16a34a" : "#dc2626", textAlign: "right" }}>
                              {isPositive ? "EV+" : "EV-"}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}