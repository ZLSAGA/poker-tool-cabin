import React, { useState, useEffect } from "react";

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#ffffff", color: "#0f172a", boxSizing: "border-box", outline: "none"
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
    <div style={{ marginTop: "25px", backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", textAlign: "left" }}>
      <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "15px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>必要勝率計算機</h3>
      
      {/* 入力フォーム */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "6px" }}>POT</label>
          <input type="number" disabled={isLoading} value={potSize} onChange={(e) => setPotSize(e.target.value)} placeholder="7" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "6px" }}>To call</label>
          <input type="number" disabled={isLoading} value={callAmount} onChange={(e) => setCallAmount(e.target.value)} placeholder="5" style={inputStyle} />
        </div>
      </div>

      {pot > 0 && call > 0 && (
        <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#334155" }}>
            必要勝率: <strong style={{ fontSize: "18px", color: "#0f172a" }}>{requiredEquity.toFixed(1)}%</strong>
          </p>

          {equityHistory && equityHistory.length > 0 && !isLoading && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
              
              {/* ストリート選択タブ */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                {equityHistory.map((item) => {
                  const isSelected = activeItem?.label === item.label;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setSelectedStreet(item.label)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        borderRadius: "6px",
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
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>
                    {activeItem.label} の判定結果
                  </div>

                  {/* Player 1 & Player 2 縦並び表示 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                    {/* Player 1 */}
                    {(() => {
                      const diff = activeItem.p1 - requiredEquity;
                      const isPositive = diff >= 0;
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontWeight: "bold", color: "#3b82f6" }}>Player 1:</span> {activeItem.p1.toFixed(1)}%
                          </div>
                          <span style={{
                            fontWeight: "bold",
                            fontSize: "11px",
                            color: isPositive ? "#15803d" : "#b91c1c",
                            backgroundColor: isPositive ? "#dcfce7" : "#fee2e2",
                            padding: "3px 8px",
                            borderRadius: "4px"
                          }}>
                            {isPositive ? `+${diff.toFixed(1)}% (EV+)` : `${diff.toFixed(1)}% (EV-)`}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Player 2 */}
                    {(() => {
                      const diff = activeItem.p2 - requiredEquity;
                      const isPositive = diff >= 0;
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontWeight: "bold", color: "#ef4444" }}>Player 2:</span> {activeItem.p2.toFixed(1)}%
                          </div>
                          <span style={{
                            fontWeight: "bold",
                            fontSize: "11px",
                            color: isPositive ? "#15803d" : "#b91c1c",
                            backgroundColor: isPositive ? "#dcfce7" : "#fee2e2",
                            padding: "3px 8px",
                            borderRadius: "4px"
                          }}>
                            {isPositive ? `+${diff.toFixed(1)}% (EV+)` : `${diff.toFixed(1)}% (EV-)`}
                          </span>
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