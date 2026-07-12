import { useState, useEffect } from "react";
import { calculateEquity } from "./utilities/simulator";

import CommunityBoard from "./components/CommunityBoard";
import PlayerSection from "./components/PlayerSection";
import PotOddsCalculator from "./components/PotOddsCalculator";
import CardMatrix from "./components/CardMatrix";
import RangeModal from "./components/RangeModal";

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = [
  { key: 's', symbol: '♠', color: 'black' },
  { key: 'h', symbol: '♥', color: 'red' },
  { key: 'd', symbol: '♦', color: 'blue' },
  { key: 'c', symbol: '♣', color: 'green' }
];
const RANGE_STRONG = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "AKo", "AQo"];
const RANGE_MEDIUM = [...RANGE_STRONG, "77", "66", "55", "KJs", "QJs", "JTs", "T9s", "98s", "AJo", "ATo", "KQo"];
const RANGE_WEAK = [...RANGE_MEDIUM, "44", "33", "22", "A9s", "A8s", "A7s", "A5s", "KTs", "QTs", "J9s", "87s", "76s", "A9o", "KTo", "QTo", "JTo"];

function expandRange(rangeArray) {
  const suits = ['h', 'd', 'c', 's']; const combos = [];
  rangeArray.forEach(pair => {
    if (pair.length === 2) {
      const r = pair[0];
      for (let i = 0; i < suits.length; i++) {
        for (let j = i + 1; j < suits.length; j++) combos.push([`${r}${suits[i]}`, `${r}${suits[j]}`]);
      }
    } else if (pair.endsWith('s')) {
      const r1 = pair[0]; const r2 = pair[1]; suits.forEach(s => combos.push([`${r1}${s}`, `${r2}${s}`]));
    } else if (pair.endsWith('o')) {
      const r1 = pair[0]; const r2 = pair[1];
      suits.forEach(s1 => suits.forEach(s2 => { if (s1 !== s2) combos.push([`${r1}${s1}`, `${r2}${s2}`]); }));
    }
  });
  return combos;
}

function getAnyRange() {
  const deck = []; RANKS.forEach(r => SUITS.forEach(s => deck.push(`${r}${s.key}`)));
  const combos = [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) combos.push([deck[i], deck[j]]);
  }
  return combos;
}

