import React, { useState, useRef, useEffect } from 'react';
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

// 役ごとのカラーパレット
const HAND_COLORS = {
  highCard: '#94a3b8',      // ハイカード
  onePair: '#60a5fa',       // ワンペア
  twoPair: '#2563eb',       // ツーペア
  threeCard: '#a855f7',     // スリーカード
  straight: '#10b981',      // ストレート
  flush: '#f59e0b',         // フラッシュ
  fullHousePlus: '#ef4444', // フルハウス以上
};

// 役の日本語表示
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
    const data = payload[0].payload;
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

        <p style={{ margin: "2px 0", color: payload[0]?.color, fontWeight: "bold" }}>
          P1 勝率: {payload[0]?.value ? payload[0].value.toFixed(1) : 0}%
        </p>
        <p style={{ margin: "2px 0", color: payload[1]?.color, fontWeight: "bold" }}>
          P2 勝率: {payload[1]?.value ? payload[1].value.toFixed(1) : 0}%
        </p>

        {data.outs && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed #475569", fontSize: "10.5px" }}>
            <p style={{ margin: "3px 0", color: "#94a3b8" }}>
              <span style={{ color: payload[0]?.color, fontWeight: "bold" }}>P1 アウツ ({data.outs.p1 ? data.outs.p1.length : 0}枚):</span><br />
              <span style={{ color: "#cbd5e1", display: "block", marginTop: "2px", lineHeight: "1.3", wordWrap: "break-word", whiteSpace: "normal" }}>
                {data.outs.p1 && data.outs.p1.length > 0 ? data.outs.p1.join(", ") : "なし"}
              </span>
            </p>
            <p style={{ margin: "3px 0", color: "#94a3b8", marginTop: "6px" }}>
              <span style={{ color: payload[1]?.color, fontWeight: "bold" }}>P2 アウツ ({data.outs.p2 ? data.outs.p2.length : 0}枚):</span><br />
              <span style={{ color: "#cbd5e1", display: "block", marginTop: "2px", lineHeight: "1.3", wordWrap: "break-word", whiteSpace: "normal" }}>
                {data.outs.p2 && data.outs.p2.length > 0 ? data.outs.p2.join(", ") : "なし"}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// 【成立役用ツールチップ（P1 / P2 比較表示）】
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
          {/* Player 1 カラム */}
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

          {/* Player 2 カラム */}
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

export default function EquityChart({ historyData, style }) {
  const [activeTab, setActiveTab] = useState('equity'); // 'equity' | 'hands'
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  // River到達時 (全4カテゴリ分割) と同じ割合のバー太さをプロット領域幅から動的計算
  const plotWidth = Math.max(0, containerWidth - 30);
  const calculatedBarSize = containerWidth > 0
    ? Math.max(10, Math.round(((plotWidth / 4) * 0.6) / 2))
    : undefined;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      
      {/* メインタブ切り替えボタン */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px' }}>
        <button
          onClick={() => setActiveTab('equity')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'equity' ? '#2563eb' : 'transparent',
            color: activeTab === 'equity' ? '#fff' : '#94a3b8',
            transition: 'all 0.2s ease'
          }}
        >
        勝率推移
        </button>
        <button
          onClick={() => setActiveTab('hands')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'hands' ? '#2563eb' : 'transparent',
            color: activeTab === 'hands' ? '#fff' : '#94a3b8',
            transition: 'all 0.2s ease'
          }}
        >
        成立役の推移
        </button>
      </div>

      {/* 成立役タブ選択時の P1 / P2 識別ガイド（表示切り替え時もレイアウト高さを一定に保つため領域を保持） */}
      <div style={{
        display: 'flex',
        justify: 'center',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '6px',
        fontSize: '11px',
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

      {/* グラフエリア */}
      <div ref={containerRef} style={{ width: '100%', height: 'clamp(220px, 34vh, 420px)', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'equity' ? (
            /* --- 1. 勝率推移グラフ (折れ線) --- */
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" />
              
              <Tooltip content={<CustomEquityTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
              
              <Line type="linear" dataKey="p1" name="Player 1" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={350} />
              <Line type="linear" dataKey="p2" name="Player 2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={350} />
            </LineChart>
          ) : (
            /* --- 2. 成立役の推移グラフ (Player 1 & 2 横並び積み上げバー) --- */
            <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={calculatedBarSize}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" />
              
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />

              {/*  Player 1 用の積層バー (stackId="p1") */}
              <Bar dataKey="p1_highCard" stackId="p1" fill={HAND_COLORS.highCard} isAnimationActive={false} />
              <Bar dataKey="p1_onePair" stackId="p1" fill={HAND_COLORS.onePair} isAnimationActive={false} />
              <Bar dataKey="p1_twoPair" stackId="p1" fill={HAND_COLORS.twoPair} isAnimationActive={false} />
              <Bar dataKey="p1_threeCard" stackId="p1" fill={HAND_COLORS.threeCard} isAnimationActive={false} />
              <Bar dataKey="p1_straight" stackId="p1" fill={HAND_COLORS.straight} isAnimationActive={false} />
              <Bar dataKey="p1_flush" stackId="p1" fill={HAND_COLORS.flush} isAnimationActive={false} />
              <Bar dataKey="p1_fullHousePlus" stackId="p1" fill={HAND_COLORS.fullHousePlus} isAnimationActive={false} />

              {/*  Player 2 用の積層バー (stackId="p2") */}
              <Bar dataKey="p2_highCard" stackId="p2" fill={HAND_COLORS.highCard} isAnimationActive={false} />
              <Bar dataKey="p2_onePair" stackId="p2" fill={HAND_COLORS.onePair} isAnimationActive={false} />
              <Bar dataKey="p2_twoPair" stackId="p2" fill={HAND_COLORS.twoPair} isAnimationActive={false} />
              <Bar dataKey="p2_threeCard" stackId="p2" fill={HAND_COLORS.threeCard} isAnimationActive={false} />
              <Bar dataKey="p2_straight" stackId="p2" fill={HAND_COLORS.straight} isAnimationActive={false} />
              <Bar dataKey="p2_flush" stackId="p2" fill={HAND_COLORS.flush} isAnimationActive={false} />
              <Bar dataKey="p2_fullHousePlus" stackId="p2" fill={HAND_COLORS.fullHousePlus} isAnimationActive={false} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 成立役タブ選択時の凡例表示（表示切り替え時もレイアウト高さを一定に保つため領域を保持） */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justify: 'center',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '6px',
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