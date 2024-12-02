import { useRef, useEffect, useCallback } from 'react';

const useSound = () => {
  const audioContextRef = useRef(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => document.removeEventListener('click', initAudio);
  }, []);

  const playSound = useCallback((frequency, type = 'sine', volume = 0.5, duration = 0.1) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const playSuccessSound = useCallback(() => {
    const baseFreq = 440;
    [0, 0.1, 0.2].forEach((delay, i) => {
      setTimeout(() => {
        playSound(baseFreq * Math.pow(1.2, i), 'triangle', 0.3, 0.2);
      }, delay * 1000);
    });
  }, [playSound]);

  const playWrongSound = useCallback(() => {
    playSound(200, 'sawtooth', 0.3, 0.2);
  }, [playSound]);

  const playStreakSound = useCallback(() => {
    const baseFreq = 440;
    const notes = [
      { freq: baseFreq, delay: 0 },
      { freq: baseFreq * 1.26, delay: 0.1 },
      { freq: baseFreq * 1.5, delay: 0.2 },
      { freq: baseFreq * 2, delay: 0.4 },
      { freq: baseFreq * 2, delay: 0.6 },
      { freq: baseFreq * 3, delay: 0.8 }
    ];

    notes.forEach(({ freq, delay }) => {
      setTimeout(() => {
        playSound(freq, 'triangle', 0.3, 0.3);
      }, delay * 1000);
    });

    setTimeout(() => {
      [1, 1.5, 2].forEach((pitch, i) => {
        setTimeout(() => {
          playSound(1200 * pitch, 'sine', 0.2, 0.1);
        }, i * 100);
      });
    }, 1000);
  }, [playSound]);

  return { playSound, playSuccessSound, playWrongSound, playStreakSound };
};

export default useSound; 