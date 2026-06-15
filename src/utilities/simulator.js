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

  // 引数に「...」をつけずにそのまま渡す
  const remainingDeck = filterDeck(baseDeck, allUsedCards);
  const needCards = 5 - board.length;

  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  if (needCards === 1) {
    for (let i = 0; i < remainingDeck.length; i++) {
      const card1 = remainingDeck[i].key ? remainingDeck[i].key : remainingDeck[i];
      const finalBoard = [...board, remainingDeck[i]];
      const result = evaluateWinner(hand1, hand2, finalBoard);
      if (result === 1) p1Wins++;
      else if (result === 2) p2Wins++;
      else ties++;
    }
  } else if (needCards === 2) {
    for (let i = 0; i < remainingDeck.length; i++) {
      for (let j = i + 1; j < remainingDeck.length; j++) {
        const card1 = remainingDeck[i].key ? remainingDeck[i].key : remainingDeck[i];
        const card2 = remainingDeck[j].key ? remainingDeck[j].key : remainingDeck[j];
        const finalBoard = [...board, card1, card2];
        const result = evaluateWinner(hand1, hand2, finalBoard);
        if (result === 1) p1Wins++;
        else if (result === 2) p2Wins++;
        else ties++;
      }
    }
  } else if (needCards === 5) {
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
    p1Equity: total > 0 ? ((p1Wins + (ties * 0.5)) / total) * 100 : 0,
    p2Equity: total > 0 ? ((p2Wins + (ties * 0.5)) / total) * 100 : 0,
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
    let hand1;
    if (p1.isRange) {
      hand1 = p1.range[Math.floor(Math.random() * p1.range.length)];
    } else {
      hand1 = p1.hand;
    }
    let hand2;
    if (p2.isRange) {
      hand2 = p2.range[Math.floor(Math.random() * p2.range.length)];
    } else {
      hand2 = p2.hand;
    }


    if (!hand1 || !hand2) return { p1Equity: 0, p2Equity: 0 };

    // 3. カードの重複をチェック
    const usedCardKeys = [...hand1, ...hand2, ...board];
    const uniqueCards = new Set(usedCardKeys);
    
    if (uniqueCards.size !== usedCardKeys.length) {
      // 重複があった場合は無効なシミュレーションなので、この回をやり直す
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

  // 1. 勝者が2人（役の強さが完全に同じ）なら引き分け
  if (winners.length === 2) {
    return 0; 
  } 
  
  // 2. 勝者のカードの文字列と、p1のカードの文字列を比較する
  // (オブジェクトの比較ではなく、文字列にすることでJavaScriptが正しく判定できるようになります)
  if (winners[0].cards.toString() === p1Hand.cards.toString()) {
    return 1; // Player 1 (AA) の勝ち
  } else {
    return 2; // Player 2 (KK) の勝ち
  }
}


