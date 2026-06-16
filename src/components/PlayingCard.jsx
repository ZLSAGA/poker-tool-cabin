// src/components/PlayingCard.jsx
import React from "react";

/**
 * ポーカーカードをCSSで再現したコンポーネント（未選択 "?" 対応版）
 */
export default function PlayingCard({ cardKey }) {
  // ▼ カードが未選択（空文字列など）の場合は「？」マークの空枠カードを表示
  if (!cardKey || cardKey === "") {
    return (
      <div style={{
        width: "75px",
        height: "110px",
        backgroundColor: "#e9ecef", // 薄いグレー
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        border: "2px dashed #cbd5e1", // おしゃれな点線枠
        color: "#94a3b8",
        fontWeight: "bold",
        fontSize: "28px",
        userSelect: "none"
      }}>
        ?
      </div>
    );
  }

  const rankInput = cardKey[0];
  const suitInput = cardKey[1];
  const rank = rankInput === "T" ? "10" : rankInput;

  let suitSymbol = "";
  let color = "#212529";

  switch (suitInput) {
    case "h": suitSymbol = "♥"; color = "red"; break;
    case "d": suitSymbol = "♦"; color = "blue"; break;
    case "c": suitSymbol = "♣"; color = "green"; break;
    case "s": suitSymbol = "♠"; color = "black"; break;
    default: break;
  }

  return (
    <div style={{
      width: "75px",
      height: "110px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 5px 12px rgba(0,0,0,0.3)",
      position: "relative",
      boxSizing: "border-box",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: "bold",
      color: color,
      userSelect: "none",
      border: "1px solid #ccc"
    }}>
      {/* 左上の数字とマーク */}
      <div style={{ position: "absolute", top: "6px", left: "8px", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: "1.0", fontSize: "16px" }}>
        <span>{rank}</span>
        <span style={{ fontSize: "12px", marginTop: "1px" }}>{suitSymbol}</span>
      </div>
      
      {/* 中央の大きなマーク */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "28px", lineHeight: "1" }}>
        {suitSymbol}
      </div>
      
      {/* 右下の逆向きの数字とマーク */}
      <div style={{ position: "absolute", bottom: "6px", right: "8px", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: "1.0", fontSize: "16px", transform: "rotate(180deg)" }}>
        <span>{rank}</span>
        <span style={{ fontSize: "12px", marginTop: "1px" }}>{suitSymbol}</span>
      </div>
    </div>
  );
}