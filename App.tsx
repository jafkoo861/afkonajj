
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
  Target, Zap, RefreshCw, Activity, Heart, Info, DollarSign
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
        id: 'msg-1', sender: club.name, subject: 'Welcome!', 
        body: `Welcome ${tempPlayer.name}! Prove your worth at ${club.name}.`,
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

  // ADVANCE DAY WITH STANDINGS SIMULATION
  const handleAdvanceDay = () => {
    if (!gameState) return;
    
    const nextDate = advanceDate(gameState.currentDate);
    const day = new Date(nextDate).getDay();
    const isNextMatchDay = day === 6 || day === 3; 

    let newStamina = Math.min(100, gameState.player.currentStamina + 20);
    let newInjury = Math.max(0, gameState.player.injuryDays - 1);
    const shouldBeBenched = newStamina < 30 || newInjury > 0;
    
    let opponentId: string | undefined = undefined;
    let competition: CompetitionType = 'LEAGUE';
    let newLeagueTable = [...gameState.leagueTable];

    if (isNextMatchDay) {
      const playerClub = STARTING_CLUBS.find(c => c.id === gameState.currentClubId)!;
      const leagueClubs = STARTING_CLUBS.filter(c => c.league === playerClub.league && c.id !== playerClub.id);
      opponentId = leagueClubs[Math.floor(Math.random() * leagueClubs.length)].id;
      
      // Rotate Competitions
      const dayHash = new Date(nextDate).getDate();
      if (dayHash % 7 === 0) competition = 'CUP';
      else if (dayHash % 10 === 0) competition = 'CONTINENTAL';

      // SIMULATE OTHER LEAGUE MATCHES
      newLeagueTable = newLeagueTable.map(row => {
        // Don't simulate player match here, it's done in handleMatchFinish
        if (row.clubId === gameState.currentClubId || row.clubId === opponentId) return row;
        
        const club = STARTING_CLUBS.find(c => c.id === row.clubId)!;
        const winProb = club.reputation / 150;
        const drawProb = 0.25;
        const roll = Math.random();
        
        if (roll < winProb) return { ...row, played: row.played + 1, points: row.points + 3, won: row.won + 1, goalsFor: row.goalsFor + 2 };
        if (roll < winProb + drawProb) return { ...row, played: row.played + 1, points: row.points + 1, drawn: row.drawn + 1, goalsFor: row.goalsFor + 1, goalsAgainst: row.goalsAgainst + 1 };
        return { ...row, played: row.played + 1, lost: row.lost + 1, goalsAgainst: row.goalsAgainst + 2 };
      });
    }

    // National Team Check
    const newInbox = [...gameState.inbox];
    if (gameState.player.ovr > 75 && gameState.player.stats.avgRating > 7.2 && Math.random() < 0.05) {
      newInbox.unshift({
        id: 'intl-' + Date.now(), sender: `${gameState.player.nationality} FA`,
        subject: 'National Team Call-up', body: 'You are invited to the National Team!',
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
    const gain = type === 'LIGHT' ? 150 : 500;
    const risk = type === 'INTENSE' ? 0.08 : 0.01;

    let newXp = p.xp + gain;
    let newLevel = p.level;
    let newOvr = p.ovr;
    let newAttrs = { ...p.attributes };

    if (newXp >= 1000 * p.level) {
      newXp -= 1000 * p.level;
      newLevel += 1;
      newOvr = Math.min(p.potential, p.ovr + 1);
      Object.keys(newAttrs).forEach(k => { if (Math.random() > 0.4) (newAttrs as any)[k] += 1; });
    }

    const isInjured = Math.random() < risk;
    setGameState({
      ...gameState,
      player: { ...p, xp: newXp, level: newLevel, ovr: newOvr, attributes: newAttrs, currentStamina: p.currentStamina - drain, injuryDays: isInjured ? 10 : p.injuryDays }
    });
    if (isInjured) alert("You got injured in training!");
  };

  const handleMatchFinish = (result: { goals: number; assists: number; rating: number; win: boolean; score: string }) => {
    if (!gameState) return;
    const [h, a] = result.score.split('-').map(Number);
    
    // Update League Table for Player Match
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
      currentStamina: Math.max(0, gameState.player.currentStamina - 40)
    };

    setGameState({ ...gameState, player: updatedPlayer, leagueTable: newLeagueTable, isMatchDay: false, nextMatchOpponent: undefined });
    saveGame({ ...gameState, player: updatedPlayer, leagueTable: newLeagueTable, isMatchDay: false });
    setIsPlayingMatch(false);
  };

  const handleRequestTransfer = () => {
    setIsTransferRequestPending(true);
    setTimeout(() => {
      const p = gameState!.player;
      const clubs = STARTING_CLUBS.filter(c => c.id !== gameState!.currentClubId && c.reputation <= p.reputation + 20);
      const offerClub = clubs[Math.floor(Math.random() * clubs.length)];
      
      const newInbox = [...gameState!.inbox];
      newInbox.unshift({
        id: 'off-' + Date.now(), sender: offerClub.name, subject: 'Contract Offer',
        body: `We want you at ${offerClub.name}. Wage: ${formatCurrency(Math.round(offerClub.budget/5000))} / week.`,
        date: gameState!.currentDate, isRead: false, action: 'contract'
      });
      setGameState({ ...gameState!, inbox: newInbox });
      setIsTransferRequestPending(false);
    }, 1500);
  };

  const handleAcceptOffer = (msgId: string) => {
    const msg = gameState!.inbox.find(m => m.id === msgId);
    const club = STARTING_CLUBS.find(c => c.name === msg?.sender)!;
    const leagueClubs = STARTING_CLUBS.filter(c => c.league === club.league);
    
    setGameState({
      ...gameState!,
      currentClubId: club.id,
      player: { ...gameState!.player, salary: Math.round(club.budget/5000) },
      leagueTable: leagueClubs.map(c => ({ clubId: c.id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 })),
      inbox: gameState!.inbox.filter(m => m.id !== msgId)
    });
    setActiveTab('home');
  };

  const currentClub = STARTING_CLUBS.find(c => c.id === gameState?.currentClubId);
  const nextOpponent = STARTING_CLUBS.find(c => c.id === gameState?.nextMatchOpponent);

  if (isPlayingMatch && gameState && nextOpponent) {
    return <MatchEngine player={gameState.player} opponent={nextOpponent.name} onFinish={handleMatchFinish} />;
  }

  if (!gameState && !isCreating) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-8xl font-black italic tracking-tighter text-white mb-4 uppercase">STRIKE & GLORY</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest mb-10">THE PRO FOOTBALLER JOURNEY</p>
        <button onClick={handleStartNewCareer} className="bg-yellow-500 text-black px-12 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all shadow-2xl">Start Career</button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-zinc-950 p-10 flex flex-col items-center">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10">PRO CREATOR</h2>
        {creationStep === 1 ? (
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 w-full max-w-xl space-y-6">
            <input className="w-full bg-black p-4 rounded-xl border border-zinc-800" placeholder="Name" onChange={e => setTempPlayer({...tempPlayer, name: e.target.value})} />
            <select className="w-full bg-black p-4 rounded-xl border border-zinc-800" onChange={e => setTempPlayer({...tempPlayer, nationality: e.target.value})}>
              {NATIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setCreationStep(2)} className="w-full bg-yellow-500 text-black p-4 rounded-xl font-bold uppercase">Next</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              <h3 className="font-bold text-zinc-500 uppercase">Select Trial Club</h3>
              {STARTING_CLUBS.filter(c => c.reputation < 45).map(c => (
                <button key={c.id} onClick={() => handleFinishCreation(c.id)} className="w-full bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-yellow-500 text-left flex justify-between items-center group">
                  <div><div className="font-bold">{c.name}</div><div className="text-xs text-zinc-500 uppercase">{c.league}</div></div>
                  <ChevronRight />
                </button>
              ))}
            </div>
            <PlayerCard player={tempPlayer} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row">
      <nav className="w-full md:w-24 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-8 space-y-8">
        <div className="font-black italic text-2xl tracking-tighter text-yellow-500">S&G</div>
        <div className="flex flex-col space-y-4">
          {[{ id: 'home', icon: TrendingUp }, { id: 'squad', icon: User }, { id: 'training', icon: Activity }, { id: 'market', icon: DollarSign }, { id: 'inbox', icon: Mail }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-yellow-500 text-black' : 'text-zinc-600 hover:text-white'}`}>
              <item.icon size={24} />
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center mb-1"><Calendar size={12} className="mr-1"/> {new Date(gameState!.currentDate).toLocaleDateString()}</div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">{gameState?.player.name}</h1>
            <div className="text-xs text-zinc-500 font-bold uppercase">{currentClub?.name} • {currentClub?.league}</div>
          </div>
          <div className="flex space-x-4">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center min-w-[100px]">
              <div className="text-[9px] text-zinc-500 font-bold uppercase">Stamina</div>
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
                    <h2 className="text-xs font-black uppercase tracking-widest mb-2 opacity-70">{gameState.nextMatchCompetition} MATCH</h2>
                    <h3 className="text-5xl font-black italic uppercase mb-6 tracking-tighter">VS {nextOpponent?.name}</h3>
                    {gameState.isBenched ? (
                      <div className="bg-black/10 p-4 rounded-xl flex items-center space-x-3 mb-4"><Info /> <p className="font-bold">Coach Decision: You are too exhausted to play.</p></div>
                    ) : (
                      <button onClick={() => setIsPlayingMatch(true)} className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-transform">KICK OFF</button>
                    )}
                    {gameState.isBenched && <button onClick={handleAdvanceDay} className="bg-black/80 text-white px-8 py-3 rounded-xl font-bold ml-2">SKIP</button>}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 border-dashed p-16 rounded-3xl text-center">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest mb-6">Rest Day</p>
                  <button onClick={handleAdvanceDay} className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-zinc-200 flex items-center space-x-2 mx-auto">
                    <RefreshCw size={18} /> <span>Next Day</span>
                  </button>
                </div>
              )}

              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center"><h3 className="font-black italic uppercase tracking-tighter text-xl">Standings</h3> <span className="text-[9px] text-zinc-500 uppercase">{currentClub?.league}</span></div>
                <div className="p-4"><table className="w-full text-left text-xs"><thead className="text-zinc-500 font-bold uppercase"><tr><th className="p-4">POS</th><th className="p-4">CLUB</th><th className="p-4 text-center">P</th><th className="p-4 text-center">PTS</th></tr></thead><tbody className="divide-y divide-zinc-800">{gameState?.leagueTable.sort((a,b) => b.points - a.points).map((row, i) => { const club = STARTING_CLUBS.find(c => c.id === row.clubId); return (<tr key={row.clubId} className={row.clubId === gameState.currentClubId ? 'bg-yellow-500/10' : ''}><td className="p-4 font-black">{i+1}</td><td className="p-4 font-bold">{club?.name}</td><td className="p-4 text-center text-zinc-500">{row.played}</td><td className="p-4 text-center font-black text-yellow-500">{row.points}</td></tr>); })}</tbody></table></div>
              </div>
            </div>
            <div className="space-y-6"><PlayerCard player={gameState!.player} clubName={currentClub?.name} /></div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center flex flex-col items-center">
              <Heart size={48} className="text-green-500 mb-6" />
              <h3 className="text-2xl font-black italic uppercase mb-2">Light Session</h3>
              <p className="text-zinc-500 text-sm mb-6">Minor XP gains, low stamina drain. Good for maintaining fitness.</p>
              <button disabled={gameState!.player.currentStamina < 30} onClick={() => handleTraining('LIGHT')} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase disabled:opacity-20">Train</button>
            </div>
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center flex flex-col items-center">
              <Zap size={48} className="text-yellow-500 mb-6" />
              <h3 className="text-2xl font-black italic uppercase mb-2">Intense Session</h3>
              <p className="text-zinc-500 text-sm mb-6">Massive XP gains, but heavy fatigue and injury risk.</p>
              <button disabled={gameState!.player.currentStamina < 50} onClick={() => handleTraining('INTENSE')} className="w-full bg-yellow-500 text-black py-4 rounded-xl font-black uppercase disabled:opacity-20">Push Hard</button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="max-w-4xl mx-auto text-center py-20">
            <Users size={64} className="mx-auto text-zinc-800 mb-6" />
            <h3 className="text-3xl font-black italic mb-4 uppercase">TRANSFER HUB</h3>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Your current reputation is {Math.round(gameState!.player.reputation)}. Higher reputation attracts bigger clubs.</p>
            <button disabled={isTransferRequestPending} onClick={handleRequestTransfer} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all disabled:opacity-50">
              {isTransferRequestPending ? 'Contacting Scouts...' : 'Request Transfer'}
            </button>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {selectedMessage ? (
              <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800">
                <button onClick={() => setSelectedMessage(null)} className="text-zinc-500 text-xs font-bold uppercase mb-8">← Back</button>
                <h2 className="text-3xl font-black italic uppercase mb-4">{selectedMessage.subject}</h2>
                <div className="text-yellow-500 font-bold uppercase text-xs mb-8">{selectedMessage.sender}</div>
                <p className="text-zinc-400 mb-10 leading-relaxed">{selectedMessage.body}</p>
                {selectedMessage.action === 'contract' && <button onClick={() => handleAcceptOffer(selectedMessage.id)} className="bg-yellow-500 text-black px-10 py-4 rounded-xl font-black uppercase italic tracking-tighter shadow-xl">ACCEPT CONTRACT</button>}
              </div>
            ) : (
              gameState!.inbox.map(msg => (
                <button key={msg.id} onClick={() => { setSelectedMessage(msg); setGameState({...gameState!, inbox: gameState!.inbox.map(m => m.id === msg.id ? {...m, isRead: true} : m)}) }} className={`w-full p-6 rounded-2xl border text-left flex justify-between items-center ${msg.isRead ? 'bg-zinc-950 border-zinc-900 opacity-60' : 'bg-zinc-900 border-zinc-800 border-l-4 border-l-yellow-500 shadow-xl'}`}>
                  <div><div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">{msg.sender}</div><div className="font-bold">{msg.subject}</div></div>
                  <ChevronRight />
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="space-y-8">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">My Attributes</h3>
              <div className="space-y-6">
                {Object.entries(gameState!.player.attributes).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black uppercase text-zinc-500">{key}</span><span className="font-black italic">{val}</span></div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${val}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 h-fit">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Career Summary</h3>
              <div className="grid grid-cols-2 gap-8">
                <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Apps</div><div className="text-3xl font-black">{gameState?.player.stats.appearances}</div></div>
                <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Goals</div><div className="text-3xl font-black text-yellow-500">{gameState?.player.stats.goals}</div></div>
                <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Rating</div><div className="text-3xl font-black text-green-500">{gameState?.player.stats.avgRating.toFixed(2)}</div></div>
                <div><div className="text-[10px] text-zinc-500 font-bold uppercase">Wage</div><div className="text-3xl font-black text-white">{formatCurrency(gameState!.player.salary)}</div></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
