import { useState } from "react";
import { calculateEquity } from "./utilities/simulator";
import PlayingCard from "./components/PlayingCard";

// ==========================================
// 1. マトリックス表示用の定数・ヘルパー定義
// ==========================================
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const SUITS = [
  { key: 's', symbol: '♠', color: 'black' }, // 黒 (Spade)
  { key: 'h', symbol: '♥', color: 'red' },   // 赤 (Heart)
  { key: 'd', symbol: '♦', color: 'blue' },  // 青 (Diamond)
  { key: 'c', symbol: '♣', color: 'green' }  // 緑 (Club)
];

// レンジ定義
const RANGE_STRONG = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "AKo", "AQo"];
const RANGE_MEDIUM = [...RANGE_STRONG, "77", "66", "55", "KJs", "QJs", "JTs", "T9s", "98s", "AJo", "ATo", "KQo"];
const RANGE_WEAK = [...RANGE_MEDIUM, "44", "33", "22", "A9s", "A8s", "A7s", "A5s", "KTs", "QTs", "J9s", "87s", "76s", "A9o", "KTo", "QTo", "JTo"];

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

function getAnyRange() {
  const deck = [];
  RANKS.forEach(r => SUITS.forEach(s => deck.push(`${r}${s.key}`)));
  const combos = [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      combos.push([deck[i], deck[j]]);
    }
  }
  return combos;
}

