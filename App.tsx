
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Player, Position, PlayStyle, Message, Club, CompetitionType } from './types';
import { STARTING_CLUBS, NATIONS, ALL_POSITIONS } from './constants';
import { PlayerCard } from './components/PlayerCard';
import { ProgressBar } from './components/UI/Progress';
import { MatchEngine } from './components/Match/MatchEngine';
import { formatCurrency, advanceDate, calculateMarketValue } from './utils/gameLogic';
import { 
  Trophy, User, Users, Mail, TrendingUp, Calendar, 
  Settings, Play, Save, LogOut, ChevronRight, Bell,
  Target, Zap, Shield, Star, RefreshCw, Activity, Heart, Info
} from 'lucide-react';

const INITIAL_PLAYER: Player = {
  name: 'Young Prospect',
  age: 17,
  nationality: 'England',
  height: 182,
  weight: 75,
  preferredFoot: 'Right',
  position: Position.ST,
  secondaryPosition: Position.LW,
  playStyle: PlayStyle.FINISHER,
  ovr: 64,
  potential: 88,
  attributes: {
    pace: 75,
    shooting: 68,
    passing: 58,
    dribbling: 70,
    defending: 30,
    physical: 62,
    stamina: 80
  },
  stats: {
    goals: 0,
    assists: 0,
    appearances: 0,
    cleanSheets: 0,
    avgRating: 0
  },
  marketValue: 1200000,
  salary: 1500,
  reputation: 10,
  xp: 0,
  level: 1,
  currentStamina: 100,
  injuryDays: 0
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'squad' | 'training' | 'market' | 'inbox'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [tempPlayer, setTempPlayer] = useState<Player>(INITIAL_PLAYER);
  const [isPlayingMatch, setIsPlayingMatch] = useState(false);
  const [isTransferRequestPending, setIsTransferRequestPending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('strike_glory_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(parsed);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  const saveGame = useCallback((state: GameState) => {
    localStorage.setItem('strike_glory_save', JSON.stringify(state));
  }, []);

  const handleStartNewCareer = () => {
    setIsCreating(true);
    setCreationStep(1);
  };

  const handleFinishCreation = (clubId: string) => {
    const club = STARTING_CLUBS.find(c => c.id === clubId)!;
    const leagueClubs = STARTING_CLUBS.filter(c => c.league === club.league);
    
    const newState: GameState = {
      player: { ...tempPlayer, marketValue: calculateMarketValue(tempPlayer) },
      currentClubId: clubId,
      currentDate: new Date('2024-08-01').toISOString(),
      season: 1,
      history: { seasons: [] },
      inbox: [
        {
          id: 'welcome-' + Date.now(),
          sender: club.name,
          subject: 'Your Pro Journey Begins',
          body: `Welcome ${tempPlayer.name}! You've signed your first professional contract with ${club.name}. The wage is ${formatCurrency(INITIAL_PLAYER.salary)} per week. Prove yourself in the ${club.league}!`,
          date: new Date('2024-08-01').toISOString(),
          isRead: false
        }
      ],
      isMatchDay: false,
      nextMatchCompetition: 'LEAGUE',
      leagueTable: leagueClubs.map(c => ({ clubId: c.id, points: 0, played: 0 })),
      isBenched: false
    };
    setGameState(newState);
    saveGame(newState);
    setIsCreating(false);
  };

  const handleAdvanceDay = () => {
    if (!gameState) return;
    
    const nextDate = advanceDate(gameState.currentDate);
    const day = new Date(nextDate).getDay();
    const isNextMatchDay = day === 6 || day === 3; 

    // Natural recovery
    let newStamina = Math.min(100, gameState.player.currentStamina + 15);
    let newInjury = Math.max(0, gameState.player.injuryDays - 1);

    // Bench logic: Coach benches you if stamina is < 30 or injured
    const shouldBeBenched = newStamina < 30 || newInjury > 0;
    
    let opponentId: string | undefined = undefined;
    let competition: CompetitionType = 'LEAGUE';

    if (isNextMatchDay) {
      const playerClub = STARTING_CLUBS.find(c => c.id === gameState.currentClubId)!;
      const leagueClubs = STARTING_CLUBS.filter(c => c.league === playerClub.league && c.id !== playerClub.id);
      opponentId = leagueClubs[Math.floor(Math.random() * leagueClubs.length)].id;
      
      // Rotate competitions
      const dayOfYear = new Date(nextDate).getTime() / (1000 * 60 * 60 * 24);
      if (Math.floor(dayOfYear) % 10 === 0) competition = 'CONTINENTAL';
      else if (Math.floor(dayOfYear) % 7 === 0) competition = 'CUP';
    }

    // National Team Call-up Logic
    const newInbox = [...gameState.inbox];
    if (gameState.player.ovr > 78 && gameState.player.stats.avgRating > 7.5 && Math.random() < 0.05) {
        newInbox.unshift({
            id: 'intl-' + Date.now(),
            sender: `${gameState.player.nationality} FA`,
            subject: 'National Team Call-up',
            body: `Congratulations ${gameState.player.name}! Your domestic form has earned you a place in the National Team for the upcoming International fixtures.`,
            date: nextDate,
            isRead: false,
            action: 'national'
        });
    }

    const newState: GameState = {
      ...gameState,
      player: { ...gameState.player, currentStamina: newStamina, injuryDays: newInjury },
      currentDate: nextDate,
      isMatchDay: isNextMatchDay,
      nextMatchOpponent: opponentId,
      nextMatchCompetition: competition,
      inbox: newInbox,
      isBenched: shouldBeBenched
    };
    setGameState(newState);
    saveGame(newState);
  };

  const handleTraining = (type: 'LIGHT' | 'INTENSE' | 'TACTICAL') => {
    if (!gameState || gameState.player.currentStamina < 20) return;

    let drain = 0;
    let xp = 0;
    let injuryRisk = 0;

    if (type === 'LIGHT') { drain = 15; xp = 150; injuryRisk = 0.01; }
    if (type === 'INTENSE') { drain = 40; xp = 500; injuryRisk = 0.10; }
    if (type === 'TACTICAL') { drain = 20; xp = 250; injuryRisk = 0.02; }

    const isInjured = Math.random() < injuryRisk;
    const p = gameState.player;
    
    let newXp = p.xp + xp;
    let newLevel = p.level;
    let newOvr = p.ovr;
    let newAttrs = { ...p.attributes };

    if (newXp >= 1000 * p.level) {
        newXp -= 1000 * p.level;
        newLevel += 1;
        newOvr = Math.min(p.potential, p.ovr + 1);
        // Distribute attribute gains
        Object.keys(newAttrs).forEach(k => {
            if (Math.random() > 0.5) (newAttrs as any)[k] = Math.min(99, (newAttrs as any)[k] + 1);
        });
    }

    const newState: GameState = {
        ...gameState,
        player: { 
            ...p, 
            xp: newXp, 
            level: newLevel, 
            ovr: newOvr, 
            attributes: newAttrs,
            currentStamina: p.currentStamina - drain,
            injuryDays: isInjured ? Math.floor(Math.random() * 14) + 7 : p.injuryDays
        }
    };

    if (isInjured) {
        newState.inbox.unshift({
            id: 'injury-' + Date.now(),
            sender: 'Club Doctor',
            subject: 'Injury Report',
            body: `You sustained an injury during ${type} training. You will be out for approximately ${newState.player.injuryDays} days.`,
            date: gameState.currentDate,
            isRead: false
        });
    }

    setGameState(newState);
    saveGame(newState);
  };

  const handleMatchFinish = (result: { goals: number; assists: number; rating: number; win: boolean; score: string }) => {
    if (!gameState) return;

    const p = gameState.player;
    const updatedStats = {
      ...p.stats,
      goals: p.stats.goals + result.goals,
      assists: p.stats.assists + result.assists,
      appearances: p.stats.appearances + 1,
      avgRating: (p.stats.avgRating * p.stats.appearances + result.rating) / (p.stats.appearances + 1)
    };

    // XP and Reputation from Match
    const xpGained = Math.round(result.rating * 150);
    const repGained = result.win ? 1.5 : 0.2;

    const newState: GameState = {
      ...gameState,
      player: { 
          ...p, 
          stats: updatedStats, 
          xp: p.xp + xpGained, 
          reputation: Math.min(100, p.reputation + repGained),
          currentStamina: Math.max(0, p.currentStamina - 45) // Match fatigue
      },
      isMatchDay: false,
      nextMatchOpponent: undefined
    };

    setGameState(newState);
    saveGame(newState);
    setIsPlayingMatch(false);
  };

  const handleAcceptOffer = (messageId: string) => {
    if (!gameState) return;
    const msg = gameState.inbox.find(m => m.id === messageId);
    const targetClub = STARTING_CLUBS.find(c => c.name === msg?.sender);
    if (!targetClub) return;

    // Realism: Negotiate salary based on club budget and player OVR
    const negotiatedSalary = Math.round((targetClub.budget / 1000) * (gameState.player.ovr / 100));

    const newState: GameState = {
        ...gameState,
        currentClubId: targetClub.id,
        player: { ...gameState.player, salary: negotiatedSalary },
        inbox: gameState.inbox.filter(m => m.id !== messageId),
        leagueTable: STARTING_CLUBS.filter(c => c.league === targetClub.league).map(c => ({ clubId: c.id, points: 0, played: 0 }))
    };
    setGameState(newState);
    saveGame(newState);
    setActiveTab('home');
    alert(`Transfer Complete! New Salary: ${formatCurrency(negotiatedSalary)}/week`);
  };

  const currentClub = STARTING_CLUBS.find(c => c.id === gameState?.currentClubId);
  const nextOpponent = STARTING_CLUBS.find(c => c.id === gameState?.nextMatchOpponent);

  if (isPlayingMatch && gameState && nextOpponent) {
    return <MatchEngine player={gameState.player} opponent={nextOpponent.name} onFinish={handleMatchFinish} />;
  }

  if (!gameState && !isCreating) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-8xl font-black italic tracking-tighter text-white mb-4">STRIKE & GLORY</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest mb-10">Realistic Career Simulation</p>
            <button onClick={handleStartNewCareer} className="bg-yellow-500 text-black px-12 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all shadow-2xl">Start New Journey</button>
            {localStorage.getItem('strike_glory_save') && (
                <button onClick={() => window.location.reload()} className="mt-4 text-zinc-500 font-bold hover:text-white transition-colors">Resume Saved Pro</button>
            )}
        </div>
    );
  }

  if (isCreating) {
    return (
        <div className="min-h-screen bg-zinc-950 p-10">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-5xl font-black italic uppercase italic tracking-tighter mb-10">Pro Creator</h2>
                {creationStep === 1 && (
                    <div className="space-y-6 bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
                        <input className="w-full bg-black p-4 rounded-xl border border-zinc-800" placeholder="Player Name" onChange={e => setTempPlayer({...tempPlayer, name: e.target.value})} />
                        <select className="w-full bg-black p-4 rounded-xl border border-zinc-800" onChange={e => setTempPlayer({...tempPlayer, nationality: e.target.value})}>
                            {NATIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <button onClick={() => setCreationStep(2)} className="w-full bg-yellow-500 text-black p-4 rounded-xl font-bold uppercase">Next Step</button>
                    </div>
                )}
                {creationStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold uppercase text-zinc-500">Select Starting Trial</h3>
                            {STARTING_CLUBS.filter(c => c.reputation < 45).map(c => (
                                <button key={c.id} onClick={() => handleFinishCreation(c.id)} className="w-full bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-yellow-500 text-left flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold">{c.name}</div>
                                        <div className="text-xs text-zinc-500 uppercase">{c.league}</div>
                                    </div>
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                        <PlayerCard player={tempPlayer} />
                    </div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row font-sans">
      <nav className="w-full md:w-24 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-8 space-y-8">
        <div className="font-black italic text-2xl tracking-tighter text-yellow-500">S&G</div>
        <div className="flex flex-col space-y-4">
            {[
                { id: 'home', icon: TrendingUp },
                { id: 'squad', icon: User },
                { id: 'training', icon: Activity },
                { id: 'market', icon: Users },
                { id: 'inbox', icon: Mail },
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)}
                    className={`p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-yellow-500 text-black' : 'text-zinc-600 hover:text-white'}`}
                >
                    <item.icon size={24} />
                </button>
            ))}
        </div>
        <button onClick={() => { localStorage.removeItem('strike_glory_save'); window.location.reload(); }} className="mt-auto text-zinc-700 hover:text-red-500"><LogOut size={20} /></button>
      </nav>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    <Calendar size={14} className="mr-2" /> {new Date(gameState!.currentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h1 className="text-5xl font-black italic uppercase italic tracking-tighter">{gameState?.player.name}</h1>
                <div className="flex items-center mt-1 space-x-2">
                    <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">OVR {gameState?.player.ovr}</span>
                    <span className="text-zinc-500 font-bold uppercase text-xs">{currentClub?.name} • {currentClub?.league}</span>
                </div>
            </div>
            <div className="flex space-x-4">
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center min-w-[120px]">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Wage</div>
                    <div className="font-black text-yellow-500">{formatCurrency(gameState!.player.salary)}</div>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center min-w-[120px]">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Stamina</div>
                    <div className={`font-black ${gameState!.player.currentStamina < 30 ? 'text-red-500' : 'text-green-500'}`}>{gameState!.player.currentStamina}%</div>
                </div>
            </div>
        </header>

        {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {gameState?.isMatchDay ? (
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-10 rounded-3xl text-black relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-70">{gameState.nextMatchCompetition} MATCH</h2>
                                <h3 className="text-6xl font-black italic uppercase tracking-tighter mb-6">VS {nextOpponent?.name}</h3>
                                {gameState.isBenched ? (
                                    <div className="flex flex-col space-y-2">
                                        <div className="bg-black/10 p-4 rounded-xl flex items-center space-x-3">
                                            <Info size={24} />
                                            <p className="font-bold">The Coach has decided to rest you. Your stamina is too low.</p>
                                        </div>
                                        <button onClick={handleAdvanceDay} className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-zinc-800 self-start">Skip Match</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsPlayingMatch(true)} className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl hover:scale-105 transition-transform flex items-center space-x-3">
                                        <Play fill="white" />
                                        <span>Start Match</span>
                                    </button>
                                )}
                            </div>
                            <Trophy className="absolute -right-10 -bottom-10 text-black/5" size={300} />
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 border-dashed p-20 rounded-3xl text-center">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest mb-6">No matches scheduled today</p>
                            <button onClick={handleAdvanceDay} className="bg-white text-black px-12 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center space-x-2 mx-auto">
                                <RefreshCw size={20} />
                                <span>Advance Day</span>
                            </button>
                        </div>
                    )}

                    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="font-black italic uppercase tracking-tighter text-xl">Season Standings</h3>
                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{currentClub?.league}</span>
                        </div>
                        <div className="p-4">
                            <table className="w-full text-left">
                                <thead className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                    <tr><th className="p-4">POS</th><th className="p-4">CLUB</th><th className="p-4 text-center">P</th><th className="p-4 text-center">PTS</th></tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {gameState?.leagueTable.sort((a,b) => b.points - a.points).map((row, i) => {
                                        const club = STARTING_CLUBS.find(c => c.id === row.clubId);
                                        return (
                                            <tr key={row.clubId} className={row.clubId === gameState.currentClubId ? 'bg-yellow-500/10' : ''}>
                                                <td className="p-4 font-black">{i+1}</td>
                                                <td className="p-4 font-bold">{club?.name}</td>
                                                <td className="p-4 text-center text-zinc-500">{row.played}</td>
                                                <td className="p-4 text-center font-black text-yellow-500">{row.points}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <PlayerCard player={gameState!.player} clubName={currentClub?.name} />
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Level</div>
                                <div className="text-4xl font-black italic text-yellow-500">{gameState?.player.level}</div>
                            </div>
                        </div>
                        <ProgressBar value={gameState!.player.xp} max={1000 * gameState!.player.level} color="bg-yellow-500" size="lg" />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'training' && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { type: 'LIGHT', icon: Heart, desc: 'Low fatigue, low risk, minor gains', drain: 15, risk: '1%' },
                    { type: 'INTENSE', icon: Zap, desc: 'High fatigue, high risk, massive gains', drain: 40, risk: '10%' },
                    { type: 'TACTICAL', icon: Target, desc: 'Moderate fatigue, focus on awareness', drain: 20, risk: '2%' }
                ].map(session => (
                    <div key={session.type} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center">
                        <session.icon size={48} className="text-yellow-500 mb-6" />
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{session.type}</h3>
                        <p className="text-zinc-500 text-sm mb-8">{session.desc}</p>
                        <div className="w-full grid grid-cols-2 gap-4 mb-8 text-[10px] font-bold uppercase tracking-widest">
                            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                                <div className="text-zinc-500">Stamina</div>
                                <div className="text-red-500">-{session.drain}%</div>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800">
                                <div className="text-zinc-500">Injury Risk</div>
                                <div className="text-yellow-500">{session.risk}</div>
                            </div>
                        </div>
                        <button 
                            disabled={gameState!.player.currentStamina < session.drain || gameState!.player.injuryDays > 0}
                            onClick={() => handleTraining(session.type as any)}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-tighter disabled:opacity-20"
                        >
                            Start Session
                        </button>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'inbox' && (
            <div className="max-w-4xl mx-auto space-y-4">
                {selectedMessage ? (
                    <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                        <button onClick={() => setSelectedMessage(null)} className="text-zinc-500 font-bold uppercase text-xs mb-8 flex items-center hover:text-white"><ChevronRight className="rotate-180 mr-1" /> Back to Inbox</button>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedMessage.subject}</h2>
                        </div>
                        <div className="text-yellow-500 font-bold uppercase text-xs tracking-widest mb-10">{selectedMessage.sender}</div>
                        <p className="text-zinc-300 leading-relaxed text-lg mb-10">{selectedMessage.body}</p>
                        {selectedMessage.action === 'contract' && (
                            <button onClick={() => handleAcceptOffer(selectedMessage.id)} className="bg-yellow-500 text-black px-12 py-4 rounded-xl font-black uppercase italic tracking-tighter shadow-xl">Accept Contract Offer</button>
                        )}
                    </div>
                ) : (
                    gameState!.inbox.map(msg => (
                        <button 
                            key={msg.id} 
                            onClick={() => {
                                setSelectedMessage(msg);
                                setGameState({ ...gameState!, inbox: gameState!.inbox.map(m => m.id === msg.id ? {...m, isRead: true} : m)});
                            }}
                            className={`w-full p-6 rounded-2xl border text-left flex justify-between items-center group transition-all ${msg.isRead ? 'bg-zinc-950 border-zinc-900 opacity-60' : 'bg-zinc-900 border-zinc-800 border-l-4 border-l-yellow-500 shadow-xl'}`}
                        >
                            <div>
                                <div className="text-xs text-zinc-500 font-bold uppercase mb-1">{msg.sender}</div>
                                <div className="font-bold text-lg">{msg.subject}</div>
                            </div>
                            <ChevronRight className="text-zinc-800 group-hover:text-yellow-500 transition-colors" />
                        </button>
                    ))
                )}
            </div>
        )}

        {activeTab === 'squad' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                <div className="space-y-8">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Attributes</h3>
                    <div className="space-y-6">
                        {Object.entries(gameState!.player.attributes).map(([key, val]) => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{key}</span>
                                    <span className="font-black text-xl italic">{val}</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${val}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 h-fit">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Career Stats</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Apps</div><div className="text-3xl font-black">{gameState?.player.stats.appearances}</div></div>
                        <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Goals</div><div className="text-3xl font-black text-yellow-500">{gameState?.player.stats.goals}</div></div>
                        <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Assists</div><div className="text-3xl font-black text-blue-400">{gameState?.player.stats.assists}</div></div>
                        <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Avg Rating</div><div className="text-3xl font-black text-green-500">{gameState?.player.stats.avgRating.toFixed(2)}</div></div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
