// src/hooks/useSound.js

import { useRef, useEffect, useCallback } from 'react';

// Sound presets for different effects
const SOUND_PRESETS = {
  success: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 chord
    type: 'sine',
    duration: 0.15,
    volume: 0.3
  },
  wrong: {
    frequencies: [196.00, 185.00], // G3 to F#3 slide
    type: 'sine',
    duration: 0.2,
    volume: 0.2
  },
  levelUp: {
    frequencies: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6 arpeggio
    type: 'sine',
    duration: 0.1,
    volume: 0.3
  },
  streak: {
    frequencies: [783.99, 987.77, 1174.66], // G5, B5, D6 power chord
    type: 'square',
    duration: 0.15,
    volume: 0.2
  },
  click: {
    frequencies: [440], // A4
    type: 'sine',
    duration: 0.05,
    volume: 0.1
  },
  boss: {
    baseFrequency: 220, // A3
    jazzChords: [
      [220, 277.18, 329.63, 415.30], // Am7
      [246.94, 311.13, 369.99, 440], // Bm7
      [261.63, 329.63, 392, 493.88], // CM7
      [293.66, 369.99, 440, 523.25]  // DM7
    ],
    swingRhythm: {
      noteLength: 0.3,
      swingRatio: 0.7
    },
    type: ['triangle', 'sine'],
    volume: 0.2
  }
};

const useSound = () => {
  const audioContextRef = useRef(null);
  const bossOscillatorsRef = useRef([]);
  const gainNodesRef = useRef([]);

  // Clean stop for boss music - defined first to avoid initialization issues
  const stopBossMusic = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    bossOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        console.warn('Error stopping oscillator:', e);
      }
    });

    gainNodesRef.current.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {
        console.warn('Error disconnecting gain node:', e);
      }
    });

    bossOscillatorsRef.current = [];
    gainNodesRef.current = [];
  }, []);

  // Initialize audio context with better error handling
  useEffect(() => {
    const initAudio = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          console.log('Audio context initialized');
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('Audio context resumed');
          }).catch(console.error);
        }
      } catch (error) {
        console.warn('Audio initialization failed:', error);
        // Create a dummy audio context that won't break the game
        audioContextRef.current = {
          state: 'running',
          createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {} }),
          createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
          createDynamicsCompressor: () => ({ connect: () => {} }),
          destination: {},
          currentTime: 0,
          suspend: () => {},
          resume: () => Promise.resolve(),
          close: () => {}
        };
      }
    };

    // Try to initialize immediately
    initAudio();
    
    // Also listen for user interaction
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Enhanced playSound function with better audio shaping
  const playSound = useCallback((frequency, type = 'sine', volume = 0.5, duration = 0.1) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;

    // Create a compressor for better sound control
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Configure oscillator
    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Configure gain envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(ctx.destination);

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + duration + 0.1);

    return () => {
      oscillator.disconnect();
      gainNode.disconnect();
      compressor.disconnect();
    };
  }, []);

  // Play a sequence of notes
  const playSequence = useCallback((notes, options = {}) => {
    if (!audioContextRef.current) return;
    
    notes.forEach((frequency) => {
      playSound(
        frequency,
        options.type || 'sine',
        options.volume || 0.3,
        options.duration || 0.1
      );
    });
  }, [playSound]);

  // Enhanced success sound with happy chord
  const playSuccessSound = useCallback(() => {
    const { frequencies, type, duration, volume } = SOUND_PRESETS.success;
    playSequence(frequencies, { type, duration, volume });
  }, [playSequence]);

  // Gentle wrong answer sound
  const playWrongSound = useCallback(() => {
    const { frequencies, type, duration, volume } = SOUND_PRESETS.wrong;
    playSequence(frequencies, { type, duration, volume });
  }, [playSequence]);

  // Exciting level up sound
  const playLevelUpSound = useCallback(() => {
    const { frequencies, type, duration, volume } = SOUND_PRESETS.levelUp;
    playSequence(frequencies, { type, duration, volume, spacing: 0.08 });
  }, [playSequence]);

  // Energetic streak sound
  const playStreakSound = useCallback(() => {
    const { frequencies, type, duration, volume } = SOUND_PRESETS.streak;
    playSequence(frequencies, { type, duration, volume });
  }, [playSequence]);

  // Enhanced boss mode music
  const startBossMusic = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const { jazzChords, swingRhythm, type, volume } = SOUND_PRESETS.boss;

    // Stop any existing boss music
    stopBossMusic();

    let currentChordIndex = 0;
    const swingInterval = swingRhythm.noteLength * 1000; // Convert to milliseconds

    // Create a walking bass line
    const bassOscillator = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOscillator.type = 'triangle';
    bassGain.gain.value = volume * 0.8;
    bassOscillator.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOscillator.start();

    // Store for cleanup
    bossOscillatorsRef.current.push(bassOscillator);
    gainNodesRef.current.push(bassGain);

    // Jazz chord progression with swing rhythm
    const playNextChord = () => {
      const chord = jazzChords[currentChordIndex];
      
      // Update bass note
      bassOscillator.frequency.setValueAtTime(chord[0] / 2, ctx.currentTime);

      // Play chord notes with swing feel
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type[i % type.length];
        osc.frequency.value = freq;
        
        // Add slight detune for warmth
        osc.detune.value = Math.random() * 10 - 5;
        
        gain.gain.value = volume / (i + 1); // Decrease volume for higher notes
        
        // Add swing rhythm envelope
        const attackTime = 0.02;
        const releaseTime = swingRhythm.noteLength * (i === 0 ? swingRhythm.swingRatio : (1 - swingRhythm.swingRatio));
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + releaseTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + releaseTime);
        
        // Store for cleanup
        bossOscillatorsRef.current.push(osc);
        gainNodesRef.current.push(gain);
      });

      currentChordIndex = (currentChordIndex + 1) % jazzChords.length;
    };

    // Start the chord progression
    const progressionInterval = setInterval(playNextChord, swingInterval);

    // Store interval for cleanup
    const cleanup = () => {
      clearInterval(progressionInterval);
      stopBossMusic();
    };

    return cleanup;
  }, [stopBossMusic]);

  // Enhanced resumeAudioContext with better error handling
  const resumeAudioContext = useCallback(() => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
        .then(() => console.log('Audio context resumed'))
        .catch(error => console.warn('Failed to resume audio context:', error));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBossMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopBossMusic]);

  return {
    playSound,
    playSuccessSound,
    playWrongSound,
    playLevelUpSound,
    playStreakSound,
    startBossMusic,
    stopBossMusic,
    resumeAudioContext
  };
};

export default useSound;