export default function App() {
  const [p1Select, setP1Select] = useState("custom");
  const [p2Select, setP2Select] = useState("custom");
  const [p1Hand, setP1Hand] = useState(["", ""]);
  const [p2Hand, setP2Hand] = useState(["", ""]);
  const [board, setBoard] = useState(["", "", "", "", ""]);
  const [activeSlot, setActiveSlot] = useState(null); 
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [time, setTime] = useState(null);
  const [calcMethod, setCalcMethod] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [myRange, setMyRange] = useState([]);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [outs, setOuts] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [potSize, setPotSize] = useState("7");
  const [callAmount, setCallAmount] = useState("5");

  const usedCards = [
    ...(p1Select === "custom" ? p1Hand.filter(Boolean) : []),
    ...(p2Select === "custom" ? p2Hand.filter(Boolean) : []),
    ...board.filter(Boolean)
  ];

const saveToHistory = () => {
  setHistory(prev => [...prev, { board: [...board], p1Hand: [...p1Hand], p2Hand: [...p2Hand] }]);
};

const handleUndo = () => {
  if (history.length === 0 || isLoading) return;
  const previousState = history[history.length - 1];
  setHistory(prev => prev.slice(0, -1));
  setBoard(previousState.board);
  setP1Hand(previousState.p1Hand);
  setP2Hand(previousState.p2Hand);
  setActiveSlot(null);
  setErrorMessage("");
};

  const handleSelectCard = (cardKey) => {
    if (!activeSlot || isLoading) return;
    const { target, index } = activeSlot;
    if (usedCards.includes(cardKey)) {
      let currentSlotCard = target === "p1" ? p1Hand[index] : target === "p2" ? p2Hand[index] : board[index];
      if (currentSlotCard !== cardKey) return;
    }

    saveToHistory(); setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand]; nextHand[index] = cardKey; setP1Hand(nextHand);
    } else if (target === "p2") {
      const nextHand = [...p2Hand]; nextHand[index] = cardKey; setP2Hand(nextHand);
    } else if (target === "board") {
      const nextBoard = [...board]; nextBoard[index] = cardKey; setBoard(nextBoard);
    }

    setActiveSlot(null);
  };


  const handleClearSpecificSlot = (target, index) => {
    if (isLoading) return;
    let currentCard = target === "p1" ? p1Hand[index] : target === "p2" ? p2Hand[index] : board[index];
    if (currentCard === "") return;

    saveToHistory(); setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand]; nextHand[index] = ""; setP1Hand(nextHand);
    } else if (target === "p2") {
      const nextHand = [...p2Hand]; nextHand[index] = ""; setP2Hand(nextHand);
    } else if (target === "board") {
      const nextBoard = [...board]; nextBoard[index] = ""; setBoard(nextBoard);
    }
  };

  const handleClearAll = () => {
    if (isLoading) return;
    if (board.every(c => c === "") && p1Hand.every(c => c === "") && p2Hand.every(c => c === "")) return;
    saveToHistory();
    setBoard(["", "", "", "", ""]); setP1Hand(["", ""]); setP2Hand(["", ""]);
    setActiveSlot(null); setResult(null); setTime(null); setErrorMessage(""); setOuts(null);
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
    setResult(null); setTime(null); setErrorMessage(""); setOuts(null);
    const currentBoard = board.filter(c => c !== "");
    if (p1Select === "custom" && (p1Hand[0] === "" || p1Hand[1] === "")) { setErrorMessage("Player 1 のカードを選んでください。"); return; }
    if (p2Select === "custom" && (p2Hand[0] === "" || p2Hand[1] === "")) { setErrorMessage("Player 2 のカードを選んでください。"); return; }

    setIsLoading(true);
    setTimeout(() => {
      try {
        let p1Data = getPlayerData(p1Select, p1Hand); let p2Data = getPlayerData(p2Select, p2Hand);
        const startTime = performance.now();
        const equityResult = calculateEquity(p1Data, p2Data, currentBoard);
        const endTime = performance.now();
        setCalcMethod(equityResult.calcMethod); setResult(equityResult); setTime(endTime - startTime);

        if (p1Select === "custom" && p2Select === "custom" && (currentBoard.length === 3 || currentBoard.length === 4)) {
          const allCards = []; RANKS.forEach(r => SUITS.forEach(s => allCards.push(`${r}${s.key}`)));
          const remainingCards = allCards.filter(c => !usedCards.includes(c));
          const p1OutsList = []; const p2OutsList = [];
          remainingCards.forEach(card => {
            const testResult = calculateEquity(p1Data, p2Data, [...currentBoard, card]);
            if (testResult.p1Equity > testResult.p2Equity && equityResult.p1Equity <= equityResult.p2Equity) p1OutsList.push(card);
            if (testResult.p2Equity > testResult.p1Equity && equityResult.p2Equity <= equityResult.p1Equity) p2OutsList.push(card);
          });
          setOuts({ p1: p1OutsList, p2: p2OutsList });
        }
      } catch (err) { setErrorMessage("計算エラーが発生しました。"); console.error(err); } finally { setIsLoading(false); }
    }, 50);
  };

  const getSlotStyle = (target, index) => {
    const isActive = activeSlot && activeSlot.target === target && activeSlot.index === index;
    return {
      width: "100%", maxWidth: target === "board" ? "65px" : "75px", minWidth: "40px", aspectRatio: "3 / 4.2", cursor: isLoading ? "not-allowed" : "pointer", position: "relative", borderRadius: "8px", transition: "all 0.15s ease-in-out", containerType: "inline-size",
      outline: isActive ? "3px solid #ffc107" : "none", outlineOffset: isActive ? "2px" : "0px", boxShadow: isActive ? "0 0 15px rgba(255,193,7,0.6)" : "none", transform: isActive ? "scale(1.04)" : "scale(1)", opacity: isLoading ? 0.7 : 1, backgroundColor: "rgba(255,255,255,0.1)", display: "flex", justifyContent: "center", alignItems: "center", boxSizing: "border-box"
    };
  };

  const getRangeLabel = (val) => {
    if (val === "strong") return "強"; if (val === "medium") return "標準"; if (val === "weak") return "弱"; if (val === "any") return "Any"; if (val === "myRange") return "マイ"; return "";
  };

  return (
    <div style={{ position: "relative", top: 0, left: 0, width: "100%", minHeight: "100vh", margin: 0, padding: "10px", fontFamily: "sans-serif", backgroundColor: "#f4f6f9", boxSizing: "border-box" }}>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: "5px", marginTop: "0px", fontSize: "clamp(18px, 2.5vw, 24px)" }}>ポーカー勝率シミュレータ</h1>
      <p style={{ textAlign: "center", color: "#475569", fontWeight: "bold", fontSize: "12px", marginBottom: "20px" }}>枠を選択すると、カード選択用のポップアップが表示されます。</p>

      <div style={{ maxWidth: "550px", margin: "0 auto", boxSizing: "border-box" }}>

        <div style={{ backgroundColor: "#155724", padding: "20px 12px", borderRadius: "15px", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", color: "white", marginBottom: "25px" }}>
          {/* コミュニティボード */}
          <CommunityBoard board={board} isLoading={isLoading} activeSlot={activeSlot} setActiveSlot={setActiveSlot} getSlotStyle={getSlotStyle} outs={outs} SUITS={SUITS} handleClearSpecificSlot={handleClearSpecificSlot} />

          {/* プレイヤー手札＆勝率バー */}
          <PlayerSection isLoading={isLoading} p1Select={p1Select} setP1Select={setP1Select} p2Select={p2Select} setP2Select={setP2Select} p1Hand={p1Hand} p2Hand={p2Hand} setActiveSlot={setActiveSlot} getSlotStyle={getSlotStyle} getRangeLabel={getRangeLabel} result={result} handleClearSpecificSlot={handleClearSpecificSlot} />
        </div>

        {/* 計算コントロール */}
        {errorMessage && <div style={{ fontWeight: "bold", color: "#d9534f", textAlign: "center", marginBottom: "15px" }}>{errorMessage}</div>}
        <div style={{ textAlign: "center" }}>
          <button onClick={handleCalculate} disabled={isLoading} style={{ width: "100%", backgroundColor: isLoading ? "#64748b" : "#2563eb", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: isLoading ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.2)", transition: "all 0.2s ease" }}>
            {isLoading ? "確率を計算しています..." : "このシチュエーションの勝率を計算する"}
          </button>

          {/* 「戻る」ボタンをメイン画面に常駐化、等幅配置 */}
          <div style={{ marginTop: "15px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              onClick={handleUndo}
              disabled={history.length === 0 || isLoading}
              style={{
                flex: 1, backgroundColor: (history.length === 0 || isLoading) ? "#f1f5f9" : "#e0f2fe",
                color: (history.length === 0 || isLoading) ? "#94a3b8" : "#0369a1",
                border: (history.length === 0 || isLoading) ? "1px solid #cbd5e1" : "1px solid #bae6fd",
                padding: "10px 8px", fontSize: "13px", borderRadius: "6px", fontWeight: "bold",
                cursor: (history.length === 0 || isLoading) ? "not-allowed" : "pointer"
              }}
            >
              戻る ({history.length})
            </button>
            <button disabled={isLoading} onClick={() => setIsRangeModalOpen(true)} style={{ flex: 1, backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 8px", fontSize: "13px", borderRadius: "6px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer" }}>
              マイレンジ設定
            </button>
            <button disabled={isLoading} onClick={handleClearAll} style={{ flex: 1, backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", padding: "10px 8px", fontSize: "13px", borderRadius: "6px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer" }}>
              盤面を全消去
            </button>
          </div>

          {time !== null && !isLoading && (
            <div style={{ marginTop: "15px", color: "#444", fontSize: "13px", backgroundColor: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "inline-block", width: "100%", boxSizing: "border-box" }}>
              <p style={{ margin: "3px 0" }}>計算手法: <strong>{calcMethod}</strong></p>
              <p style={{ margin: "3px 0" }}>処理時間: <strong>{time.toFixed(1)} ミリ秒</strong></p>
            </div>
          )}
        </div>

        {/* 必要勝率計算機 */}
        <PotOddsCalculator isLoading={isLoading} potSize={potSize} setPotSize={setPotSize} callAmount={callAmount} setCallAmount={setCallAmount} result={result} />
      </div>

      {/* 【ポップアップ】カードマトリックス */}
      <CardMatrix
        isOpen={activeSlot !== null}
        onClose={() => setActiveSlot(null)}
        isLoading={isLoading}
        activeSlot={activeSlot}
        RANKS={RANKS}
        SUITS={SUITS}
        usedCards={usedCards}
        handleSelectCard={handleSelectCard}
      />

      {/* マイレンジ編集モーダル */}
      <RangeModal isRangeModalOpen={isRangeModalOpen} setIsRangeModalOpen={setIsRangeModalOpen} myRange={myRange} setMyRange={setMyRange} RANKS={RANKS} />
    </div>
  );
}