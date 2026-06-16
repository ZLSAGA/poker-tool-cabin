// src/App.jsx
import { useState } from "react";
import { calculateEquity } from "./utilities/simulator";
import PlayingCard from "./components/PlayingCard"; // ← ステップ1で作った自作カードをインポート

// レンジ文字列を具体的なコンボに展開するヘルパー関数
function expandRange(rangeArray) {
  const suits = ['h', 'd', 'c', 's'];
  const combos = [];
  rangeArray.forEach(pair => {
    if (pair.length === 2) {
      const r = pair[0];
      for (let i = 0; i < suits.length; i++) {
        for (let j = i + 1; j < suits.length; j++) {
          combos.push([`${r}${suits[i]}`, `${r}${suits[j]}`]);
        }
      }
    } else if (pair.endsWith('s')) {
      const r1 = pair[0]; const r2 = pair[1];
      suits.forEach(s => combos.push([`${r1}${s}`, `${r2}${s}`]));
    } else if (pair.endsWith('o')) {
      const r1 = pair[0]; const r2 = pair[1];
      suits.forEach(s1 => {
        suits.forEach(s2 => {
          if (s1 !== s2) combos.push([`${r1}${s1}`, `${r2}${s2}`]);
        });
      });
    }
  });
  return combos;
}

