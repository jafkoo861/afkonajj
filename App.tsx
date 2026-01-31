
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Player, Position, PlayStyle, Message, Club, CompetitionType, LeagueTableRow } from './types';
import { STARTING_CLUBS, NATIONS, ALL_POSITIONS } from './constants';
import { PlayerCard } from './components/PlayerCard';
import { ProgressBar } from './components/UI/Progress';
import { MatchEngine } from './components/Match/MatchEngine';
import { formatCurrency, advanceDate, calculateMarketValue } from './utils/gameLogic';
import { 
  Trophy, User, Users, Mail, TrendingUp, Calendar, 
  Play, LogOut, ChevronRight, Bell,
  Target, Zap, RefreshCw, Activity, Heart, Info, DollarSign, Trash2
} from 'lucide-react';

const INITIAL_PLAYER: Player = {
  name: 'Young Prospect',
  age: 17,
  nationality: 'Bosnia and Herzegovina',
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
  stats: { goals: 0, assists: 0, appearances: 0, cleanSheets: 0, avgRating: 0 },
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

  useEffect(() => {
    const saved = localStorage.getItem('strike_glory_v3_save');
    if (saved) {
      try { setGameState(JSON.parse(saved)); } catch (e) { console.error("Load failed", e); }
    }
  }, []);

  const saveGame = useCallback((state: GameState) => {
    localStorage.setItem('strike_glory_v3_save', JSON.stringify(state));
  }, []);

  const handleStartNewCareer = () => {
    setIsCreating(true);
    setCreationStep(1);
    setTempPlayer(INITIAL_PLAYER);
  };

  const handleDeleteCareer = () => {
    if (window.confirm("Are you sure you want to delete this career? All progress will be lost forever.")) {
      localStorage.removeItem('strike_glory_v3_save');
      setGameState(null);
      setActiveTab('home');
    }
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
      inbox: [{
        id: 'msg-1', sender: club.name, subject: 'Welcome Pro!', 
        body: `Welcome ${tempPlayer.name}! You have signed your first pro contract at ${club.name}. Training starts tomorrow. Prove your worth in the ${club.league}!`,
        date: new Date('2024-08-01').toISOString(), isRead: false
      }],
      isMatchDay: false,
      nextMatchCompetition: 'LEAGUE',
      leagueTable: leagueClubs.map(c => ({ clubId: c.id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 })),
      isBenched: false,
      isIntlCallup: false
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

    let newStamina = Math.min(100, gameState.player.currentStamina + 25);
    let newInjury = Math.max(0, gameState.player.injuryDays - 1);
    const shouldBeBenched = newStamina < 30 || newInjury > 0;
    
    let opponentId: string | undefined = undefined;
    let competition: CompetitionType = 'LEAGUE';
    let newLeagueTable = [...gameState.leagueTable];

    if (isNextMatchDay) {
      const playerClub = STARTING_CLUBS.find(c => c.id === gameState.currentClubId)!;
      const leagueClubs = STARTING_CLUBS.filter(c => c.league === playerClub.league && c.id !== playerClub.id);
      opponentId = leagueClubs[Math.floor(Math.random() * leagueClubs.length)].id;
      
      const dayHash = new Date(nextDate).getDate();
      if (dayHash % 7 === 0) competition = 'CUP';
      else if (dayHash % 10 === 0) competition = 'CONTINENTAL';

      newLeagueTable = newLeagueTable.map(row => {
        if (row.clubId === gameState.currentClubId || row.clubId === opponentId) return row;
        
        const club = STARTING_CLUBS.find(c => c.id === row.clubId)!;
        const winProb = club.reputation / 150;
        const drawProb = 0.25;
        const roll = Math.random();
        
        if (roll < winProb) return { ...row, played: row.played + 1, points: row.points + 3, won: row.won + 1, goalsFor: row.goalsFor + Math.floor(Math.random()*3+1) };
        if (roll < winProb + drawProb) return { ...row, played: row.played + 1, points: row.points + 1, drawn: row.drawn + 1, goalsFor: row.goalsFor + 1, goalsAgainst: row.goalsAgainst + 1 };
        return { ...row, played: row.played + 1, lost: row.lost + 1, goalsAgainst: row.goalsAgainst + Math.floor(Math.random()*3+1) };
      });
    }

    const newInbox = [...gameState.inbox];
    if (gameState.player.ovr > 75 && gameState.player.stats.avgRating > 7.2 && Math.random() < 0.05) {
      newInbox.unshift({
        id: 'intl-' + Date.now(), sender: `${gameState.player.nationality} FA`,
        subject: 'National Team Call-up', body: `Congratulations! You have been selected for the ${gameState.player.nationality} National Team. This is a massive milestone in your career!`,
        date: nextDate, isRead: false, action: 'national'
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
      isBenched: shouldBeBenched,
      leagueTable: newLeagueTable
    };
    setGameState(newState);
    saveGame(newState);
  };

  const handleTraining = (type: 'LIGHT' | 'INTENSE') => {
    if (!gameState || gameState.player.currentStamina < 30) return;
    const p = gameState.player;
    const drain = type === 'LIGHT' ? 15 : 40;
    const gain = type === 'LIGHT' ? 250 : 750; // Increased XP for faster progress
    const risk = type === 'INTENSE' ? 0.05 : 0.005; // Reduced risk

    let newXp = p.xp + gain;
    let newLevel = p.level;
    let newOvr = p.ovr;
    let newAttrs = { ...p.attributes };

    if (newXp >= 1000 * p.level) {
      newXp -= 1000 * p.level;
      newLevel += 1;
      newOvr = Math.min(p.potential, p.ovr + 1);
      Object.keys(newAttrs).forEach(k => { 
        if (Math.random() > 0.3) {
          (newAttrs as any)[k] = Math.min(99, (newAttrs as any)[k] + 1);
        }
      });
    }

    const isInjured = Math.random() < risk;
    const nextState = {
      ...gameState,
      player: { 
        ...p, 
        xp: newXp, 
        level: newLevel, 
        ovr: newOvr, 
        attributes: newAttrs, 
        currentStamina: p.currentStamina - drain, 
        injuryDays: isInjured ? 7 : p.injuryDays 
      }
    };
    setGameState(nextState);
    saveGame(nextState);
    if (isInjured) alert("You sustained a training injury. Out for a week!");
  };

  const handleMatchFinish = (result: { goals: number; assists: number; rating: number; win: boolean; score: string }) => {
    if (!gameState) return;
    const [h, a] = result.score.split('-').map(Number);
    
    const newLeagueTable = gameState.leagueTable.map(row => {
      if (row.clubId === gameState.currentClubId) {
        return {
          ...row, played: row.played + 1, points: row.points + (h > a ? 3 : h === a ? 1 : 0),
          won: row.won + (h > a ? 1 : 0), drawn: row.drawn + (h === a ? 1 : 0), lost: row.lost + (h < a ? 1 : 0),
          goalsFor: row.goalsFor + h, goalsAgainst: row.goalsAgainst + a
        };
      }
      if (row.clubId === gameState.nextMatchOpponent) {
        return {
          ...row, played: row.played + 1, points: row.points + (a > h ? 3 : h === a ? 1 : 0),
          won: row.won + (a > h ? 1 : 0), drawn: row.drawn + (h === a ? 1 : 0), lost: row.lost + (a < h ? 1 : 0),
          goalsFor: row.goalsFor + a, goalsAgainst: row.goalsAgainst + h
        };
      }
      return row;
    });

    const updatedPlayer = {
      ...gameState.player,
      stats: {
        ...gameState.player.stats,
        goals: gameState.player.stats.goals + result.goals,
        assists: gameState.player.stats.assists + result.assists,
        appearances: gameState.player.stats.appearances + 1,
        avgRating: (gameState.player.stats.avgRating * gameState.player.stats.appearances + result.rating) / (gameState.player.stats.appearances + 1)
      },
      currentStamina: Math.max(0, gameState.player.currentStamina - 45)
    };

    const nextState = { ...gameState, player: updatedPlayer, leagueTable: newLeagueTable, isMatchDay: false, nextMatchOpponent: undefined };
    setGameState(nextState);
    saveGame(nextState);
    setIsPlayingMatch(false);
  };

  const handleRequestTransfer = () => {
    setIsTransferRequestPending(true);
    setTimeout(() => {
      const p = gameState!.player;
      const clubs = STARTING_CLUBS.filter(c => c.id !== gameState!.currentClubId && c.reputation <= p.reputation + 25);
      const offerClub = clubs[Math.floor(Math.random() * clubs.length)];
      
      const newInbox = [...gameState!.inbox];
      newInbox.unshift({
        id: 'off-' + Date.now(), sender: offerClub.name, subject: 'Contract Offer',
        body: `We are impressed by your progress. Join ${offerClub.name} in the ${offerClub.league}. We'll pay you ${formatCurrency(Math.round(offerClub.budget/4000))} per week.`,
        date: gameState!.currentDate, isRead: false, action: 'contract'
      });
      const nextState = { ...gameState!, inbox: newInbox };
      setGameState(nextState);
      saveGame(nextState);
      setIsTransferRequestPending(false);
    }, 1200);
  };

  const handleAcceptOffer = (msgId: string) => {
    const msg = gameState!.inbox.find(m => m.id === msgId);
    const club = STARTING_CLUBS.find(c => c.name === msg?.sender)!;
    const leagueClubs = STARTING_CLUBS.filter(c => c.league === club.league);
    
    const nextState = {
      ...gameState!,
      currentClubId: club.id,
      player: { ...gameState!.player, salary: Math.round(club.budget/4000) },
      leagueTable: leagueClubs.map(c => ({ clubId: c.id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 })),
      inbox: gameState!.inbox.filter(m => m.id !== msgId)
    };
    setGameState(nextState);
    saveGame(nextState);
    setActiveTab('home');
    alert(`Transfer Confirmed to ${club.name}!`);
  };

  const currentClub = STARTING_CLUBS.find(c => c.id === gameState?.currentClubId);
  const nextOpponent = STARTING_CLUBS.find(c => c.id === gameState?.nextMatchOpponent);

  if (isPlayingMatch && gameState && nextOpponent) {
    return <MatchEngine player={gameState.player} opponent={nextOpponent.name} onFinish={handleMatchFinish} />;
  }

  if (!gameState && !isCreating) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
        <h1 className="text-9xl font-black italic tracking-tighter text-white mb-4 uppercase drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">STRIKE & GLORY</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] mb-12">LEGENDARY FOOTBALLER SIMULATOR</p>
        <button onClick={handleStartNewCareer} className="bg-yellow-500 text-black px-16 py-6 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(234,179,8,0.2)]">Create Your Legacy</button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-zinc-950 p-10 flex flex-col items-center">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-10 text-white">PLAYER SETUP</h2>
        {creationStep === 1 ? (
          <div className="bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 w-full max-w-xl space-y-6 shadow-2xl">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase mb-2 block ml-1">Player Name</label>
              <input className="w-full bg-black p-5 rounded-2xl border border-zinc-800 focus:border-yellow-500 transition-colors" placeholder="e.g. Edin Džeko" onChange={e => setTempPlayer({...tempPlayer, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase mb-2 block ml-1">Nationality</label>
              <select className="w-full bg-black p-5 rounded-2xl border border-zinc-800 focus:border-yellow-500 transition-colors" onChange={e => setTempPlayer({...tempPlayer, nationality: e.target.value})} value={tempPlayer.nationality}>
                {NATIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={() => setCreationStep(2)} className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase tracking-tighter hover:bg-yellow-400 transition-colors">Continue to Trials</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 scroll-smooth">
              <h3 className="font-black text-zinc-500 uppercase tracking-widest text-sm mb-4">AVAILABLE TRIALS</h3>
              {STARTING_CLUBS.filter(c => c.reputation < 45).map(c => (
                <button key={c.id} onClick={() => handleFinishCreation(c.id)} className="w-full bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 hover:border-yellow-500 text-left flex justify-between items-center group transition-all">
                  <div>
                    <div className="font-black text-xl italic uppercase tracking-tighter">{c.name}</div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{c.league}</div>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-transform text-zinc-800 group-hover:text-yellow-500" />
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <PlayerCard player={tempPlayer} size="lg" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row">
      <nav className="w-full md:w-28 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-10 space-y-10">
        <div className="font-black italic text-4xl tracking-tighter text-yellow-500 mb-4 select-none">S&G</div>
        <div className="flex flex-col space-y-6 flex-1">
          {[
            { id: 'home', icon: TrendingUp }, 
            { id: 'squad', icon: User }, 
            { id: 'training', icon: Activity }, 
            { id: 'market', icon: DollarSign }, 
            { id: 'inbox', icon: Mail }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`p-5 rounded-3xl transition-all ${activeTab === item.id ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}
            >
              <item.icon size={28} />
            </button>
          ))}
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={handleDeleteCareer}
            className="p-5 rounded-3xl text-zinc-800 hover:text-red-500 hover:bg-red-500/10 transition-all group"
            title="Delete Career"
          >
            <Trash2 size={24} />
          </button>
          <button 
            onClick={() => { if (window.confirm("Exit to main menu?")) setGameState(null); }}
            className="p-5 rounded-3xl text-zinc-800 hover:text-white transition-all"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      <main className="flex-1 p-10 overflow-y-auto scroll-smooth">
        <header className="flex justify-between items-start mb-12">
          <div>
            <div className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] flex items-center mb-2">
              <Calendar size={14} className="mr-2 text-yellow-500"/> {new Date(gameState!.currentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">{gameState?.player.name}</h1>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{currentClub?.name}</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{currentClub?.league}</span>
            </div>
          </div>
          
          <div className="flex space-x-6">
            <div className="bg-zinc-900/50 backdrop-blur p-6 rounded-3xl border border-zinc-800 text-center min-w-[140px] shadow-xl">
              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Weekly Wage</div>
              <div className="font-black text-2xl text-yellow-500 tracking-tighter">{formatCurrency(gameState!.player.salary)}</div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur p-6 rounded-3xl border border-zinc-800 text-center min-w-[140px] shadow-xl">
              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Stamina</div>
              <div className={`font-black text-2xl tracking-tighter ${gameState!.player.currentStamina < 30 ? 'text-red-500' : 'text-green-500'}`}>{Math.round(gameState!.player.currentStamina)}%</div>
            </div>
          </div>
        </header>

        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-6 duration-700">
            <div className="lg:col-span-2 space-y-8">
              {gameState?.isMatchDay ? (
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-12 rounded-[3rem] text-black relative overflow-hidden shadow-[0_30px_60px_rgba(234,179,8,0.2)]">
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{gameState.nextMatchCompetition}</span>
                      <span className="text-xs font-black uppercase opacity-60">Match Day</span>
                    </div>
                    <h3 className="text-7xl font-black italic uppercase mb-8 tracking-tighter leading-none">VS {nextOpponent?.name}</h3>
                    
                    {gameState.isBenched ? (
                      <div className="bg-black/10 p-6 rounded-3xl flex items-center space-x-4 mb-6 border border-black/10">
                        <Info size={32} /> 
                        <div>
                          <p className="font-black uppercase text-sm">Squad Rotation</p>
                          <p className="text-xs opacity-70 font-bold uppercase">The gaffer is resting you due to low stamina or injury.</p>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setIsPlayingMatch(true)} className="bg-black text-white px-14 py-6 rounded-[2rem] font-black uppercase italic tracking-tighter text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center group">
                        <Play fill="white" className="mr-3 group-hover:scale-110 transition-transform" />
                        KICK OFF
                      </button>
                    )}
                    {gameState.isBenched && (
                      <button onClick={handleAdvanceDay} className="bg-black/20 text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black/30 transition-all">
                        Simulate Match
                      </button>
                    )}
                  </div>
                  <Trophy size={400} className="absolute -right-20 -bottom-20 text-black/5 rotate-12" />
                </div>
              ) : (
                <div className="bg-zinc-900 border-2 border-zinc-800 border-dashed p-24 rounded-[3rem] text-center group hover:border-zinc-700 transition-colors">
                  <RefreshCw size={48} className="mx-auto text-zinc-800 mb-6 group-hover:rotate-180 transition-transform duration-700" />
                  <p className="text-zinc-500 font-black uppercase tracking-[0.4em] mb-10 text-sm italic">Focusing on recovery</p>
                  <button onClick={handleAdvanceDay} className="bg-white text-black px-16 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-xl">
                    Next Day
                  </button>
                </div>
              )}

              <div className="bg-zinc-900/30 rounded-[3rem] border border-zinc-800/50 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="font-black italic uppercase tracking-tighter text-2xl">League Standings</h3> 
                  <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest px-4 py-1 bg-yellow-500/10 rounded-full">{currentClub?.league}</span>
                </div>
                <div className="p-6">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-4">Pos</th>
                        <th className="p-4">Club</th>
                        <th className="p-4 text-center">P</th>
                        <th className="p-4 text-center">W</th>
                        <th className="p-4 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {gameState?.leagueTable.sort((a,b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)).map((row, i) => { 
                        const club = STARTING_CLUBS.find(c => c.id === row.clubId); 
                        return (
                          <tr key={row.clubId} className={`transition-colors ${row.clubId === gameState.currentClubId ? 'bg-yellow-500/5' : 'hover:bg-zinc-900/50'}`}>
                            <td className="p-5 font-black text-lg italic">{i+1}</td>
                            <td className="p-5">
                              <div className="font-bold text-lg uppercase tracking-tight">{club?.name}</div>
                            </td>
                            <td className="p-5 text-center text-zinc-500 font-bold">{row.played}</td>
                            <td className="p-5 text-center text-zinc-500 font-bold">{row.won}</td>
                            <td className="p-5 text-center font-black text-xl text-yellow-500">{row.points}</td>
                          </tr>
                        ); 
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <PlayerCard player={gameState!.player} clubName={currentClub?.name} />
              <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Career Level</div>
                    <div className="text-5xl font-black italic text-yellow-500 tracking-tighter">{gameState?.player.level}</div>
                  </div>
                </div>
                <ProgressBar value={gameState!.player.xp} max={1000 * gameState!.player.level} color="bg-yellow-500" size="lg" />
                <div className="text-[9px] text-zinc-500 font-bold uppercase text-right mt-2 tracking-widest">
                  {Math.round(gameState!.player.xp)} / {1000 * gameState!.player.level} XP TO LEVEL UP
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-6 duration-700">
            <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-zinc-800 text-center flex flex-col items-center hover:bg-zinc-900/60 transition-all shadow-xl">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
                <Heart size={48} className="text-green-500" />
              </div>
              <h3 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Light Training</h3>
              <p className="text-zinc-500 text-sm mb-10 max-w-xs uppercase font-bold tracking-wider leading-relaxed">Minor skill improvements. Best for maintaining fitness and sharpness.</p>
              <div className="grid grid-cols-2 gap-4 w-full mb-10">
                <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-[9px] font-black uppercase text-zinc-500 mb-1">Stamina Drain</div>
                  <div className="font-black text-red-500">-15%</div>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-[9px] font-black uppercase text-zinc-500 mb-1">XP Gain</div>
                  <div className="font-black text-green-500">+250</div>
                </div>
              </div>
              <button 
                disabled={gameState!.player.currentStamina < 30} 
                onClick={() => handleTraining('LIGHT')} 
                className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase italic tracking-tighter text-lg disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Start Drill
              </button>
            </div>

            <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-zinc-800 text-center flex flex-col items-center hover:bg-zinc-900/60 transition-all shadow-xl">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-8">
                <Zap size={48} className="text-yellow-500" />
              </div>
              <h3 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Intense Session</h3>
              <p className="text-zinc-500 text-sm mb-10 max-w-xs uppercase font-bold tracking-wider leading-relaxed">Push your limits. Rapid growth but high risk of exhaustion.</p>
              <div className="grid grid-cols-2 gap-4 w-full mb-10">
                <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-[9px] font-black uppercase text-zinc-500 mb-1">Stamina Drain</div>
                  <div className="font-black text-red-500">-40%</div>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-[9px] font-black uppercase text-zinc-500 mb-1">XP Gain</div>
                  <div className="font-black text-yellow-500">+750</div>
                </div>
              </div>
              <button 
                disabled={gameState!.player.currentStamina < 50} 
                onClick={() => handleTraining('INTENSE')} 
                className="w-full bg-yellow-500 text-black py-6 rounded-2xl font-black uppercase italic tracking-tighter text-lg disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                Go Full Throttle
              </button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="max-w-4xl mx-auto text-center py-20 animate-in fade-in zoom-in duration-700">
            <div className="relative mb-12 inline-block">
               <Users size={120} className="mx-auto text-zinc-900" />
               <DollarSign size={48} className="absolute bottom-0 right-0 text-yellow-500 animate-pulse" />
            </div>
            <h3 className="text-5xl font-black italic mb-6 uppercase tracking-tighter">Transfer Hub</h3>
            <p className="text-zinc-500 mb-10 max-w-md mx-auto font-bold uppercase tracking-wider text-sm leading-relaxed">
              Your reputation is <span className="text-yellow-500 font-black">{Math.round(gameState!.player.reputation)}</span>. 
              Higher reputation attracts world-class clubs from Europe's top leagues.
            </p>
            <button 
              disabled={isTransferRequestPending} 
              onClick={handleRequestTransfer} 
              className="bg-white text-black px-16 py-6 rounded-[2rem] font-black uppercase italic tracking-tighter text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.05)] disabled:opacity-50"
            >
              {isTransferRequestPending ? 'Negotiating with Agents...' : 'Request Transfer'}
            </button>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-6 duration-700">
            {selectedMessage ? (
              <div className="bg-zinc-900 p-12 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-300">
                <button onClick={() => setSelectedMessage(null)} className="text-zinc-500 text-xs font-black uppercase mb-10 hover:text-white transition-colors tracking-widest">← Back to Messages</button>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">{selectedMessage.subject}</h2>
                  <span className="text-[10px] text-zinc-600 font-black">{new Date(selectedMessage.date).toLocaleDateString()}</span>
                </div>
                <div className="text-yellow-500 font-black uppercase text-xs tracking-[0.3em] mb-10">{selectedMessage.sender}</div>
                <p className="text-zinc-400 mb-14 leading-relaxed text-lg font-medium">{selectedMessage.body}</p>
                {selectedMessage.action === 'contract' && (
                  <button onClick={() => handleAcceptOffer(selectedMessage.id)} className="bg-yellow-500 text-black px-14 py-5 rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-2xl hover:bg-yellow-400 transition-colors">
                    Accept Contract Offer
                  </button>
                )}
              </div>
            ) : (
              gameState!.inbox.length === 0 ? (
                <div className="text-center py-20 text-zinc-800 italic font-black text-2xl uppercase">No new messages</div>
              ) : (
                gameState!.inbox.map(msg => (
                  <button 
                    key={msg.id} 
                    onClick={() => { 
                      setSelectedMessage(msg); 
                      const nextInbox = gameState!.inbox.map(m => m.id === msg.id ? {...m, isRead: true} : m);
                      setGameState({...gameState!, inbox: nextInbox}); 
                      saveGame({...gameState!, inbox: nextInbox});
                    }} 
                    className={`w-full p-8 rounded-[2rem] border-2 text-left flex justify-between items-center group transition-all ${msg.isRead ? 'bg-zinc-950/50 border-zinc-900 opacity-60' : 'bg-zinc-900 border-zinc-800 border-l-[12px] border-l-yellow-500 shadow-2xl hover:scale-[1.01]'}`}
                  >
                    <div>
                      <div className="text-[10px] text-zinc-500 font-black uppercase mb-1 tracking-widest">{msg.sender}</div>
                      <div className="font-black text-xl italic uppercase tracking-tighter text-white group-hover:text-yellow-500 transition-colors">{msg.subject}</div>
                    </div>
                    <ChevronRight className="text-zinc-800 group-hover:text-yellow-500 transition-all" />
                  </button>
                ))
              )
            )}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto animate-in slide-in-from-left-6 duration-700">
            <div className="space-y-10">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">Player Attributes</h3>
              <div className="space-y-8">
                {Object.entries(gameState!.player.attributes).map(([key, val]) => (
                  <div key={key} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">{key}</span>
                      <span className="font-black italic text-2xl text-white group-hover:text-yellow-500 transition-all">{val}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-1000 group-hover:bg-yellow-500" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-zinc-900/40 p-12 rounded-[3.5rem] border border-zinc-800 h-fit shadow-2xl">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-10 text-white">Career Statistics</h3>
                <div className="grid grid-cols-2 gap-10">
                  <div className="bg-black/20 p-6 rounded-3xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Appearances</div>
                    <div className="text-5xl font-black italic tracking-tighter">{gameState?.player.stats.appearances}</div>
                  </div>
                  <div className="bg-black/20 p-6 rounded-3xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Total Goals</div>
                    <div className="text-5xl font-black italic text-yellow-500 tracking-tighter">{gameState?.player.stats.goals}</div>
                  </div>
                  <div className="bg-black/20 p-6 rounded-3xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Avg Rating</div>
                    <div className="text-5xl font-black italic text-green-500 tracking-tighter">{gameState?.player.stats.avgRating.toFixed(2)}</div>
                  </div>
                  <div className="bg-black/20 p-6 rounded-3xl border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Assists</div>
                    <div className="text-5xl font-black italic text-blue-400 tracking-tighter">{gameState?.player.stats.assists}</div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 text-center">
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4 italic">Pro Value</p>
                 <div className="text-4xl font-black italic uppercase tracking-tighter text-white">{formatCurrency(gameState!.player.marketValue)}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
