// src/components/NumberBondsGame.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import useSound from '../hooks/useSound';
import BadgesDisplay, { BADGES } from './BadgesDisplay';
import SettingsPanel from './SettingsPanel';
import { SPEED_THRESHOLDS, BOSS_MODE } from '../constants/gameConstants';

const createCelebration = (x, y, type = 'success') => {
  const container = document.createElement('div');
  container.className = 'celebration-container';
  document.body.appendChild(container);

  const items = type === 'level-up' ? 30 : type === 'boss-complete' ? 50 : 15;
  const types = ['unicorn', 'heart', 'fairy', 'star', 'rainbow', 'sparkle'];
  const colors = ['#FFD700', '#FF69B4', '#4169E1', '#FF1493', '#7B68EE', '#00FA9A'];

  for (let i = 0; i < items; i++) {
    const item = document.createElement('div');
    const randomType = types[Math.floor(Math.random() * types.length)];
    item.className = `celebration-item celebration-${randomType}`;
    
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 100 + Math.random() * (type === 'boss-complete' ? 300 : 200);
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rotation = Math.random() * 720 - 360;
    const scale = 0.5 + Math.random() * 0.5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    item.style.setProperty('--tx', `${tx}px`);
    item.style.setProperty('--ty', `${ty}px`);
    item.style.setProperty('--tr', `${rotation}deg`);
    item.style.setProperty('--scale', scale);
    item.style.setProperty('--color', color);
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;

    container.appendChild(item);
  }

  setTimeout(() => {
    document.body.removeChild(container);
  }, type === 'boss-complete' ? 3000 : 2000);
};

