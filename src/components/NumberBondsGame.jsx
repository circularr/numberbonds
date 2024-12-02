import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Volume2, RotateCw } from 'lucide-react';

const NumberBondsGame = () => {
  const [problems, setProblems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [level, setLevel] = useState(1);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    const savedHighScore = localStorage.getItem('numberBondsHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    generateProblemsAndAnswers();
  }, []);

  const generateProblemsAndAnswers = () => {
    let newProblems = [];
    let newAnswers = [];
    
    // Level 1: Only 2+2 = 4 (super easy start)
    if (level === 1) {
      newProblems.push({ 
        id: Math.random(), 
        first: 2,
        second: 2,
        sum: 4,
        isCorrect: true
      });
      // Add corresponding answer
      newAnswers.push({ id: Math.random(), value: 4 });
    }
    // Level 2: Add 1+3 and 3+1 = 4
    else if (level === 2) {
      const pairs = [
        [1, 3],
        [2, 2],
        [3, 1]
      ];
      pairs.forEach(([a, b]) => {
        newProblems.push({ 
          id: Math.random(), 
          first: a,
          second: b,
          sum: 4,
          isCorrect: true
        });
      });
      // Add corresponding answers
      for (let i = 0; i < pairs.length; i++) {
        newAnswers.push({ id: Math.random(), value: 4 });
      }
    }
    // Level 3: All combinations that make 4
    else if (level === 3) {
      for (let i = 0; i <= 4; i++) {
        newProblems.push({ 
          id: Math.random(), 
          first: i,
          second: 4 - i,
          sum: 4,
          isCorrect: true
        });
        newAnswers.push({ id: Math.random(), value: 4 });
      }
    }
    // Level 4+: Start introducing pairs that make 5
    else {
      // All pairs that make 4
      for (let i = 0; i <= 4; i++) {
        newProblems.push({ 
          id: Math.random(), 
          first: i,
          second: 4 - i,
          sum: 4,
          isCorrect: true
        });
        newAnswers.push({ id: Math.random(), value: 4 });
      }
      
      // Add pairs that make 5 (increasing with level)
      const numFivePairs = Math.min(Math.floor((level - 3) * 1.5), 6); // Add more pairs as level increases
      const fivePairs = [];
      for (let i = 0; i <= 5; i++) {
        fivePairs.push([i, 5 - i]);
      }
      
      // Shuffle and take some pairs
      const selectedFivePairs = fivePairs
        .sort(() => Math.random() - 0.5)
        .slice(0, numFivePairs);
      
      selectedFivePairs.forEach(([a, b]) => {
        newProblems.push({ 
          id: Math.random(), 
          first: a,
          second: b,
          sum: 5,
          isCorrect: true
        });
        newAnswers.push({ id: Math.random(), value: 5 });
      });
    }

    // Add a few extra answers for both 4 and 5 to make it more interesting
    if (level >= 4) {
      const extraFours = 2;
      const extraFives = 2;
      for (let i = 0; i < extraFours; i++) {
        newAnswers.push({ id: Math.random(), value: 4 });
      }
      for (let i = 0; i < extraFives; i++) {
        newAnswers.push({ id: Math.random(), value: 5 });
      }
    }

    // Shuffle both arrays
    newProblems = newProblems.sort(() => Math.random() - 0.5);
    newAnswers = newAnswers.sort(() => Math.random() - 0.5);

    setProblems(newProblems);
    setAnswers(newAnswers);
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setLevel(1);
    setSuccessCount(0);
    generateProblemsAndAnswers();
    localStorage.setItem('numberBondsScore', '0');
    playSound(330, 'sawtooth', 0.3);
  };

  const playSound = (frequency, type = 'sine', volume = 0.5, duration = 0.5) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    if (type === 'square') {
      // For correct matches, add a quick pitch bend up
      oscillator.frequency.linearRampToValueAtTime(frequency * 1.2, audioContext.currentTime + 0.1);
    }

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  };

  const playSuccessSound = () => {
    // Play a series of ascending notes for success
    const baseFreq = 440;
    [0, 0.1, 0.2].forEach((delay, i) => {
      setTimeout(() => {
        playSound(baseFreq * Math.pow(1.2, i), 'square', 0.3, 0.2);
      }, delay * 1000);
    });
  };

  const playStreakSound = () => {
    // Play a special sound for streaks
    const baseFreq = 880;
    [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
      setTimeout(() => {
        playSound(baseFreq * Math.pow(1.2, i), 'square', 0.2, 0.15);
      }, delay * 1000);
    });
  };

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
      particle.style.position = 'absolute';
      particle.style.width = isStreak ? '15px' : '12px';
      particle.style.height = isStreak ? '15px' : '12px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.animation = isStreak ? 'particle-fade 0.8s ease-out forwards' : 'particle-fade 0.5s ease-out forwards';
      particle.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(particle);
    }

    setTimeout(() => {
      document.body.removeChild(container);
    }, isStreak ? 1500 : 1000);
  };

  const handleSelection = (item, type) => {
    if (removingItems.has(item.id)) return;
    
    playSound(type === 'problem' ? 440 : 520);

    if (type === 'problem') {
      setSelectedProblem(selectedProblem?.id === item.id ? null : item);
      setSelectedAnswer(null);
    } else {
      setSelectedAnswer(selectedAnswer?.id === item.id ? null : item);
      setSelectedProblem(selectedProblem);
    }
  };

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

  const checkLevelProgress = useCallback(() => {
    setSuccessCount(prev => {
      const newCount = prev + 1;
      // Level up after certain number of successful matches
      if (level === 1 && newCount >= 2) {  // Very quick progress from level 1
        setLevel(2);
        return 0;
      } else if (level === 2 && newCount >= 4) {  // Need more success at level 2
        setLevel(3);
        return 0;
      } else if (level === 3 && newCount >= 6) {  // Even more at level 3
        setLevel(4);
        return 0;
      } else if (level >= 4 && newCount >= 8) {  // Keep increasing difficulty
        setLevel(l => l + 1);
        return 0;
      }
      return newCount;
    });
  }, [level]);

  const checkMatch = useCallback(() => {
    if (!selectedProblem || !selectedAnswer) return;

    const isMatch = selectedProblem.sum === selectedAnswer.value;

    if (isMatch) {
      // Update streak and check level progress
      checkLevelProgress();
      
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > 0 && newStreak % 3 === 0) {
          setShowStreakAnimation(true);
          setTimeout(() => setShowStreakAnimation(false), 2000);
          playStreakSound();
        } else {
          playSuccessSound();
        }
        return newStreak;
      });

      setScore(prevScore => {
        const newScore = prevScore + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('numberBondsHighScore', newScore.toString());
        }
        return newScore;
      });

      const problemElement = document.querySelector(`[data-id="${selectedProblem.id}"]`);
      const answerElement = document.querySelector(`[data-id="${selectedAnswer.id}"]`);

      if (problemElement && answerElement) {
        const problemRect = problemElement.getBoundingClientRect();
        const answerRect = answerElement.getBoundingClientRect();

        createParticles(problemRect.left + problemRect.width / 2, problemRect.top + problemRect.height / 2);
        createParticles(answerRect.left + answerRect.width / 2, answerRect.top + answerRect.height / 2);
      }

      removeItems(selectedProblem.id, selectedAnswer.id);
      setSelectedProblem(null);
      setSelectedAnswer(null);

      // Generate new problems if we're running low
      if (problems.length <= 2) {
        generateProblemsAndAnswers();
      }
    } else {
      setStreak(0);
      // On wrong answer at higher levels, consider dropping back a level
      if (level > 3 && Math.random() < 0.3) {  // 30% chance to drop back
        setLevel(prev => prev - 1);
        setSuccessCount(0);
        generateProblemsAndAnswers();
      }
      playSound(280, 'sawtooth');
      setSelectedProblem(null);
      setSelectedAnswer(null);
    }
  }, [selectedProblem, selectedAnswer, highScore, removeItems, problems.length, level, checkLevelProgress]);

  useEffect(() => {
    checkMatch();
  }, [selectedProblem, selectedAnswer, checkMatch]);

  useEffect(() => {
    generateProblemsAndAnswers();
  }, [level]);

  const isRemoving = (id) => removingItems.has(id);

  const RainbowText = ({ text }) => {
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF'];
    return (
      <div className="flex justify-center items-center gap-1">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            className="text-6xl font-bold animate-bounce"
            style={{
              color: colors[index % colors.length],
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              animationDelay: `${index * 0.1}s`
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <RainbowText text="BLAKES" />
          <div className="text-2xl text-center text-white font-bold mt-2">
            Number Bonds Game!
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-white text-xl">
            Score: {score}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-white text-xl">
              <Crown className="w-6 h-6 mr-2 text-yellow-300" />
              High Score: {highScore}
            </div>
            <div className="text-white text-xl">
              Level: {level}
            </div>
            {streak > 0 && (
              <div className={`text-xl font-bold ${showStreakAnimation ? 'animate-bounce text-yellow-300' : 'text-white'}`}>
                Streak: {streak}! 🔥
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Volume2 
              className="w-6 h-6 text-white cursor-pointer hover:text-yellow-300 transition-colors" 
              onClick={() => playSound(440)} 
            />
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <RotateCw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-lg">
            <h2 className="text-xl font-semibold text-white mb-4 sticky top-0 bg-white/10 p-2 rounded">
              Number Pairs
            </h2>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid-container">
                {problems.map((problem) => (
                  <button
                    key={problem.id}
                    data-id={problem.id}
                    className={`grid-item p-4 rounded-lg text-3xl font-bold transition-all transform hover:scale-105
                      ${isRemoving(problem.id) ? 'animate-disappear' : ''}
                      ${selectedProblem?.id === problem.id 
                        ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                        : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                    onClick={() => !isRemoving(problem.id) && handleSelection(problem, 'problem')}
                    disabled={isRemoving(problem.id)}
                  >
                    {problem.first} + {problem.second}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-lg">
            <h2 className="text-xl font-semibold text-white mb-4 sticky top-0 bg-white/10 p-2 rounded">
              Makes What?
            </h2>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid-container">
                {answers.map((answer) => (
                  <button
                    key={answer.id}
                    data-id={answer.id}
                    className={`grid-item p-4 rounded-lg text-4xl font-bold transition-all transform hover:scale-105
                      ${isRemoving(answer.id) ? 'animate-disappear' : ''}
                      ${selectedAnswer?.id === answer.id 
                        ? 'bg-purple-600 text-white shadow-lg scale-105' 
                        : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                    onClick={() => !isRemoving(answer.id) && handleSelection(answer, 'answer')}
                    disabled={isRemoving(answer.id)}
                  >
                    {answer.value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberBondsGame;
