import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTicTacToeComments, generateTicTacToeEndComment, generateSpeech, playBase64Audio } from '../lib/gemini';
import { PERSONALITIES } from '../lib/constants';
import { Loader2, Mic, RefreshCw } from 'lucide-react';
import { LiveHostModal } from './LiveHostModal';

type Player = 'X' | 'O' | null;

export function TicTacToeScreen({ personalityId, onRestart }: { personalityId: string, onRestart: () => void }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);

  const personality = PERSONALITIES.find(p => p.id === personalityId)!;

  useEffect(() => {
    generateTicTacToeComments(personality.description).then(c => {
      setComments(c);
      setLoading(false);
      speakText(`Let's play Tic Tac Toe! You go first as X.`);
    }).catch(() => {
      setComments(["Good move!", "My turn!", "Interesting strategy.", "Let's see...", "Nice play!"]);
      setLoading(false);
      speakText(`Let's play Tic Tac Toe! You go first as X.`);
    });
  }, []);

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const audioBase64 = await generateSpeech(text, personality.voice);
      await playBase64Audio(audioBase64);
    } catch (e) {
      console.error("Speech error:", e);
    } finally {
      setIsSpeaking(false);
    }
  };

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  };

  const makeAIMove = async (currentBoard: Player[]) => {
    let move = -1;
    const available = currentBoard.map((v, i) => v === null ? i : -1).filter(v => v !== -1);
    
    // 1. Win
    for (let i of available) {
      const boardCopy = [...currentBoard];
      boardCopy[i] = 'O';
      if (checkWinner(boardCopy) === 'O') {
        move = i;
        break;
      }
    }

    // 2. Block
    if (move === -1) {
      for (let i of available) {
        const boardCopy = [...currentBoard];
        boardCopy[i] = 'X';
        if (checkWinner(boardCopy) === 'X') {
          move = i;
          break;
        }
      }
    }

    // 3. Center
    if (move === -1 && available.includes(4)) move = 4;
    
    // 4. Random
    if (move === -1) move = available[Math.floor(Math.random() * available.length)];

    const newBoard = [...currentBoard];
    newBoard[move] = 'O';
    setBoard(newBoard);
    
    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      handleGameOver(newWinner);
    } else {
      setIsPlayerTurn(true);
      if (comments.length > 0 && Math.random() > 0.3) {
        const comment = comments[Math.floor(Math.random() * comments.length)];
        speakText(comment);
      }
    }
  };

  const handleGameOver = async (result: Player | 'Draw') => {
    setWinner(result);
    const endResult = result === 'X' ? 'win' : result === 'O' ? 'loss' : 'draw';
    try {
      const endComment = await generateTicTacToeEndComment(personality.description, endResult);
      await speakText(endComment);
    } catch (e) {
      speakText("Good game!");
    }
  };

  const handleSquareClick = (index: number) => {
    if (!isPlayerTurn || board[index] || winner || isSpeaking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      handleGameOver(newWinner);
    } else {
      setTimeout(() => makeAIMove(newBoard), 500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Setting up the board...</p>
        <p className="text-sm text-gray-400 mt-2">The {personality.name} is preparing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="bg-white px-4 py-2 rounded-full shadow-sm font-semibold text-indigo-600">
          Tic Tac Toe
        </div>
        <button
          onClick={() => setShowLiveModal(true)}
          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors font-medium"
        >
          <Mic size={18} />
          Talk to Host
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 mb-6"
      >
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`px-4 py-2 rounded-lg font-bold transition-colors ${isPlayerTurn && !winner ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400'}`}>
            You (X)
          </div>
          <div className="text-gray-300 font-bold">VS</div>
          <div className={`px-4 py-2 rounded-lg font-bold transition-colors ${!isPlayerTurn && !winner ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400'} ${isSpeaking ? 'animate-pulse bg-indigo-50' : ''}`}>
            {personality.name} (O)
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto mb-8">
          {board.map((square, i) => (
            <button
              key={i}
              disabled={!isPlayerTurn || square !== null || winner !== null || isSpeaking}
              onClick={() => handleSquareClick(i)}
              className={`h-24 text-5xl font-bold rounded-xl transition-all flex items-center justify-center
                ${square === null && isPlayerTurn && !winner && !isSpeaking ? 'bg-gray-50 hover:bg-indigo-50 cursor-pointer' : 'bg-gray-100 cursor-default'}
                ${square === 'X' ? 'text-indigo-600' : 'text-emerald-600'}
              `}
            >
              {square}
            </button>
          ))}
        </div>

        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {winner === 'Draw' ? "It's a Draw!" : winner === 'X' ? "You Won!" : `${personality.name} Won!`}
            </h3>
            <button
              onClick={onRestart}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Play Again
            </button>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showLiveModal && (
          <LiveHostModal 
            personality={personality} 
            topic="Tic Tac Toe"
            onClose={() => setShowLiveModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
