import React from 'react'
import '../styles/Card.css'
import cardBackImage from '../assets/card-back-1.png';

const Card = ({card, isFlipped}) => {

    // Back of the card -> display
    if (!isFlipped) {
        return (
          <div className="card">
            <img 
              src={cardBackImage} 
              alt="Card Back" 
              className="card-image"
            />
          </div>
        );
      }

      // Function to retrieve the card face based on suit and rank
      // Naming convention for cards is '(rank)_of_(suits).png' for consistency
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

      }
    

    return (
        <div className="card">
            <img
                className='card-image'
                src={getCardImageUrl(card)}
                alt={`${card.rank} of ${card.suit}`}
            />
        </div>
    )

}
export default Card