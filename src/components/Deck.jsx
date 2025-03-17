import {useState, useEffect, useRef} from 'react';
import Card from './Card';
import useCardCounting from '..hooks/useCardCounting';

const Deck = () => {
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

    return;
}

export default Deck