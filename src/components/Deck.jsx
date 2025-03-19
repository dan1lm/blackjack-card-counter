import {useState, useEffect, useRef} from 'react';
import Card from './Card.jsx';
import useCardCounting from '../hooks/useCardCounting.jsx';

const Deck = ( {mode, targetRate, deckSize, stopSimulation, endSimulation} ) => {
    const [currentCount, setCurrentCount] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [cardTimes, setCardTimes] = useState([]);
    const [lastCardTime, setLastCardTime] = useState(null);

    const inputRef = useRef(null);
    const intervalRef = useRef(null);


    const { deck, getCardValue, getCorrectCount } = useCardCounting(deckSize);

    useEffect( () => {
        setStartTime(Date.now());
        setLastCardTime(Date.now());
        setIsFlipped(true);

        if (mode === 'timed') {
            intervalRef.current = setInterval( () => {
                nextCard();
            }, targetRate*1000);
        }

        inputRef.current?.focus();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const checkAnswer = () => {
        const currentCard = deck[currentCardIndex];
        const cardValue = getCardValue(currentCard);
        const userValue = parseInt(userInput);

        const now = Date.now();
        const timeTaken = (now - lastCardTime) / 1000;
        setCardTimes([...cardTimes, timeTaken]);
        setLastCardTime(now);

        if (userValue === cardValue){
            setFeedback('Correct!');
            setCorrectCount(correctCount+1);
        }
        else {
            setFeedback(`Incorrect. The count for ${currentCard.rank} of ${currentCard.suit} is ${currentValue}`);
            setIncorrectCount(incorrectCount + 1);
        }

        // updating running count
        setCurrentCount(getCorrectCount(currentCardIndex));

        // next card
        setUserInput('');
        
        if (mode === 'self-paced') {
            setTimeout(() => {
                nextCard();
            }, 1000);
        }
    };

    const nextCard = () => {
        if (currentCardIndex >= deck.length - 1) {
            finishSimulation();
            return;
        }

        setCurrentCardIndex(currentCardIndex + 1);
        setFeedback('');
        if(inputRef.current) {
            inputRef.current.focus();
        }
    };

    const finishSimulation = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        const totalTime = (Date.now() - startTime) / 1000;
        const averageTime = totalTime / (currentCardIndex + 1);

        endSimulation({
            correctCount,
            incorrectCount,
            totalTime,
            averageTime,
            cardTimes,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    };

    return (
        <div className="deck-container">
          <div className="deck-stats">
            <div className="count-display">Current Count: <span className="count-value">{currentCount}</span></div>
            <div className="card-progress">Card: {currentCardIndex + 1} / {deck.length}</div>
          </div>
          
          <div className="card-display">
            <Card card={deck[currentCardIndex]} isFlipped={isFlipped} />
          </div>
          
          {mode === 'self-paced' && (
            <div className="input-container">
              <div className="input-group">
                <input
                  type="text"
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="count-input"
                  placeholder="Enter count (+1, 0, -1)"
                />
                <button 
                  onClick={checkAnswer}
                  className="submit-button"
                >
                  Submit
                </button>
              </div>
              
              {feedback && (
                <div className={feedback.startsWith('Correct') ? 'feedback correct' : 'feedback incorrect'}>
                  {feedback}
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={stopSimulation} 
            className="stop-button"
          >
            Stop Simulation
          </button>
        </div>
      );
}

export default Deck