// src/components/PlayingCard.jsx
import React from "react";

/**
 * ポーカーカードをCSSで再現したコンポーネント（位置修正版）
 */
export default function PlayingCard({ cardKey }) {
  if (!cardKey) return null;

  const rankInput = cardKey[0];
  const suitInput = cardKey[1];
  const rank = rankInput === "T" ? "10" : rankInput;

  let suitSymbol = "";
  let color = "#212529";

  switch (suitInput) {
    case "h":
      suitSymbol = "♥";
      color = "#dc3545"; // 赤
      break;
    case "d":
      suitSymbol = "♦";
      color = "#dc3545"; // 赤
      break;
    case "c":
      suitSymbol = "♣";
      color = "#198754"; // 緑（お好みで黒 "#212529" にしてもOK）
      break;
    case "s":
      suitSymbol = "♠";
      color = "#212529"; // 黒
      break;
    default:
      break;
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
      {/* 1. 左上の数字とマーク */}
      <div style={{
        position: "absolute",
        top: "6px",
        left: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: "1.0",
        fontSize: "16px"
      }}>
        <span>{rank}</span>
        <span style={{ fontSize: "12px", marginTop: "1px" }}>{suitSymbol}</span>
      </div>
      
      {/* 2. 中央の大きなシンボルマーク */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "28px",
        lineHeight: "1"
      }}>
        {suitSymbol}
      </div>
      
      {/* 3. 右下の逆向きの数字とマーク */}
      <div style={{
        position: "absolute",
        bottom: "6px",
        right: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: "1.0",
        fontSize: "16px",
        transform: "rotate(180deg)" // 180度ひっくり返す
      }}>
        <span>{rank}</span>
        <span style={{ fontSize: "12px", marginTop: "1px" }}>{suitSymbol}</span>
      </div>
    </div>
  );
}