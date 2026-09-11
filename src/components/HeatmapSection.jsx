import React, { useState, useMemo } from 'react';
import { getHandEvaluation } from './pokerEvaluator';

// ランク順序（インデックスが小さいほど強い）
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = ['s', 'h', 'd', 'c']; // ♠, ♥, ♦, ♣

/**
 * 抽象ハンド（"55", "AKs", "A7o"）とボードから重なりのない具体カードを生成するヘルパー
 */
function getConcreteHandCards(hand, parsedBoard) {
  const usedSuitsByRank = {};
  parsedBoard.forEach(c => {
    if (!usedSuitsByRank[c.rank]) usedSuitsByRank[c.rank] = new Set();
    usedSuitsByRank[c.rank].add(c.suit);
  });

  const r1 = hand[0];
  const r2 = hand[1];
  const isPair = r1 === r2;
  const isSuited = hand.endsWith('s');

  const getAvailableSuit = (rank, avoidSuit = null) => {
    const used = usedSuitsByRank[rank] || new Set();
    for (const s of SUITS) {
      if (!used.has(s) && s !== avoidSuit) return s;
    }
    return SUITS.find(s => s !== avoidSuit) || 's';
  };

  if (isPair) {
    const s1 = getAvailableSuit(r1);
    const s2 = getAvailableSuit(r1, s1);
    return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
  } else if (isSuited) {
    let commonSuit = SUITS.find(s => 
      !(usedSuitsByRank[r1]?.has(s)) && !(usedSuitsByRank[r2]?.has(s))
    );
    if (!commonSuit) commonSuit = 's';
    return [{ rank: r1, suit: commonSuit }, { rank: r2, suit: commonSuit }];
  } else {
    const s1 = getAvailableSuit(r1);
    const s2 = getAvailableSuit(r2, s1);
    return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
  }
}

/**
 * ボードとハンドから成立しているポーカーの完成役を厳密に判定する関数
 */
function evaluateMadeHand(hand, board = []) {
  if (!board || board.length === 0) return 'ハイカード';

  const parsedBoard = board.map(card => {
    if (!card) return null;
    if (typeof card === 'string' && card.length >= 2) return { rank: card[0], suit: card[1] };
    if (typeof card === 'object' && card.rank) return card;
    return null;
  }).filter(Boolean);

  if (parsedBoard.length === 0) return 'ハイカード';

  const handCards = getConcreteHandCards(hand, parsedBoard);
  const allCards = [...parsedBoard, ...handCards];

  const rankCounts = {};
  const suitCounts = {};
  const suitCards = {};

  allCards.forEach(c => {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    if (!suitCards[c.suit]) suitCards[c.suit] = [];
    suitCards[c.suit].push(c.rank);
  });

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);

  const checkStraight = (ranksArray) => {
    const rankVals = Array.from(new Set(ranksArray.map(r => 14 - RANK_ORDER.indexOf(r)))).sort((a, b) => b - a);
    if (rankVals.includes(14)) rankVals.push(1);
    let streak = 1;
    for (let i = 0; i < rankVals.length - 1; i++) {
      if (rankVals[i] - rankVals[i + 1] === 1) {
        streak++;
        if (streak >= 5) return true;
      } else if (rankVals[i] !== rankVals[i + 1]) {
        streak = 1;
      }
    }
    return false;
  };

  const isFlush = !!flushSuit;
  const isStraight = checkStraight(allCards.map(c => c.rank));
  const isStraightFlush = isFlush && checkStraight(suitCards[flushSuit]);

  if (isStraightFlush) return 'ストレートフラッシュ';
  if (counts[0] >= 4) return 'フォーカード';
  
  const hasThree = counts[0] >= 3;
  const hasTwoOrMoreThree = counts.filter(c => c >= 3).length >= 2;
  const hasPair = counts[1] >= 2;
  if ((hasThree && hasPair) || hasTwoOrMoreThree) return 'フルハウス';

  if (isFlush) return 'フラッシュ';
  if (isStraight) return 'ストレート';
  if (counts[0] === 3) return 'スリーカード';
  if (counts[0] === 2 && counts[1] >= 2) return 'ツーペア';
  if (counts[0] === 2) return 'ワンペア';

  return 'ハイカード';
}

