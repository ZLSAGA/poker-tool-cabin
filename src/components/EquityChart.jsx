import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// カスタムツールチップ（サイズをコンパクトに最適化）
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: "rgba(15, 23, 42, 0.95)", 
        color: "#f8fafc", 
        padding: "8px 12px", 
        borderRadius: "8px", 
        border: "1px solid #334155", 
        fontSize: "12px", 
        boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
        maxWidth: "220px", // ツールチップが大きくなりすぎないように制限
        pointerEvents: "none"
      }}>
        <p style={{ margin: "0 0 6px 0", fontWeight: "bold", borderBottom: "1px solid #475569", paddingBottom: "4px", color: "#e2e8f0" }}>{label}</p>
        
        {/* 勝率表示 */}
        <p style={{ margin: "2px 0", color: payload[0].color, fontWeight: "bold" }}>P1 勝率: {payload[0].value.toFixed(1)}%</p>
        <p style={{ margin: "2px 0", color: payload[1].color, fontWeight: "bold" }}>P2 勝率: {payload[1].value.toFixed(1)}%</p>
        
        {/* アウツ表示（データが存在する場合のみ、コンパクトに表示） */}
        {data.outs && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed #475569", fontSize: "10.5px" }}>
            <p style={{ margin: "3px 0", color: "#94a3b8" }}>
              <span style={{ color: payload[0].color, fontWeight: "bold" }}>P1 アウツ ({data.outs.p1.length}枚):</span><br/>
              <span style={{ color: "#cbd5e1", display: "block", marginTop: "2px", lineHeight: "1.3", wordWrap: "break-word", whiteSpace: "normal" }}>
                {data.outs.p1.join(", ") || "なし"}
              </span>
            </p>
            <p style={{ margin: "3px 0", color: "#94a3b8", marginTop: "6px" }}>
              <span style={{ color: payload[1].color, fontWeight: "bold" }}>P2 アウツ ({data.outs.p2.length}枚):</span><br/>
              <span style={{ color: "#cbd5e1", display: "block", marginTop: "2px", lineHeight: "1.3", wordWrap: "break-word", whiteSpace: "normal" }}>
                {data.outs.p2.join(", ") || "なし"}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function EquityChart({ historyData, style }) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "250px", ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
          
          {/* type="linear" に変更して直線のグラフにする */}
          <Line type="linear" dataKey="p1" name="Player 1" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={500} />
          <Line type="linear" dataKey="p2" name="Player 2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={500} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}