import React from "react";
import PlayingCard from "./PlayingCard";

const miniLabelStyle = {
  display: "block", fontSize: "9px", color: "#cbd5e1", textAlign: "center", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px"
};
const dividerStyle = {
  width: "1px", height: "35px", backgroundColor: "rgba(255, 255, 255, 0.25)", margin: "0 2px", alignSelf: "flex-start", marginTop: "13px"
};
const closeBtnStyle = {
  position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#000000", color: "white", border: "1px solid white", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.2)", padding: 0, lineHeight: 1
};

export default function CommunityBoard({ 
  board, 
  isLoading, 
  activeSlot, 
  setActiveSlot, 
  getSlotStyle, 
  outs, 
  SUITS, 
  handleClearSpecificSlot,
  invalidBoardSlots = []
}) {
  const isFlopComplete = Boolean(board[0] && board[1] && board[2]);
  const isTurnComplete = isFlopComplete && Boolean(board[3]);

  const lockedSlotStyle = {
    opacity: 0.35,
    cursor: "not-allowed",
    filter: "grayscale(100%)",
    pointerEvents: "auto",
  };

  const errorSlotStyle = {
    border: "2px solid #ff4d4f",
    boxShadow: "0 0 8px rgba(255, 77, 79, 0.8)",
  };

  const renderOutCard = (cardKey) => {
    if (!cardKey || cardKey.length < 2) return null;

    const rank = cardKey[0] === "T" ? "10" : cardKey[0];
    const suitChar = cardKey[cardKey.length - 1];

    const suit = SUITS.find(
      (s) => s.key.toLowerCase() === suitChar.toLowerCase() || s.symbol === suitChar
    );

    return (
      <span key={cardKey} style={{
        display: "inline-block",
        backgroundColor: "white",
        color: suit ? suit.color : "#333",
        padding: "2px 6px",
        borderRadius: "4px",
        border: "1px solid #cbd5e1",
        fontWeight: "bold",
        fontSize: "11px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        {suit ? suit.symbol : ""}{rank}
      </span>
    );
  };

  return (
    <div style={{ marginBottom: "5px", textAlign: "center", width: "100%" }}>
      <h3 style={{ borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: "6px", color: "#ffc107", marginTop: 0, fontSize: "13px", letterSpacing: "1px" }}>
        COMMUNITY BOARD
      </h3>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "flex-start", marginTop: "12px", width: "100%", maxWidth: "360px", margin: "12px auto 0" }}>
        {/* Flop 1 ~ 3 */}
        {[0, 1, 2].map((idx) => {
          const isInvalid = invalidBoardSlots.includes(idx);
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
              <div 
                className="card-slot" 
                onClick={() => !isLoading && setActiveSlot({ target: "board", index: idx })} 
                style={{
                  ...getSlotStyle("board", idx),
                  ...(isInvalid ? errorSlotStyle : {})
                }}
              >
                <PlayingCard cardKey={board[idx]} />
                {board[idx] && (
                  <button onClick={(e) => { e.stopPropagation(); handleClearSpecificSlot("board", idx); }} style={closeBtnStyle}>×</button>
                )}
              </div>
              <span style={{ ...miniLabelStyle, color: isInvalid ? "#ff4d4f" : "#cbd5e1", fontWeight: isInvalid ? "bold" : "normal" }}>
                Flop {idx + 1}
              </span>
            </div>
          );
        })}
        
        <div style={dividerStyle} />
        
        {/* Turn */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
          <div 
            className="card-slot" 
            onClick={() => {
              if (!isLoading && isFlopComplete) {
                setActiveSlot({ target: "board", index: 3 });
              }
            }} 
            style={{
              ...getSlotStyle("board", 3),
              ...(!isFlopComplete ? lockedSlotStyle : {})
            }}
            title={!isFlopComplete ? "Flop 3枚を入力してください" : ""}
          >
            <PlayingCard cardKey={board[3]} />
            {board[3] && (
              <button onClick={(e) => { e.stopPropagation(); handleClearSpecificSlot("board", 3); }} style={closeBtnStyle}>×</button>
            )}
          </div>
          <span style={{ ...miniLabelStyle, color: !isFlopComplete ? "#64748b" : "#cbd5e1" }}>
            Turn {!isFlopComplete && ""}
          </span>
        </div>
        
        <div style={dividerStyle} />
        
        {/* River */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
          <div 
            className="card-slot" 
            onClick={() => {
              if (!isLoading && isTurnComplete) {
                setActiveSlot({ target: "board", index: 4 });
              }
            }} 
            style={{
              ...getSlotStyle("board", 4),
              ...(!isTurnComplete ? lockedSlotStyle : {})
            }}
            title={!isTurnComplete ? "FlopとTurnを入力してください" : ""}
          >
            <PlayingCard cardKey={board[4]} />
            {board[4] && (
              <button onClick={(e) => { e.stopPropagation(); handleClearSpecificSlot("board", 4); }} style={closeBtnStyle}>×</button>
            )}
          </div>
          <span style={{ ...miniLabelStyle, color: !isTurnComplete ? "#64748b" : "#cbd5e1" }}>
            River {!isTurnComplete && ""}
          </span>
        </div>
      </div>

      {/* アウツ表示領域 (outs が存在するときだけ安全に描画) */}
      {outs && (outs.p1?.length > 0 || outs.p2?.length > 0 || outs.chop?.length > 0) && (
        <div style={{ 
          marginTop: "20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "8px", 
          backgroundColor: "rgba(0,0,0,0.3)", 
          padding: "12px", 
          borderRadius: "10px", 
          textAlign: "left" 
        }}>
          {/* P1 アウツ */}
          {outs.p1 && outs.p1.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#66b0ff", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>
                P1アウツ ({outs.p1.length}):
              </span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {outs.p1.map(renderOutCard)}
              </div>
            </div>
          )}

          {/* P2 アウツ */}
          {outs.p2 && outs.p2.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#ff6b6b", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>
                P2アウツ ({outs.p2.length}):
              </span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {outs.p2.map(renderOutCard)}
              </div>
            </div>
          )}

          {/* チョップアウツ */}
          {outs.chop && outs.chop.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#a0a09f", fontWeight: "bold", whiteSpace: "nowrap", marginTop: "2px" }}>
                チョップアウツ ({outs.chop.length}):
              </span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {outs.chop.map(renderOutCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}