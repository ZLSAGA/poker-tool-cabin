import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { calculateHandScore, getScoreColor, getTextColor } from './pokerEvaluator';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const HAND_COLORS = {
  highCard: '#94a3b8',
  onePair: '#60a5fa',
  twoPair: '#2563eb',
  threeCard: '#a855f7',
  straight: '#10b981',
  flush: '#f59e0b',
  fullHousePlus: '#ef4444',
};

const HAND_LABELS = {
  highCard: 'ハイカード',
  onePair: 'ワンペア',
  twoPair: 'ツーペア',
  threeCard: 'スリーカード',
  straight: 'ストレート',
  flush: 'フラッシュ',
  fullHousePlus: 'フルハウス+',
};

// 【勝率用ツールチップ】
const CustomEquityTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        color: "#f8fafc",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #334155",
        fontSize: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
        maxWidth: "240px",
        pointerEvents: "none"
      }}>
        <p style={{ margin: "0 0 6px 0", fontWeight: "bold", borderBottom: "1px solid #475569", paddingBottom: "4px", color: "#e2e8f0" }}>
          {label}
        </p>
        {payload.map((item, index) => (
          <p key={index} style={{ margin: "2px 0", color: item.color, fontWeight: "bold" }}>
            {item.name}: {item.value !== undefined ? Number(item.value).toFixed(1) : 0}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 【成立役用ツールチップ】
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const p1Items = payload.filter((item) => item.dataKey.startsWith('p1_') && item.value > 0);
    const p2Items = payload.filter((item) => item.dataKey.startsWith('p2_') && item.value > 0);

    return (
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid #334155',
        padding: '10px 12px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '11px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        minWidth: '230px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px', textAlign: 'center' }}>
          {label} 成立役比較
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #3b82f6', fontSize: '11.5px' }}>
              Player 1 (左)
            </div>
            {p1Items.length > 0 ? p1Items.slice().reverse().map((item) => {
              const key = item.dataKey.replace('p1_', '');
              return (
                <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.fill, display: 'inline-block' }} />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{HAND_LABELS[key] || key}:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', marginLeft: 'auto' }}>{Number(item.value).toFixed(1)}%</span>
                </div>
              );
            }) : <span style={{ color: '#94a3b8', fontSize: '10px' }}>データなし</span>}
          </div>

          <div>
            <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #ef4444', fontSize: '11.5px' }}>
              Player 2 (右)
            </div>
            {p2Items.length > 0 ? p2Items.slice().reverse().map((item) => {
              const key = item.dataKey.replace('p2_', '');
              return (
                <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.fill, display: 'inline-block' }} />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{HAND_LABELS[key] || key}:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', marginLeft: 'auto' }}>{Number(item.value).toFixed(1)}%</span>
                </div>
              );
            }) : <span style={{ color: '#94a3b8', fontSize: '10px' }}>データなし</span>}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function EquityChart({ historyData, boardCards = [], style }) {
  const [activeTab, setActiveTab] = useState('equity'); // 'equity' | 'hands' | 'heatmap'
  const [selectedHand, setSelectedHand] = useState(null);
  const [street, setStreet] = useState('river'); // ストリート切替状態
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ★ 1. 有効なカード（nullや空文字を除外）のみをフィルター取得
  const validBoardCards = useMemo(() => {
    return (boardCards || []).filter((card) => card && card !== '');
  }, [boardCards]);

  // ★ 2. 選択ストリートに応じた有効カード切り出し
  const currentBoard = useMemo(() => {
    switch (street) {
      case 'preflop': return [];
      case 'flop': return validBoardCards.slice(0, 3);
      case 'turn': return validBoardCards.slice(0, 4);
      case 'river': return validBoardCards.slice(0, 5);
      default: return validBoardCards;
    }
  }, [street, validBoardCards]);

  // 13×13 マトリックス用スコアデータの算出・キャッシュ
  const heatmapGrid = useMemo(() => {
    const rawGrid = [];
    let maxScore = -Infinity;
    let minScore = Infinity;

    for (let r = 0; r < 13; r++) {
      const row = [];
      for (let c = 0; c < 13; c++) {
        let hand = '';
        if (r === c) hand = RANKS[r] + RANKS[c];
        else if (r < c) hand = RANKS[r] + RANKS[c] + 's';
        else hand = RANKS[c] + RANKS[r] + 'o';

        const score = calculateHandScore(hand, currentBoard);
        if (score > maxScore) maxScore = score;
        if (score < minScore) minScore = score;

        row.push({ hand, score, row: r, col: c });
      }
      rawGrid.push(row);
    }

    return rawGrid.map((row) =>
      row.map((item) => ({
        ...item,
        color: getScoreColor(item.score, maxScore, minScore),
        textColor: getTextColor(item.score, maxScore, minScore),
      }))
    );
  }, [currentBoard]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const plotWidth = Math.max(0, containerWidth - 30);
  const calculatedBarSize = containerWidth > 0
    ? Math.max(10, Math.round(((plotWidth / 4) * 0.6) / 2))
    : undefined;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      
      {/* 1. メインタブ切り替えボタン */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px' }}>
        <button
          onClick={() => setActiveTab('equity')}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer',
            backgroundColor: activeTab === 'equity' ? '#2563eb' : 'transparent', color: activeTab === 'equity' ? '#fff' : '#94a3b8', transition: 'all 0.2s ease'
          }}
        >
          勝率推移
        </button>
        <button
          onClick={() => setActiveTab('hands')}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer',
            backgroundColor: activeTab === 'hands' ? '#2563eb' : 'transparent', color: activeTab === 'hands' ? '#fff' : '#94a3b8', transition: 'all 0.2s ease'
          }}
        >
          成立役の推移
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer',
            backgroundColor: activeTab === 'heatmap' ? '#2563eb' : 'transparent', color: activeTab === 'heatmap' ? '#fff' : '#94a3b8', transition: 'all 0.2s ease'
          }}
        >
          レンジヒートマップ
        </button>
      </div>

      {/* サブガイド領域 */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '6px', fontSize: '11px', height: '18px',
        visibility: activeTab === 'hands' ? 'visible' : 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93c5fd', fontWeight: 'bold' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />
          左バー: Player 1
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fca5a5', fontWeight: 'bold' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
          右バー: Player 2
        </div>
      </div>

      {/* 2. メイン表示エリア */}
      <div ref={containerRef} style={{ width: '100%', minHeight: '340px', position: 'relative' }}>
        
        {activeTab === 'equity' && (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" />
              <Tooltip trigger="hover" content={<CustomEquityTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
              <Line type="linear" dataKey="p1" name="Player 1" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={350} />
              <Line type="linear" dataKey="p2" name="Player 2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={350} />
              <Line type="linear" dataKey="tie" name="Chop" stroke="#dedddd" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={350} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'hands' && (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={calculatedBarSize}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" />
              <Tooltip trigger="hover" content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
              <Bar dataKey="p1_highCard" stackId="p1" fill={HAND_COLORS.highCard} isAnimationActive={false} />
              <Bar dataKey="p1_onePair" stackId="p1" fill={HAND_COLORS.onePair} isAnimationActive={false} />
              <Bar dataKey="p1_twoPair" stackId="p1" fill={HAND_COLORS.twoPair} isAnimationActive={false} />
              <Bar dataKey="p1_threeCard" stackId="p1" fill={HAND_COLORS.threeCard} isAnimationActive={false} />
              <Bar dataKey="p1_straight" stackId="p1" fill={HAND_COLORS.straight} isAnimationActive={false} />
              <Bar dataKey="p1_flush" stackId="p1" fill={HAND_COLORS.flush} isAnimationActive={false} />
              <Bar dataKey="p1_fullHousePlus" stackId="p1" fill={HAND_COLORS.fullHousePlus} isAnimationActive={false} />
              <Bar dataKey="p2_highCard" stackId="p2" fill={HAND_COLORS.highCard} isAnimationActive={false} />
              <Bar dataKey="p2_onePair" stackId="p2" fill={HAND_COLORS.onePair} isAnimationActive={false} />
              <Bar dataKey="p2_twoPair" stackId="p2" fill={HAND_COLORS.twoPair} isAnimationActive={false} />
              <Bar dataKey="p2_threeCard" stackId="p2" fill={HAND_COLORS.threeCard} isAnimationActive={false} />
              <Bar dataKey="p2_straight" stackId="p2" fill={HAND_COLORS.straight} isAnimationActive={false} />
              <Bar dataKey="p2_flush" stackId="p2" fill={HAND_COLORS.flush} isAnimationActive={false} />
              <Bar dataKey="p2_fullHousePlus" stackId="p2" fill={HAND_COLORS.fullHousePlus} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'heatmap' && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            boxSizing: 'border-box'
          }}>
            
            {/* ★ 3. ストリート切り替えボタン群 (レイアウト崩れ対策で独立配置) */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', width: '100%', maxWidth: '380px' }}>
              {[
                { key: 'preflop', label: 'Preflop', minCards: 0 },
                { key: 'flop', label: 'Flop', minCards: 3 },
                { key: 'turn', label: 'Turn', minCards: 4 },
                { key: 'river', label: 'River', minCards: 5 },
              ].map((item) => {
                const isActive = street === item.key;
                // 有効枚数で判定
                const isAvailable = validBoardCards.length >= item.minCards || item.key === 'preflop';

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
                      opacity: isAvailable ? 1 : 0.4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 13x13 グリッド */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(13, 1fr)',
              gap: '2px',
              width: '100%',
              maxWidth: '380px',
              aspectRatio: '1 / 1',
              backgroundColor: '#0f172a',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid #334155',
              boxSizing: 'border-box'
            }}>
              {heatmapGrid.map((row, r) =>
                row.map((item, c) => {
                  const isSelected = selectedHand?.hand === item.hand;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => setSelectedHand(item)}
                      style={{
                        backgroundColor: item.color,
                        color: item.textColor,
                        border: isSelected ? '2px solid #ffffff' : 'none',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        zIndex: isSelected ? 2 : 1,
                        transition: 'all 0.15s ease'
                      }}
                      title={`${item.hand}: スコア ${item.score}`}
                    >
                      {item.hand}
                    </button>
                  );
                })
              )}
            </div>

            {/* クリックされたハンドの詳細表示パネル */}
            <div style={{
              marginTop: '8px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              padding: '0 16px',
              borderRadius: '6px',
              border: '1px solid #334155',
              fontSize: '12px',
              color: '#f8fafc'
            }}>
              {selectedHand ? (
                <span>
                  選択ハンド: <strong style={{ color: '#ffc107', fontSize: '13px' }}>{selectedHand.hand}</strong>
                  {' | '}
                  評価スコア: <strong style={{ color: selectedHand.color, fontSize: '13px' }}>{selectedHand.score}点</strong>
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>※ マス目をクリックするとハンドの詳細スコアが表示されます</span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 凡例表示 */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px', paddingTop: '6px',
        borderTop: activeTab === 'hands' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        visibility: activeTab === 'hands' ? 'visible' : 'hidden'
      }}>
        {Object.entries(HAND_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#cbd5e1' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: HAND_COLORS[key] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}