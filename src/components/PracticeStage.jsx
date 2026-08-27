import { useState, useRef, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import useCardCounting from '../hooks/useCardCounting';
import useCountdown from '../hooks/useCountdown';
import '../styles/PracticeStage.css';

const ANSWER_ADVANCE_DELAY = 800;
const INCORRECT_RETRY_DELAY = 1500;
const TIME_UP_ADVANCE_DELAY = 1500;

const PracticeStage = ({ mode, targetRate, deckSize, endSimulation }) => {
  const { deck, getRunningCountThrough } = useCardCounting(deckSize);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [flash, setFlash] = useState(null);
  const [status, setStatus] = useState('playing'); // playing | correct | incorrect
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [currentCardAttempts, setCurrentCardAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const inputRef = useRef(null);
  const elapsedIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastCardTimeRef = useRef(null);
  const timeoutsRef = useRef([]);
  const finishedRef = useRef(false);

  // Mirrors of the state fields that MUST be correct no matter which
  // render's closure a delayed setTimeout/interval callback runs from.
  const currentCardIndexRef = useRef(0);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const cardTimesRef = useRef([]);

  const scheduleTimeout = (fn, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
  };

  const clearScheduledTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const handleTimeUp = () => {
    incorrectCountRef.current += 1;
    setIncorrectCount(incorrectCountRef.current);
    setStatus('incorrect');
    setFlash('incorrect');
    setFeedback("Time's up — moving to next card...");

    scheduleTimeout(() => {
      setFlash(null);
      nextCard();
    }, TIME_UP_ADVANCE_DELAY);
  };

  const countdown = useCountdown(targetRate, handleTimeUp);

  const nextCard = () => {
    const nextIndex = currentCardIndexRef.current + 1;

    if (nextIndex >= deck.length) {
      finishSimulation('Deck completed');
      return;
    }

    currentCardIndexRef.current = nextIndex;
    setCurrentCardIndex(nextIndex);
    setCurrentCardAttempts(0);
    setFeedback('');
    setStatus('playing');

    if (mode === 'timed') {
      countdown.start();
    }

    inputRef.current?.focus();
  };

  const finishSimulation = (reason) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    clearScheduledTimeouts();
    countdown.stop();
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);

    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const cardsViewed = currentCardIndexRef.current + 1;
    const averageTime = cardsViewed > 0 ? totalTime / cardsViewed : 0;

    endSimulation({
      correctCount: correctCountRef.current,
      incorrectCount: incorrectCountRef.current,
      totalTime,
      averageTime,
      cardsViewed,
      cardTimes: cardTimesRef.current,
      reason,
    });
  };

  // Start the session once the deck has been built.
  useEffect(() => {
    if (deck.length === 0) return undefined;

    const now = Date.now();
    startTimeRef.current = now;
    lastCardTimeRef.current = now;

    elapsedIntervalRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    if (mode === 'timed') {
      countdown.start();
    }

    inputRef.current?.focus();

    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      countdown.stop();
      clearScheduledTimeouts();
    };
    // Runs once the deck is ready; mode/targetRate/deckSize are fixed for
    // the lifetime of a session (Settings disables editing while running).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length > 0]);

  const checkAnswer = () => {
    if (status !== 'playing') return;

    const userValue = parseInt(userInput, 10);
    const expectedCount = getRunningCountThrough(currentCardIndex + 1);

    if (userValue === expectedCount) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      setStatus('correct');
      setFlash('correct');
      setFeedback('Correct!');

      const now = Date.now();
      const timeTaken = (now - lastCardTimeRef.current) / 1000;
      cardTimesRef.current = [...cardTimesRef.current, timeTaken];
      lastCardTimeRef.current = now;

      if (mode === 'timed') {
        countdown.stop();
      }

      scheduleTimeout(() => {
        setFlash(null);
        nextCard();
      }, ANSWER_ADVANCE_DELAY);
    } else {
      incorrectCountRef.current += 1;
      setIncorrectCount(incorrectCountRef.current);
      setCurrentCardAttempts((prev) => prev + 1);
      setStatus('incorrect');
      setFlash('incorrect');
      setFeedback(`Incorrect — try again (attempt ${currentCardAttempts + 1})`);

      scheduleTimeout(() => {
        setStatus('playing');
        setFeedback('');
        setFlash(null);
      }, INCORRECT_RETRY_DELAY);
    }

    setUserInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') checkAnswer();
  };

  const formatTime = (seconds) => seconds.toFixed(1);

  return (
    <div className="practice-stage">
      <div className="practice-stage__meta">
        <span className="practice-stage__meta-item">
          CARD {String(currentCardIndex + 1).padStart(2, '0')} / {deck.length}
        </span>
        <span className="practice-stage__meta-item">
          {formatTime(elapsedTime)}s ELAPSED
        </span>
        {mode === 'timed' && (
          <span
            className={`practice-stage__meta-item ${countdown.timeLeft < targetRate * 0.3 ? 'practice-stage__meta-item--warning' : ''}`}
          >
            {formatTime(countdown.timeLeft)}s LEFT
          </span>
        )}
      </div>

      {mode === 'timed' && (
        <div className="practice-stage__progress">
          <div
            className="practice-stage__progress-fill"
            style={{ width: `${(countdown.timeLeft / targetRate) * 100}%` }}
          />
        </div>
      )}

      <div className="practice-stage__card">
        <PlayingCard card={deck[currentCardIndex]} revealed flash={flash} />
      </div>

      <div className="practice-stage__input-help">
        Enter the running count including this card
      </div>

      <div className="practice-stage__input-row">
        <input
          ref={inputRef}
          type="number"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="practice-stage__input"
          placeholder="count"
          disabled={status !== 'playing'}
        />
        <button
          onClick={checkAnswer}
          className="practice-stage__submit"
          disabled={status !== 'playing'}
        >
          Enter
        </button>
      </div>

      {feedback && (
        <div className={`practice-stage__feedback practice-stage__feedback--${status}`}>
          {feedback}
        </div>
      )}

      <div className="practice-stage__stats">
        <span>Correct <b className="practice-stage__stat-value">{correctCount}</b></span>
        <span>Incorrect <b className="practice-stage__stat-value">{incorrectCount}</b></span>
        {currentCardAttempts > 0 && (
          <span>Attempts <b className="practice-stage__stat-value">{currentCardAttempts}</b></span>
        )}
      </div>

      <button onClick={() => finishSimulation('Stopped by user')} className="practice-stage__stop">
        Stop Session
      </button>
    </div>
  );
};

export default PracticeStage;
