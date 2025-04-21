import { useState, useEffect, useRef } from 'react';
import Card from './Card.jsx';
import useCardCounting from '../hooks/useCardCounting.jsx';
import '../styles/Deck.css';

const Deck = ({ mode, targetRate, deckSize, stopSimulation, endSimulation }) => {
    const [currentCount, setCurrentCount] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [currentCardAttempts, setCurrentCardAttempts] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [cardTimes, setCardTimes] = useState([]);
    const [timeLeft, setTimeLeft] = useState(targetRate);
    const [gameStatus, setGameStatus] = useState('ready'); // ready, playing, correct, incorrect

    const inputRef = useRef(null);
    const intervalRef = useRef(null);
    const timerRef = useRef(null);
    const countdownRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastCardTimeRef = useRef(null);

    const { deck, getCardValue, getCorrectCount } = useCardCounting(deckSize);

    // Initialize the game
    useEffect(() => {
        const now = Date.now();
        startTimeRef.current = now;
        lastCardTimeRef.current = now;
        setIsFlipped(true);  
        setGameStatus('playing');
        
        // Start the timer
        timerRef.current = setInterval(() => {
            setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }, 100);
        
        // Set up the countdown timer for timed mode
        if (mode === 'timed') {
            setTimeLeft(targetRate);
            
            countdownRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0.1) {
                        // Time's up
                        clearInterval(countdownRef.current);
                        finishSimulation("Time's up!");
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        
        inputRef.current?.focus();
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    // Check the user's answer against the correct running count
    const checkAnswer = () => {
        if (gameStatus !== 'playing') return;
        
        const userValue = parseInt(userInput);
        // Include the current card in the running count (up through currentCardIndex)
        const correctRunningCount = getCorrectCount(currentCardIndex + 1);
        
        if (userValue === correctRunningCount) {
            // Correct answer
            setFeedback('Correct!');
            setCorrectCount(prev => prev + 1);
            setGameStatus('correct');
            
            const now = Date.now();
            const timeTaken = (now - lastCardTimeRef.current) / 1000;
            setCardTimes(prev => [...prev, timeTaken]);
            lastCardTimeRef.current = now;
            
            // Reset timers for timed mode
            if (mode === 'timed') {
                clearInterval(countdownRef.current);
                setTimeLeft(targetRate);
            }
            
            setTimeout(() => {
                nextCard();
            }, 800);
        } else {
            // Wrong answer
            setIncorrectCount(prev => prev + 1);
            setCurrentCardAttempts(prev => prev + 1);
            setFeedback(`Incorrect! Try again. (Attempts: ${currentCardAttempts + 1})`);
            setGameStatus('incorrect');
            
            // Reset to playing state after a brief delay
            setTimeout(() => {
                setGameStatus('playing');
                setFeedback('');
            }, 1500);
        }
        
        setUserInput('');
    }

    // Advance to the next card
    const nextCard = () => {
        if (currentCardIndex >= deck.length - 1) {
            finishSimulation("Deck completed");
            return;
        }
        
        // Update the current card index
        setCurrentCardIndex(prev => prev + 1);
        
        // Reset card attempts counter
        setCurrentCardAttempts(0);
        
        // Reset for next card
        setFeedback('');
        setGameStatus('playing');
        
        // Restart the countdown for timed mode
        if (mode === 'timed') {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setTimeLeft(targetRate);
            
            countdownRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0.1) {
                        // Time's up
                        clearInterval(countdownRef.current);
                        setIncorrectCount(prev => prev + 1);
                        setFeedback("Time's up! Moving to next card...");
                        
                        setTimeout(() => {
                            nextCard();
                        }, 1500);
                        
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    // End the simulation and calculate final statistics
    const finishSimulation = (reason = "Stopped by user") => {
        // Clear all timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        const totalTime = (Date.now() - startTimeRef.current) / 1000;
        
        const cardsViewed = currentCardIndex + 1;
        const averageTime = cardsViewed > 0 ? totalTime / cardsViewed : 0;
        
        endSimulation({
            correctCount,
            incorrectCount,
            totalTime,
            averageTime,
            cardsViewed,
            cardTimes,
            reason
        });
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    }
    
    const formatTime = (seconds) => {
        return seconds.toFixed(1);
    }

    return (
        <div className="deck-container">
            <div className="deck-header">
                <div className="deck-timer">
                    <span className="timer-label">Elapsed:</span>
                    <span className="timer-value">{formatTime(elapsedTime)}s</span>
                </div>
                
                <div className="countdown-timer">
                    <span className="timer-label">Time Left:</span>
                    <span className={`timer-value ${timeLeft < targetRate * 0.3 && mode === 'timed' ? 'warning' : ''}`}>
                        {mode === 'timed' ? `${formatTime(timeLeft)}s` : '--'}
                    </span>
                </div>
                
                <div className="card-progress">
                    <span>Card:</span>
                    <span>{currentCardIndex + 1} / {deck.length}</span>
                </div>
            </div>
            
            <div className="stats-bar">
                <div className="stat-item">
                    <span className="stat-label">Correct:</span>
                    <span className="stat-value correct">{correctCount}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Incorrect:</span>
                    <span className="stat-value incorrect">{incorrectCount}</span>
                </div>
                {currentCardAttempts > 0 && (
                    <div className="stat-item">
                        <span className="stat-label">Current Card Attempts:</span>
                        <span className="stat-value">{currentCardAttempts}</span>
                    </div>
                )}
            </div>
            
            <div className="card-area">
                <Card card={deck[currentCardIndex]} isFlipped={isFlipped} />
            </div>
            
            <div className={`input-area ${gameStatus}`}>
                <div className="input-help">
                    Enter the running count including this card:
                </div>
                <div className="input-group">
                    <input
                        type="number"
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="count-input"
                        placeholder="Enter count"
                        disabled={gameStatus !== 'playing'}
                    />
                    <button 
                        onClick={checkAnswer}
                        className="submit-button"
                        disabled={gameStatus !== 'playing'}
                    >
                        Submit
                    </button>
                </div>
                
                {feedback && (
                    <div className={`feedback ${gameStatus}`}>
                        {feedback}
                    </div>
                )}
            </div>
            
            <div className="controls">
                <button 
                    onClick={() => finishSimulation("Stopped by user")}
                    className="stop-button"
                >
                    Stop Simulation
                </button>
            </div>
        </div>
    );
};

export default Deck;