function RangeCardPlaceholder({ label }) {
  return (
    <div style={{
      width: "75px",
      height: "110px",
      backgroundColor: "#2c3e50",
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
// 2. メインコンポーネント
// ==========================================
export default function App() {
  const [p1Select, setP1Select] = useState("custom");
  const [p2Select, setP2Select] = useState("custom");

  const [p1Hand, setP1Hand] = useState(["", ""]);
  const [p2Hand, setP2Hand] = useState(["", ""]);
  const [board, setBoard] = useState(["", "", "", "", ""]);
  const [activeSlot, setActiveSlot] = useState({ target: "p1", index: 0 });

  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [time, setTime] = useState(null);
  const [calcMethod, setCalcMethod] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [myRange, setMyRange] = useState([]);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  const [outs, setOuts] = useState(null);

  const [potSize, setPotSize] = useState("7");
  const [callAmount, setCallAmount] = useState("5");

  const pot = parseFloat(potSize) || 0;
  const call = parseFloat(callAmount) || 0;
  const totalPot = pot + call;
  const requiredEquity = totalPot > 0 ? (call / totalPot) * 100 : 0;

  const usedCards = [
    ...(p1Select === "custom" ? p1Hand.filter(Boolean) : []),
    ...(p2Select === "custom" ? p2Hand.filter(Boolean) : []),
    ...board.filter(Boolean)
  ];

  // アウツの個別カードを描画するヘルパー関数
  const renderOutCard = (cardKey) => {
    const rank = cardKey[0] === "T" ? "10" : cardKey[0];
    const suitKey = cardKey[1];
    const suit = SUITS.find(s => s.key === suitKey);
    return (
      <span key={cardKey} style={{
        display: "inline-block",
        backgroundColor: "white",
        color: suit ? suit.color : "#333",
        padding: "2px 5px",
        borderRadius: "4px",
        border: "1px solid #cbd5e1",
        fontWeight: "bold",
        fontSize: "11px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        {suit ? suit.symbol : ""}{rank}
      </span>
    );
  };

  const saveToHistory = () => {
    setHistory(prev => [
      ...prev,
      {
        board: [...board],
        p1Hand: [...p1Hand],
        p2Hand: [...p2Hand],
        activeSlot: activeSlot ? { ...activeSlot } : null
      }
    ]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setBoard(previousState.board);
    setP1Hand(previousState.p1Hand);
    setP2Hand(previousState.p2Hand);
    setActiveSlot(previousState.activeSlot);
    setErrorMessage("");
  };

  const handleSelectCard = (cardKey) => {
    if (!activeSlot) return;
    const { target, index } = activeSlot;

    if (usedCards.includes(cardKey)) {
      let currentSlotCard = "";
      if (target === "p1") currentSlotCard = p1Hand[index];
      if (target === "p2") currentSlotCard = p2Hand[index];
      if (target === "board") currentSlotCard = board[index];
      if (currentSlotCard !== cardKey) return;
    }

    saveToHistory();
    setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand];
      nextHand[index] = cardKey;
      setP1Hand(nextHand);
      if (index === 0) {
        setActiveSlot({ target: "p1", index: 1 });
      } else if (p2Select === "custom" && p2Hand.includes("")) {
        setActiveSlot({ target: "p2", index: p2Hand.indexOf("") });
      } else {
        setActiveSlot({ target: "board", index: board.indexOf("") !== -1 ? board.indexOf("") : 0 });
      }
    } else if (target === "p2") {
      const nextHand = [...p2Hand];
      nextHand[index] = cardKey;
      setP2Hand(nextHand);
      if (index === 0) {
        setActiveSlot({ target: "p2", index: 1 });
      } else {
        setActiveSlot({ target: "board", index: board.indexOf("") !== -1 ? board.indexOf("") : 0 });
      }
    } else if (target === "board") {
      const nextBoard = [...board];
      nextBoard[index] = cardKey;
      setBoard(nextBoard);
      if (index < 4) {
        setActiveSlot({ target: "board", index: index + 1 });
      } else {
        setActiveSlot(null);
      }
    }
  };

  const handleClearSlot = () => {
    if (!activeSlot) return;
    const { target, index } = activeSlot;

    let currentCard = "";
    if (target === "p1") currentCard = p1Hand[index];
    if (target === "p2") currentCard = p2Hand[index];
    if (target === "board") currentCard = board[index];
    if (currentCard === "") return;

    saveToHistory();
    setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand]; nextHand[index] = ""; setP1Hand(nextHand);
      if (index === 0) {
        setActiveSlot({ target: "p1", index: 1 });
      } else if (p2Select === "custom" && p2Hand.includes("")) {
        setActiveSlot({ target: "p2", index: p2Hand.indexOf("") });
      } else {
        setActiveSlot({ target: "board", index: board.indexOf("") !== -1 ? board.indexOf("") : 0 });
      }
    } else if (target === "p2") {
      const nextHand = [...p2Hand]; nextHand[index] = ""; setP2Hand(nextHand);
      if (index === 0) {
        setActiveSlot({ target: "p2", index: 1 });
      } else {
        setActiveSlot({ target: "board", index: board.indexOf("") !== -1 ? board.indexOf("") : 0 });
      }
    } else if (target === "board") {
      const nextBoard = [...board]; nextBoard[index] = ""; setBoard(nextBoard);
      if (index < 4) {
        setActiveSlot({ target: "board", index: index + 1 });
      } else {
        setActiveSlot(null);
      }
    }
  };

  const handleClearAll = () => {
    const isAllEmpty = board.every(c => c === "") && p1Hand.every(c => c === "") && p2Hand.every(c => c === "");
    if (isAllEmpty) return;

    saveToHistory();

    setBoard(["", "", "", "", ""]);
    setP1Hand(["", ""]);
    setP2Hand(["", ""]);
    setActiveSlot({ target: "p1", index: 0 });
    setResult(null);
    setTime(null);
    setErrorMessage("");
    setOuts(null);
  };

  const getPlayerData = (selectValue, customHand) => {
    if (selectValue === "strong") return { isRange: true, range: expandRange(RANGE_STRONG) };
    if (selectValue === "medium") return { isRange: true, range: expandRange(RANGE_MEDIUM) };
    if (selectValue === "weak") return { isRange: true, range: expandRange(RANGE_WEAK) };
    if (selectValue === "any") return { isRange: true, range: getAnyRange() };
    if (selectValue === "myRange") return { isRange: true, range: expandRange(myRange) };
    return { isRange: false, hand: customHand };
  };

  const handleCalculate = () => {
    setResult(null);
    setTime(null);
    setErrorMessage("");
    setOuts(null);

    const currentBoard = board.filter(c => c !== "");

    if (p1Select === "custom" && (p1Hand[0] === "" || p1Hand[1] === "")) {
      setErrorMessage("Player 1 のカードを2枚選んでください。");
      return;
    }
    if (p2Select === "custom" && (p2Hand[0] === "" || p2Hand[1] === "")) {
      setErrorMessage("Player 2 のカードを2枚選んでください。");
      return;
    }

    let p1Data = getPlayerData(p1Select, p1Hand);
    let p2Data = getPlayerData(p2Select, p2Hand);

    const startTime = performance.now();
    const equityResult = calculateEquity(p1Data, p2Data, currentBoard);
    const endTime = performance.now();

    setCalcMethod(equityResult.calcMethod);
    setResult(equityResult);
    setTime(endTime - startTime);

    if (p1Select === "custom" && p2Select === "custom" && (currentBoard.length === 3 || currentBoard.length === 4)) {
      const allCards = [];
      RANKS.forEach(r => SUITS.forEach(s => allCards.push(`${r}${s.key}`)));
      const remainingCards = allCards.filter(c => !usedCards.includes(c));

      const p1OutsList = [];
      const p2OutsList = [];

      remainingCards.forEach(card => {
        const nextBoard = [...currentBoard, card];
        const testResult = calculateEquity(p1Data, p2Data, nextBoard);

        if (testResult.p1Equity > testResult.p2Equity && equityResult.p1Equity <= equityResult.p2Equity) {
          p1OutsList.push(card);
        }
        if (testResult.p2Equity > testResult.p1Equity && equityResult.p2Equity <= equityResult.p1Equity) {
          p2OutsList.push(card);
        }
      });

      setOuts({ p1: p1OutsList, p2: p2OutsList });
    }
  };

  const getSlotStyle = (target, index) => {
    const isActive = activeSlot && activeSlot.target === target && activeSlot.index === index;
    return {
      cursor: "pointer",
      position: "relative",
      borderRadius: "8px",
      transition: "all 0.15s ease-in-out",
      outline: isActive ? "3px solid #ffc107" : "none",
      outlineOffset: isActive ? "2px" : "0px",
      boxShadow: isActive ? "0 0 15px rgba(255,193,7,0.6)" : "none",
      transform: isActive ? "scale(1.04)" : "scale(1)"
    };
  };

  const getRangeLabel = (val) => {
    if (val === "strong") return "強";
    if (val === "medium") return "標準";
    if (val === "weak") return "弱";
    if (val === "any") return "Any";
    if (val === "myRange") return "マイ";
    return "";
  };

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100vw",
      minHeight: "100vh",
      margin: 0,
      padding: "20px",
      fontFamily: "sans-serif",
      backgroundColor: "#f4f6f9",
      boxSizing: "border-box"
    }}>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: "5px", marginTop: "0px" }}>ポーカー勝率シミュレータ</h1>
      <p style={{ textAlign: "center", color: "#475569", fontWeight: "bold", fontSize: "14px", marginBottom: "30px" }}>
        枠を選択し、右側の52枚のカードマトリックスからクリックしてはめ込んでください。
      </p>

      <div style={{ display: "flex", gap: "25px", maxWidth: "1200px", margin: "0 auto", alignItems: "flex-start" }}>

        {/* 【左カラム】シミュレータ＆計算コントロール */}
        <div style={{ flex: "1.2", minWidth: "550px" }}>

          <div style={{ backgroundColor: "#155724", padding: "20px 25px", borderRadius: "15px", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", color: "white", marginBottom: "25px" }}>

            {/* コミュニティボード */}
            <div style={{ marginBottom: "5px", textAlign: "center" }}>
              <h3 style={{ borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: "6px", color: "#ffc107", marginTop: 0, fontSize: "13px", letterSpacing: "1px" }}>
                COMMUNITY BOARD
              </h3>

              {/* 5枚のコミュニティカード */}
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center", marginTop: "12px" }}>
                <div onClick={() => setActiveSlot({ target: "board", index: 0 })} style={getSlotStyle("board", 0)}>
                  <PlayingCard cardKey={board[0]} /><span style={miniLabelStyle}>Flop 1</span>
                </div>
                <div onClick={() => setActiveSlot({ target: "board", index: 1 })} style={getSlotStyle("board", 1)}>
                  <PlayingCard cardKey={board[1]} /><span style={miniLabelStyle}>Flop 2</span>
                </div>
                <div onClick={() => setActiveSlot({ target: "board", index: 2 })} style={getSlotStyle("board", 2)}>
                  <PlayingCard cardKey={board[2]} /><span style={miniLabelStyle}>Flop 3</span>
                </div>
                <div style={dividerStyle} />
                <div onClick={() => setActiveSlot({ target: "board", index: 3 })} style={getSlotStyle("board", 3)}>
                  <PlayingCard cardKey={board[3]} /><span style={miniLabelStyle}>Turn</span>
                </div>
                <div style={dividerStyle} />
                <div onClick={() => setActiveSlot({ target: "board", index: 4 })} style={getSlotStyle("board", 4)}>
                  <PlayingCard cardKey={board[4]} /><span style={miniLabelStyle}>River</span>
                </div>
              </div>

              {/* アウツ表示エリア */}
              {outs && (outs.p1.length > 0 || outs.p2.length > 0) && (
                <div style={{
                  marginTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "left"
                }}>
                  {/* Player 1 の逆転アウツ */}
                  {outs.p1.length > 0 && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#66b0ff", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>
                        P1アウツ ({outs.p1.length}):
                      </span>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {outs.p1.map(renderOutCard)}
                      </div>
                    </div>
                  )}
                  {/* Player 2 の逆転アウツ */}
                  {outs.p2.length > 0 && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#ff6b6b", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>
                        P2アウツ ({outs.p2.length}):
                      </span>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {outs.p2.map(renderOutCard)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* プレイヤー手札 */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", marginTop: "25px" }}>
              {/* Player 1 */}
              <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: "10px", width: "49%" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Player 1</h4>
                <select value={p1Select} onChange={(e) => setP1Select(e.target.value)} style={playerSelectStyle}>
                  <option value="custom">カスタムハンド (カード指定)</option>
                  <option value="strong">レンジ: 強 (上位11%)</option>
                  <option value="medium">レンジ: 標準 (上位20%)</option>
                  <option value="weak">レンジ: 弱 (上位35%)</option>
                  <option value="any">レンジ: Any (100%)</option>
                  <option value="myRange">マイレンジ (カスタム)</option>
                </select>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "8px" }}>
                  {p1Select === "custom" ? (
                    <>
                      <div onClick={() => setActiveSlot({ target: "p1", index: 0 })} style={getSlotStyle("p1", 0)}><PlayingCard cardKey={p1Hand[0]} /></div>
                      <div onClick={() => setActiveSlot({ target: "p1", index: 1 })} style={getSlotStyle("p1", 1)}><PlayingCard cardKey={p1Hand[1]} /></div>
                    </>
                  ) : (
                    <>
                      <RangeCardPlaceholder label={getRangeLabel(p1Select)} />
                      <RangeCardPlaceholder label={getRangeLabel(p1Select)} />
                    </>
                  )}
                </div>
                {result && <div style={{ marginTop: "12px", fontSize: "24px", fontWeight: "bold", color: "#66b0ff" }}>{result.p1Equity.toFixed(2)} %</div>}
              </div>

              {/* Player 2 */}
              <div style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: "10px", width: "49%" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Player 2</h4>
                <select value={p2Select} onChange={(e) => setP2Select(e.target.value)} style={playerSelectStyle}>
                  <option value="custom">カスタムハンド (カード指定)</option>
                  <option value="strong">レンジ: 強 (上位11%)</option>
                  <option value="medium">レンジ: 標準 (上位20%)</option>
                  <option value="weak">レンジ: 弱 (上位35%)</option>
                  <option value="any">レンジ: Any (100%)</option>
                  <option value="myRange">マイレンジ (カスタム)</option>
                </select>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "8px" }}>
                  {p2Select === "custom" ? (
                    <>
                      <div onClick={() => setActiveSlot({ target: "p2", index: 0 })} style={getSlotStyle("p2", 0)}><PlayingCard cardKey={p2Hand[0]} /></div>
                      <div onClick={() => setActiveSlot({ target: "p2", index: 1 })} style={getSlotStyle("p2", 1)}><PlayingCard cardKey={p2Hand[1]} /></div>
                    </>
                  ) : (
                    <>
                      <RangeCardPlaceholder label={getRangeLabel(p2Select)} />
                      <RangeCardPlaceholder label={getRangeLabel(p2Select)} />
                    </>
                  )}
                </div>
                {result && <div style={{ marginTop: "12px", fontSize: "24px", fontWeight: "bold", color: "#ff6b6b" }}>{result.p2Equity.toFixed(2)} %</div>}
              </div>
            </div>
          </div>

          {/* 計算ボタン・結果表示エリア */}
          {errorMessage && <div style={{ fontWeight: "bold", color: "#d9534f", textAlign: "center", marginBottom: "15px" }}>{errorMessage}</div>}
          <div style={{ textAlign: "center" }}>
            <button onClick={handleCalculate} style={calcBtnStyle}>このシチュエーションの勝率を計算する</button>

            <div style={{ marginTop: "15px" }}>
              <button
                onClick={() => setIsRangeModalOpen(true)}
                style={{ ...secondaryBtnStyle, padding: "8px 16px", fontSize: "13px", backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}
              >
                マイレンジを設定・編集する
              </button>
            </div>

            {time !== null && (
              <div style={{ marginTop: "15px", color: "#444", fontSize: "13px", backgroundColor: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "inline-block" }}>
                <p style={{ margin: "3px 0" }}>計算手法: <strong>{calcMethod}</strong></p>
                <p style={{ margin: "3px 0" }}>処理時間: <strong>{time.toFixed(1)} ミリ秒</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* ポットオッズ＆必要勝率 計算機 */}
        <div style={{
          marginTop: "25px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          textAlign: "left"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "15px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
            必要勝率計算機
          </h3>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "6px" }}>
                POT
              </label>
              <input
                type="number"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
                placeholder="7"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "6px" }}>
                To call
              </label>
              <input
                type="number"
                value={callAmount}
                onChange={(e) => setCallAmount(e.target.value)}
                placeholder="5"
                style={inputStyle}
              />
            </div>
          </div>

          {pot > 0 && call > 0 && (
            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#334155" }}>
                必要勝率:<strong style={{ fontSize: "18px", color: "#0f172a" }}>{requiredEquity.toFixed(1)}%</strong>
              </p>
              {/* シミュレータ結果（勝率）との自動連動判定 */}
              {result && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                    <div>
                      <span style={{ fontWeight: "bold", color: "#3b82f6" }}>Player 1:</span> 現勝率 {result.p1Equity.toFixed(1)}%
                      {result.p1Equity >= requiredEquity ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold", marginLeft: "8px" }}>+EV</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: "bold", marginLeft: "8px" }}>-EV</span>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: "bold", color: "#ef4444" }}>Player 2:</span> 現勝率 {result.p2Equity.toFixed(1)}%
                      {result.p2Equity >= requiredEquity ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold", marginLeft: "8px" }}>+EV</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: "bold", marginLeft: "8px" }}>-EV</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 【右カラム】52枚のカード選択マトリックス */}
        <div style={{
          flex: "0.8",
          minWidth: "380px",
          backgroundColor: "white",
          padding: "18px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          position: "sticky",
          top: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
            <h4 style={{ margin: 0, color: "#334155", fontSize: "14px", fontWeight: "bold" }}>カードマトリックス</h4>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                style={{
                  ...secondaryBtnStyle,
                  backgroundColor: history.length === 0 ? "#f1f5f9" : "#e0f2fe",
                  color: history.length === 0 ? "#94a3b8" : "#0369a1",
                  border: history.length === 0 ? "1px solid #cbd5e1" : "1px solid #bae6fd"
                }}
              >
                戻る ({history.length})
              </button>
              <button onClick={handleClearSlot} disabled={!activeSlot} style={secondaryBtnStyle}>枠を空に</button>
              <button onClick={handleClearAll} style={{...secondaryBtnStyle, backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5"}}>全消去</button>
            </div>
          </div>

          {activeSlot ? (
            <div style={{ fontSize: "12px", color: "#d97706", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px", fontWeight: "bold" }}>
              選択中: {activeSlot.target === "board" ? `ボード (スロット${activeSlot.index + 1})` : `Player ${activeSlot.target === "p1" ? "1" : "2"} (${activeSlot.index + 1}枚目)`}
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f8fafc", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px" }}>
              スタックを選択してください
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {RANKS.map(rank => (
              <div key={rank} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <div style={{ width: "20px", fontWeight: "bold", color: "#64748b", textAlign: "center", fontSize: "13px" }}>
                  {rank === "T" ? "10" : rank}
                </div>

                {SUITS.map(suit => {
                  const cardKey = `${rank}${suit.key}`;
                  const isUsed = usedCards.includes(cardKey);

                  return (
                    <button
                      key={cardKey}
                      onClick={() => handleSelectCard(cardKey)}
                      disabled={isUsed}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        fontSize: "12px",
                        fontWeight: "bold",
                        borderRadius: "5px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: isUsed ? "#e2e8f0" : "white",
                        color: isUsed ? "#94a3b8" : suit.color,
                        cursor: isUsed ? "not-allowed" : "pointer",
                        transition: "all 0.1s ease",
                        boxShadow: isUsed ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                        textDecoration: isUsed ? "line-through" : "none"
                      }}
                      onMouseEnter={(e) => { if (!isUsed) e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                      onMouseLeave={(e) => { if (!isUsed) e.currentTarget.style.backgroundColor = "white"; }}
                    >
                      {suit.symbol}{rank === "T" ? "10" : rank}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* モーダル部分 */}
      {isRangeModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white", padding: "25px", borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)", maxWidth: "550px", width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#1e293b" }}>マイレンジ編集 (13×13)</h3>
              <button
                onClick={() => setMyRange([])}
                style={{ ...secondaryBtnStyle, backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5" }}
              >
                全解除
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {RANKS.map((rowRank, rowIndex) => (
                <div key={rowRank} style={{ display: "flex", gap: "3px" }}>
                  {RANKS.map((colRank, colIndex) => {
                    let handStr = "";
                    if (rowIndex === colIndex) {
                      handStr = rowRank + colRank;
                    } else if (rowIndex < colIndex) {
                      handStr = rowRank + colRank + "s";
                    } else {
                      handStr = colRank + rowRank + "o";
                    }

                    const isSelected = myRange.includes(handStr);

                    return (
                      <button
                        key={handStr}
                        onClick={() => {
                          if (isSelected) {
                            setMyRange(myRange.filter(h => h !== handStr));
                          } else {
                            setMyRange([...myRange, handStr]);
                          }
                        }}
                        style={{
                          flex: 1,
                          aspectRatio: "1/1",
                          fontSize: "10px",
                          fontWeight: "bold",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: rowIndex === colIndex ? (isSelected ? "#22c55e" : "#ffedd5") :
                                           rowIndex < colIndex ? (isSelected ? "#3b82f6" : "#eff6ff") :   
                                                                 (isSelected ? "#eab308" : "#fef9c3"),  
                          color: isSelected ? "white" : "#334155",
                        }}
                      >
                        {handStr}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* モーダルを閉じるボタン */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsRangeModalOpen(false)}
                style={{
                  ...calcBtnStyle,
                  width: "auto",
                  padding: "8px 24px",
                  fontSize: "14px",
                  backgroundColor: "#475569"
                }}
              >
                確定して閉じる
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. スタイル定数の定義（コード内未定義分の補完）
// ==========================================
const miniLabelStyle = {
  display: "block",
  fontSize: "10px",
  color: "#cbd5e1",
  textAlign: "center",
  marginTop: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const dividerStyle = {
  width: "1px",
  height: "35px",
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  margin: "0 2px",
  alignSelf: "center"
};

const playerSelectStyle = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  backgroundColor: "white",
  color: "#1e293b",
  cursor: "pointer",
  outline: "none"
};

const calcBtnStyle = {
  width: "100%",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  transition: "all 0.2s ease"
};

const secondaryBtnStyle = {
  backgroundColor: "#f8fafc",
  color: "#475569",
  border: "1px solid #cbd5e1",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box",
  outline: "none"
};