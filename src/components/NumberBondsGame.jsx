import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RotateCw, Star, Zap, Trophy, Target, Compass } from 'lucide-react';
import useSound from '../hooks/useSound';

const BADGES = {
  MATH_WHIZ: {
    id: 'math-whiz',
    name: 'Math Whiz',
    description: 'Reached level 3',
    icon: Star,
    className: 'badge-math-whiz',
    condition: (stats) => stats.level >= 3
  },
  SPEED_DEMON: {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Completed 10 problems in under 30 seconds',
    icon: Zap,
    className: 'badge-speed-demon',
    condition: (stats) => stats.fastSolves >= 10
  },
  PERSISTENT: {
    id: 'persistent',
    name: 'Persistent',
    description: 'Played for 5 minutes straight',
    icon: Target,
    className: 'badge-persistent',
    condition: (stats) => stats.playTime >= 300
  },
  PERFECTIONIST: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Got a streak of 10',
    icon: Trophy,
    className: 'badge-perfectionist',
    condition: (stats) => stats.maxStreak >= 10
  },
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Tried both addition and multiplication',
    icon: Compass,
    className: 'badge-explorer',
    condition: (stats) => stats.operationsUsed.size >= 2
  }
};

const SettingsPanel = React.memo(({
  onClose,
  isIntro = false,
  playerName,
  setPlayerName,
  gameSettings,
  setGameSettings,
  generateProblemsAndAnswers,
}) => {
  const [formData, setFormData] = React.useState({
    name: playerName || '',
    settings: { ...gameSettings }
  });
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('name');

  // Memoized handlers to prevent unnecessary re-renders
  const handleNameChange = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName
    }));
  }, []);

  const handleDifficultySelect = React.useCallback((preset) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        minNumber: preset.min,
        maxNumber: preset.max,
        problemCount: preset.problemCount
      }
    }));
    setError('');
  }, []);

  const handleOperationToggle = React.useCallback((operation, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData(prev => {
      const currentOps = prev.settings.enabledOperations || ['addition'];
      let newOps;
      
      if (currentOps.includes(operation)) {
        // Don't allow removing the last operation
        if (currentOps.length === 1) return prev;
        newOps = currentOps.filter(op => op !== operation);
      } else {
        newOps = [...currentOps, operation];
        // If division is enabled, force variableCount to 2
        if (operation === 'division') {
          return {
            ...prev,
            settings: {
              ...prev.settings,
              enabledOperations: newOps,
              variableCount: 2
            }
          };
        }
      }
      
      return {
        ...prev,
        settings: {
          ...prev.settings,
          enabledOperations: newOps
        }
      };
    });
  }, []);

  const handleVariableCountChange = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const count = parseInt(e.target.value);
    if (!isNaN(count) && count >= 2 && count <= 5) {
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          variableCount: count
        }
      }));
    }
  }, []);

  const handleTabChange = React.useCallback((tabId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveTab(tabId);
  }, []);

  const handleSave = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmedName = formData.name.trim();
    if (trimmedName) {
      setPlayerName(trimmedName);
      setGameSettings(formData.settings);
      localStorage.setItem('playerName', trimmedName);
      
      // Properly store enabledOperations as JSON
      Object.entries(formData.settings).forEach(([key, value]) => {
        if (key === 'enabledOperations') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, value.toString());
        }
      });
      
      onClose();
      generateProblemsAndAnswers();
    }
  }, [formData, setPlayerName, setGameSettings, onClose, generateProblemsAndAnswers]);

  const handleModalClick = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Memoized tabs configuration
  const tabs = React.useMemo(() => [
    { id: 'name', label: '👤 Name', show: true },
    { id: 'difficulty', label: '🎯 Difficulty', show: true },
    { id: 'customize', label: '⚙️ Customize', show: true }
  ], []);

  // Memoized difficulty presets
  const difficultyPresets = React.useMemo(() => [
    { name: 'Beginner', min: 1, max: 5, problemCount: 3, emoji: '🌱' },
    { name: 'Easy', min: 1, max: 10, problemCount: 4, emoji: '🌟' },
    { name: 'Medium', min: 5, max: 15, problemCount: 5, emoji: '🚀' },
    { name: 'Hard', min: 10, max: 20, problemCount: 6, emoji: '🔥' },
    { name: 'Expert', min: 15, max: 30, problemCount: 8, emoji: '👑' }
  ], []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" 
      onClick={handleModalClick}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl transform transition-all my-4"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6 rounded-t-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {isIntro ? '👋 Welcome!' : '⚙️ Game Settings'}
          </h2>
          <p className="text-primary-100">
            {isIntro ? "Let's set up your game" : 'Customize your experience'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b" onClick={(e) => e.stopPropagation()}>
          {tabs.filter(tab => tab.show).map(tab => (
            <button
              key={tab.id}
              onClick={(e) => handleTabChange(tab.id, e)}
              className={`flex-1 p-3 sm:p-4 text-center transition-colors text-sm sm:text-base
                ${activeTab === tab.id 
                  ? 'text-primary-600 border-b-2 border-primary-500 font-bold'
                  : 'text-gray-500 hover:text-primary-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {activeTab === 'name' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-lg font-medium text-gray-700">What's your name?</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="mt-2 w-full p-3 border-2 border-gray-200 rounded-xl 
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                           text-lg transition-all"
                  placeholder="Enter your name"
                  autoComplete="off"
                  maxLength={20}
                />
              </label>
              {formData.name.trim() && (
                <div className="animate-fade-in text-center">
                  <span className="text-2xl">👋</span>
                  <p className="text-primary-600 font-medium">
                    Nice to meet you, {formData.name.trim()}!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'difficulty' && (
            <div className="space-y-4">
              <p className="text-gray-600">Choose your difficulty level:</p>
              <div className="grid grid-cols-1 gap-3">
                {difficultyPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={(e) => handleDifficultySelect(preset, e)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center
                      ${formData.settings.minNumber === preset.min && 
                        formData.settings.maxNumber === preset.max &&
                        formData.settings.problemCount === preset.problemCount
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'}`}
                  >
                    <span className="text-xl sm:text-2xl mr-3">{preset.emoji}</span>
                    <div className="text-left flex-grow">
                      <div className="font-medium text-sm sm:text-base">{preset.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Numbers: {preset.min} to {preset.max}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Problems: {preset.problemCount} at a time
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-6">
              {/* Operations */}
              <div>
                <label className="text-gray-700 font-medium mb-2 block">Operations</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: 'addition', label: 'Addition', emoji: '➕' },
                    { value: 'subtraction', label: 'Subtraction', emoji: '➖' },
                    { value: 'multiplication', label: 'Multiplication', emoji: '✖️' },
                    { value: 'division', label: 'Division', emoji: '➗' }
                  ].map(op => (
                    <button
                      key={op.value}
                      onClick={(e) => handleOperationToggle(op.value, e)}
                      className={`p-3 rounded-xl border-2 transition-all text-center relative
                        ${(formData.settings.enabledOperations || ['addition']).includes(op.value)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 text-gray-500'}`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{op.emoji}</div>
                      <div className="font-medium text-sm sm:text-base">{op.label}</div>
                      {(formData.settings.enabledOperations || ['addition']).includes(op.value) && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select multiple operations to mix them together.
                  {(formData.settings.enabledOperations || []).includes('division') && 
                    ' Division problems will always use 2 variables.'}
                </p>
              </div>

              {/* Variable Count */}
              <div>
                <label className="text-gray-700 font-medium">
                  Variables per Problem: {formData.settings.variableCount || 2}
                </label>
                <input
                  type="range"
                  min="2"
                  max="5"
                  step="1"
                  value={formData.settings.variableCount || 2}
                  onChange={handleVariableCountChange}
                  disabled={(formData.settings.enabledOperations || []).includes('division')}
                  className={`w-full mt-2 cursor-pointer ${
                    (formData.settings.enabledOperations || []).includes('division')
                      ? 'opacity-50'
                      : 'accent-primary-500'
                  }`}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>2</span>
                  <span>5</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.settings.enabledOperations || []).includes('division')
                    ? 'Division problems always use 2 variables'
                    : 'Example: 3 variables would be like "2 + 3 + 4 = 9"'}
                </p>
              </div>

              {/* Current Difficulty Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Settings</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Number Range: {formData.settings.minNumber} to {formData.settings.maxNumber}</p>
                  <p>Problems Shown: {formData.settings.problemCount}</p>
                  <p>Operations: {(formData.settings.enabledOperations || ['addition'])
                    .map(op => op.charAt(0).toUpperCase() + op.slice(1))
                    .join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 rounded-b-2xl border-t flex justify-end gap-3">
          {!isIntro && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100
                       transition-colors text-gray-700 text-sm sm:text-base"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="px-6 py-2 rounded-lg bg-primary-500 text-white font-medium
                     hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-sm sm:text-base"
          >
            {isIntro ? "Let's Play!" : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
});

const NumberBondsGame = () => {
  // Game state
  const [problems, setProblems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [removingItems, setRemovingItems] = useState(new Set());

  // Player and game settings
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [gameSettings, setGameSettings] = useState({
    minNumber: parseInt(localStorage.getItem('minNumber')) || 1,
    maxNumber: parseInt(localStorage.getItem('maxNumber')) || 10,
    problemCount: parseInt(localStorage.getItem('problemCount')) || 4,
    enabledOperations: (() => {
      try {
        const saved = localStorage.getItem('enabledOperations');
        return saved ? JSON.parse(saved) : ['addition'];
      } catch (e) {
        console.warn('Error parsing enabledOperations from localStorage:', e);
        return ['addition'];
      }
    })(),
    variableCount: parseInt(localStorage.getItem('variableCount')) || 2
  });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(!localStorage.getItem('playerName'));
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Score and streak
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Sound effects
  const { playSound, playSuccessSound, playWrongSound, playStreakSound } = useSound();

  // Add new state for badges and stats
  const [earnedBadges, setEarnedBadges] = useState(() => {
    const saved = localStorage.getItem('earnedBadges');
    return saved ? JSON.parse(saved) : [];
  });
  const [newBadge, setNewBadge] = useState(null);
  const [gameStats, setGameStats] = useState(() => ({
    level: 1,
    fastSolves: 0,
    playTime: 0,
    maxStreak: 0,
    operationsUsed: new Set([gameSettings.enabledOperations])
  }));

  const createParticles = (x, y, isStreak = false) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    document.body.appendChild(container);

    const colors = isStreak 
      ? ['#FFD700', '#FFA500', '#FF4500', '#FF0000'] // Streak colors (fire-like)
      : ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF']; // Rainbow colors
    
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
  };

  // Generate problems based on operation type
  const generateProblem = useCallback(() => {
    const { minNumber, maxNumber, variableCount = 2, enabledOperations = ['addition'] } = gameSettings;
    
    const generateNumber = () => Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    
    // Randomly select one of the enabled operations
    const operationType = enabledOperations[Math.floor(Math.random() * enabledOperations.length)];
    
    switch (operationType) {
      case 'addition': {
        const result = generateNumber();
        const parts = [];
        let remaining = result;
        
        for (let i = 0; i < variableCount - 1; i++) {
          const part = i === variableCount - 2 
            ? remaining 
            : Math.floor(Math.random() * (remaining - minNumber)) + minNumber;
          parts.push(part);
          remaining -= part;
        }
        parts.push(remaining);
        return { parts, result, operation: '+' };
      }
      
      case 'subtraction': {
        const firstNumber = generateNumber();
        const parts = [firstNumber];
        for (let i = 1; i < variableCount; i++) {
          parts.push(generateNumber());
        }
        const result = parts.reduce((a, b) => a - b);
        return { parts, result, operation: '-' };
      }
      
      case 'multiplication': {
        const parts = Array(variableCount).fill(0).map(generateNumber);
        const result = parts.reduce((a, b) => a * b);
        return { parts, result, operation: '×' };
      }
      
      case 'division': {
        const result = generateNumber();
        const firstNumber = result * generateNumber();
        return { parts: [firstNumber, result], result: firstNumber / result, operation: '÷' };
      }
      
      default:
        return { parts: [0, 0], result: 0, operation: '+' };
    }
  }, [gameSettings]);

  // Generate problems and answers
  const generateProblemsAndAnswers = useCallback(() => {
    const newProblems = [];
    const answersSet = new Set();
    const { problemCount } = gameSettings;

    // Keep generating problems until we have the desired number
    while (newProblems.length < problemCount) {
      const problem = generateProblem();
      // Only add the problem if its answer isn't already used
      if (!answersSet.has(problem.result)) {
        newProblems.push({
          id: Math.random().toString(36).substr(2, 9),
          ...problem
        });
        answersSet.add(problem.result);
      }
    }

    const shuffledAnswers = Array.from(answersSet)
      .map(value => ({ id: Math.random().toString(36).substr(2, 9), value }))
      .sort(() => Math.random() - 0.5);

    setProblems(newProblems);
    setAnswers(shuffledAnswers);
  }, [gameSettings, generateProblem]);

  // Initialize game
  useEffect(() => {
    if (!showIntroModal) {
      generateProblemsAndAnswers();
    }
  }, [generateProblemsAndAnswers, showIntroModal]);

  // Celebration effect function
  const createCelebration = () => {
    const container = document.createElement('div');
    container.className = 'celebration-container';
    document.body.appendChild(container);

    // Create confetti
    const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(confetti);
    }

    // Create shooting stars
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.top = Math.random() * 100 + 'vh';
      star.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
      star.style.setProperty('--ty', (Math.random() - 0.5) * 300 + 'px');
      star.style.animationDelay = Math.random() * 0.5 + 's';
      container.appendChild(star);
    }

    // Show level up text
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 1500);

    // Clean up
    setTimeout(() => {
      document.body.removeChild(container);
    }, 3000);
  };

  // Handle problem selection
  const handleProblemClick = (problem) => {
    playSound(440, 'sine', 0.2, 0.1);
    setSelectedProblem(prev => prev?.id === problem.id ? null : problem);
  };

  // Handle answer selection
  const handleAnswerClick = (answer) => {
    playSound(520, 'sine', 0.2, 0.1);
    setSelectedAnswer(prev => prev?.id === answer.id ? null : answer);
  };

  // Remove matched items with animation
  const removeItems = useCallback((problemId, answerId) => {
    setRemovingItems(prev => new Set([...prev, problemId, answerId]));
    
    setTimeout(() => {
      setProblems(prev => prev.filter(p => p.id !== problemId));
      setAnswers(prev => prev.filter(a => a.id !== answerId));
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(problemId);
        next.delete(answerId);
        return next;
      });
    }, 500);
  }, []);

  // Check for matches
  useEffect(() => {
    if (selectedProblem && selectedAnswer) {
      const isCorrect = selectedProblem.result === selectedAnswer.value;

      if (isCorrect) {
        playSuccessSound();
        setScore(prev => prev + (100 * multiplier));
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak % 5 === 0) {
            setMultiplier(prev => Math.min(prev + 0.5, 4));
            setShowStreakAnimation(true);
            setTimeout(() => setShowStreakAnimation(false), 2000);
            playStreakSound();
            createCelebration();
          }
          return newStreak;
        });

        // Create particles at both the problem and answer locations
        const problemElement = document.querySelector(`[data-id="${selectedProblem.id}"]`);
        const answerElement = document.querySelector(`[data-id="${selectedAnswer.id}"]`);

        if (problemElement && answerElement) {
          const problemRect = problemElement.getBoundingClientRect();
          const answerRect = answerElement.getBoundingClientRect();

          createParticles(
            problemRect.left + problemRect.width / 2,
            problemRect.top + problemRect.height / 2
          );
          createParticles(
            answerRect.left + answerRect.width / 2,
            answerRect.top + answerRect.height / 2
          );
        }

        // Remove matched pair with animation
        removeItems(selectedProblem.id, selectedAnswer.id);

        // Generate new problems if needed
        if (problems.length <= 1) {
          setTimeout(generateProblemsAndAnswers, 500);
        }
      } else {
        playWrongSound();
        setStreak(0);
        setMultiplier(1);
      }

      setSelectedProblem(null);
      setSelectedAnswer(null);
    }
  }, [selectedProblem, selectedAnswer, problems.length, multiplier, 
      playSuccessSound, playWrongSound, playStreakSound, generateProblemsAndAnswers, removeItems]);

  // Update play time
  useEffect(() => {
    const timer = setInterval(() => {
      setGameStats(prev => ({
        ...prev,
        playTime: prev.playTime + 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for new badges
  const checkBadges = useCallback(() => {
    Object.values(BADGES).forEach(badge => {
      if (!earnedBadges.includes(badge.id) && badge.condition(gameStats)) {
        setEarnedBadges(prev => {
          const newBadges = [...prev, badge.id];
          localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
          return newBadges;
        });
        setNewBadge(badge);
        playStreakSound();
        setTimeout(() => setNewBadge(null), 3000);
      }
    });
  }, [earnedBadges, gameStats, playStreakSound]);

  // Update stats when game state changes
  useEffect(() => {
    setGameStats(prev => {
      const newStats = {
        ...prev,
        level: Math.floor(streak / 5) + 1,
        maxStreak: Math.max(prev.maxStreak, streak),
        operationsUsed: new Set([...prev.operationsUsed, gameSettings.enabledOperations])
      };
      return newStats;
    });
  }, [streak, gameSettings.enabledOperations]);

  // Check badges when stats change
  useEffect(() => {
    checkBadges();
  }, [gameStats, checkBadges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      {/* Badges Display */}
      <div className="badges-container">
        {earnedBadges.map(badgeId => {
          const badge = Object.values(BADGES).find(b => b.id === badgeId);
          if (!badge) return null;
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`badge ${badge.className} ${newBadge?.id === badge.id ? 'badge-new' : ''}`}
            >
              <Icon className="badge-icon" />
              {badge.name}
              <span className="badge-tooltip">{badge.description}</span>
            </div>
          );
        })}
      </div>

      {/* New Badge Celebration */}
      {newBadge && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-center">
            <div className={`badge ${newBadge.className} badge-new scale-150 mb-4`}>
              <newBadge.icon className="badge-icon w-8 h-8" />
              {newBadge.name}
            </div>
            <div className="text-2xl font-bold text-white shadow-text">
              New Badge Unlocked!
            </div>
          </div>
        </div>
      )}

      {showLevelUp && (
        <div className="level-up-text">
          Level Up! 🎉
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="rainbow-text text-4xl mb-2">Number Bonds</h1>
            {playerName && (
              <p className="text-primary-700 text-xl animate-wiggle">
                Hello, {playerName}!
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="kid-button !p-2"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={generateProblemsAndAnswers}
              className="kid-button !p-2"
              aria-label="New Problems"
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center mb-6">
          <div className="rainbow-text text-6xl mb-2">{score}</div>
          {multiplier > 1 && (
            <div className="multiplier-badge">
              {multiplier}x Multiplier!
            </div>
          )}
          {streak > 0 && (
            <div className={`streak-badge mt-2 ${showStreakAnimation ? 'animate-bounce' : ''}`}>
              🔥 {streak} Streak! 🔥
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="kid-panel">
          <div className="grid grid-cols-2 gap-6">
            {/* Problems */}
            <div>
              <h2 className="rainbow-text text-2xl mb-4">Problems</h2>
              <div className="space-y-3">
                {problems.map((problem) => (
                  <button
                    key={problem.id}
                    data-id={problem.id}
                    onClick={() => handleProblemClick(problem)}
                    className={`kid-card w-full ${
                      removingItems.has(problem.id) ? 'animate-disappear' : ''
                    } ${
                      selectedProblem?.id === problem.id ? 'selected' : ''
                    }`}
                    disabled={removingItems.has(problem.id)}
                  >
                    {problem.parts.join(` ${problem.operation} `)}
                  </button>
                ))}
              </div>
            </div>

            {/* Answers */}
            <div>
              <h2 className="rainbow-text text-2xl mb-4">Answers</h2>
              <div className="space-y-3">
                {answers.map((answer) => (
                  <button
                    key={answer.id}
                    data-id={answer.id}
                    onClick={() => handleAnswerClick(answer)}
                    className={`kid-card w-full ${
                      removingItems.has(answer.id) ? 'animate-disappear' : ''
                    } ${
                      selectedAnswer?.id === answer.id ? 'selected' : ''
                    }`}
                    disabled={removingItems.has(answer.id)}
                  >
                    {answer.value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            playerName={playerName}
            setPlayerName={setPlayerName}
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            generateProblemsAndAnswers={generateProblemsAndAnswers}
          />
        )}
        {showIntroModal && (
          <SettingsPanel
            onClose={() => setShowIntroModal(false)}
            isIntro
            playerName={playerName}
            setPlayerName={setPlayerName}
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            generateProblemsAndAnswers={generateProblemsAndAnswers}
          />
        )}
      </div>
    </div>
  );
};

export default NumberBondsGame;
