import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PERSONALITIES } from '../lib/constants';
import { Brain, Sparkles, User, Grid3X3 } from 'lucide-react';

interface StartScreenProps {
  onStart: (mode: 'trivia' | 'tictactoe', topic: string, personalityId: string) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [gameMode, setGameMode] = useState<'trivia' | 'tictactoe'>('trivia');
  const [topic, setTopic] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState(PERSONALITIES[0].id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
          <Brain size={32} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Game Master</h1>
        <p className="text-gray-600">Choose your game and your host's personality!</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Game Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGameMode('trivia')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                gameMode === 'trivia' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 hover:border-indigo-200 text-gray-600'
              }`}
            >
              <Brain size={24} />
              Trivia
            </button>
            <button
              onClick={() => setGameMode('tictactoe')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                gameMode === 'tictactoe' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 hover:border-indigo-200 text-gray-600'
              }`}
            >
              <Grid3X3 size={24} />
              Tic Tac Toe
            </button>
          </div>
        </div>

        {gameMode === 'trivia' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-2">
              What do you want to be quizzed on?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 90s Pop Culture, Quantum Physics, The Beatles..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose your Host
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonality(p.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPersonality === p.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <User size={20} className={selectedPersonality === p.id ? 'text-indigo-600' : 'text-gray-400'} />
                  <span className="font-semibold text-gray-900">{p.name}</span>
                </div>
                <p className="text-sm text-gray-500">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onStart(gameMode, gameMode === 'trivia' ? (topic || 'General Knowledge') : 'Tic Tac Toe', selectedPersonality)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles size={24} />
          Start Game
        </button>
      </div>
    </motion.div>
  );
}
