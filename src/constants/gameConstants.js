export const SPEED_THRESHOLDS = {
  LIGHTNING: { time: 3, score: 500, label: '⚡ Lightning Fast!', color: 'text-yellow-500' },
  SUPER_FAST: { time: 5, score: 300, label: '🚀 Super Fast!', color: 'text-purple-500' },
  FAST: { time: 8, score: 200, label: '💨 Fast!', color: 'text-blue-500' },
  GOOD: { time: 12, score: 100, label: '👍 Good!', color: 'text-green-500' }
};

export const BOSS_MODE = {
  STREAK_REQUIRED: 10,
  TIME_LIMIT: 10,
  BONUS_MULTIPLIER: 3,
  COLORS: ['from-red-500', 'from-purple-600', 'from-orange-500']
};

export const DIFFICULTY_PRESETS = [
  { name: 'Beginner', min: 1, max: 5, problemCount: 3, emoji: '🌱' },
  { name: 'Easy', min: 1, max: 10, problemCount: 4, emoji: '🌟' },
  { name: 'Medium', min: 5, max: 15, problemCount: 5, emoji: '🚀' },
  { name: 'Hard', min: 10, max: 20, problemCount: 6, emoji: '🔥' },
  { name: 'Expert', min: 15, max: 30, problemCount: 8, emoji: '👑' }
];

export const OPERATIONS = [
  { value: 'addition', label: 'Addition', emoji: '➕' },
  { value: 'subtraction', label: 'Subtraction', emoji: '➖' },
  { value: 'multiplication', label: 'Multiplication', emoji: '✖️' },
  { value: 'division', label: 'Division', emoji: '➗' }
]; 