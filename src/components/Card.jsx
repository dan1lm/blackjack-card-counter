import React from 'react';
import '../styles/Card.css';
import cardBackImage from '../assets/card-back-2.png';

const Card = ({ card, isFlipped }) => {
    // Back of the card -> display
    if (!isFlipped) {
        return (
            <div className="card-wrapper">
                <div className="card back">
                    <img 
                        src={cardBackImage} 
                        alt="Card Back" 
                        className="card-image"
                    />
                </div>
            </div>
        );
    }

    // Retrieve the card face based on suit and rank
    // Naming convention: '(rank)_of_(suits).png'
    const getCardImageUrl = (card) => {
        const rankMap = {
            '2': '2',
            '3': '3', 
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9',
            '10': '10',
            'J': 'jack',
            'Q': 'queen',
            'K': 'king',
            'A': 'ace'
        };

        const rank = rankMap[card.rank];
        const suit = card.suit.toLowerCase();

        return `/cards/${rank}_of_${suit}.png`;
    };
    
    // Determine card count value for styling
    const getCardCountClass = (card) => {
        const { rank } = card;
        
        if (['2', '3', '4', '5', '6'].includes(rank)) {
            return 'positive';  // +1
        } else if (['7', '8', '9'].includes(rank)) {
            return 'neutral';  // 0
        } else {
            return 'negative';  // -1
        }
    };
    
    const getCardCountValue = (card) => {
        const { rank } = card;
        
        if (['2', '3', '4', '5', '6'].includes(rank)) {
            return '+1';
        } else if (['7', '8', '9'].includes(rank)) {
            return '0';
        } else {
            return '-1';
        }
    };

    return (
        <div className="card-wrapper">
            <div className={`card front ${getCardCountClass(card)}`}>
                <img
                    className="card-image"
                    src={getCardImageUrl(card)}
                    alt={`${card.rank} of ${card.suit}`}
                />
                <div className="card-count-badge">
                    {getCardCountValue(card)}
                </div>
            </div>
        </div>
    );
};

export default Card;