import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const TRACKS = [
  'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-sun-and-ocean-585.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3'
];

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [trackIndex] = useState(() => Math.floor(Math.random() * TRACKS.length));

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        alert("Please interact with the page first to enable music.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20">
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex]}
        loop
      />
      
      <button
        onClick={togglePlay}
        className={`p-2 rounded-xl transition-all ${
          isPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
        }`}
        title={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {isPlaying && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <Music size={16} className="text-indigo-400 animate-pulse" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
