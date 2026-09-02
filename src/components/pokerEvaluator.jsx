import pokersolver from "pokersolver";
const { Hand } = pokersolver;

const SUITS = ['s', 'h', 'd', 'c'];

const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// 表記ゆれ ("10♠", "10s", オブジェクト形式等) を標準形式 ("Ts", "Ks") に統一
function normalizeCard(c) {
  if (!c) return "";
  let str = "";
  if (typeof c === "object") {
    const rank = c.rank || c.value || c.r || "";
    const suit = c.suit || c.s || "";
    str = `${rank}${suit}`;
  } else {
    str = String(c).trim();
  }

  str = str.replace(/10/g, "T");

  let rank = "";
  let suit = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const upper = char.toUpperCase();
    
    if ("23456789TJQKA".includes(upper) && !rank) {
      rank = upper;
    } else if (char === "s" || char === "♠" || upper === "S") {
      suit = "s";
    } else if (char === "h" || char === "♥" || upper === "H") {
      suit = "h";
    } else if (char === "d" || char === "♦" || upper === "D") {
      suit = "d";
    } else if (char === "c" || char === "♣" || upper === "C") {
      suit = "c";
    }
  }

  return (rank && suit) ? `${rank}${suit}` : "";
}

// ハンド表記 ("AA", "AKs", "AKo") から全コンボを作成
function getCombosForHand(handStr) {
  const combos = [];
  if (!handStr) return combos;

  if (handStr.length === 2) {
    const r = handStr[0];
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push([`${r}${SUITS[i]}`, `${r}${SUITS[j]}`]);
      }
    }
  } else if (handStr.endsWith('s')) {
    const r1 = handStr[0];
    const r2 = handStr[1];
    SUITS.forEach(s => combos.push([`${r1}${s}`, `${r2}${s}`]));
  } else if (handStr.endsWith('o')) {
    const r1 = handStr[0];
    const r2 = handStr[1];
    SUITS.forEach(s1 => {
      SUITS.forEach(s2 => {
        if (s1 !== s2) combos.push([`${r1}${s1}`, `${r2}${s2}`]);
      });
    });
  }
  return combos;
}

// ドロー（フラッシュ・ストレートドロー）判定
function evaluateDraws(normCombo, normBoard) {
  const fullCards = [...normCombo, ...normBoard];
  
  // 1. フラッシュドロー判定
  const suitCounts = { s: 0, h: 0, d: 0, c: 0 };
  fullCards.forEach(c => {
    const suit = c[1];
    if (suitCounts[suit] !== undefined) suitCounts[suit]++;
  });

  let hasFlushDraw = false;
  let hasNutFlushDraw = false;
  let hasBackdoorFlushDraw = false;

  Object.keys(suitCounts).forEach(suit => {
    if (suitCounts[suit] === 4) {
      hasFlushDraw = true;
      const hasAceInSuit = normCombo.some(c => c[0] === 'A' && c[1] === suit);
      if (hasAceInSuit) hasNutFlushDraw = true;
    } else if (suitCounts[suit] === 3 && normBoard.length === 3) {
      hasBackdoorFlushDraw = true;
    }
  });

  // 2. ストレートドロー判定
  const rankSet = new Set(fullCards.map(c => RANK_VALUES[c[0]]));
  if (rankSet.has(14)) rankSet.add(1);

  let hasOESD = false;
  let hasGutshot = false;

  for (let start = 1; start <= 10; start++) {
    const window = [start, start + 1, start + 2, start + 3, start + 4];
    const matchCount = window.filter(r => rankSet.has(r)).length;

    if (matchCount === 4) {
      const missing = window.filter(r => !rankSet.has(r))[0];
      if (missing === start || missing === start + 4) {
        if (missing === 1 || missing === 14) {
          hasGutshot = true;
        } else {
          hasOESD = true;
        }
      } else {
        hasGutshot = true;
      }
    }
  }

  return {
    hasFlushDraw,
    hasNutFlushDraw,
    hasBackdoorFlushDraw,
    hasOESD,
    hasGutshot
  };
}

// プリフロップ評価 (ボード0枚時)
function evaluatePreflopCombo(combo) {
  const r1 = RANK_VALUES[combo[0][0]];
  const r2 = RANK_VALUES[combo[1][0]];
  const isPair = combo[0][0] === combo[1][0];
  const isSuited = combo[0][1] === combo[1][1];

  const high = Math.max(r1, r2);
  const low = Math.min(r1, r2);

  if (isPair) {
    return { score: Math.round(50 + (high / 14) * 50), handName: "ポケットペア" };
  }

  let score = (high * 2 + low) * 1.5;
  if (isSuited) score += 10;
  if (high - low === 1) score += 8;
  if (high - low === 2) score += 4;

  return { score: Math.min(85, Math.round(score)), handName: "プリフロップ" };
}

