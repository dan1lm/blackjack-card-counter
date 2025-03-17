import {useState, useEffet} from 'react';

const useCardCounting = (deckSize = 52) => {
    const [deck, setDeck] = useState([]);

    useEffect( () => {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        let newDeck = [];

        const standardDecks = Math.ceil(deckSize / 52);             // determine how many decks to use

        for (let d = 0; d <standardDecks; d++) {                    // push to new deck
            for (let s = 0; s < suits.length; s++) {
                for (let r = 0; r < ranks.length; r++){
                    newDeck.push({
                        suit: suits[s],
                        rank: ranks[r],
                    });
                }
            }
        }

        if (newDeck.length > deckSize) {
            newDeck = newDeck.slice(0, deckSize);
        }

        
        for (let i = newDeck.length - 1; i > 0; i--) {              // Shuffle the deck
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }

        setDeck(newDeck);
    }, [deckSize]);






    })

    return;
}
export default useCardCounting