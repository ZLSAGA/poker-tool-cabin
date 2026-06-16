// src/utilities/simulator.js
import { createDeck, filterDeck } from './card';
import pokersolver from 'pokersolver';
const { Hand } = pokersolver;

export function calculateEquity(p1, p2, board) {
  // 全探索
  if (!p1.isRange && !p2.isRange) {
    return runExactEnumeration(p1.hand, p2.hand, board);
  }

  //モンテカルロ法
  return runMonteCarlo(p1, p2, board, 100000); // 10万回試行
}

// 全探索
function runExactEnumeration(hand1, hand2, board) {
  const baseDeck = createDeck();
  const allUsedCards = [];
  hand1.forEach(c => allUsedCards.push(c));
  hand2.forEach(c => allUsedCards.push(c));
  board.forEach(c => allUsedCards.push(c));

  const remainingDeck = filterDeck(baseDeck, allUsedCards);
  const needCards = 5 - board.length;

  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  // ▼ 【修正】リバーまで5枚すべて埋まっている場合の処理を新設
  if (needCards === 0) {
    const result = evaluateWinner(hand1, hand2, board);
    if (result === 1) p1Wins++;
    else if (result === 2) p2Wins++;
    else ties++;
  } 
  // ▼ 【修正】オブジェクトではなく .key (文字列) を finalBoard に渡すよう修正
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
  // ▼ 【修正】オブジェクトではなく .key (文字列) を finalBoard に渡すよう修正
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
  };
}

// モンテカルロ法
function runMonteCarlo(p1, p2, board, iterations) {
  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  const baseDeck = createDeck();
  const needCards = 5 - board.length;

  for (let i = 0; i < iterations; i++) {
    let hand1 = p1.isRange ? p1.range[Math.floor(Math.random() * p1.range.length)] : p1.hand;
    let hand2 = p2.isRange ? p2.range[Math.floor(Math.random() * p2.range.length)] : p2.hand;

    if (!hand1 || !hand2) return { p1Equity: 0, p2Equity: 0 };

    const usedCardKeys = [...hand1, ...hand2, ...board];
    const uniqueCards = new Set(usedCardKeys);
    
    if (uniqueCards.size !== usedCardKeys.length) {
      i--;
      continue;
    }

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
  }

  return {
    p1Equity: ((p1Wins + ties * 0.5) / iterations) * 100,
    p2Equity: ((p2Wins + ties * 0.5) / iterations) * 100,
  };
}

function evaluateWinner(hand1, hand2, board) {
  const p1Cards = [...hand1, ...board];
  const p2Cards = [...hand2, ...board];

  const p1Hand = Hand.solve(p1Cards);
  const p2Hand = Hand.solve(p2Cards);

  const winners = Hand.winners([p1Hand, p2Hand]);

  if (winners.length === 2) {
    return 0; // 引き分け
  } else if (winners[0] === p1Hand) {
    return 1; // P1勝ち
  } else {
    return 2; // P2勝ち
  }
}