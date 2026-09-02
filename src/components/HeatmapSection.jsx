import React, { useState } from 'react';
import { getScoreColor, getTextColor, getHandEvaluation } from './pokerEvaluator';

export function HeatmapSection({ board = [], isPc = false, height }) {
  const [currentStreet, setCurrentStreet] = useState('River');
  const [isSorted, setIsSorted] = useState(false);
  const [selectedHand, setSelectedHand] = useState('AA');

  const streets = ['Preflop', 'Flop', 'Turn', 'River'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const safeBoard = Array.isArray(board) ? board : [];
  const gridHeight = height ? `${height}px` : (isPc ? '290px' : '320px');

  return (
    <div style={{
      width: '100%',
      height: gridHeight,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      boxSizing: 'border-box'
    }}>
      
      {/* 【左側】13x13ヒートマップ（全体の 3/4 [75%] を占有） */}
      <div style={{
        flex: '3 3 0',
        height: gridHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 1fr)',
          gap: '2px',
          backgroundColor: '#0f172a',
          padding: '6px',
          borderRadius: '8px',
          border: '1px solid #334155',
          height: '100%',
          aspectRatio: '1 / 1',
          maxHeight: '100%',
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
                    border: isSelected ? '2px solid #ffffff' : 'none',
                    borderRadius: '3px',
                    fontSize: isPc ? '11.5px' : '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    zIndex: isSelected ? 2 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  title={`${hand}: スコア ${score}`}
                >
                  {hand}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 【右側】コントロールパネル（拡大化） */}
      <div style={{
        flex: '1 1 0',
        minWidth: '140px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        justifyContent: 'flex-start'
      }}>
        
        {/* STREET ボタン（2x2グリッド配置） */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>STREET SELECT</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {streets.map(st => (
              <button
                key={st}
                onClick={() => setCurrentStreet(st)}
                style={{
                  padding: '9px 0',
                  borderRadius: '5px',
                  border: currentStreet === st ? '1.5px solid #60a5fa' : '1px solid #334155',
                  backgroundColor: currentStreet === st ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11.5px',
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

        {/* 50点以上ソートボタン */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>FILTER</span>
          <button
            onClick={() => setIsSorted(!isSorted)}
            style={{
              padding: '9px 10px',
              borderRadius: '5px',
              border: isSorted ? '1.5px solid #ef4444' : 'none',
              backgroundColor: isSorted ? '#dc2626' : '#334155',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11.5px',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: isSorted ? '0 0 8px rgba(220, 38, 38, 0.5)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isSorted ? '50点以上 ON' : '50点以上でソート'}
          </button>
        </div>

        {/* 選択ハンド情報表示欄 (フィルターの下に二行で表示) */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '12px 14px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>SCORE DETAIL</span>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>選択ハンド: <span style={{ color: '#fbbf24', fontSize: '14.5px' }}>{selectedHand}</span></div>
            <div>評価スコア: <span style={{ color: '#f87171', fontSize: '14.5px' }}>
              {(() => {
                try {
                  return getHandEvaluation(selectedHand, safeBoard, currentStreet).score;
                } catch (e) {
                  return 0;
                }
              })()}点
            </span></div>
          </div>
        </div>

      </div>

    </div>
  );
}

export const RangeHeatmapSection = HeatmapSection;
export default HeatmapSection;