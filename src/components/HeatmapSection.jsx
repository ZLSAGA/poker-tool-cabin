import React, { useState } from 'react';
import { getScoreColor, getTextColor, getHandEvaluation } from './pokerEvaluator';

export function HeatmapSection({ board = [] }) {
  const [currentStreet, setCurrentStreet] = useState('River');
  const [isSorted, setIsSorted] = useState(false);
  const [selectedHand, setSelectedHand] = useState('AA');

  const streets = ['Preflop', 'Flop', 'Turn', 'River'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const safeBoard = Array.isArray(board) ? board : [];

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      gap: '12px',
      boxSizing: 'border-box'
    }}>
      
      {/* 【左側】13x13ヒートマップ + 選択情報 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 1fr)',
          gap: '1px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '6px',
          width: '320px',
          height: '320px',
          boxSizing: 'border-box'
        }}>
          {ranks.map((r1, row) =>
            ranks.map((r2, col) => {
              let hand = '';
              if (row === col) hand = `${r1}${r2}`;
              else if (row < col) hand = `${r1}${r2}s`;
              else hand = `${r2}${r1}o`;

              let score = 0;
              try {
                const evaluation = getHandEvaluation(hand, safeBoard, currentStreet);
                score = evaluation?.score ?? 0;
              } catch (e) {
                score = 0;
              }

              let bgColor = getScoreColor(score);
              let textColor = getTextColor(score);

              if (isSorted && score < 50) {
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
                    border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(15, 23, 42, 0.3)',
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  {hand}
                </button>
              );
            })
          )}
        </div>

        {/* 選択ハンド情報表示欄 */}
        <div style={{
          marginTop: '6px',
          padding: '6px 10px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 'bold',
          width: '320px',
          textAlign: 'center',
          boxSizing: 'border-box',
          border: '1px solid #334155'
        }}>
          選択ハンド: <span style={{ color: '#fbbf24' }}>{selectedHand}</span> | 
          評価スコア: <span style={{ color: '#f87171' }}>
            {(() => {
              try {
                return getHandEvaluation(selectedHand, safeBoard, currentStreet).score;
              } catch (e) {
                return 0;
              }
            })()}点
          </span>
        </div>
      </div>

      {/* 【右側】コントロールパネル */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: '100px',
        flex: 1
      }}>
        
        {/* STREET ボタン */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>STREET</span>
          {streets.map(st => (
            <button
              key={st}
              onClick={() => setCurrentStreet(st)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: currentStreet === st ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* 50点以上ソートボタン */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>FILTER</span>
          <button
            onClick={() => setIsSorted(!isSorted)}
            style={{
              padding: '7px 8px',
              borderRadius: '4px',
              border: isSorted ? '1px solid #ef4444' : 'none',
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
            {isSorted ? '50点以上 ON' : '50点以上でソート'}
          </button>
        </div>

      </div>

    </div>
  );
}

export const RangeHeatmapSection = HeatmapSection;
export default HeatmapSection;