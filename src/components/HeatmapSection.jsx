import React, { useState } from 'react';
import { getScoreColor, getTextColor, getHandEvaluation } from './pokerEvaluator';

export function HeatmapSection({ board = [] }) {
  const [currentStreet, setCurrentStreet] = useState('River');
  const [isSorted, setIsSorted] = useState(false); // 50点以上ソート（絞り込み）
  const [selectedHand, setSelectedHand] = useState('QJs');

  const streets = ['Preflop', 'Flop', 'Turn', 'River'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  // ボードデータの安全策
  const safeBoard = Array.isArray(board) ? board : [];

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    }}>
      {/* 
        横並びコンテナ (flex-direction: row)
        【左】ヒートマップ本体 (左端に配置)  /  【右】操作ボタン群 
      */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        
        {/* 【左側】ヒートマップ + 選択ハンド評価表示 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 1fr)',
            gap: '1px',
            backgroundColor: '#0f172a', // 暗い背景で白セルもくっきり境界線が出る
            padding: '4px',
            borderRadius: '6px',
            width: '360px',
            height: '360px',
            boxSizing: 'border-box'
          }}>
            {ranks.map((r1, row) =>
              ranks.map((r2, col) => {
                let hand = '';
                if (row === col) hand = `${r1}${r2}`;
                else if (row < col) hand = `${r1}${r2}s`;
                else hand = `${r2}${r1}o`;

                // ハンド評価の安全呼び出し
                let score = 0;
                try {
                  const evaluation = getHandEvaluation(hand, safeBoard, currentStreet);
                  score = evaluation?.score ?? 0;
                } catch (e) {
                  score = 0;
                }

                // 1. pokerEvaluator.js のグラデーション色を適用
                let bgColor = getScoreColor(score);
                let textColor = getTextColor(score);

                // 2. 「50点以上でソート」がON かつ 50点未満の場合は灰色にする
                if (isSorted && score < 50) {
                  bgColor = '#334155';  // 灰色（ダークスレート）
                  textColor = '#94a3b8'; // 淡いグレー文字
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
                      fontSize: '10px',
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

          {/* 下部：選択ハンド情報 */}
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            width: '360px',
            textAlign: 'center',
            boxSizing: 'border-box'
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

        {/* 【右側】コントロールパネル (ストリート切替 ＆ ソートボタン) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minWidth: '110px'
        }}>
          
          {/* ストリート選択（縦並び） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>STREET</span>
            {streets.map(st => (
              <button
                key={st}
                onClick={() => setCurrentStreet(st)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: currentStreet === st ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* 50点以上でソートボタン */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>FILTER</span>
            <button
              onClick={() => setIsSorted(!isSorted)}
              style={{
                padding: '8px 10px',
                borderRadius: '4px',
                border: isSorted ? '1px solid #ef4444' : 'none',
                backgroundColor: isSorted ? '#dc2626' : '#334155',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isSorted ? '0 0 8px rgba(220, 38, 38, 0.6)' : 'none'
              }}
            >
              {isSorted ? '50点以上 ON' : '50点以上でソート'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// エラー防止用の同義エクスポート設定
export const RangeHeatmapSection = HeatmapSection;
export default HeatmapSection;