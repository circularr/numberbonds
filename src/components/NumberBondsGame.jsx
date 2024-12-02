import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RotateCw } from 'lucide-react';
import useSound from '../hooks/useSound';

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
    operationType: localStorage.getItem('operationType') || 'addition',
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
    const { minNumber, maxNumber, operationType } = gameSettings;
    
    if (operationType === 'addition') {
      const sum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      const part1 = Math.floor(Math.random() * (sum - minNumber)) + minNumber;
      const part2 = sum - part1;
      return { parts: [part1, part2], result: sum, operation: '+' };
    } else { // multiplication
      const num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      const num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      return { parts: [num1, num2], result: num1 * num2, operation: '×' };
    }
  }, [gameSettings]);

  // Generate problems and answers
  const generateProblemsAndAnswers = useCallback(() => {
    const newProblems = [];
    const answersSet = new Set();
    const { problemCount } = gameSettings;

    while (newProblems.length < problemCount) {
      const problem = generateProblem();
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

  // Settings Panel Component
  const SettingsPanel = ({
    onClose,
    isIntro = false,
    playerName,
    setPlayerName,
    gameSettings,
    setGameSettings,
    generateProblemsAndAnswers,
  }) => {
    const [tempName, setTempName] = useState(playerName);
    const [tempSettings, setTempSettings] = useState(gameSettings);
    const [error, setError] = useState('');

    // Handle number range changes with validation
    const handleRangeChange = (field, value) => {
      const numValue = parseInt(value) || 0;
      
      setTempSettings(prev => {
        const newSettings = { ...prev };
        
        if (field === 'minNumber') {
          // Ensure min is not greater than max
          newSettings.minNumber = Math.max(1, Math.min(numValue, prev.maxNumber - 1));
        } else if (field === 'maxNumber') {
          // Ensure max is not less than min
          newSettings.maxNumber = Math.max(prev.minNumber + 1, numValue);
        }

        // Validate the range
        if (newSettings.maxNumber - newSettings.minNumber < 2) {
          setError('Range must be at least 2 numbers');
        } else if (newSettings.maxNumber > 100) {
          setError('Maximum number cannot exceed 100');
        } else if (newSettings.minNumber < 1) {
          setError('Minimum number cannot be less than 1');
        } else {
          setError('');
        }

        return newSettings;
      });
    };

    // Preset ranges for quick selection
    const presetRanges = [
      { label: 'Easy (1-5)', min: 1, max: 5 },
      { label: 'Medium (1-10)', min: 1, max: 10 },
      { label: 'Hard (1-20)', min: 1, max: 20 },
      { label: 'Expert (10-50)', min: 10, max: 50 },
    ];

    const handleSave = () => {
      if (tempName.trim() && !error) {
        setPlayerName(tempName);
        setGameSettings(tempSettings);
        localStorage.setItem('playerName', tempName);
        localStorage.setItem('minNumber', tempSettings.minNumber.toString());
        localStorage.setItem('maxNumber', tempSettings.maxNumber.toString());
        localStorage.setItem('problemCount', tempSettings.problemCount.toString());
        localStorage.setItem('operationType', tempSettings.operationType);
        onClose();
        generateProblemsAndAnswers();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">{isIntro ? 'Welcome!' : 'Game Settings'}</h2>
          
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter your name"
            />
          </div>

          {/* Operation Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Operation Type</label>
            <select
              value={tempSettings.operationType}
              onChange={(e) => setTempSettings(prev => ({
                ...prev,
                operationType: e.target.value
              }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="addition">Addition (+)</option>
              <option value="multiplication">Multiplication (×)</option>
            </select>
          </div>

          {/* Preset Number Ranges */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quick Range Select</label>
            <div className="grid grid-cols-2 gap-2">
              {presetRanges.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setTempSettings(prev => ({
                    ...prev,
                    minNumber: preset.min,
                    maxNumber: preset.max
                  }))}
                  className="p-2 text-sm border rounded-lg hover:bg-primary-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Number Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Custom Number Range</label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  min="1"
                  max={tempSettings.maxNumber - 1}
                  value={tempSettings.minNumber}
                  onChange={(e) => handleRangeChange('minNumber', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  min={tempSettings.minNumber + 1}
                  max="100"
                  value={tempSettings.maxNumber}
                  onChange={(e) => handleRangeChange('maxNumber', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Problem Count */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Number of Problems
              <span className="text-gray-500 text-xs ml-2">(2-8)</span>
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={tempSettings.problemCount}
              onChange={(e) => setTempSettings(prev => ({
                ...prev,
                problemCount: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">
              {tempSettings.problemCount} problems
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            {!isIntro && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!tempName.trim() || error}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isIntro ? 'Start Game' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
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
