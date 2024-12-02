import React, { useState, useEffect } from 'react';
import { Star, Zap, Trophy, Target, Compass, Crown, Map, Medal } from 'lucide-react';

export const BADGES = {
  QUICK_START: {
    id: 'quick-start',
    name: 'Quick Start',
    description: 'Complete your first problem',
    icon: Star,
    className: 'badge-quick-start',
    condition: (stats) => stats.totalSolved >= 1
  },
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
    description: 'Tried all basic operations',
    icon: Compass,
    className: 'badge-explorer',
    condition: (stats) => stats.operationsUsed.size >= 4
  },
  VARIABLE_MASTER: {
    id: 'variable-master',
    name: 'Variable Master',
    description: 'Solved problems with 5 variables',
    icon: Star,
    className: 'badge-variable-master',
    condition: (stats) => stats.maxVariables >= 5
  },
  MATH_MASTER: {
    id: 'math-master',
    name: 'Math Master',
    description: 'Earn Math Whiz, Speed Demon, and Perfectionist badges',
    icon: Crown,
    className: 'badge-super badge-math-master',
    isSuper: true,
    requiredBadges: ['math-whiz', 'speed-demon', 'perfectionist'],
    condition: (stats, earnedBadges) => 
      earnedBadges.includes('math-whiz') && 
      earnedBadges.includes('speed-demon') && 
      earnedBadges.includes('perfectionist')
  },
  GRAND_EXPLORER: {
    id: 'grand-explorer',
    name: 'Grand Explorer',
    description: 'Earn Explorer, Variable Master, and solve 100 problems',
    icon: Map,
    className: 'badge-super badge-grand-explorer',
    isSuper: true,
    requiredBadges: ['explorer', 'variable-master'],
    condition: (stats, earnedBadges) => 
      earnedBadges.includes('explorer') && 
      earnedBadges.includes('variable-master') && 
      stats.totalSolved >= 100
  },
  ULTIMATE_ACHIEVER: {
    id: 'ultimate-achiever',
    name: 'Ultimate Achiever',
    description: 'Earn all other super badges',
    icon: Medal,
    className: 'badge-super badge-ultimate',
    isSuper: true,
    requiredBadges: ['math-master', 'grand-explorer'],
    condition: (stats, earnedBadges) => 
      earnedBadges.includes('math-master') && 
      earnedBadges.includes('grand-explorer')
  }
};

const BadgeDisplay = ({ badge, isNew = false }) => {
  const Icon = badge.icon;
  
  return (
    <div className={`badge ${badge.className} ${isNew ? 'badge-new' : ''}`}>
      <div className="badge-content">
        <Icon className="badge-icon" />
      </div>
      <div className="badge-tooltip">
        <div className="font-bold">{badge.name}</div>
        <div className="text-xs mt-1">{badge.description}</div>
      </div>
    </div>
  );
};

const BadgeCelebration = ({ badge, onClose }) => {
  return (
    <div className="badge-celebration" onClick={onClose}>
      <div className="badge-celebration-content" onClick={e => e.stopPropagation()}>
        <div className="text-3xl mb-4">🎉 New Badge Unlocked! 🎉</div>
        <div className="transform scale-150 my-8">
          <BadgeDisplay badge={badge} isNew={true} />
        </div>
        <button
          className="mt-6 px-6 py-3 bg-primary-500 text-white rounded-xl
                     hover:bg-primary-600 transition-colors font-bold"
          onClick={onClose}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

const BadgesDisplay = ({ earnedBadges, newBadge }) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (newBadge) {
      setShowCelebration(true);
    }
  }, [newBadge]);

  return (
    <>
      <div className="badges-container">
        {earnedBadges.map(badgeId => {
          const badge = Object.values(BADGES).find(b => b.id === badgeId);
          if (!badge) return null;
          return <BadgeDisplay key={badge.id} badge={badge} />;
        })}
      </div>
      {showCelebration && newBadge && (
        <BadgeCelebration
          badge={newBadge}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
};

export default BadgesDisplay; 