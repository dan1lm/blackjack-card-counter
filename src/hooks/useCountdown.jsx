import { useState, useRef, useCallback, useEffect } from 'react';

const TICK_MS = 100;
const TICK_SECONDS = TICK_MS / 1000;

const useCountdown = (duration, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const durationRef = useRef(duration);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setTimeLeft(durationRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= TICK_SECONDS) {
          stop();
          onExpireRef.current?.();
          return 0;
        }
        return prev - TICK_SECONDS;
      });
    }, TICK_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { timeLeft, start, stop };
};

export default useCountdown;
