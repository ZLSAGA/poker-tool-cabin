import React from "react";

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#ffffff", color: "#0f172a", boxSizing: "border-box", outline: "none"
};

export default function PotOddsCalculator({ isLoading, potSize, setPotSize, callAmount, setCallAmount, result }) {
  const pot = parseFloat(potSize) || 0;
  const call = parseFloat(callAmount) || 0;
  const totalPot = pot + call;
  const requiredEquity = totalPot > 0 ? (call / totalPot) * 100 : 0;

  return (
    <div style={{ marginTop: "25px", backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", textAlign: "left" }}>
      <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "15px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>必要勝率計算機</h3>
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
          <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#334155" }}>
            必要勝率:<strong style={{ fontSize: "18px", color: "#0f172a" }}>{requiredEquity.toFixed(1)}%</strong>
          </p>
          {result && !isLoading && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <div>
                  <span style={{ fontWeight: "bold", color: "#3b82f6" }}>Player 1:</span> 現勝率 {result.p1Equity.toFixed(1)}%
                  {result.p1Equity >= requiredEquity ? <span style={{ color: "#16a34a", fontWeight: "bold", marginLeft: "8px" }}>+EV</span> : <span style={{ color: "#dc2626", fontWeight: "bold", marginLeft: "8px" }}>-EV</span>}
                </div>
                <div>
                  <span style={{ fontWeight: "bold", color: "#ef4444" }}>Player 2:</span> 現勝率 {result.p2Equity.toFixed(1)}%
                  {result.p2Equity >= requiredEquity ? <span style={{ color: "#16a34a", fontWeight: "bold", marginLeft: "8px" }}>+EV</span> : <span style={{ color: "#dc2626", fontWeight: "bold", marginLeft: "8px" }}>-EV</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}