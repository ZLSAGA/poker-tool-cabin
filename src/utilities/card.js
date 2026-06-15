const SUITS = ['h', 'd', 'c', 's'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

// デックの作成
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, key: `${rank}${suit}` });
    }
  }
  return deck;
}


export function filterDeck(baseDeck, usedCards) {
  // usedCardsがただの配列として渡される前提
  return baseDeck.filter(card => {
    // cardがオブジェクト（{key: 'As'}）の場合
    const cardKey = card.key ? card.key : card;
    return !usedCards.includes(cardKey);
  });
}

// デックから選択されたカードを抜く
// export function filterDeck(deck, excludeCardKeys) {
  // return deck.filter(card => !excludeCardKeys.includes(card.key));
// }