import { useState, useEffect } from "react";
import { calculateEquity } from "./utilities/simulator";
import pokersolver from "pokersolver";
const { Hand } = pokersolver;

import CommunityBoard from "./components/CommunityBoard";
import ExposedSection from "./components/ExposedSection";
import PlayerSection from "./components/PlayerSection";
import PotOddsCalculator from "./components/PotOddsCalculator";
import CardMatrix from "./components/CardMatrix";
import RangeModal from "./components/RangeModal";
import EquityChart from "./components/EquityChart";

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

function evaluateHandCategory(cards) {
  if (cards.length < 5) return "highCard";
  const solved = Hand.solve(cards);

  switch (solved.name) {
    case "Pair":
      return "onePair";
    case "Two Pair":
      return "twoPair";
    case "Three of a Kind":
      return "threeCard";
    case "Straight":
      return "straight";
    case "Flush":
      return "flush";
    case "Full House":
    case "Four of a Kind":
    case "Straight Flush":
    case "Royal Flush":
    case "Wild Royal Flush":
      return "fullHousePlus";
    case "High Card":
    default:
      return "highCard";
  }
}

function calculateHandDistribution(p1Data, p2Data, currentBoard, samples = 500) {
  const allCards = [];
  RANKS.forEach(r => SUITS.forEach(s => allCards.push(`${r}${s.key}`)));

  const p1Counts = { highCard: 0, onePair: 0, twoPair: 0, threeCard: 0, straight: 0, flush: 0, fullHousePlus: 0 };
  const p2Counts = { highCard: 0, onePair: 0, twoPair: 0, threeCard: 0, straight: 0, flush: 0, fullHousePlus: 0 };

  const getHandFromData = (pData) => {
    if (pData.isRange) {
      return pData.range[Math.floor(Math.random() * pData.range.length)];
    }
    return pData.hand;
  };

  for (let i = 0; i < samples; i++) {
    const h1 = getHandFromData(p1Data);
    const h2 = getHandFromData(p2Data);
    
    const used = new Set([...h1, ...h2, ...currentBoard]);
    if (used.size < h1.length + h2.length + currentBoard.length) continue;

    const deck = allCards.filter(c => !used.has(c));
    
    const needed = 5 - currentBoard.length;
    const sampleBoard = [...currentBoard];
    for (let j = 0; j < needed; j++) {
      const idx = Math.floor(Math.random() * deck.length);
      sampleBoard.push(deck.splice(idx, 1)[0]);
    }

    const cat1 = evaluateHandCategory([...h1, ...sampleBoard]);
    const cat2 = evaluateHandCategory([...h2, ...sampleBoard]);

    p1Counts[cat1]++;
    p2Counts[cat2]++;
  }

  const formatDist = (counts) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      highCard: (counts.highCard / total) * 100,
      onePair: (counts.onePair / total) * 100,
      twoPair: (counts.twoPair / total) * 100,
      threeCard: (counts.threeCard / total) * 100,
      straight: (counts.straight / total) * 100,
      flush: (counts.flush / total) * 100,
      fullHousePlus: (counts.fullHousePlus / total) * 100,
    };
  };

  return {
    p1: formatDist(p1Counts),
    p2: formatDist(p2Counts)
  };
}

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
  const [exposedCards, setExposedCards] = useState(["", "", "", "", "", ""]);
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
  const [equityHistory, setEquityHistory] = useState(null);
  const [invalidBoardSlots, setInvalidBoardSlots] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPc = windowWidth >= 900;

  const usedCards = [
    ...(p1Select === "custom" ? p1Hand.filter(Boolean) : []),
    ...(p2Select === "custom" ? p2Hand.filter(Boolean) : []),
    ...board.filter(Boolean),
    ...exposedCards.filter(Boolean)
  ];

  const saveToHistory = () => {
    setHistory(prev => [...prev, { board: [...board], p1Hand: [...p1Hand], p2Hand: [...p2Hand], exposedCards: [...exposedCards] }]);
  };

  const handleUndo = () => {
    if (history.length === 0 || isLoading) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setBoard(previousState.board); setP1Hand(previousState.p1Hand); setP2Hand(previousState.p2Hand);
    setExposedCards(previousState.exposedCards || ["", "", "", "", "", ""]);
    setActiveSlot(null);
    setErrorMessage("");
    setEquityHistory(null);
  };

  const handleSelectCard = (cardKey) => {
    if (!activeSlot || isLoading) return;
    const { target, index } = activeSlot;
    if (usedCards.includes(cardKey)) {
      let currentSlotCard = target === "p1" ? p1Hand[index] : target === "p2" ? p2Hand[index] : target === "exposed" ? exposedCards[index] : board[index];
      if (currentSlotCard !== cardKey) return;
    }

    saveToHistory(); setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand]; nextHand[index] = cardKey; setP1Hand(nextHand);
    } else if (target === "p2") {
      const nextHand = [...p2Hand]; nextHand[index] = cardKey; setP2Hand(nextHand);
    } else if (target === "board") {
      const nextBoard = [...board]; nextBoard[index] = cardKey; setBoard(nextBoard);
    } else if (target === "exposed") {
      const nextExposed = [...exposedCards]; nextExposed[index] = cardKey; setExposedCards(nextExposed);
    }

    setActiveSlot(null);
  };

  const handleClearSpecificSlot = (target, index) => {
    if (isLoading) return;
    let currentCard = target === "p1" ? p1Hand[index] : target === "p2" ? p2Hand[index] : target === "exposed" ? exposedCards[index] : board[index];
    if (currentCard === "") return;

    saveToHistory(); setOuts(null);

    if (target === "p1") {
      const nextHand = [...p1Hand]; nextHand[index] = ""; setP1Hand(nextHand);
    } else if (target === "p2") {
      const nextHand = [...p2Hand]; nextHand[index] = ""; setP2Hand(nextHand);
    } else if (target === "board") {
      const nextBoard = [...board]; nextBoard[index] = ""; setBoard(nextBoard);
    } else if (target === "exposed") {
      const nextExposed = [...exposedCards]; nextExposed[index] = ""; setExposedCards(nextExposed);
    }
  };

  const handleClearAll = () => {
    if (isLoading) return;
    if (board.every(c => c === "") && p1Hand.every(c => c === "") && p2Hand.every(c => c === "") && exposedCards.every(c => c === "")) return;
    saveToHistory();
    setBoard(["", "", "", "", ""]); setP1Hand(["", ""]); setP2Hand(["", ""]); setExposedCards(["", "", "", "", "", ""]);
    setActiveSlot(null); setResult(null); setTime(null); setErrorMessage(""); setOuts(null);
    setEquityHistory(null);
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
    setEquityHistory(null);
    setInvalidBoardSlots([]);

    const currentBoard = board.filter((c) => c !== "");
    const deadCards = exposedCards.filter(Boolean);
    const errorMessages = [];

    const flopCards = [board[0], board[1], board[2]];
    const filledFlopCount = flopCards.filter((c) => c !== "").length;

    if (filledFlopCount > 0 && filledFlopCount < 3) {
      errorMessages.push("Flopカードは3枚すべて入力してください。");
      const missingIndices = [0, 1, 2].filter((i) => board[i] === "");
      setInvalidBoardSlots(missingIndices);
    }

    if (p1Select === "custom" && (p1Hand[0] === "" || p1Hand[1] === "")) {
      errorMessages.push("Player 1 のカードを選んでください。");
    }
    if (p2Select === "custom" && (p2Hand[0] === "" || p2Hand[1] === "")) {
      errorMessages.push("Player 2 のカードを選んでください。");
    }

    // プレイヤーの選択データを取得
    const p1Data = getPlayerData(p1Select, p1Hand);
    const p2Data = getPlayerData(p2Select, p2Hand);

    // 重複チェック用のカードセット
    const usedCardsSet = new Set([...currentBoard, ...deadCards]);
    if (!p1Data.isRange) p1Hand.forEach((c) => c && usedCardsSet.add(c));
    if (!p2Data.isRange) p2Hand.forEach((c) => c && usedCardsSet.add(c));

    // 有効なコンボ数を数えるヘルパー関数
    const getValidCombosCount = (pData) => {
      if (!pData.isRange || !pData.range) return 0;
      let count = 0;
      for (const combo of pData.range) {
        if (!usedCardsSet.has(combo[0]) && !usedCardsSet.has(combo[1])) {
          count++;
        }
      }
      return count;
    };

    if (p1Data.isRange) {
      if (!p1Data.range || p1Data.range.length === 0) {
        errorMessages.push("Player 1: レンジが選択されていません。");
      } else if (getValidCombosCount(p1Data) === 0) {
        errorMessages.push("Player 1: カードの重複により、計算可能な組み合わせ（コンボ）がありません。");
      }
    }

    if (p2Data.isRange) {
      if (!p2Data.range || p2Data.range.length === 0) {
        errorMessages.push("Player 2: レンジが選択されていません。");
      } else if (getValidCombosCount(p2Data) === 0) {
        errorMessages.push("Player 2: カードの重複により、計算可能な組み合わせ（コンボ）がありません。");
      }
    }

    if (errorMessages.length > 0) {
      setErrorMessage(errorMessages.join("\n"));
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const startTime = performance.now();
        
        const isRangeFight = p1Data.isRange || p2Data.isRange;
        const mainIterations = isRangeFight ? 10000 : 30000;
        const historyIterations = isRangeFight ? 10000 : 30000;

        const getOutsForStreet = (targetBoard) => {
          if (isRangeFight || (targetBoard.length !== 3 && targetBoard.length !== 4)) return null;

          const toStandardCard = (c) => {
            if (!c) return "";
            let str = String(c).trim().replace(/^10/, "T");
            if (str.length < 2) return "";

            const rank = str[0].toUpperCase();
            const lastChar = str[str.length - 1].toLowerCase();

            let suitKey = "";
            if (lastChar === "s" || lastChar === "♠") suitKey = "s";
            else if (lastChar === "h" || lastChar === "♥") suitKey = "h";
            else if (lastChar === "d" || lastChar === "♦") suitKey = "d";
            else if (lastChar === "c" || lastChar === "♣") suitKey = "c";

            return rank && suitKey ? `${rank}${suitKey}` : "";
          };

          const p1Cards = p1Data.hand.map(toStandardCard).filter(Boolean);
          const p2Cards = p2Data.hand.map(toStandardCard).filter(Boolean);
          const boardCards = targetBoard.map(toStandardCard).filter(Boolean);
          const expCards = deadCards.map(toStandardCard).filter(Boolean);

          const allCards = [];
          RANKS.forEach((r) => {
            ['s', 'h', 'd', 'c'].forEach((sKey) => {
              allCards.push(`${r}${sKey}`);
            });
          });

          const currentUsed = new Set([...p1Cards, ...p2Cards, ...boardCards, ...expCards]);
          const remainingCards = allCards.filter((c) => !currentUsed.has(c));

          const currentP1Solve = Hand.solve([...p1Cards, ...boardCards]);
          const currentP2Solve = Hand.solve([...p2Cards, ...boardCards]);
          const currentWinners = Hand.winners([currentP1Solve, currentP2Solve]);

          const p1OutsList = [];
          const p2OutsList = [];
          const chopOutsList = [];

          remainingCards.forEach((card) => {
            const nextBoard = [...boardCards, card];
            const p1Solve = Hand.solve([...p1Cards, ...nextBoard]);
            const p2Solve = Hand.solve([...p2Cards, ...nextBoard]);
            const winners = Hand.winners([p1Solve, p2Solve]);

            if (winners.length === 1) {
              if (winners[0] === p1Solve) p1OutsList.push(card);
              if (winners[0] === p2Solve) p2OutsList.push(card);
            } else if (winners.length === 2) {
              chopOutsList.push(card);
            }
          });

          let finalP1Outs = [];
          let finalP2Outs = [];

          if (currentWinners.length === 1 && currentWinners[0] === currentP2Solve) {
            finalP1Outs = p1OutsList;
          } else if (currentWinners.length === 1 && currentWinners[0] === currentP1Solve) {
            finalP2Outs = p2OutsList;
          } else {
            finalP1Outs = p1OutsList;
            finalP2Outs = p2OutsList;
          }

          return { p1: finalP1Outs, p2: finalP2Outs, chop: chopOutsList };
        };

        const formatHistoryItem = (label, res, targetBoard, outs = null) => {
          const dist = calculateHandDistribution(p1Data, p2Data, targetBoard);

          return {
            label,
            p1: res.p1Equity ?? 0,
            p2: res.p2Equity ?? 0,
            outs,
            p1_highCard: dist.p1.highCard,
            p1_onePair: dist.p1.onePair,
            p1_twoPair: dist.p1.twoPair,
            p1_threeCard: dist.p1.threeCard,
            p1_straight: dist.p1.straight,
            p1_flush: dist.p1.flush,
            p1_fullHousePlus: dist.p1.fullHousePlus,
            p2_highCard: dist.p2.highCard,
            p2_onePair: dist.p2.onePair,
            p2_twoPair: dist.p2.twoPair,
            p2_threeCard: dist.p2.threeCard,
            p2_straight: dist.p2.straight,
            p2_flush: dist.p2.flush,
            p2_fullHousePlus: dist.p2.fullHousePlus,
          };
        };

        const equityResult = calculateEquity(p1Data, p2Data, currentBoard, mainIterations, deadCards);

        const historyData = [];

        const preflopRes = calculateEquity(p1Data, p2Data, [], historyIterations, deadCards);
        historyData.push(formatHistoryItem("Preflop", preflopRes, [], null));

        if (currentBoard.length >= 3) {
          const flopBoard = currentBoard.slice(0, 3);
          const flopRes = calculateEquity(p1Data, p2Data, flopBoard, historyIterations, deadCards);
          const flopOuts = getOutsForStreet(flopBoard);
          historyData.push(formatHistoryItem("Flop", flopRes, flopBoard, flopOuts));
        }

        if (currentBoard.length >= 4) {
          const turnBoard = currentBoard.slice(0, 4);
          const turnRes = calculateEquity(p1Data, p2Data, turnBoard, historyIterations, deadCards);
          const turnOuts = getOutsForStreet(turnBoard);
          historyData.push(formatHistoryItem("Turn", turnRes, turnBoard, turnOuts));
        }

        if (currentBoard.length === 5) {
          const riverBoard = currentBoard.slice(0, 5);
          const riverRes = calculateEquity(p1Data, p2Data, riverBoard, historyIterations, deadCards);
          historyData.push(formatHistoryItem("River", riverRes, riverBoard, null));
        }

        setEquityHistory(historyData);

        const endTime = performance.now();
        setCalcMethod(equityResult.calcMethod); setResult(equityResult); setTime(endTime - startTime);

        const currentOuts = getOutsForStreet(currentBoard);
        if (currentOuts) setOuts(currentOuts);

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

      <div style={{ maxWidth: isPc ? "1000px" : "550px", margin: "0 auto", boxSizing: "border-box", transition: "max-width 0.3s ease-in-out" }}>

        <div style={{
          backgroundColor: "#155724",
          padding: "20px 15px",
          borderRadius: "15px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          color: "white",
          marginBottom: "25px",
          display: "flex",
          flexDirection: isPc ? "row" : "column",
          gap: "20px",
          alignItems: "stretch"
        }}>
          {/* 左カラム */}
          <div style={{ flex: isPc ? "1 1 50%" : "none", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <CommunityBoard board={board} isLoading={isLoading} activeSlot={activeSlot} setActiveSlot={setActiveSlot} getSlotStyle={getSlotStyle} outs={outs} SUITS={SUITS} handleClearSpecificSlot={handleClearSpecificSlot} invalidBoardSlots={invalidBoardSlots}/>
            <ExposedSection exposedCards={exposedCards} isLoading={isLoading} activeSlot={activeSlot} setActiveSlot={setActiveSlot} getSlotStyle={getSlotStyle} handleClearSpecificSlot={handleClearSpecificSlot} />
            <PlayerSection isLoading={isLoading} p1Select={p1Select} setP1Select={setP1Select} p2Select={p2Select} setP2Select={setP2Select} p1Hand={p1Hand} p2Hand={p2Hand} setActiveSlot={setActiveSlot} getSlotStyle={getSlotStyle} getRangeLabel={getRangeLabel} result={result} handleClearSpecificSlot={handleClearSpecificSlot} />
          </div>

          {/* 右カラム (PC) または 下部 (スマホ) */}
          {isPc ? (
            <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {equityHistory ? (
                <EquityChart historyData={equityHistory} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }} />
              ) : (
                <div style={{
                  height: "100%", minHeight: "220px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "12px",
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px",
                  textAlign: "center", color: "rgba(255,255,255,0.45)", backgroundColor: "rgba(0,0,0,0.15)", boxSizing: "border-box"
                }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ffc107" }}>EQUITY & HAND ANALYZER</span>
                  <span style={{ fontSize: "11px", marginTop: "6px", maxWidth: "260px", lineHeight: "1.4" }}>
                    勝率計算を実行すると、ここにストリートごとの推移チャートが表示されます。
                  </span>
                </div>
              )}
            </div>
          ) : (
            equityHistory && (
              <div style={{ width: "100%", minHeight: "280px", marginTop: "15px" }}>
                <EquityChart historyData={equityHistory} />
              </div>
            )
          )}
        </div>

        {/* コントロールパネル */}
        {errorMessage && <div style={{ fontWeight: "bold", color: "#d9534f", textAlign: "center", marginBottom: "15px", whiteSpace: "pre-line" }}>{errorMessage}</div>}
        <div style={{ textAlign: "center" }}>
          <button onClick={handleCalculate} disabled={isLoading} style={{ width: "100%", backgroundColor: isLoading ? "#64748b" : "#2563eb", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: isLoading ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.2)", transition: "all 0.2s ease" }}>
            {isLoading ? "確率を計算しています..." : "このシチュエーションの勝率を計算する"}
          </button>

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

        </div>

        <PotOddsCalculator isLoading={isLoading} potSize={potSize} setPotSize={setPotSize} callAmount={callAmount} setCallAmount={setCallAmount} result={result} equityHistory={equityHistory} />
      </div>

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

      <RangeModal isRangeModalOpen={isRangeModalOpen} setIsRangeModalOpen={setIsRangeModalOpen} myRange={myRange} setMyRange={setMyRange} RANKS={RANKS} />
    </div>
  );
}