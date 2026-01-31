
import React, { useState, useEffect, useRef } from 'react';
import { Player, Position, Club } from '../../types';
import { STARTING_CLUBS } from '../../constants';

interface MatchEngineProps {
  player: Player;
  opponent: string;
  onFinish: (result: { goals: number; assists: number; rating: number; win: boolean; score: string }) => void;
}

type GamePhase = 'INTRO' | 'EVENT' | 'RESULT' | 'CELEBRATION';
type EventType = 'SHOOTING' | 'PASSING';

export const MatchEngine: React.FC<MatchEngineProps> = ({ player, opponent, onFinish }) => {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [playerStats, setPlayerStats] = useState({ goals: 0, assists: 0, rating: 6.0 });
  const [timer, setTimer] = useState(0); 
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);

  const playerClub = STARTING_CLUBS.find(c => c.name === opponent) ? STARTING_CLUBS[0] : STARTING_CLUBS[0]; // Fallback logic
  const opponentClub = STARTING_CLUBS.find(c => c.name === opponent);

  useEffect(() => {
    const t = setTimeout(() => setPhase('EVENT'), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'EVENT' && !currentEvent) {
      const nextTime = timer + Math.floor(Math.random() * 20) + 5;
      if (nextTime >= 90) {
        setPhase('RESULT');
        return;
      }
      setTimer(nextTime);
      
      // Realism Logic: Opponent Strength check
      if (opponentClub) {
          const powerDiff = (opponentClub.reputation - 50) / 100;
          if (Math.random() < 0.2 + (powerDiff > 0 ? powerDiff : 0)) {
              setScore(s => ({ ...s, away: s.away + 1 }));
          }
      }

      const roll = Math.random();
      // Only generate player event if stamina > 10
      if (player.currentStamina > 10) {
        const selected: EventType = roll < 0.5 ? 'SHOOTING' : 'PASSING';
        setCurrentEvent(selected);
        setIsSuccess(null);
      }
    }
  }, [phase, currentEvent, timer]);

  const handleInteractionEnd = () => {
    if (!touchStart || !touchEnd || isSuccess !== null) return;
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 30) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeEndX = ((touchEnd.x - rect.left) / rect.width) * 100;
    const relativeEndY = ((touchEnd.y - rect.top) / rect.height) * 100;

    // Difficulty based on player stats
    const threshold = currentEvent === 'SHOOTING' ? (player.attributes.shooting / 100) * 40 : (player.attributes.passing / 100) * 40;
    const success = relativeEndY < (35 + threshold/2) && relativeEndX > (50 - threshold) && relativeEndX < (50 + threshold);
    
    setIsSuccess(success);

    setTimeout(() => {
      if (success) {
        if (currentEvent === 'SHOOTING') {
          setScore(s => ({ ...s, home: s.home + 1 }));
          setPlayerStats(s => ({ ...s, goals: s.goals + 1, rating: Math.min(10, s.rating + 1.2) }));
          setPhase('CELEBRATION');
        } else {
          if (Math.random() > 0.7) {
            setScore(s => ({ ...s, home: s.home + 1 }));
            setPlayerStats(s => ({ ...s, assists: s.assists + 1, rating: Math.min(10, s.rating + 0.8) }));
            setPhase('CELEBRATION');
          } else {
            setPlayerStats(s => ({ ...s, rating: Math.min(10, s.rating + 0.4) }));
          }
        }
      } else {
        setPlayerStats(s => ({ ...s, rating: Math.max(3, s.rating - 0.2) }));
      }
      if (phase !== 'CELEBRATION' || !success) {
        setCurrentEvent(null);
        setPhase('EVENT');
      }
    }, 800);
  };

  if (phase === 'INTRO') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-6xl font-black mb-4 italic uppercase italic tracking-tighter">VERSUS {opponent}</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Match Starting...</p>
      </div>
    );
  }

  if (phase === 'RESULT') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-bold mb-2 uppercase opacity-50">Match Finished</h2>
        <div className="text-8xl font-black mb-8 italic text-yellow-500 tracking-tighter">{score.home} - {score.away}</div>
        <button 
          onClick={() => onFinish({ ...playerStats, win: score.home > score.away, score: `${score.home}-${score.away}` })}
          className="bg-yellow-500 text-black px-12 py-4 rounded-xl font-black uppercase italic tracking-tighter hover:bg-yellow-400"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-between p-4 overflow-hidden select-none touch-none"
      onMouseDown={(e) => { setTouchStart({x: e.clientX, y: e.clientY}); setTouchEnd({x: e.clientX, y: e.clientY}); }}
      onMouseMove={(e) => { if (touchStart) setTouchEnd({x: e.clientX, y: e.clientY}); }}
      onMouseUp={handleInteractionEnd}
      onTouchStart={(e) => { setTouchStart({x: e.touches[0].clientX, y: e.touches[0].clientY}); }}
      onTouchMove={(e) => { setTouchEnd({x: e.touches[0].clientX, y: e.touches[0].clientY}); }}
      onTouchEnd={handleInteractionEnd}
    >
      <div className="w-full flex justify-between items-center max-w-5xl z-20">
        <div className="bg-black/80 p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="text-2xl font-black italic tracking-tighter">{score.home} - {score.away}</div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase">YOU vs {opponent.substring(0,8)}</div>
        </div>
        <div className="text-4xl font-black italic text-white/20">{timer}'</div>
        <div className="bg-black/80 p-4 rounded-xl border-r-4 border-green-500 text-right">
          <div className="text-2xl font-black text-yellow-500">{playerStats.rating.toFixed(1)}</div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase">Match Rating</div>
        </div>
      </div>

      <div className="flex-1 w-full relative flex flex-col items-center justify-center">
        {phase === 'CELEBRATION' ? (
          <div className="text-center animate-bounce z-10">
            <h2 className="text-8xl font-black italic text-yellow-500 mb-2 tracking-tighter">GOAL!</h2>
            <p className="text-xl font-bold uppercase tracking-widest">{player.name} IMPACT!</p>
          </div>
        ) : currentEvent ? (
          <>
            <div className="absolute top-[10%] w-[50%] h-[20%] border-2 border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/5 font-black text-5xl uppercase italic tracking-tighter">TARGET</span>
            </div>
            <div className="text-center mb-20 pointer-events-none">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-1">
                {currentEvent === 'SHOOTING' ? 'SWIPE TO FINISH!' : 'SWIPE TO ASSIST!'}
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase">Control the outcome</p>
            </div>
            <div className="absolute bottom-[20%] w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-zinc-300">
               <div className="w-10 h-10 bg-zinc-100 rounded-full border border-zinc-200"></div>
            </div>
          </>
        ) : (
          <div className="text-zinc-800 italic font-black text-3xl uppercase animate-pulse">Building play...</div>
        )}
      </div>

      <div className="w-full max-w-5xl h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${(timer/90) * 100}%` }} />
      </div>
    </div>
  );
};
