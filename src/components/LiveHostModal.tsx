import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Mic, Loader2 } from 'lucide-react';
import { LiveSession } from '../lib/LiveSession';

interface LiveHostModalProps {
  personality: any;
  topic: string;
  onClose: () => void;
}

export function LiveHostModal({ personality, topic, onClose }: LiveHostModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    const session = new LiveSession(
      personality.description,
      topic,
      personality.voice,
      (msg) => console.log(msg),
      (err) => setError(err.message || "Connection failed"),
      () => console.log("Interrupted")
    );

    sessionRef.current = session;

    session.connect()
      .then(() => setIsConnected(true))
      .catch(err => setError(err.message || "Failed to connect to microphone or API"));

    return () => {
      session.disconnect();
    };
  }, [personality, topic]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Live Chat: {personality.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <div className="text-center text-red-500">
              <p className="font-semibold mb-2">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : !isConnected ? (
            <div className="flex flex-col items-center text-gray-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
              <p>Connecting to host...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-50"></div>
                <Mic className="w-12 h-12 text-indigo-600 relative z-10" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Listening...</h4>
              <p className="text-gray-500 text-center">
                Speak into your microphone. The host will respond automatically.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