// 単一コンボの総合評価 (Made Hand + Kickers + Draw Score)
function evaluateSingleCombo(combo, board) {
  const normCombo = combo.map(normalizeCard).filter(Boolean);
  const normBoard = board.map(normalizeCard).filter(Boolean);

  if (normBoard.length === 0) {
    return evaluatePreflopCombo(normCombo);
  }

  const fullHand = [...normCombo, ...normBoard];

  let madeScore = 10;
  let handName = "ハイカード";

  if (fullHand.length >= 5) {
    const solved = Hand.solve(fullHand);
    const rawName = solved.name || "High Card";

    const HAND_BASE_SCORES = {
      "Royal Flush": 100,
      "Straight Flush": 98,
      "Four of a Kind": 92,
      "Full House": 85,
      "Flush": 75,
      "Straight": 65,
      "Three of a Kind": 50,
      "Two Pair": 40,
      "Pair": 20,
      "High Card": 5
    };

    const HAND_NAMES_JA = {
      "Royal Flush": "ロイヤルフラッシュ",
      "Straight Flush": "ストレートフラッシュ",
      "Four of a Kind": "フォーカード",
      "Full House": "フルハウス",
      "Flush": "フラッシュ",
      "Straight": "ストレート",
      "Three of a Kind": "スリーカード",
      "Two Pair": "ツーペア",
      "Pair": "ワンペア",
      "High Card": "ハイカード"
    };
    handName = HAND_NAMES_JA[rawName] || rawName;

    // キッカー & ランクボーナス計算 (最大 +12点)
    let kickerBonus = 0;
    if (solved.cards && solved.cards.length) {
      solved.cards.forEach((card, idx) => {
        const val = RANK_VALUES[card.value] || 0;
        kickerBonus += (val / 14) * Math.pow(0.35, idx) * 8;
      });
    }

    // ワンペアの詳細区分（トップ / ミドル / ボトムペア）およびキッカー加算
    if (rawName === "Pair") {
      const boardRanks = normBoard.map(c => RANK_VALUES[c[0]]).sort((a,b) => b-a);
      const pairRank = RANK_VALUES[solved.cards[0].value];

      let pairBase = 18;
      if (pairRank >= boardRanks[0]) {
        pairBase = 30;
        handName = "トップペア";
      } else if (boardRanks.length > 1 && pairRank >= boardRanks[1]) {
        pairBase = 22;
        handName = "ミドルペア";
      } else {
        pairBase = 16;
        handName = "ボトムペア";
      }

      // ペアランクボーナス (最大 +6点) + キッカーボーナス (最大 +6点)
      let pBonus = (pairRank / 14) * 6;
      let kBonus = 0;
      if (solved.cards.length > 2) {
        const kicker1 = RANK_VALUES[solved.cards[2].value] || 0;
        const kicker2 = RANK_VALUES[solved.cards[3]?.value] || 0;
        kBonus = (kicker1 / 14) * 4.5 + (kicker2 / 14) * 1.5;
      }

      madeScore = pairBase + pBonus + kBonus;
    } else {
      madeScore = (HAND_BASE_SCORES[rawName] || 10) + kickerBonus;
    }
  } else {
    const isPair = normCombo[0][0] === normCombo[1][0];
    const r1 = RANK_VALUES[normCombo[0][0]];
    const r2 = RANK_VALUES[normCombo[1][0]];
    madeScore = isPair ? 25 + (r1 / 14) * 8 : 8 + ((r1 + r2) / 28) * 8;
    handName = isPair ? "ワンペア" : "ハイカード";
  }

  // リバー（5枚）はドロー加算なし
  if (normBoard.length === 5) {
    return { score: Math.round(madeScore), handName };
  }

  // 2. フロップ / ターンでのドロー評価
  const draws = evaluateDraws(normCombo, normBoard);
  let drawBonus = 0;
  let drawName = "";

  if (draws.hasFlushDraw && draws.hasOESD) {
    drawBonus = 48;
    drawName = " (モンスタードロー)";
  } else if (draws.hasFlushDraw && draws.hasGutshot) {
    drawBonus = 35;
    drawName = " (FD + Gut)";
  } else if (draws.hasNutFlushDraw) {
    drawBonus = 32;
    drawName = " (ナッツFD)";
  } else if (draws.hasFlushDraw) {
    drawBonus = 25;
    drawName = " (FD)";
  } else if (draws.hasOESD) {
    drawBonus = 20;
    drawName = " (OESD)";
  } else if (draws.hasGutshot) {
    drawBonus = 10;
    drawName = " (Gutshot)";
  } else if (draws.hasBackdoorFlushDraw) {
    drawBonus = 5;
  }

  // オーバーカード補正
  const maxBoardRank = Math.max(...normBoard.map(c => RANK_VALUES[c[0]]));
  const c1Rank = RANK_VALUES[normCombo[0][0]];
  const c2Rank = RANK_VALUES[normCombo[1][0]];
  let overcards = 0;
  if (c1Rank > maxBoardRank) overcards++;
  if (c2Rank > maxBoardRank) overcards++;

  if (madeScore < 35) {
    drawBonus += overcards * 4;
  }

  const finalScore = Math.min(99, Math.round(madeScore + drawBonus));
  const finalName = drawBonus > 15 && madeScore < 50 ? `${handName}${drawName}` : handName;

  return { score: finalScore, handName: finalName };
}

