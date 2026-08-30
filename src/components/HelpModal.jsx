import React from "react";

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const btnStyle = {
    padding: "6px 16px",
    fontSize: "13px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.3)"
  };

  const sectionTitleStyle = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#1e293b",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "4px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  };

  const cardBoxStyle = {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px"
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justify: "center",
        alignItems: "center",
        zIndex: 1200,
        backdropFilter: "blur(2px)"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
          maxWidth: "600px",
          width: "92%",
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box"
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
            <span></span> 使い方の説明
          </h2>
          <button onClick={onClose} style={btnStyle}>閉じる</button>
        </div>

        {/* コンテンツ */}
        <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>

          {/* 1. カード選択 */}
          <div style={cardBoxStyle}>
            <div style={sectionTitleStyle}>
              <span></span> 1. カード & レンジのセット
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li><strong>カードの選択:</strong> コミュニティボード、Player 1 / 2 のハンド、またはエクスポーズ枠をタップすると黄色く選択状態になります。その状態で画面下のカードマトリックスからカードを選んで配置します。</li>
              <li><strong>プレイヤー範囲設定:</strong> 「ハンド選択」ドロップダウンから「強」「標準」「弱」「Any」「マイレンジ」を選択することで、レンジ vs ハンドの計算も行えます。</li>
            </ul>
          </div>

          {/* 2. シミュレーション実行 */}
          <div style={cardBoxStyle}>
            <div style={sectionTitleStyle}>
              <span></span> 2. 勝率計算の実行
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li><strong>計算実行:</strong> 青い「計算実行」ボタンを押すと、各プレイヤーの勝率と平均期待値を瞬時に算出します。</li>
              <li><strong>アウツ表示:</strong> フロップ・ターン時点で逆転に必要なカード枚数とカードが表示されます。</li>
            </ul>
          </div>

          {/* 3. チャート確認 */}
          <div style={cardBoxStyle}>
            <div style={sectionTitleStyle}>
              <span></span> 3. 勝率 & 成立役推移グラフ (Recharts)
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li><strong>勝率推移 (折れ線):</strong> プリフロップ〜リバーまでの勝率のアップダウンをグラフ化。</li>
              <li><strong>成立役の推移 (積み上げ棒):</strong> フロップ以降、各プレイヤーがどの役をどれくらいの確率で形成しているかを積み上げバーで視覚化します。</li>
            </ul>
          </div>

          {/* 4. ポットオッズ */}
          <div style={cardBoxStyle}>
            <div style={sectionTitleStyle}>
              <span></span> 4. ポットオッズ & 必要勝率計算機
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li><strong>オッズ計算:</strong> 現在の「ポットサイズ」とコールに必要な「コール額」を入力すると、必要勝率を算出。勝率が上回っているかを判定できます。</li>
            </ul>
          </div>

          {/* 5. 便利なボタン */}
          <div style={{ ...cardBoxStyle, marginBottom: 0 }}>
            <div style={sectionTitleStyle}>
              <span></span> 5. 便利な操作
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li><strong>1つ戻る (Undo):</strong> 誤ってカードを配置・削除した場合に1つ前の状態に戻せます。</li>
              <li><strong>クリア:</strong> 盤面のカードをすべてリセットします。</li>
            </ul>
          </div>

        </div>

        {/* フッター */}
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button onClick={onClose} style={btnStyle}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
