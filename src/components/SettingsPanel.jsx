// src/components/SettingsPanel.jsx

import React, { useState, useCallback } from 'react';

const SettingsPanel = React.memo(({
  onClose,
  isIntro = false,
  playerName,
  setPlayerName,
  gameSettings,
  setGameSettings,
  generateProblemsAndAnswers,
}) => {
  const [formData, setFormData] = useState({
    name: playerName || '',
    settings: { ...gameSettings }
  });
  const [activeTab, setActiveTab] = useState('name');

  const handleNameChange = useCallback((e) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName
    }));
  }, []);

  const handleDifficultySelect = useCallback((preset) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        minNumber: preset.min,
        maxNumber: preset.max,
        problemCount: preset.problemCount
      }
    }));
  }, []);

  const handleOperationToggle = useCallback((operation, e) => {
    e.preventDefault();
    const currentOps = formData.settings.enabledOperations || ['addition'];
    let newOps;

    if (currentOps.includes(operation)) {
      if (currentOps.length === 1) return;
      newOps = currentOps.filter(op => op !== operation);
    } else {
      newOps = [...currentOps, operation];
      if (operation === 'division') {
        setFormData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            enabledOperations: newOps,
            variableCount: 2
          }
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        enabledOperations: newOps
      }
    }));
  }, [formData.settings.enabledOperations]);

  const handleVariableCountChange = useCallback((e) => {
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

  const handleTabChange = useCallback((tabId, e) => {
    e.preventDefault();
    setActiveTab(tabId);
  }, []);

  const handleSave = useCallback((e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (trimmedName) {
      setPlayerName(trimmedName);
      setGameSettings(formData.settings);
      localStorage.setItem('playerName', trimmedName);

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

  const tabs = [
    { id: 'name', label: '👤 Name', show: true },
    { id: 'difficulty', label: '🎯 Difficulty', show: true },
    { id: 'customize', label: '⚙️ Customize', show: true }
  ];

  const difficultyPresets = [
    { name: 'Beginner', min: 1, max: 5, problemCount: 3, emoji: '🌱' },
    { name: 'Easy', min: 1, max: 10, problemCount: 4, emoji: '🌟' },
    { name: 'Medium', min: 5, max: 15, problemCount: 5, emoji: '🚀' },
    { name: 'Hard', min: 10, max: 20, problemCount: 6, emoji: '🔥' },
    { name: 'Expert', min: 15, max: 30, problemCount: 8, emoji: '👑' }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl transform transition-all my-4"
        onClick={(e) => e.stopPropagation()}
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
        <div className="flex border-b">
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
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
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
                    onClick={() => handleDifficultySelect(preset)}
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

export default SettingsPanel;