export default function App() {
  const [result, setResult] = useState(null);
  const [time, setTime] = useState(null);
  const [testMode, setTestMode] = useState(""); 
  const [gameState, setGameState] = useState({
    p1Name: "Player 1",
    p2Name: "Player 2",
    p1DisplayCards: [], // 画面表示用のカード
    p2DisplayCards: [],
    board: []
  });

  // 広いレンジの定義
  const broadRangeP1 = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "AKo", "AQo"];
  const broadRangeP2 = ["77", "66", "55", "AQs", "AJs", "ATs", "KQs", "KJs", "QJs", "JTs", "T9s", "98s", "AQo"];

  // 【モード1】前回成功した「ハンド vs ハンド (フロップあり)」
  const setupHandVsHandFlop = () => {
    setResult(null);
    setTestMode("exact"); // 全探索モード
    setGameState({
      p1Name: "Player 1 (AA)",
      p2Name: "Player 2 (KK)",
      p1DisplayCards: ["As", "Ah"],
      p2DisplayCards: ["Ks", "Kh"],
      board: ["4h", "5s", "Tc"],
      p1Data: { hand: ["As", "Ah"], isRange: false },
      p2Data: { hand: ["Ks", "Kh"], isRange: false }
    });
  };

  // 【モード2】リクエストの「広いレンジ vs 広いレンジ (フロップあり)」
  const setupBroadVsBroadFlop = () => {
    setResult(null);
    setTestMode("montecarlo"); // モンテカルロモード
    setGameState({
      p1Name: "Player 1 (広いレンジ: 15%)",
      p2Name: "Player 2 (広いレンジ: 10%)",
      p1DisplayCards: ["As", "Ac"], // レンジの代表としてAAを表示（裏向きカード画像にしても良い）
      p2DisplayCards: ["Qc", "Jc"], // レンジの代表としてQJsを表示
      board: ["Jc", "Tc", "9d"],    // ウェットなフロップボード
      p1Data: { isRange: true, range: expandRange(broadRangeP1) },
      p2Data: { isRange: true, range: expandRange(broadRangeP2) }
    });
  };

  // 計算実行
  const runCalculation = () => {
    if (!gameState.p1Data) return;
    
    const startTime = performance.now();
    const equity = calculateEquity(gameState.p1Data, gameState.p2Data, gameState.board);
    const endTime = performance.now();

    setResult(equity);
    setTime(endTime - startTime);
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: "20px" }}>
        ポーカー勝率シミュレータ
      </h1>

      {/* テストシチュエーションの切り替えボタン */}
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
        <button onClick={setupHandVsHandFlop} style={modeBtnStyle(gameState.p1Name.includes("AA"))}>
          シチュエーション①: AA vs KK (フロップ固定)
        </button>
        <button onClick={setupBroadVsBroadFlop} style={modeBtnStyle(gameState.p1Name.includes("広い"))}>
          シチュエーション②: 広いレンジ vs 広いレンジ (フロップ固定)
        </button>
      </div>

      {gameState.p1Data ? (
        <>
          {/* ポーカーテーブル */}
          <div style={{
            backgroundColor: "#155724",
            padding: "30px",
            borderRadius: "15px",
            maxWidth: "650px",
            margin: "0 auto 30px auto",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
            color: "white"
          }}>
            
            {/* コミュニティボード */}
            <div style={{ marginBottom: "35px", textAlign: "center" }}>
              <h3 style={{ borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: "8px", color: "#ffc107", marginTop: 0 }}>
                COMMUNITY BOARD
              </h3>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "15px" }}>
                {gameState.board.map((card) => (
                  <PlayingCard key={card} cardKey={card} />
                ))}
              </div>
            </div>

            {/* プレイヤーエリア */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
              
              {/* Player 1 */}
              <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "15px", borderRadius: "10px", width: "48%" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "15px" }}>{gameState.p1Name}</h4>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                  {gameState.p1DisplayCards.map((card) => (
                    <PlayingCard key={card} cardKey={card} />
                  ))}
                </div>
                {/* レンジ表示用補足 */}
                {gameState.p1Data.isRange && <p style={{ fontSize: "11px", margin: "5px 0 0 0", color: "#ccc" }}>※全130コンボの範囲</p>}
                
                {result && (
                  <div style={{ marginTop: "15px", fontSize: "26px", fontWeight: "bold", color: "#66b0ff" }}>
                    {result.p1Equity.toFixed(2)} %
                  </div>
                )}
              </div>

              {/* Player 2 */}
              <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "15px", borderRadius: "10px", width: "48%" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "15px" }}>{gameState.p2Name}</h4>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                  {gameState.p2DisplayCards.map((card) => (
                    <PlayingCard key={card} cardKey={card} />
                  ))}
                </div>
                {gameState.p2Data.isRange && <p style={{ fontSize: "11px", margin: "5px 0 0 0", color: "#ccc" }}>※全104コンボの範囲</p>}

                {result && (
                  <div style={{ marginTop: "15px", fontSize: "26px", fontWeight: "bold", color: "#ff6b6b" }}>
                    {result.p2Equity.toFixed(2)} %
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 計算ボタン */}
          <div style={{ textAlign: "center" }}>
            <button onClick={runCalculation} style={calcBtnStyle}>
              このシチュエーションの勝率を計算する
            </button>

            {time !== null && (
              <p style={{ color: "#666", marginTop: "18px", fontSize: "14px" }}>
                計算手法: <strong>{testMode === "exact" ? "全探索" : "モンテカルロ法 (10万回)"}</strong> | 
                処理 time: <strong>{time.toFixed(1)} ミリ秒</strong>
              </p>
            )}
          </div>
        </>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>上のボタンを押して、テストしたいシチュエーションを選択してください。</p>
      )}
    </div>
  );
}

// スタイリング用ヘルパー
const modeBtnStyle = (isActive) => ({
  padding: "10px 18px",
  fontSize: "14px",
  cursor: "pointer",
  backgroundColor: isActive ? "#007bff" : "#fff",
  color: isActive ? "white" : "#333",
  border: "1px solid #ccc",
  borderRadius: "20px",
  fontWeight: "bold",
  boxShadow: isActive ? "0 4px 6px rgba(0,123,255,0.2)" : "none"
});

const calcBtnStyle = {
  padding: "14px 35px",
  fontSize: "18px",
  cursor: "pointer",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  boxShadow: "0 4px 10px rgba(40,167,69,0.3)"
};