const NumberBondsGame = () => {
  // Game state
  const [problems, setProblems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [isBossMode, setIsBossMode] = useState(false);
  const [bossTimeLeft, setBossTimeLeft] = useState(BOSS_MODE.TIME_LIMIT);
  const [bossColorIndex, setBossColorIndex] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(null);

  // Player and game settings
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const initialEnabledOperations = (() => {
    const ops = JSON.parse(localStorage.getItem('enabledOperations') || '["addition"]');
    return ops.length > 0 ? ops : ['addition'];
  })();
  const [gameSettings, setGameSettings] = useState({
    minNumber: parseInt(localStorage.getItem('minNumber')) || 1,
    maxNumber: parseInt(localStorage.getItem('maxNumber')) || 10,
    problemCount: parseInt(localStorage.getItem('problemCount')) || 4,
    enabledOperations: initialEnabledOperations,
    variableCount: parseInt(localStorage.getItem('variableCount')) || 2
  });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(!localStorage.getItem('playerName'));
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Score and streak
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Sound effects
  const {
    playSound,
    playSuccessSound,
    playWrongSound,
    playLevelUpSound,
    playStreakSound,
    startBossMusic,
    stopBossMusic,
    resumeAudioContext
  } = useSound();

  // Badges state
  const [earnedBadges, setEarnedBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('earnedBadges') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [newBadge, setNewBadge] = useState(null);
  const [gameStats, setGameStats] = useState({
    level: 1,
    fastSolves: 0,
    playTime: 0,
    maxStreak: 0,
    operationsUsed: new Set(),
    totalSolved: 0,
    maxVariables: 2
  });

  const [lastClickPosition, setLastClickPosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  // Score calculation function
  const calculateScore = useCallback(
    (baseScore, speedBonus = 0) => {
      const streakMultiplier = multiplier;
      const bossModeMultiplier = isBossMode ? BOSS_MODE.BONUS_MULTIPLIER : 1;
      return baseScore * streakMultiplier * bossModeMultiplier + speedBonus;
    },
    [multiplier, isBossMode]
  );

  // Problem generation function
  const generateProblem = useCallback(() => {
    const { minNumber, maxNumber, variableCount = 2, enabledOperations = ['addition'] } =
      gameSettings;

    let operations = enabledOperations;
    if (!operations || operations.length === 0) {
      operations = ['addition'];
    }

    const generateNonZeroNumber = (min = minNumber, max = maxNumber) => {
      let num;
      do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (num === 0);
      return num;
    };

    // Randomly select one of the enabled operations
    const operationType = operations[Math.floor(Math.random() * operations.length)];

    switch (operationType) {
      case 'addition': {
        const parts = [];
        for (let i = 0; i < variableCount; i++) {
          parts.push(generateNonZeroNumber());
        }
        const result = parts.reduce((a, b) => a + b, 0);
        return { parts, result, operation: '+' };
      }

      case 'subtraction': {
        const parts = [];
        const firstNumber = generateNonZeroNumber(Math.floor(maxNumber / 2), maxNumber);
        parts.push(firstNumber);

        let remainingValue = firstNumber;
        for (let i = 1; i < variableCount; i++) {
          const maxSubtract = Math.min(remainingValue - 1, maxNumber);
          if (maxSubtract < minNumber) break;
          const nextNumber = generateNonZeroNumber(minNumber, maxSubtract);
          parts.push(nextNumber);
          remainingValue -= nextNumber;
        }

        const result = parts.reduce((a, b) => a - b);
        return { parts, result, operation: '-' };
      }

      case 'multiplication': {
        const adjustedMax = Math.min(maxNumber, Math.floor(Math.pow(maxNumber, 1 / variableCount)));
        const parts = Array(variableCount)
          .fill(0)
          .map(() => generateNonZeroNumber(minNumber, adjustedMax));
        const result = parts.reduce((a, b) => a * b, 1);
        return { parts, result, operation: '×' };
      }

      case 'division': {
        const result = generateNonZeroNumber(minNumber, Math.min(maxNumber, 12));
        const multiplier = generateNonZeroNumber(minNumber, Math.min(maxNumber / result, 12));
        const firstNumber = result * multiplier;
        return { parts: [firstNumber, multiplier], result, operation: '÷' };
      }

      default:
        return { parts: [1, 1], result: 2, operation: '+' };
    }
  }, [gameSettings]);

  // Problems and answers generation function
  const generateProblemsAndAnswers = useCallback(() => {
    const newProblems = [];
    const answersSet = new Set();
    const { problemCount } = gameSettings;
    let attempts = 0;
    const maxAttempts = 100;

    while (newProblems.length < problemCount && attempts < maxAttempts) {
      attempts++;
      const problem = generateProblem();

      if (
        !answersSet.has(problem.result) &&
        !newProblems.some(
          (p) => p.parts.join(p.operation) === problem.parts.join(problem.operation)
        )
      ) {
        newProblems.push({
          id: Math.random().toString(36).substr(2, 9),
          ...problem
        });
        answersSet.add(problem.result);
      }
    }

    if (newProblems.length < problemCount) {
      console.warn('Could not generate enough unique problems, adjusting difficulty...');
      setGameSettings((prev) => ({
        ...prev,
        maxNumber: prev.maxNumber + 5
      }));
    }

    const shuffledAnswers = Array.from(answersSet)
      .map((value) => ({ id: Math.random().toString(36).substr(2, 9), value }))
      .sort(() => Math.random() - 0.5);

    setProblems(newProblems);
    setAnswers(shuffledAnswers);
  }, [gameSettings, generateProblem, setGameSettings]);

  // Handle correct match
  const handleMatch = useCallback(
    (problem, answer, event) => {
      const isMatch = problem.result === answer.value;
      if (isMatch) {
        resumeAudioContext();
        playSuccessSound();
        createParticles(event.clientX, event.clientY);
        const timeTaken = (Date.now() - problemStartTime) / 1000;
        let speedBonus = 0;

        for (const key of Object.keys(SPEED_THRESHOLDS)) {
          const threshold = SPEED_THRESHOLDS[key];
          if (timeTaken <= threshold.time) {
            speedBonus = threshold.score;
            break;
          }
        }

        setScore((prev) => prev + calculateScore(100, speedBonus));
        setStreak((prev) => {
          const newStreak = prev + 1;
          setGameStats((stats) => ({
            ...stats,
            maxStreak: Math.max(stats.maxStreak, newStreak)
          }));
          return newStreak;
        });
        setMultiplier((prev) => Math.min(prev + 0.1, 3));

        setGameStats((prev) => ({
          ...prev,
          totalSolved: prev.totalSolved + 1,
          fastSolves: timeTaken <= 5 ? prev.fastSolves + 1 : prev.fastSolves
        }));

        setRemovingItems((prev) => new Set([...prev, problem.id, answer.id]));
        setTimeout(() => {
          setProblems((prev) => prev.filter((p) => p.id !== problem.id));
          setAnswers((prev) => prev.filter((a) => a.id !== answer.id));
          setRemovingItems((prev) => {
            const next = new Set(prev);
            next.delete(problem.id);
            next.delete(answer.id);
            return next;
          });
        }, 500);
      } else {
        resumeAudioContext();
        playWrongSound();
        setStreak(0);
        setMultiplier(1);
      }
      setSelectedProblem(null);
      setSelectedAnswer(null);
      setProblemStartTime(null);
    },
    [playSuccessSound, playWrongSound, problemStartTime, calculateScore, resumeAudioContext]
  );

  const handleProblemClick = useCallback(
    (event, problem) => {
      resumeAudioContext();
      playSound(440, 'sine', 0.2, 0.1);
      if (!selectedProblem) {
        setProblemStartTime(Date.now());
        createClickEffect(event);
      }
      setLastClickPosition({ x: event.clientX, y: event.clientY });
      const newSelectedProblem = selectedProblem?.id === problem.id ? null : problem;
      setSelectedProblem(newSelectedProblem);
      if (newSelectedProblem && selectedAnswer) {
        handleMatch(newSelectedProblem, selectedAnswer, event);
      }
    },
    [selectedProblem, selectedAnswer, playSound, handleMatch, resumeAudioContext]
  );

  const handleAnswerClick = useCallback(
    (event, answer) => {
      resumeAudioContext();
      playSound(520, 'sine', 0.2, 0.1);
      createClickEffect(event);
      setLastClickPosition({ x: event.clientX, y: event.clientY });
      const newSelectedAnswer = selectedAnswer?.id === answer.id ? null : answer;
      setSelectedAnswer(newSelectedAnswer);
      if (selectedProblem && newSelectedAnswer) {
        handleMatch(selectedProblem, newSelectedAnswer, event);
      }
    },
    [selectedProblem, selectedAnswer, playSound, handleMatch, resumeAudioContext]
  );

  // Visual effects functions
  const createClickEffect = (event) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    const rect = event.target.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    event.target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
  };

  const createParticles = useCallback((x, y, isStreak = false) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    document.body.appendChild(container);

    const colors = isStreak
      ? ['#FFD700', '#FFA500', '#FF4500', '#FF0000']
      : ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF'];

    const particleCount = isStreak ? 20 : 10;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      particle.style.setProperty('--ty', `${(Math.random() - 0.7) * 200}px`);
      container.appendChild(particle);
    }

    setTimeout(() => {
      document.body.removeChild(container);
    }, 1000);
  }, []);

  // Effects
  useEffect(() => {
    let interval;
    if (isBossMode) {
      interval = setInterval(() => {
        setBossTimeLeft((prev) => {
          if (prev <= 0) {
            setIsBossMode(false);
            // Celebrate boss mode completion
            const bonusPoints = Math.floor(score * 0.2); // 20% bonus
            setScore(prev => prev + bonusPoints);
            createCelebration(window.innerWidth / 2, window.innerHeight / 2, 'boss-complete');
            playLevelUpSound();
            return BOSS_MODE.TIME_LIMIT;
          }
          return prev - 0.1;
        });
        setBossColorIndex((prev) => (prev + 1) % BOSS_MODE.COLORS.length);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isBossMode, score, playLevelUpSound]);

  useEffect(() => {
    if (streak === BOSS_MODE.STREAK_REQUIRED && !isBossMode) {
      setIsBossMode(true);
      setBossTimeLeft(BOSS_MODE.TIME_LIMIT);
      playStreakSound();
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 1000);
    }
  }, [streak, isBossMode, playStreakSound]);

  useEffect(() => {
    if (problems.length === 0 && !showIntroModal) {
      console.log('Generating new problems...');
      generateProblemsAndAnswers();
    }
  }, [generateProblemsAndAnswers, showIntroModal, problems.length]);

  useEffect(() => {
    let cleanup;
    if (isBossMode) {
      cleanup = startBossMusic();
    }
    return () => {
      if (cleanup) cleanup();
      stopBossMusic();
    };
  }, [isBossMode, startBossMusic, stopBossMusic]);

  useEffect(() => {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > gameStats.level) {
      setGameStats((prev) => ({ ...prev, level: newLevel }));
      setShowLevelUp(true);
      playLevelUpSound();
      
      // Multiple celebration points for level up
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      createCelebration(centerX, centerY, 'level-up');
      
      // Additional celebrations at corners with different timing
      setTimeout(() => {
        createCelebration(0, 0, 'level-up');
        createCelebration(window.innerWidth, 0, 'level-up');
      }, 200);
      
      setTimeout(() => {
        createCelebration(0, window.innerHeight, 'level-up');
        createCelebration(window.innerWidth, window.innerHeight, 'level-up');
      }, 400);
      
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [score, gameStats.level, playLevelUpSound]);

  // Update play time
  useEffect(() => {
    const timer = setInterval(() => {
      setGameStats((prev) => ({
        ...prev,
        playTime: prev.playTime + 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for new badges
  const checkBadges = useCallback(() => {
    Object.values(BADGES).forEach((badge) => {
      if (!earnedBadges.includes(badge.id)) {
        const meetsCondition = badge.condition(gameStats, earnedBadges);
        if (meetsCondition) {
          setEarnedBadges((prev) => {
            const newBadges = [...prev, badge.id];
            localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
            return newBadges;
          });
          setNewBadge(badge);
          playStreakSound();
          setTimeout(() => setNewBadge(null), 3000);
        }
      }
    });
  }, [earnedBadges, gameStats, playStreakSound]);

  useEffect(() => {
    checkBadges();
  }, [gameStats, checkBadges]);

  // Add reset functionality
  const handleReset = useCallback(() => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all progress? This will clear all badges, scores, and settings.'
    );

    if (confirmReset) {
      localStorage.clear();
      setScore(0);
      setStreak(0);
      setMultiplier(1);
      setEarnedBadges([]);
      setGameStats({
        level: 1,
        fastSolves: 0,
        playTime: 0,
        maxStreak: 0,
        operationsUsed: new Set(),
        totalSolved: 0,
        maxVariables: 2
      });
      setGameSettings({
        minNumber: 1,
        maxNumber: 10,
        problemCount: 4,
        enabledOperations: ['addition'],
        variableCount: 2
      });
      generateProblemsAndAnswers();
    }
  }, [generateProblemsAndAnswers]);

  // Add a safety timeout for loading state
  const [isInitializing, setIsInitializing] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000); // 2 second safety timeout
    return () => clearTimeout(timer);
  }, []);

  // Update loading screen condition
  if (problems.length === 0 || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 rounded-xl shadow-lg">
          <div className="animate-bounce text-4xl mb-4">🎲</div>
          <h2 className="text-2xl font-bold text-gray-700">Loading Game...</h2>
          <button 
            onClick={() => {
              setIsInitializing(false);
              generateProblemsAndAnswers();
            }}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Main game render
  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${
        isBossMode
          ? 'boss-mode-bg'
          : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100'
      } p-4 sm:p-8`}
      style={
        isBossMode
          ? {
              '--color-1': BOSS_MODE.COLORS[bossColorIndex],
              '--color-2': BOSS_MODE.COLORS[(bossColorIndex + 1) % BOSS_MODE.COLORS.length],
              '--color-3': BOSS_MODE.COLORS[(bossColorIndex + 2) % BOSS_MODE.COLORS.length]
            }
          : {}
      }
    >
      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg hover:shadow-xl
                    transition-all hover:scale-110 active:scale-95 z-50"
      >
        <Settings className="w-6 h-6 text-gray-700" />
      </button>

      {/* Settings Modal */}
      {(showSettings || showIntroModal) && (
        <SettingsPanel
          onClose={() => {
            setShowSettings(false);
            setShowIntroModal(false);
          }}
          isIntro={showIntroModal}
          playerName={playerName}
          setPlayerName={setPlayerName}
          gameSettings={gameSettings}
          setGameSettings={setGameSettings}
          generateProblemsAndAnswers={generateProblemsAndAnswers}
        />
      )}

      {/* Game Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-2 rainbow-text animate-float">
          Welcome, {playerName}! 👋
        </h1>
        <div className="text-3xl font-bold mb-4 text-primary-600">
          Score: {score}
        </div>
        {streak > 0 && (
          <div className="streak-badge animate-bounce">
            🔥 Streak: {streak}x
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problems Column */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6 text-primary-600 animate-float">
              Problems 🧮
            </h2>
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <button
                  key={problem.id}
                  onClick={(event) => handleProblemClick(event, problem)}
                  className={`kid-card w-full animate-slide-in ${
                    selectedProblem?.id === problem.id ? 'selected' : ''
                  } ${removingItems.has(problem.id) ? 'animate-disappear' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  disabled={removingItems.has(problem.id)}
                >
                  {problem.parts.join(` ${problem.operation} `)}
                </button>
              ))}
            </div>
          </div>

          {/* Answers Column */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6 text-primary-600 animate-float">
              Answers 🎯
            </h2>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <button
                  key={answer.id}
                  onClick={(event) => handleAnswerClick(event, answer)}
                  className={`kid-card w-full animate-slide-in ${
                    selectedAnswer?.id === answer.id ? 'selected' : ''
                  } ${removingItems.has(answer.id) ? 'animate-disappear' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  disabled={removingItems.has(answer.id)}
                >
                  {answer.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Boss Mode Timer */}
      {isBossMode && (
        <div className="fixed top-4 left-4 bg-black/80 rounded-full p-4 shadow-lg
                      animate-pulse border-2 border-yellow-400 z-50">
          <div className="text-3xl font-mono font-bold text-yellow-400">
            {bossTimeLeft.toFixed(1)}s
          </div>
          <div className="text-sm text-yellow-500 text-center mt-1">BOSS MODE!</div>
        </div>
      )}

      {/* Badges Display */}
      <div className="fixed top-20 right-4 z-50">
        <BadgesDisplay earnedBadges={earnedBadges} newBadge={newBadge} />
      </div>

      {/* Level Up Effect */}
      {showLevelUp && (
        <div className="level-up-container">
          <div className="level-up-text">
            Level {gameStats.level}! 🎉
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        className="reset-button"
      >
        Reset Progress
      </button>
    </div>
  );
};

export default NumberBondsGame;