/**
 * ボード上のカードからストレート完成に必要な「キーカード」とその重要度（ウエイト）を動的に計算する
 */
function getStraightKeyRanks(boardRanks) {
  const rankValues = boardRanks.map(r => RANK_ORDER.length - RANK_ORDER.indexOf(r) + 1);
  const valuesSet = new Set(rankValues);
  if (valuesSet.has(14)) valuesSet.add(1);

  const keyRankWeights = {};

  for (let low = 1; low <= 10; low++) {
    const window = [low, low + 1, low + 2, low + 3, low + 4];
    const boardHits = window.filter(val => valuesSet.has(val));
    
    if (boardHits.length >= 2) {
      const missing = window.filter(val => !valuesSet.has(val));
      const weight = boardHits.length >= 3 ? 2 : 1;

      missing.forEach(val => {
        const actualVal = val === 1 ? 14 : val;
        keyRankWeights[actualVal] = (keyRankWeights[actualVal] || 0) + weight;
      });
    }
  }

  return keyRankWeights;
}

/**
 * ボーナス（役構造、ブロッカー等）を計算し、内訳リストと合計値を返す関数
 */
function calculateBonusDetails(hand, board = []) {
  if (!hand || !board || board.length === 0) {
    return { totalBonus: 0, breakdown: [] };
  }

  const breakdown = [];
  const handRanks = [hand[0], hand[1]];
  const isPair = hand[0] === hand[1];

  const parsedBoard = board
    .map(card => {
      if (!card) return null;
      if (typeof card === 'string' && card.length >= 2) {
        return { rank: card[0], suit: card[1] };
      }
      if (typeof card === 'object' && card.rank) {
        return card;
      }
      return null;
    })
    .filter(Boolean);

  if (parsedBoard.length === 0) return { totalBonus: 0, breakdown: [] };

  const boardRanks = parsedBoard
    .map(c => c.rank)
    .filter(rank => RANK_ORDER.includes(rank))
    .sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));

  if (boardRanks.length === 0) return { totalBonus: 0, breakdown: [] };

  const topBoardRank = boardRanks[0];
  const secondBoardRank = boardRanks[1];

  // 1. ポケットペア判定
  if (isPair) {
    if (boardRanks.includes(handRanks[0])) {
      breakdown.push({ label: 'セットボーナス', points: 22 });
    } else {
      const pairRankIndex = RANK_ORDER.indexOf(handRanks[0]);
      const topBoardRankIndex = RANK_ORDER.indexOf(topBoardRank);
      if (pairRankIndex < topBoardRankIndex) {
        breakdown.push({ label: 'オーバーペアボーナス', points: 18 });
      }
    }
  }

  // 2. 非ペアハンド判定
  if (!isPair) {
    const hitBoardRanks = handRanks.filter(r => boardRanks.includes(r));
    if (hitBoardRanks.length >= 2) {
      breakdown.push({ label: 'ツーペアボーナス', points: 10 });
    } else if (handRanks.includes(topBoardRank)) {
      breakdown.push({ label: 'トップペアボーナス', points: 8 });
    } else if (secondBoardRank && handRanks.includes(secondBoardRank)) {
      breakdown.push({ label: 'セカンドペアボーナス', points: 4 });
    }
  }

  // 3. ストレートキーカード・ブロッカー
  const keyRankWeights = getStraightKeyRanks(boardRanks);
  let straightBlockerPoints = 0;
  
  handRanks.forEach(r => {
    const val = RANK_ORDER.length - RANK_ORDER.indexOf(r) + 1;
    if (keyRankWeights[val]) {
      const weight = keyRankWeights[val];
      const pts = weight >= 3 ? 5 : (weight >= 2 ? 4 : 2);
      straightBlockerPoints += pts;
    }
  });

  if (straightBlockerPoints > 0) {
    breakdown.push({ label: 'ストレートブロッカー', points: straightBlockerPoints });
  }

  // 4. ナッツフラッシュブロッカー
  const suitCounts = {};
  parsedBoard.forEach(c => {
    if (c.suit) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });

  const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 3);
  if (flushSuit && handRanks.includes('A')) {
    breakdown.push({ label: 'フラッシュブロッカー', points: 12 });
  }

  const totalBonus = breakdown.reduce((sum, item) => sum + item.points, 0);

  return { totalBonus, breakdown };
}

