import '../styles/PlayingCard.css';

const SUIT_SYMBOL = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

const PlayingCard = ({ card, revealed, flash }) => {
  if (!revealed || !card) {
    return (
      <div className="playing-card playing-card--back" aria-hidden="true">
        <div className="playing-card__back-pattern" />
      </div>
    );
  }

  const { rank, suit } = card;
  const colorClass = RED_SUITS.has(suit) ? 'playing-card--red' : 'playing-card--black';
  const flashClass = flash ? `playing-card--${flash}` : '';

  return (
    <div
      className={`playing-card playing-card--front ${colorClass} ${flashClass}`}
      role="img"
      aria-label={`${rank} of ${suit}`}
    >
      <span className="playing-card__rank playing-card__rank--top">{rank}</span>
      <span className="playing-card__suit">{SUIT_SYMBOL[suit]}</span>
      <span className="playing-card__rank playing-card__rank--bottom">{rank}</span>
    </div>
  );
};

export default PlayingCard;
