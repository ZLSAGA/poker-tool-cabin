// src/utilities/simulator.js
import { createDeck, filterDeck } from './card';
import pokersolver from 'pokersolver';
const { Hand } = pokersolver;

// ★ 第5引数に exposedCards を追加 (デフォルトは空配列)
export function calculateEquity(p1, p2, board, iterations = 30000, exposedCards = []) {
  const needCards = 5 - board.length;

  if (p1.isRange || p2.isRange || needCards === 5) {
    const result = runMonteCarlo(p1, p2, board, iterations, exposedCards); 

    let reason = "";
    if (p1.isRange || p2.isRange) {
      reason = "レンジ指定のため";
    } else {
      reason = "プリフロップのため";
    }

    return {
      p1Equity: result.p1Equity,
      p2Equity: result.p2Equity,
      p1Win: result.p1Win,
      p2Win: result.p2Win,
      tie: result.tie,
      calcMethod: `モンテカルロ法 (${iterations.toLocaleString()}回試行) - ${reason}`
    };
  }

  const result = runExactEnumeration(p1.hand, p2.hand, board, exposedCards);
  return {
    p1Equity: result.p1Equity,
    p2Equity: result.p2Equity,
    p1Win: result.p1Win,
    p2Win: result.p2Win,
    tie: result.tie,
    calcMethod: `全探索 (${result.totalPatterns.toLocaleString()}通りの組み合わせ)`
  };
}

// 全探索の実行
function runExactEnumeration(hand1, hand2, board, exposedCards = []) {
  const baseDeck = createDeck();
  const allUsedCards = [];
  hand1.forEach(c => allUsedCards.push(c));
  hand2.forEach(c => allUsedCards.push(c));
  board.forEach(c => allUsedCards.push(c));
  exposedCards.forEach(c => allUsedCards.push(c)); // ★ デッドカード追加

  const remainingDeck = filterDeck(baseDeck, allUsedCards);
  const needCards = 5 - board.length;

  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  if (needCards === 0) {
    const result = evaluateWinner(hand1, hand2, board);
    if (result === 1) p1Wins++;
    else if (result === 2) p2Wins++;
    else ties++;
  }
  else if (needCards === 1) {
    for (let i = 0; i < remainingDeck.length; i++) {
      const card1 = remainingDeck[i].key;
      const finalBoard = [...board, card1];
      const result = evaluateWinner(hand1, hand2, finalBoard);
      if (result === 1) p1Wins++;
      else if (result === 2) p2Wins++;
      else ties++;
    }
  }
  else if (needCards === 2) {
    for (let i = 0; i < remainingDeck.length; i++) {
      for (let j = i + 1; j < remainingDeck.length; j++) {
        const card1 = remainingDeck[i].key;
        const card2 = remainingDeck[j].key;
        const finalBoard = [...board, card1, card2];
        const result = evaluateWinner(hand1, hand2, finalBoard);
        if (result === 1) p1Wins++;
        else if (result === 2) p2Wins++;
        else ties++;
      }
    }
  }
  else if (needCards === 5) {
    for (let i = 0; i < remainingDeck.length; i++) {
      for (let j = i + 1; j < remainingDeck.length; j++) {
        for (let k = j + 1; k < remainingDeck.length; k++) {
          for (let l = k + 1; l < remainingDeck.length; l++) {
            for (let m = l + 1; m < remainingDeck.length; m++) {
              const finalBoard = [
                remainingDeck[i].key,
                remainingDeck[j].key,
                remainingDeck[k].key,
                remainingDeck[l].key,
                remainingDeck[m].key
              ];
              const result = evaluateWinner(hand1, hand2, finalBoard);
              if (result === 1) p1Wins++;
              else if (result === 2) p2Wins++;
              else ties++;
            }
          }
        }
      }
    }
  }

  const total = p1Wins + p2Wins + ties;
  return {
    p1Equity: total > 0 ? ((p1Wins + ties * 0.5) / total) * 100 : 0,
    p2Equity: total > 0 ? ((p2Wins + ties * 0.5) / total) * 100 : 0,
    p1Win: total > 0 ? (p1Wins / total) * 100 : 0,
    p2Win: total > 0 ? (p2Wins / total) * 100 : 0,
    tie: total > 0 ? (ties / total) * 100 : 0,
    totalPatterns: total
  };
}