/**
 * pokerEvaluator の評価結果から完成役とドローのスコアを抽出し、動的補正を適用するヘルパー関数
 */
function parseBaseScoreBreakdown(evaluation, baseScore, hand, board) {
  let rawMadeName = evaluation?.madeHandName || 
                    evaluation?.madeHand || 
                    evaluation?.handRank || 
                    evaluation?.handName || 
                    evaluation?.rankName || 
                    evaluation?.name || 
                    evaluation?.type;

  // 検出された役がない、またはハイカードと判定されている場合は動的判定を実行
  if (!rawMadeName || rawMadeName === 'ハイカード' || rawMadeName === 'High Card') {
    rawMadeName = evaluateMadeHand(hand, board);
  }

  const madeScore = typeof evaluation?.madeScore === 'number' 
    ? evaluation.madeScore 
    : (typeof evaluation?.madeHandScore === 'number' ? evaluation.madeHandScore : null);
    
  const drawScore = typeof evaluation?.drawScore === 'number' ? evaluation.drawScore : null;
  const drawName = evaluation?.drawName || evaluation?.drawType || 'なし';

  let finalMadePoints = 0;
  let finalDrawPoints = 0;

  if (madeScore !== null && drawScore !== null) {
    finalMadePoints = madeScore;
    finalDrawPoints = drawScore;
  } else if (madeScore !== null) {
    finalMadePoints = madeScore;
    finalDrawPoints = Math.max(0, baseScore - madeScore);
  } else if (drawScore !== null) {
    finalDrawPoints = drawScore;
    finalMadePoints = Math.max(0, baseScore - drawScore);
  } else {
    if (drawName && drawName !== 'なし' && drawName !== 'None') {
      finalDrawPoints = Math.round(baseScore * 0.35);
      finalMadePoints = baseScore - finalDrawPoints;
    } else {
      finalMadePoints = baseScore;
      finalDrawPoints = 0;
    }
  }

  return [
    { label: '完成役による点数', points: finalMadePoints, detail: rawMadeName },
    { label: 'ドローによる点数', points: finalDrawPoints, detail: drawName }
  ];
}

/**
 * 相対スコア(0%〜100%)に応じた 0%(青) → 30%(白) → 100%(赤) のグラデーション関数
 */
