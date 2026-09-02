import React, { useState } from 'react';
import { getScoreColor, getTextColor, getHandEvaluation } from './pokerEvaluator';

export function HeatmapSection({ board = [], isPc = false, height, windowSize }) {
  const [currentStreet, setCurrentStreet] = useState('River');
  const [isSorted, setIsSorted] = useState(false);
  const [selectedHand, setSelectedHand] = useState('AA');

  const streets = ['Preflop', 'Flop', 'Turn', 'River'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const safeBoard = Array.isArray(board) ? board : [];
  
  // 画面幅が十分広い場合 (例: 1150px 以上) のみ横並び、それ以下の画面幅・カラム幅ではヒートマップ下部にボタン群を配置
  const winWidth = windowSize?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isRowLayout = winWidth >= 1150;

  const gridHeight = height && typeof height === 'number' ? `${height}px` : (isRowLayout ? '290px' : '320px');

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

      {/* 【下部/右側】コントロールパネル（ボタン群） */}
      <div style={{
        flex: isRowLayout ? '1 1 0' : '0 0 auto',
        width: '100%',
        minWidth: isRowLayout ? '140px' : '0px',
        display: 'flex',
        flexDirection: isRowLayout ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: isRowLayout ? 'flex-start' : 'center',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        marginTop: isRowLayout ? 0 : '4px'
      }}>
        
        {/* STREET ボタン（2x2グリッド配置） */}
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

        {/* 50点以上ソートボタン */}
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
            {isSorted ? '50点以上 ON' : '50点以上でソート'}
          </button>
        </div>

        {/* 選択ハンド情報表示欄 */}
        <div style={{
          flex: isRowLayout ? 'none' : '1 1 140px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' }}>SCORE DETAIL</span>
          <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>選択ハンド: <span style={{ color: '#fbbf24', fontSize: '12.5px' }}>{selectedHand}</span></div>
            <div>評価スコア: <span style={{ color: '#f87171', fontSize: '12.5px' }}>
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