/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { TicTacToeScreen } from './components/TicTacToeScreen';
import { BackgroundMusic } from './components/BackgroundMusic';

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing'>('start');
  const [gameMode, setGameMode] = useState<'trivia' | 'tictactoe'>('trivia');
  const [topic, setTopic] = useState('');
  const [personalityId, setPersonalityId] = useState('');

  const handleStart = (mode: 'trivia' | 'tictactoe', selectedTopic: string, selectedPersonality: string) => {
    setGameMode(mode);
    setTopic(selectedTopic);
    setPersonalityId(selectedPersonality);
    setGameState('playing');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <BackgroundMusic />
      
      {gameState === 'start' ? (
        <StartScreen onStart={handleStart} />
      ) : gameMode === 'trivia' ? (
        <GameScreen 
          topic={topic} 
          personalityId={personalityId} 
          onRestart={handleRestart} 
        />
      ) : (
        <TicTacToeScreen 
          personalityId={personalityId} 
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
}
