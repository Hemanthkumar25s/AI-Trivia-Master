import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TriviaQuestion, generateQuestions, generateSpeech, playBase64Audio } from '../lib/gemini';
import { PERSONALITIES } from '../lib/constants';
import { Loader2, Mic, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { LiveHostModal } from './LiveHostModal';

interface GameScreenProps {
  topic: string;
  personalityId: string;
  onRestart: () => void;
}

export function GameScreen({ topic, personalityId, onRestart }: GameScreenProps) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const personality = PERSONALITIES.find(p => p.id === personalityId)!;
  const hasSpokenIntro = useRef(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const qs = await generateQuestions(topic, personality.description);
      setQuestions(qs);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load questions:", error);
      // Fallback if API fails
      setQuestions([{
        hostIntro: "Well, something broke, but let's pretend I meant to ask this.",
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris",
        hostCorrectFeedback: "Wow, you actually knew that.",
        hostIncorrectFeedback: "Not even close."
      }]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && questions.length > 0 && !selectedAnswer && !gameOver) {
      if (!hasSpokenIntro.current) {
        hasSpokenIntro.current = true;
        speakText(questions[currentIndex].hostIntro);
      }
    }
  }, [loading, currentIndex, questions, selectedAnswer, gameOver]);

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

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer || isSpeaking) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentIndex].correctAnswer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      await speakText(questions[currentIndex].hostCorrectFeedback);
    } else {
      await speakText(questions[currentIndex].hostIncorrectFeedback);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        hasSpokenIntro.current = false;
      } else {
        setGameOver(true);
        speakText(`Game over! You scored ${score + (isCorrect ? 1 : 0)} out of ${questions.length}.`);
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Generating questions about {topic}...</p>
        <p className="text-sm text-gray-400 mt-2">The {personality.name} is preparing...</p>
      </div>
    );
  }

  if (gameOver) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl text-center"
      >
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Game Over!</h2>
        <p className="text-2xl text-gray-600 mb-8">You scored {score} out of {questions.length}</p>
        <button
          onClick={onRestart}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors"
        >
          Play Again
        </button>
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full md:w-48 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center border-b-4 border-indigo-500"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${isSpeaking ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}>
            <User size={40} />
          </div>
          <h3 className="font-bold text-gray-900">{personality.name}</h3>
          <p className="text-xs text-gray-500 mt-1">Your AI Host</p>
          {isSpeaking && (
            <div className="flex gap-1 mt-3">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  className="w-1 bg-indigo-500 rounded-full"
                />
              ))}
            </div>
          )}
        </motion.div>

        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm font-semibold text-indigo-600">
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm font-semibold text-gray-700">
              Score: {score}
            </div>
            <button
              onClick={() => setShowLiveModal(true)}
              className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-200 transition-colors font-medium shadow-sm"
            >
              <Mic size={18} />
              Talk to Host
            </button>
          </div>

          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="mb-8">
              <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 relative">
                <div className="absolute -left-2 top-4 w-4 h-4 bg-indigo-50 border-l border-t border-indigo-100 rotate-45"></div>
                <p className="text-lg text-indigo-900 italic">"{currentQ.hostIntro}"</p>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{currentQ.question}</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQ.correctAnswer;
                const showStatus = selectedAnswer !== null;
                
                let btnClass = "p-4 rounded-xl border-2 text-left text-lg font-medium transition-all ";
                if (!showStatus) {
                  btnClass += "border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700 hover:shadow-md";
                } else if (isCorrect) {
                  btnClass += "border-green-500 bg-green-50 text-green-700 shadow-sm";
                } else if (isSelected && !isCorrect) {
                  btnClass += "border-red-500 bg-red-50 text-red-700 shadow-sm";
                } else {
                  btnClass += "border-gray-50 opacity-50 text-gray-400";
                }

                return (
                  <button
                    key={i}
                    disabled={showStatus || isSpeaking}
                    onClick={() => handleAnswer(opt)}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center">
                      <span>{opt}</span>
                      {showStatus && isCorrect && <CheckCircle2 className="text-green-500" />}
                      {showStatus && isSelected && !isCorrect && <XCircle className="text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showLiveModal && (
          <LiveHostModal 
            personality={personality} 
            topic={topic}
            onClose={() => setShowLiveModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
