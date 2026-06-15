import { useState } from "react";
import { calculateEquity } from "./utilities/simulator";

export default function App() {
  // 計算結果と処理時間を保存するState
  const [result, setResult] = useState(null);
  const [time, setTime] = useState(null);

  const runCalculation = () => {
    // プレイヤー1: AA (スペード・ハート)
    const p1 = { hand: ["As", "Ah"], isRange: false };
    
    // プレイヤー2: KK (スペード・ハート)
    const p2 = { hand: ["Ks", "Kh"], isRange: false };
    
    // ボード (フロップの3枚): 4h, 5s, 10c 
    // ※10は「10」ではなく「T」と書くルールなので "Tc" になります
    const board = ["4h", "5s", "Tc"];

    console.log("フロップの計算を開始します...");
    const startTime = performance.now();

    // 勝率計算の実行（needCardsが2なので、自動的に2重ループの全探索が走ります）
    const equity = calculateEquity(p1, p2, board);

    const endTime = performance.now();
    console.log("計算完了！");

    setResult(equity);
    setTime(endTime - startTime);
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", color: "#333" }}>
      <h1>ポーカー勝率シミュレータ (フロップ計算)</h1>
      
      <div style={{ 
        marginBottom: "20px", 
        padding: "15px", 
        backgroundColor: "#f9f9f9", 
        borderRadius: "6px",
        border: "1px solid #ddd",
        maxWidth: "400px"
      }}>
        <p style={{ margin: "5px 0" }}><strong>Player 1 (AA):</strong> ♠A ♥A</p>
        <p style={{ margin: "5px 0" }}><strong>Player 2 (KK):</strong> ♠K ♥K</p>
        <p style={{ margin: "5px 0", color: "green" }}><strong>Board (Flop):</strong> ♥4 ♠5 ♣10</p>
      </div>

      <button 
        onClick={runCalculation} 
        style={{ 
          padding: "12px 24px", 
          fontSize: "16px", 
          cursor: "pointer",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold"
        }}
      >
        フロップの勝率を計算する (全探索: 990通り)
      </button>

      {/* 結果の表示 */}
      {result && (
        <div style={{ 
          marginTop: "30px", 
          padding: "20px", 
          border: "2px solid #28a745", 
          borderRadius: "8px", 
          maxWidth: "400px",
          backgroundColor: "#fff"
        }}>
          <h2 style={{ marginTop: 0, fontSize: "18px" }}>計算結果</h2>
          <p style={{ fontSize: "20px", color: "blue", margin: "10px 0" }}>
            <strong>Player 1 (AA) 勝率:</strong> {result.p1Equity.toFixed(2)} %
          </p>
          <p style={{ fontSize: "20px", color: "red", margin: "10px 0" }}>
            <strong>Player 2 (KK) 勝率:</strong> {result.p2Equity.toFixed(2)} %
          </p>
          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "15px 0" }} />
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            処理時間: <strong>{time.toFixed(1)} ミリ秒</strong>
          </p>
          <p style={{ color: "#999", fontSize: "12px", marginTop: "5px" }}>
            ※ターンとリバーに配られる残り2枚の全990通りをすべて計算しました。
          </p>
        </div>
      )}
    </div>
  );
}