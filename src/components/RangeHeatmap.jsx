import React, { useState, useMemo } from 'react';
import { calculateHandScore, getScoreColor, getTextColor, RANKS } from './pokerEvaluator.jsx';

/**
 * @param {Array<string>} boardCards - 全コミュニティボード配列 (例: ['Ts', 'Ks', 'Kc', '5d', '9s'])
 */
export function RangeHeatmap({ boardCards = [] }) {
  // 現在選択中のストリート (初期値: 全カードが出ている場合は'river'、なければ長さに応じて設定)
  const [street, setStreet] = useState('river');
  const [selectedHand, setSelectedHand] = useState('AA');

  // ストリートに応じた有効ボードカードの切り出し
  const currentBoard = useMemo(() => {
    switch (street) {
      case 'preflop':
        return [];
      case 'flop':
        return boardCards.slice(0, 3);
      case 'turn':
        return boardCards.slice(0, 4);
      case 'river':
        return boardCards.slice(0, 5);
      default:
        return boardCards;
    }
  }, [street, boardCards]);

  // ヒートマップ用13x13グリッドの算出
  const { grid, maxScore, minScore, handScores } = useMemo(() => {
    const rawGrid = [];
    let max = -Infinity;
    let min = Infinity;
    const scores = {};

    for (let r = 0; r < 13; r++) {
      const row = [];
      for (let c = 0; c < 13; c++) {
        let hand = '';
        if (r === c) hand = RANKS[r] + RANKS[c];
        else if (r < c) hand = RANKS[r] + RANKS[c] + 's';
        else hand = RANKS[c] + RANKS[r] + 'o';

        const score = calculateHandScore(hand, currentBoard);
        scores[hand] = score;

        if (score > max) max = score;
        if (score < min) min = score;

        row.push({ hand, score });
      }
      rawGrid.push(row);
    }

    return { grid: rawGrid, maxScore: max, minScore: min, handScores: scores };
  }, [currentBoard]);

  const activeHandScore = handScores[selectedHand] ?? 0;

  return (
    <div style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
      
      {/* 1. ストリート切替ボタン群 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', justifyContent: 'center' }}>
        {[
          { key: 'preflop', label: 'Preflop', minCards: 0 },
          { key: 'flop', label: 'Flop', minCards: 3 },
          { key: 'turn', label: 'Turn', minCards: 4 },
          { key: 'river', label: 'River', minCards: 5 },
        ].map((item) => {
          const isActive = street === item.key;
          const isAvailable = boardCards.length >= item.minCards || item.key === 'preflop';

          return (
            <button
              key={item.key}
              onClick={() => isAvailable && setStreet(item.key)}
              disabled={!isAvailable}
              style={{
                flex: 1,
                padding: '5px 0',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: isActive ? '1px solid #60a5fa' : '1px solid #334155',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                backgroundColor: isActive ? '#2563eb' : isAvailable ? '#1e293b' : '#0f172a',
                color: isActive ? '#ffffff' : isAvailable ? '#cbd5e1' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 2. 13x13 ヒートマップグリッド */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 1fr)',
          gap: '2px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '6px'
        }}
      >
        {grid.map((row) =>
          row.map((cell) => {
            const bgColor = getScoreColor(cell.score, maxScore, minScore);
            const textColor = getTextColor(cell.score, maxScore, minScore);
            const isSelected = selectedHand === cell.hand;

            return (
              <button
                key={cell.hand}
                onClick={() => setSelectedHand(cell.hand)}
                style={{
                  aspectRatio: '1',
                  backgroundColor: bgColor,
                  color: textColor,
                  border: isSelected ? '2px solid #ffffff' : 'none',
                  borderRadius: '2px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  zIndex: isSelected ? 2 : 1,
                  boxShadow: isSelected ? '0 0 6px rgba(255,255,255,0.8)' : 'none'
                }}
              >
                {cell.hand}
              </button>
            );
          })
        )}
      </div>

      {/* 3. 選択ハンド＆評価スコア表示 */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <span
          style={{
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '1px solid #334155'
          }}
        >
          選択ハンド: <span style={{ color: '#f59e0b' }}>{selectedHand}</span> | 評価スコア: <span style={{ color: '#22c55e' }}>{activeHandScore}点</span>
        </span>
      </div>
    </div>
  );
}