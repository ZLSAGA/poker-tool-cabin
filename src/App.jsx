// src/App.jsx
import { useState } from "react";
import { calculateEquity } from "./utilities/simulator"; // パスが異なる場合は適宜修正してください
import PlayingCard from "./components/PlayingCard";

// ==========================================
// 1. レンジの定義 (強・標準・弱)
// ==========================================
// 【強】上位 約11% (主要なペアと強いAK,AQなど)
const RANGE_STRONG = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "AKo", "AQo"];

// 【標準】上位 約20% (強レンジ + ミドルペアやスーテッドコネクター)
const RANGE_MEDIUM = [...RANGE_STRONG, "77", "66", "55", "KJs", "QJs", "JTs", "T9s", "98s", "AJo", "ATo", "KQo"];

// 【弱】上位 約35% (標準レンジ + すべてのペアや、より広いスーテッド)
const RANGE_WEAK = [...RANGE_MEDIUM, "44", "33", "22", "A9s", "A8s", "A7s", "A5s", "KTs", "QTs", "J9s", "87s", "76s", "A9o", "KTo", "QTo", "JTo"];

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

// ==========================================
// 2. レンジ選択時に表示する「裏向きカード」UI
// ==========================================
function RangeCardPlaceholder({ label }) {
  return (
    <div style={{
      width: "75px",
      height: "110px",
      backgroundColor: "#2c3e50", // 高級感のあるネイビー（カードの裏面）
      borderRadius: "8px",
      boxShadow: "0 5px 12px rgba(0,0,0,0.3)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      border: "2px solid #ecf0f1",
      color: "white",
      fontWeight: "bold",
      fontSize: "18px",
      userSelect: "none"
    }}>
      {label}
    </div>
  );
}

// ==========================================
// 3. メインコンポーネント
// ==========================================
export default function App() {
  // プルダウンの選択状態を管理 ("strong", "medium", "weak" または 固定ハンド名)
  const [p1Select, setP1Select] = useState("AA");
  const [p2Select, setP2Select] = useState("KK");

  const [result, setResult] = useState(null);
  const [time, setTime] = useState(null);
  const [calcMethod, setCalcMethod] = useState("");

  // ボード (フロップの3枚は固定)
  const board = ["4h", "5s", "Tc"];

  // 選択されたプルダウンの値から、シミュレータに渡すデータを組み立てる関数
  const getPlayerData = (selectValue, defaultHand) => {
    if (selectValue === "strong") {
      return { isRange: true, range: expandRange(RANGE_STRONG), name: "レンジ: 強 (143コンボ)" };
    } else if (selectValue === "medium") {
      return { isRange: true, range: expandRange(RANGE_MEDIUM), name: "レンジ: 標準 (266コンボ)" };
    } else if (selectValue === "weak") {
      return { isRange: true, range: expandRange(RANGE_WEAK), name: "レンジ: 弱 (458コンボ)" };
    } else {
      return { isRange: false, hand: defaultHand, name: `固定ハンド (${selectValue})` };
    }
  };

  // 計算実行ボタンを押した時の処理
  const handleCalculate = () => {
    setResult(null);
    setTime(null);

    const p1Data = getPlayerData(p1Select, ["As", "Ah"]);
    const p2Data = getPlayerData(p2Select, ["Ks", "Kh"]);

    // どちらか片方でもレンジであれば「モンテカルロ法」になる
    if (p1Data.isRange || p2Data.isRange) {
      setCalcMethod("モンテカルロ法 (10万回試行)");
    } else {
      setCalcMethod("全探索 (990通りすべての組み合わせ)");
    }

    const startTime = performance.now();
    const equity = calculateEquity(p1Data, p2Data, board);
    const endTime = performance.now();

    setResult(equity);
    setTime(endTime - startTime);
  };

  // プレイヤーカードのレンダリングを切り替えるヘルパー
  const renderPlayerCards = (selectValue, defaultHand, label) => {
    if (["strong", "medium", "weak"].includes(selectValue)) {
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <RangeCardPlaceholder label={label} />
          <RangeCardPlaceholder label={label} />
        </div>
      );
    } else {
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {defaultHand.map(card => <PlayingCard key={card} cardKey={card} />)}
        </div>
      );
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: "30px" }}>
        ポーカー勝率シミュレータ (レンジ選択機能付き)
      </h1>

      {/* カジノテーブル風エリア */}
      <div style={{
        backgroundColor: "#155724", // 深い緑のラバーマット
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
            {board.map((card) => (
              <PlayingCard key={card} cardKey={card} />
            ))}
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
          
          {/* Player 1 */}
          <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "15px", borderRadius: "10px", width: "48%" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Player 1</h4>
            
            {/* ▼ プルダウンメニュー */}
            <select 
              value={p1Select} 
              onChange={(e) => setP1Select(e.target.value)}
              style={selectStyle}
            >
              <option value="AA">固定ハンド: AA</option>
              <option value="strong">レンジ: 強 (上位11%)</option>
              <option value="medium">レンジ: 標準 (上位20%)</option>
              <option value="weak">レンジ: 弱 (上位35%)</option>
            </select>

            {renderPlayerCards(p1Select, ["As", "Ah"], p1Select === "strong" ? "強" : p1Select === "medium" ? "標準" : "弱")}
            
            {result && (
              <div style={{ marginTop: "15px", fontSize: "26px", fontWeight: "bold", color: "#66b0ff" }}>
                {result.p1Equity.toFixed(2)} %
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "15px", borderRadius: "10px", width: "48%" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Player 2</h4>
            
            {/* ▼ プルダウンメニュー */}
            <select 
              value={p2Select} 
              onChange={(e) => setP2Select(e.target.value)}
              style={selectStyle}
            >
              <option value="KK">固定ハンド: KK</option>
              <option value="strong">レンジ: 強 (上位11%)</option>
              <option value="medium">レンジ: 標準 (上位20%)</option>
              <option value="weak">レンジ: 弱 (上位35%)</option>
            </select>

            {renderPlayerCards(p2Select, ["Ks", "Kh"], p2Select === "strong" ? "強" : p2Select === "medium" ? "標準" : "弱")}

            {result && (
              <div style={{ marginTop: "15px", fontSize: "26px", fontWeight: "bold", color: "#ff6b6b" }}>
                {result.p2Equity.toFixed(2)} %
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 計算ボタンエリア */}
      <div style={{ textAlign: "center" }}>
        <button onClick={handleCalculate} style={calcBtnStyle}>
          このシチュエーションの勝率を計算する
        </button>

        {time !== null && (
          <div style={{ marginTop: "20px", color: "#444", fontSize: "14px" }}>
            <p style={{ margin: "5px 0" }}>計算手法: <strong>{calcMethod}</strong></p>
            <p style={{ margin: "5px 0" }}>処理時間: <strong>{time.toFixed(1)} ミリ秒</strong></p>
          </div>
        )}
      </div>

    </div>
  );
}

// プルダウン用スタイル
const selectStyle = {
  padding: "8px 10px",
  fontSize: "14px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  backgroundColor: "white",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "15px",
  width: "100%",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

// ボタン用スタイル
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