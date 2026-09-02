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
import HeatmapSection from './HeatmapSection';

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
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 有効なボードカードのみ抽出
  const validBoardCards = useMemo(() => {
    return (boardCards || []).filter((card) => card && card !== '');
  }, [boardCards]);

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
          historyData && historyData.length > 0 ? (
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
          ) : (
            <div style={{
              height: "340px", border: "2px dashed rgba(255,255,255,0.25)", borderRadius: "12px",
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px 16px",
              textAlign: "center", color: "rgba(255,255,255,0.6)", backgroundColor: "rgba(0,0,0,0.18)", boxSizing: "border-box"
            }}>
              <span style={{ fontSize: "clamp(12px, 1.3vw, 16px)", fontWeight: "bold", color: "#ffc107", letterSpacing: "0.5px" }}>EQUITY & HAND ANALYZER</span>
              <span style={{ fontSize: "clamp(10px, 1vw, 13px)", marginTop: "8px", maxWidth: "280px", lineHeight: "1.5", color: "#cbd5e1" }}>
                カードをセットして「勝率を計算する」をクリックすると、ここにストリートごとの推移チャートが表示されます。
              </span>
            </div>
          )
        )}

        {activeTab === 'hands' && (
          historyData && historyData.length > 0 ? (
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
          ) : (
            <div style={{
              height: "340px", border: "2px dashed rgba(255,255,255,0.25)", borderRadius: "12px",
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px 16px",
              textAlign: "center", color: "rgba(255,255,255,0.6)", backgroundColor: "rgba(0,0,0,0.18)", boxSizing: "border-box"
            }}>
              <span style={{ fontSize: "clamp(12px, 1.3vw, 16px)", fontWeight: "bold", color: "#ffc107", letterSpacing: "0.5px" }}>EQUITY & HAND ANALYZER</span>
              <span style={{ fontSize: "clamp(10px, 1vw, 13px)", marginTop: "8px", maxWidth: "280px", lineHeight: "1.5", color: "#cbd5e1" }}>
                カードをセットして「勝率を計算する」をクリックすると、ここに成立役の推移が表示されます。
              </span>
            </div>
          )
        )}

        {/* ヒートマップ専用コンポーネントを呼び出す */}
        {activeTab === 'heatmap' && (
          <HeatmapSection board={validBoardCards} />
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