function getRelativeRedWhiteBlueGradient(normalizedScore) {
  const clamped = Math.max(0, Math.min(100, normalizedScore));

  let r, g, b;
  if (clamped <= 30) {
    const ratio = clamped / 30;
    r = Math.round(37 + (255 - 37) * ratio);
    g = Math.round(99 + (255 - 99) * ratio);
    b = Math.round(235 + (255 - 235) * ratio);
  } else {
    const ratio = (clamped - 30) / 70;
    r = Math.round(255 + (220 - 255) * ratio);
    g = Math.round(255 + (38 - 255) * ratio);
    b = Math.round(255 + (38 - 255) * ratio);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

export function HeatmapSection({ board = [], isPc = false, height, windowSize }) {
  const [currentStreet, setCurrentStreet] = useState('Flop');
  const [isSorted, setIsSorted] = useState(false);
  const [selectedHand, setSelectedHand] = useState('AA');

  const streets = ['Preflop', 'Flop', 'Turn', 'River'];
  const ranks = RANK_ORDER;

  const activeBoard = useMemo(() => {
    const fullBoard = Array.isArray(board) ? board.filter(Boolean) : [];
    if (currentStreet === 'Preflop') return [];
    if (currentStreet === 'Flop') return fullBoard.slice(0, 3);
    if (currentStreet === 'Turn') return fullBoard.slice(0, 4);
    return fullBoard.slice(0, 5);
  }, [board, currentStreet]);

  const winWidth = windowSize?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isRowLayout = winWidth >= 1150;

  const gridHeight = height && typeof height === 'number' ? `${height}px` : (isRowLayout ? '290px' : '320px');

  const { handScoresMap, maxScore } = useMemo(() => {
    const map = {};
    let currentMax = 0;

    ranks.forEach((r1, row) => {
      ranks.forEach((r2, col) => {
        let hand = '';
        if (row === col) hand = `${r1}${r2}`;
        else if (row < col) hand = `${r1}${r2}s`;
        else hand = `${r2}${r1}o`;

        if (!map[hand]) {
          let baseScore = 0;
          let evaluation = null;

          try {
            evaluation = getHandEvaluation(hand, activeBoard, currentStreet);
            baseScore = evaluation?.score ?? 0;
          } catch (e) {
            baseScore = 0;
          }

          const baseBreakdown = parseBaseScoreBreakdown(evaluation, baseScore, hand, activeBoard);
          const { totalBonus, breakdown: bonusBreakdown } = calculateBonusDetails(hand, activeBoard);
          const finalScore = Math.min(100, Math.max(0, baseScore + totalBonus));

          if (finalScore > currentMax) {
            currentMax = finalScore;
          }

          map[hand] = { baseScore, baseBreakdown, totalBonus, bonusBreakdown, finalScore };
        }
      });
    });

    return { handScoresMap: map, maxScore: currentMax || 1 };
  }, [activeBoard, currentStreet, ranks]);

  const selectedHandData = handScoresMap[selectedHand] || {
    baseScore: 0,
    baseBreakdown: [],
    totalBonus: 0,
    bonusBreakdown: [],
    finalScore: 0
  };

  return (
    <div style={{
      width: '100%',
      height: isRowLayout ? gridHeight : 'auto',
      display: 'flex',
      flexDirection: isRowLayout ? 'row' : 'column',
      alignItems: isRowLayout ? 'flex-start' : 'center',
      justifyContent: isRowLayout ? 'space-between' : 'flex-start',
      gap: '10px',
      boxSizing: 'border-box'
    }}>
      
      {/* 【上部/左側】13x13ヒートマップ */}
      <div style={{
        flex: isRowLayout ? '3 3 0' : '0 0 auto',
        width: '100%',
        maxWidth: isRowLayout ? 'none' : '360px',
        height: isRowLayout ? gridHeight : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 1fr)',
          gap: '2px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #334155',
          width: '100%',
          maxWidth: isRowLayout ? gridHeight : '100%',
          maxHeight: isRowLayout ? gridHeight : '100%',
          aspectRatio: '1 / 1',
          boxSizing: 'border-box'
        }}>
          {ranks.map((r1, row) =>
            ranks.map((r2, col) => {
              let hand = '';
              if (row === col) hand = `${r1}${r2}`;
              else if (row < col) hand = `${r1}${r2}s`;
              else hand = `${r2}${r1}o`;

              const { finalScore } = handScoresMap[hand] || { finalScore: 0 };
              const normalizedScore = (finalScore / maxScore) * 100;

              let bgColor = getRelativeRedWhiteBlueGradient(normalizedScore);
              let textColor = (normalizedScore >= 15 && normalizedScore <= 50) ? '#0f172a' : '#ffffff';

              if (isSorted && finalScore < 50) {
                bgColor = '#334155';
                textColor = '#94a3b8';
              }

              const isSelected = selectedHand === hand;

              return (
                <button
                  key={hand}
                  onClick={() => setSelectedHand(hand)}
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    border: isSelected ? '2px solid #fbbf24' : 'none',
                    borderRadius: '3px',
                    fontSize: isRowLayout ? 'clamp(8px, 0.9vw, 11.5px)' : 'clamp(6.5px, 1.8vw, 10.5px)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    boxShadow: isSelected ? '0 0 8px rgba(251, 191, 36, 0.8)' : 'none',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    zIndex: isSelected ? 2 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  title={`${hand}: スコア ${finalScore} (相対 ${Math.round(normalizedScore)}%)`}
                >
                  {hand}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 【下部/右側】コントロールパネル（ボタン群） */}
      <div style={{
        flex: isRowLayout ? '1 1 0' : '0 0 auto',
        width: '100%',
        minWidth: isRowLayout ? '170px' : '0px',
        display: 'flex',
        flexDirection: isRowLayout ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: isRowLayout ? 'flex-start' : 'center',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        marginTop: isRowLayout ? 0 : '4px'
      }}>
        
        {/* STREET SELECT */}
        <div style={{
          flex: isRowLayout ? 'none' : '1 1 140px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 8px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>STREET SELECT</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {streets.map(st => (
              <button
                key={st}
                onClick={() => setCurrentStreet(st)}
                style={{
                  padding: '6px 0',
                  borderRadius: '5px',
                  border: currentStreet === st ? '1.5px solid #60a5fa' : '1px solid #334155',
                  backgroundColor: currentStreet === st ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: currentStreet === st ? '0 2px 6px rgba(37, 99, 235, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* FILTER */}
        <div style={{
          flex: isRowLayout ? 'none' : '1 1 120px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 8px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>FILTER</span>
          <button
            onClick={() => setIsSorted(!isSorted)}
            style={{
              padding: '6px 8px',
              borderRadius: '5px',
              border: isSorted ? '1.5px solid #ef4444' : 'none',
              backgroundColor: isSorted ? '#dc2626' : '#334155',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '10.5px',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: isSorted ? '0 0 8px rgba(220, 38, 38, 0.5)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isSorted ? '50点以上 ON' : '50点以上で絞り込む'}
          </button>
        </div>

        {/* SCORE DETAIL */}
        <div style={{
          flex: isRowLayout ? 'none' : '1 1 180px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>SCORE DETAIL</span>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>選択ハンド: <span style={{ color: '#fbbf24' }}>{selectedHand}</span></div>
            
            {/* 1. 基礎スコア内訳 */}
            <div style={{ borderTop: '1px dashed #475569', paddingTop: '3px' }}>
              <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
                基礎スコア内訳 (計 <span style={{ color: '#93c5fd' }}>{selectedHandData.baseScore}点</span>):
              </div>
              {selectedHandData.baseBreakdown.map((item, idx) => (
                <div key={idx} style={{ color: '#93c5fd', fontSize: '10px', paddingLeft: '4px' }}>
                  ・{item.label}: +{item.points}点 {item.detail ? `(${item.detail})` : ''}
                </div>
              ))}
            </div>

            {/* 2. ボーナス内訳 */}
            <div style={{ borderTop: '1px dashed #475569', paddingTop: '3px' }}>
              <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
                ボーナス内訳 (計 <span style={{ color: '#4ade80' }}>+{selectedHandData.totalBonus}点</span>):
              </div>
              {selectedHandData.bonusBreakdown.length > 0 ? (
                selectedHandData.bonusBreakdown.map((item, idx) => (
                  <div key={idx} style={{ color: '#4ade80', fontSize: '10px', paddingLeft: '4px' }}>
                    ・{item.label}: +{item.points}点
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '10px', paddingLeft: '4px' }}>・加点なし</div>
              )}
            </div>

            {/* 最終スコア */}
            <div style={{ borderTop: '1px solid #475569', paddingTop: '3px', marginTop: '2px' }}>
              最終スコア: <span style={{ color: '#f87171', fontSize: '12px' }}>{selectedHandData.finalScore}点</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export const RangeHeatmapSection = HeatmapSection;
export default HeatmapSection;