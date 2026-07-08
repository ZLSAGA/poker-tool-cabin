// src/components/PlayingCard.jsx
import React from "react";

/**
 * レスポンシブ対応版：ポーカーカードコンポーネント
 */
export default function PlayingCard({ cardKey }) {
  // スタイル共通設定：コンテナの幅に対して相対的にサイズを決める単位 (cqi) を使用
  const cardBaseStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8cqi", // 幅の8%を角丸に
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    boxSizing: "border-box",
    position: "relative",
  };

  // ▼ 未選択（空文字列など）の場合
  if (!cardKey || cardKey === "") {
    return (
      <div style={{
        ...cardBaseStyle,
        backgroundColor: "#f8fafc",
        border: "2px dashed #cbd5e1",
        color: "#94a3b8",
        fontWeight: "bold",
        fontSize: "40cqi", // 枠の幅に合わせて「？」も伸縮
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
    case "h": suitSymbol = "♥"; color = "#e11d48"; break; // 赤
    case "d": suitSymbol = "♦"; color = "#2563eb"; break; // 青
    case "c": suitSymbol = "♣"; color = "#16a34a"; break; // 緑
    case "s": suitSymbol = "♠"; color = "#1a1a1a"; break; // 黒
    default: break;
  }

  return (
    <div style={{
      ...cardBaseStyle,
      backgroundColor: "white",
      boxShadow: "0 4cqi 10cqi rgba(0,0,0,0.2)",
      color: color,
      border: "1px solid #cbd5e1",
      fontFamily: "sans-serif",
      fontWeight: "bold",
    }}>
      {/* 左上の数字とマーク */}
      <div style={{ 
        position: "absolute", 
        top: "6cqi", 
        left: "8cqi", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        lineHeight: "0.9" 
      }}>
        <span style={{ fontSize: "22cqi" }}>{rank}</span>
        <span style={{ fontSize: "16cqi" }}>{suitSymbol}</span>
      </div>
      
      {/* 中央の大きなマーク */}
      <div style={{ 
        fontSize: "45cqi", 
        lineHeight: "1",
        opacity: 0.9 
      }}>
        {suitSymbol}
      </div>
      
      {/* 右下の逆向きの数字とマーク */}
      <div style={{ 
        position: "absolute", 
        bottom: "6cqi", 
        right: "8cqi", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        lineHeight: "0.9", 
        transform: "rotate(180deg)" 
      }}>
        <span style={{ fontSize: "22cqi" }}>{rank}</span>
        <span style={{ fontSize: "16cqi" }}>{suitSymbol}</span>
      </div>
    </div>
  );
}