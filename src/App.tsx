/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing'>('start');
  const [topic, setTopic] = useState('');
  const [personalityId, setPersonalityId] = useState('');

  const handleStart = (selectedTopic: string, selectedPersonality: string) => {
    setTopic(selectedTopic);
    setPersonalityId(selectedPersonality);
    setGameState('playing');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {gameState === 'start' ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <GameScreen 
          topic={topic} 
          personalityId={personalityId} 
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
}
