
import React, { useState, useEffect, useRef } from 'react';
import { Player, Position, Club } from '../../types';
import { STARTING_CLUBS } from '../../constants';
import { Target, Zap, Shield, MoveHorizontal, MousePointer2 } from 'lucide-react';

interface MatchEngineProps {
  player: Player;
  opponent: string;
  onFinish: (result: { goals: number; assists: number; rating: number; win: boolean; score: string }) => void;
}

type GamePhase = 'INTRO' | 'EVENT' | 'RESULT' | 'CELEBRATION' | 'FAILURE';
type EventType = 'SHOOTING' | 'PASSING' | 'DRIBBLING' | 'TACKLE';

export const MatchEngine: React.FC<MatchEngineProps> = ({ player, opponent, onFinish }) => {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [playerStats, setPlayerStats] = useState({ goals: 0, assists: 0, rating: 6.0 });
  const [timer, setTimer] = useState(0); 
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  
  // Mini-game specific states
  const [sliderPos, setSliderPos] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [activeSide, setActiveSide] = useState<'LEFT' | 'RIGHT' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderInterval = useRef<number | null>(null);

  const opponentClub = STARTING_CLUBS.find(c => c.name === opponent);
  const playerClubRep = 40; 

  useEffect(() => {
    const t = setTimeout(() => setPhase('EVENT'), 2000);
    return () => clearTimeout(t);
  }, []);

  // Main Match Loop
  useEffect(() => {
    if (phase === 'EVENT' && !currentEvent) {
      const nextTime = timer + Math.floor(Math.random() * 12) + 3;
      if (nextTime >= 90) {
        setPhase('RESULT');
        return;
      }
      setTimer(nextTime);
      
      // Realistic AI Score Logic
      if (opponentClub) {
        const repGap = opponentClub.reputation - playerClubRep;
        const advantageProb = Math.max(0, repGap / 250);
        if (Math.random() < 0.08 + advantageProb) {
          setScore(s => ({ ...s, away: s.away + 1 }));
        }
        if (Math.random() < 0.05) {
           setScore(s => ({ ...s, home: s.home + 1 }));
        }
      }

      // Trigger Player Event
      const roll = Math.random();
      if (roll < 0.35) {
        const eventPool: EventType[] = ['SHOOTING', 'PASSING', 'DRIBBLING', 'TACKLE'];
        const selected = eventPool[Math.floor(Math.random() * eventPool.length)];
        startMiniGame(selected);
      }
    }
  }, [phase, currentEvent, timer]);

  const startMiniGame = (type: EventType) => {
    setCurrentEvent(type);
    setIsSuccess(null);

    if (type === 'TACKLE') {
      let dir = 1;
      sliderInterval.current = window.setInterval(() => {
        setSliderPos(prev => {
          if (prev >= 100) dir = -1;
          if (prev <= 0) dir = 1;
          return prev + (dir * 5);
        });
      }, 20);
    }

    if (type === 'DRIBBLING') {
      setActiveSide(Math.random() > 0.5 ? 'LEFT' : 'RIGHT');
    }

    if (type === 'PASSING') {
      setTargetPos({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 40 });
    }
  };

  const handleAction = (input?: any) => {
    if (isSuccess !== null) return;
    
    let success = false;
    if (currentEvent === 'TACKLE') {
      window.clearInterval(sliderInterval.current!);
      // Target is 45-55 range
      success = sliderPos >= 40 && sliderPos <= 60;
    } else if (currentEvent === 'DRIBBLING') {
      success = input === activeSide;
    } else if (currentEvent === 'SHOOTING' || currentEvent === 'PASSING') {
      // Handled by swipe or specific click
      success = input === true;
    }

    finalizeEvent(success);
  };

  const finalizeEvent = (success: boolean) => {
    setIsSuccess(success);
    
    setTimeout(() => {
      if (success) {
        if (currentEvent === 'SHOOTING') {
          setScore(s => ({ ...s, home: s.home + 1 }));
          setPlayerStats(s => ({ ...s, goals: s.goals + 1, rating: Math.min(10, s.rating + 1.2) }));
          setPhase('CELEBRATION');
        } else if (currentEvent === 'PASSING') {
          if (Math.random() > 0.5) {
            setScore(s => ({ ...s, home: s.home + 1 }));
            setPlayerStats(s => ({ ...s, assists: s.assists + 1, rating: Math.min(10, s.rating + 1.0) }));
            setPhase('CELEBRATION');
          } else {
            setPlayerStats(s => ({ ...s, rating: Math.min(10, s.rating + 0.5) }));
          }
        } else if (currentEvent === 'DRIBBLING') {
          setPlayerStats(s => ({ ...s, rating: Math.min(10, s.rating + 0.6) }));
        } else if (currentEvent === 'TACKLE') {
          setPlayerStats(s => ({ ...s, rating: Math.min(10, s.rating + 0.8) }));
        }
      } else {
        setPlayerStats(s => ({ ...s, rating: Math.max(3.5, s.rating - 0.4) }));
        setPhase('FAILURE');
        setTimeout(() => setPhase('EVENT'), 1000);
      }

      if (phase !== 'CELEBRATION' || !success) {
        setCurrentEvent(null);
        if (phase !== 'FAILURE') setPhase('EVENT');
      }
    }, 600);
  };

  if (phase === 'INTRO') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Zap size={48} className="text-black" />
        </div>
        <h1 className="text-6xl font-black mb-4 italic uppercase tracking-tighter">VERSUS {opponent}</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Pre-Match Warmup...</p>
      </div>
    );
  }

  if (phase === 'RESULT') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-2 uppercase opacity-40 italic tracking-widest">Full Time whistle</h2>
        <div className="text-9xl font-black mb-8 italic text-yellow-500 tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">{score.home} - {score.away}</div>
        <div className="grid grid-cols-2 gap-6 mb-12 w-full max-w-lg">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
                <div className="text-xs text-zinc-500 font-black uppercase mb-1">Match Rating</div>
                <div className="text-5xl font-black text-green-500 italic">{playerStats.rating.toFixed(1)}</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
                <div className="text-xs text-zinc-500 font-black uppercase mb-1">Contribution</div>
                <div className="text-3xl font-black text-white">{playerStats.goals} Goals</div>
                <div className="text-3xl font-black text-blue-400">{playerStats.assists} Assists</div>
            </div>
        </div>
        <button 
          onClick={() => onFinish({ ...playerStats, win: score.home > score.away, score: `${score.home}-${score.away}` })}
          className="bg-yellow-500 text-black px-16 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-yellow-400 hover:scale-105 transition-all shadow-xl"
        >
          Exit to Locker Room
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0c0c0e] flex flex-col items-center justify-between p-6 overflow-hidden select-none touch-none"
    >
      {/* HUD */}
      <div className="w-full flex justify-between items-start max-w-6xl z-20">
        <div className="bg-zinc-900/90 backdrop-blur-md p-5 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-black italic tracking-tighter">{score.home} <span className="text-zinc-700">-</span> {score.away}</div>
            <div className="h-8 w-px bg-zinc-800"></div>
            <div>
              <div className="text-[10px] text-zinc-500 font-black uppercase">Opposition</div>
              <div className="text-xs font-bold text-white truncate max-w-[120px]">{opponent}</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-5xl font-black italic text-zinc-800 tracking-tighter mb-1">{timer}'</div>
            <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(timer/90)*100}%` }} />
            </div>
        </div>

        <div className="bg-zinc-900/90 backdrop-blur-md p-5 rounded-2xl border border-zinc-800 shadow-2xl text-right">
          <div className="text-4xl font-black text-yellow-500 italic drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">{playerStats.rating.toFixed(1)}</div>
          <div className="text-[10px] text-zinc-500 font-black uppercase">Performance</div>
        </div>
      </div>

      {/* Mini-Game Area */}
      <div className="flex-1 w-full relative flex flex-col items-center justify-center">
        {phase === 'CELEBRATION' && (
          <div className="text-center animate-in zoom-in duration-300">
            <h2 className="text-[12rem] font-black italic text-yellow-500 leading-none tracking-tighter drop-shadow-2xl">GOAL!</h2>
            <div className="text-2xl font-black uppercase tracking-[0.5em] text-white/50">Masterful Play</div>
          </div>
        )}

        {phase === 'FAILURE' && (
          <div className="text-center animate-pulse">
            <h2 className="text-6xl font-black italic text-red-500 uppercase tracking-tighter">MISSED!</h2>
            <p className="text-zinc-500 font-bold uppercase">Focus your next chance</p>
          </div>
        )}

        {currentEvent === 'SHOOTING' && phase === 'EVENT' && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
            <div className="relative w-80 h-48 bg-zinc-900/50 rounded-2xl border-4 border-white/5 flex items-center justify-center group overflow-hidden">
                <div className="absolute top-4 left-4 w-4 h-4 bg-red-500/20 rounded-full"></div>
                <div className="absolute top-4 right-4 w-4 h-4 bg-red-500/20 rounded-full"></div>
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:scale-110 transition-transform active:scale-95" onClick={() => handleAction(true)}>
                    <Target size={32} className="text-black" />
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">PRECISION STRIKE</h3>
                <p className="text-zinc-500 font-bold uppercase text-xs">Tap the target to finish!</p>
            </div>
          </div>
        )}

        {currentEvent === 'TACKLE' && phase === 'EVENT' && (
          <div className="w-full max-w-xl space-y-12">
            <div className="relative w-full h-20 bg-zinc-900 rounded-2xl border border-zinc-800 p-2">
                <div className="absolute inset-y-0 left-[45%] right-[45%] bg-green-500/30 rounded-lg flex items-center justify-center">
                    <Shield size={24} className="text-green-500" />
                </div>
                <div 
                  className="absolute top-2 bottom-2 w-4 bg-white rounded-full shadow-lg transition-all duration-20"
                  style={{ left: `${sliderPos}%` }}
                />
            </div>
            <div className="text-center">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">TIMED TACKLE</h3>
                <p className="text-zinc-500 font-bold uppercase text-xs mb-8">Stop the slider in the green zone!</p>
                <button 
                  onClick={() => handleAction()}
                  className="bg-white text-black px-12 py-4 rounded-xl font-black uppercase italic tracking-tighter hover:bg-zinc-200"
                >
                    COMMIT TACKLE
                </button>
            </div>
          </div>
        )}

        {currentEvent === 'DRIBBLING' && phase === 'EVENT' && (
          <div className="w-full max-w-4xl grid grid-cols-2 gap-8 h-96">
            <button 
                onClick={() => handleAction('LEFT')}
                className={`rounded-3xl border-4 transition-all flex flex-col items-center justify-center group ${activeSide === 'LEFT' ? 'bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20' : 'bg-zinc-900 border-zinc-800 opacity-20'}`}
            >
                <Zap size={64} className={activeSide === 'LEFT' ? 'text-yellow-500 mb-4' : 'text-zinc-700 mb-4'} />
                <span className="font-black italic uppercase tracking-tighter text-2xl">DODGE LEFT</span>
            </button>
            <button 
                onClick={() => handleAction('RIGHT')}
                className={`rounded-3xl border-4 transition-all flex flex-col items-center justify-center group ${activeSide === 'RIGHT' ? 'bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20' : 'bg-zinc-900 border-zinc-800 opacity-20'}`}
            >
                <Zap size={64} className={activeSide === 'RIGHT' ? 'text-yellow-500 mb-4' : 'text-zinc-700 mb-4'} />
                <span className="font-black italic uppercase tracking-tighter text-2xl">DODGE RIGHT</span>
            </button>
          </div>
        )}

        {currentEvent === 'PASSING' && phase === 'EVENT' && (
          <div className="w-full h-full relative">
            <div className="text-center absolute top-10 w-full">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">VISION PASS</h3>
                <p className="text-zinc-500 font-bold uppercase text-xs">Find the teammate in space!</p>
            </div>
            <div 
              className="absolute w-20 h-20 bg-blue-500/20 border-2 border-blue-500 rounded-full flex items-center justify-center cursor-pointer animate-pulse hover:bg-blue-500/40"
              style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
              onClick={() => handleAction(true)}
            >
                <MoveHorizontal className="text-blue-500" />
            </div>
          </div>
        )}

        {!currentEvent && phase === 'EVENT' && (
          <div className="text-zinc-800 font-black text-4xl uppercase italic tracking-tighter animate-pulse flex items-center space-x-4">
            <Zap /> <span>Reading the game...</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full flex justify-center pb-8">
        <div className="flex space-x-12 opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex items-center"><Zap size={12} className="mr-2" /> Energy {player.attributes.stamina}</div>
            <div className="flex items-center"><Target size={12} className="mr-2" /> Skill {player.ovr}</div>
            <div className="flex items-center"><Shield size={12} className="mr-2" /> Form GOOD</div>
        </div>
      </div>
    </div>
  );
};
