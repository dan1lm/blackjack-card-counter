import {useState, useEffect, useRef} from 'react';
import Card from './Card.jsx';
import useCardCounting from '..hooks/useCardCounting.jsx';

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
        setCardTimes([...cardTimes, timeTaken])
    }

    return;
}

export default Deck