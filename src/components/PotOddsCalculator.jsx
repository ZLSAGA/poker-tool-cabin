import React, { useState, useEffect } from "react";

const inputStyle = {
  width: "100%", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px", backgroundColor: "#ffffff", color: "#0f172a", boxSizing: "border-box", outline: "none"
};

export default function PotOddsCalculator({ isLoading, potSize, setPotSize, callAmount, setCallAmount, equityHistory }) {
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

  return (
    <div style={{ marginTop: "6px", backgroundColor: "white", padding: "6px 8px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", textAlign: "left" }}>
      <h3 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "11px", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "3px" }}>必要勝率計算機</h3>
      
      {/* 入力フォーム */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "9.5px", color: "#64748b", fontWeight: "bold", marginBottom: "2px" }}>POT</label>
          <input type="number" disabled={isLoading} value={potSize} onChange={(e) => setPotSize(e.target.value)} placeholder="7" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "9.5px", color: "#64748b", fontWeight: "bold", marginBottom: "2px" }}>To call</label>
          <input type="number" disabled={isLoading} value={callAmount} onChange={(e) => setCallAmount(e.target.value)} placeholder="5" style={inputStyle} />
        </div>
      </div>

      {pot > 0 && call > 0 && (
        <div style={{ backgroundColor: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "10px", color: "#334155" }}>
            必要勝率: <strong style={{ fontSize: "13px", color: "#0f172a" }}>{requiredEquity.toFixed(1)}%</strong>
          </p>

          {equityHistory && equityHistory.length > 0 && !isLoading && (
            <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed #cbd5e1" }}>
              
              {/* ストリート選択タブ */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
                {equityHistory.map((item) => {
                  const isSelected = activeItem?.label === item.label;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setSelectedStreet(item.label)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "9.5px",
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
              {activeItem && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#475569" }}>
                    {activeItem.label} の判定結果
                  </div>

                  {/* Player 1 & Player 2 横並び表示 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "9.5px" }}>
                    {/* Player 1 */}
                    {(() => {
                      const diff = activeItem.p1 - requiredEquity;
                      const isPositive = diff >= 0;
                      return (
                        <div style={{
                          backgroundColor: isPositive ? "#f0fdf4" : "#fef2f2",
                          border: `1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}`,
                          borderRadius: "4px",
                          padding: "4px 6px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold", color: "#2563eb" }}>P1: {activeItem.p1.toFixed(1)}%</span>
                            <span style={{ fontWeight: "bold", fontSize: "8.5px", color: isPositive ? "#15803d" : "#b91c1c" }}>
                              {isPositive ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                            </span>
                          </div>
                          <div style={{ fontSize: "8.5px", fontWeight: "bold", color: isPositive ? "#16a34a" : "#dc2626", textAlign: "right" }}>
                            {isPositive ? "EV+" : "EV-"}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Player 2 */}
                    {(() => {
                      const diff = activeItem.p2 - requiredEquity;
                      const isPositive = diff >= 0;
                      return (
                        <div style={{
                          backgroundColor: isPositive ? "#f0fdf4" : "#fef2f2",
                          border: `1px solid ${isPositive ? "#bbf7d0" : "#fecaca"}`,
                          borderRadius: "4px",
                          padding: "4px 6px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold", color: "#dc2626" }}>P2: {activeItem.p2.toFixed(1)}%</span>
                            <span style={{ fontWeight: "bold", fontSize: "8.5px", color: isPositive ? "#15803d" : "#b91c1c" }}>
                              {isPositive ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                            </span>
                          </div>
                          <div style={{ fontSize: "8.5px", fontWeight: "bold", color: isPositive ? "#16a34a" : "#dc2626", textAlign: "right" }}>
                            {isPositive ? "EV+" : "EV-"}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}