// モンテカルロ法の実行
function runMonteCarlo(p1, p2, board, iterations, exposedCards = []) {
  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  const baseDeck = createDeck();
  const needCards = 5 - board.length;

  const boardAndExposed = new Set([...board, ...exposedCards]);

  const validP1Combos = p1.isRange
    ? (p1.range || []).filter(c => !boardAndExposed.has(c[0]) && !boardAndExposed.has(c[1]))
    : (p1.hand && p1.hand.length === 2 && !p1.hand.some(c => boardAndExposed.has(c)) ? [p1.hand] : []);

  const validP2Combos = p2.isRange
    ? (p2.range || []).filter(c => !boardAndExposed.has(c[0]) && !boardAndExposed.has(c[1]))
    : (p2.hand && p2.hand.length === 2 && !p2.hand.some(c => boardAndExposed.has(c)) ? [p2.hand] : []);

  if (validP1Combos.length === 0 || validP2Combos.length === 0) {
    return { p1Equity: 0, p2Equity: 0, p1Win: 0, p2Win: 0, tie: 0 };
  }

  // 重複のないハンド組み合わせが少なくとも1つ存在するか確認
  let hasPair = false;
  for (let i = 0; i < validP1Combos.length; i++) {
    const h10 = validP1Combos[i][0];
    const h11 = validP1Combos[i][1];
    for (let j = 0; j < validP2Combos.length; j++) {
      const h20 = validP2Combos[j][0];
      const h21 = validP2Combos[j][1];
      if (h10 !== h20 && h10 !== h21 && h11 !== h20 && h11 !== h21) {
        hasPair = true;
        break;
      }
    }
    if (hasPair) break;
  }

  if (!hasPair) {
    return { p1Equity: 0, p2Equity: 0, p1Win: 0, p2Win: 0, tie: 0 };
  }

  let validSimulations = 0;
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 1000;

  for (let i = 0; i < iterations; i++) {
    const hand1 = validP1Combos[Math.floor(Math.random() * validP1Combos.length)];
    const hand2 = validP2Combos[Math.floor(Math.random() * validP2Combos.length)];

    if (!hand1 || !hand2) continue;

    // hand1 と hand2 の重複チェック
    if (hand1[0] === hand2[0] || hand1[0] === hand2[1] || hand1[1] === hand2[0] || hand1[1] === hand2[1]) {
      consecutiveFailures++;
      if (consecutiveFailures > maxConsecutiveFailures) {
        break;
      }
      i--;
      continue;
    }
    consecutiveFailures = 0;

    const usedCardKeys = [...hand1, ...hand2, ...board, ...exposedCards];

    let finalBoard = [...board];
    if (needCards > 0) {
      const remainingDeck = filterDeck(baseDeck, usedCardKeys);
      for (let n = 0; n < needCards; n++) {
        const randomIndex = Math.floor(Math.random() * remainingDeck.length);
        const pickedCard = remainingDeck.splice(randomIndex, 1)[0];
        finalBoard.push(pickedCard.key);
      }
    }

    const result = evaluateWinner(hand1, hand2, finalBoard);
    if (result === 1) p1Wins++;
    else if (result === 2) p2Wins++;
    else ties++;
    validSimulations++;
  }

  const total = validSimulations > 0 ? validSimulations : 1;

  return {
    p1Equity: ((p1Wins + ties * 0.5) / total) * 100,
    p2Equity: ((p2Wins + ties * 0.5) / total) * 100,
    p1Win: (p1Wins / total) * 100,
    p2Win: (p2Wins / total) * 100,
    tie: (ties / total) * 100,
  };
}

function evaluateWinner(hand1, hand2, board) {
  const p1Cards = [...hand1, ...board];
  const p2Cards = [...hand2, ...board];

  const p1Hand = Hand.solve(p1Cards);
  const p2Hand = Hand.solve(p2Cards);

  const winners = Hand.winners([p1Hand, p2Hand]);

  if (winners.length === 2) {
    return 0;
  } else if (winners[0] === p1Hand) {
    return 1;
  } else {
    return 2;
  }
}