// ストリートに応じたボード絞り込み
function filterBoardByStreet(board = [], street = "") {
  const valid = (board || []).map(normalizeCard).filter(c => c !== "");
  if (!street) return valid;

  const s = String(street).toLowerCase();
  if (s === "preflop") return [];
  if (s === "flop") return valid.slice(0, 3);
  if (s === "turn") return valid.slice(0, 4);
  if (s === "river") return valid.slice(0, 5);

  return valid;
}

export function calculateHandScore(hand, board = [], street = "") {
  const result = getHandEvaluation(hand, board, street);
  return result.score;
}

export function getHandEvaluation(hand, board = [], street = "") {
  const targetBoard = filterBoardByStreet(board, street);
  const boardSet = new Set(targetBoard);
  const combos = getCombosForHand(hand);

  const validCombos = combos.filter(
    combo => {
      const c1 = normalizeCard(combo[0]);
      const c2 = normalizeCard(combo[1]);
      return !boardSet.has(c1) && !boardSet.has(c2);
    }
  );

  if (validCombos.length === 0) {
    return { score: 0, handName: "ブロック済" };
  }

  let bestEval = { score: -1, handName: "" };

  for (const combo of validCombos) {
    const ev = evaluateSingleCombo(combo, targetBoard);
    if (ev.score > bestEval.score) {
      bestEval = ev;
    }
  }

  return bestEval.score === -1 ? { score: 0, handName: "-" } : bestEval;
}

// 低スコア（弱い）＝白 ➔ 高スコア（強い）＝濃い赤 のグラデーション
export function getScoreColor(score, maxScore = 100, minScore = 0) {
  if (score === 0) return '#1e293b'; // ブロック済（ダークスレート）

  const range = (maxScore - minScore) || 1;
  const ratio = Math.max(0, Math.min(1, (score - minScore) / range));

  // カラーストップ (白 ➔ 淡いピンク ➔ 明るい赤 ➔ 鮮やかな赤 ➔ 濃い深紅)
  const stops = [
    { p: 0.00, color: [255, 255, 255] },  // #ffffff (純白: 最弱)
    { p: 0.25, color: [254, 202, 202] },  // #fecaca (淡いピンク: 弱)
    { p: 0.50, color: [248, 113, 113] },  // #f87171 (明るい赤: 中)
    { p: 0.75, color: [220, 38, 38] },   // #dc2626 (鮮やかな赤: 強)
    { p: 1.00, color: [153, 27, 27] }    // #991b1b (濃い赤: 最強)
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (ratio >= s1.p && ratio <= s2.p) {
      const factor = (ratio - s1.p) / (s2.p - s1.p);
      const r = Math.round(s1.color[0] + factor * (s2.color[0] - s1.color[0]));
      const g = Math.round(s1.color[1] + factor * (s2.color[1] - s1.color[1]));
      const b = Math.round(s1.color[2] + factor * (s2.color[2] - s1.color[2]));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  return 'rgb(153, 27, 27)';
}

// 背景色に応じた文字色（白〜淡い背景帯では黒文字、赤背景帯では白文字）
export function getTextColor(score, maxScore = 100, minScore = 0) {
  if (score === 0) return '#ffffff';

  const range = (maxScore - minScore) || 1;
  const ratio = Math.max(0, Math.min(1, (score - minScore) / range));

  // 白〜薄いピンクの低〜中スコア帯（比率 0.5 以下）は黒文字、濃い赤の高スコア帯は白文字
  if (ratio <= 0.45) {
    return '#1e293b';
  }
  return '#ffffff';
}