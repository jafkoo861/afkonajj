
import { Club, Position } from './types';

export const NATIONS = [
  'England', 'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Bosnia and Herzegovina', 'Croatia', 'Serbia', 'Turkey', 'Poland', 'Greece'
];

export const STARTING_CLUBS: Club[] = [
  // BOSNIA - Premijer Liga
  { id: 'sarajevo', name: 'FK Sarajevo', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 300000, facilities: 2, reputation: 35, colors: { primary: '#7c2d12', secondary: '#ffffff' } },
  { id: 'zeljo', name: 'FK Željezničar', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 250000, facilities: 2, reputation: 34, colors: { primary: '#1d4ed8', secondary: '#ffffff' } },
  { id: 'zrinjski', name: 'Zrinjski Mostar', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 400000, facilities: 3, reputation: 38, colors: { primary: '#ffffff', secondary: '#dc2626' } },
  { id: 'borac', name: 'Borac Banja Luka', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 350000, facilities: 2, reputation: 36, colors: { primary: '#dc2626', secondary: '#1d4ed8' } },
  { id: 'velez', name: 'Velež Mostar', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 200000, facilities: 2, reputation: 32, colors: { primary: '#dc2626', secondary: '#ffffff' } },
  { id: 'siroki', name: 'Široki Brijeg', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 220000, facilities: 2, reputation: 30, colors: { primary: '#1d4ed8', secondary: '#ffffff' } },
  { id: 'posusje', name: 'Posušje', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 150000, facilities: 1, reputation: 25, colors: { primary: '#1d4ed8', secondary: '#ffffff' } },
  { id: 'sloga', name: 'Sloga Doboj', country: 'Bosnia and Herzegovina', league: 'Premijer Liga', tier: 1, budget: 180000, facilities: 1, reputation: 24, colors: { primary: '#dc2626', secondary: '#ffffff' } },

  // ENGLAND - Premier League (Elites)
  { id: 'mancity', name: 'Manchester City', country: 'England', league: 'Premier League', tier: 1, budget: 15000000, facilities: 5, reputation: 96, colors: { primary: '#7dd3fc', secondary: '#ffffff' } },
  { id: 'liverpool', name: 'Liverpool', country: 'England', league: 'Premier League', tier: 1, budget: 10000000, facilities: 5, reputation: 94, colors: { primary: '#dc2626', secondary: '#facc15' } },
  { id: 'arsenal', name: 'Arsenal', country: 'England', league: 'Premier League', tier: 1, budget: 8000000, facilities: 5, reputation: 92, colors: { primary: '#ef4444', secondary: '#ffffff' } },
  { id: 'chelsea', name: 'Chelsea', country: 'England', league: 'Premier League', tier: 1, budget: 12000000, facilities: 5, reputation: 88, colors: { primary: '#1d4ed8', secondary: '#ffffff' } },
  { id: 'spurs', name: 'Tottenham', country: 'England', league: 'Premier League', tier: 1, budget: 7000000, facilities: 5, reputation: 86, colors: { primary: '#ffffff', secondary: '#1e3a8a' } },
  { id: 'villa', name: 'Aston Villa', country: 'England', league: 'Premier League', tier: 1, budget: 5000000, facilities: 4, reputation: 82, colors: { primary: '#7c2d12', secondary: '#7dd3fc' } },
  { id: 'newcastle', name: 'Newcastle', country: 'England', league: 'Premier League', tier: 1, budget: 9000000, facilities: 5, reputation: 84, colors: { primary: '#000000', secondary: '#ffffff' } },
  { id: 'luton', name: 'Luton Town', country: 'England', league: 'Premier League', tier: 1, budget: 500000, facilities: 2, reputation: 40, colors: { primary: '#f97316', secondary: '#ffffff' } },

  // SPAIN - La Liga
  { id: 'realmadrid', name: 'Real Madrid', country: 'Spain', league: 'La Liga', tier: 1, budget: 20000000, facilities: 5, reputation: 98, colors: { primary: '#ffffff', secondary: '#1e3a8a' } },
  { id: 'barca', name: 'FC Barcelona', country: 'Spain', league: 'La Liga', tier: 1, budget: 8000000, facilities: 5, reputation: 95, colors: { primary: '#7c2d12', secondary: '#1e3a8a' } },
  { id: 'atletico', name: 'Atletico Madrid', country: 'Spain', league: 'La Liga', tier: 1, budget: 6000000, facilities: 5, reputation: 91, colors: { primary: '#dc2626', secondary: '#ffffff' } },
  { id: 'sociedad', name: 'Real Sociedad', country: 'Spain', league: 'La Liga', tier: 1, budget: 3000000, facilities: 4, reputation: 83, colors: { primary: '#1d4ed8', secondary: '#ffffff' } },
  { id: 'villarreal', name: 'Villarreal', country: 'Spain', league: 'La Liga', tier: 1, budget: 2500000, facilities: 4, reputation: 81, colors: { primary: '#facc15', secondary: '#1d4ed8' } },
  { id: 'betis', name: 'Real Betis', country: 'Spain', league: 'La Liga', tier: 1, budget: 2800000, facilities: 4, reputation: 82, colors: { primary: '#166534', secondary: '#ffffff' } },
  { id: 'sevilla', name: 'Sevilla', country: 'Spain', league: 'La Liga', tier: 1, budget: 3200000, facilities: 4, reputation: 84, colors: { primary: '#ffffff', secondary: '#dc2626' } },
  { id: 'almeria', name: 'Almeria', country: 'Spain', league: 'La Liga', tier: 1, budget: 400000, facilities: 2, reputation: 34, colors: { primary: '#dc2626', secondary: '#ffffff' } }
];

export const ALL_POSITIONS = Object.values(Position);

export const ATTRIBUTE_DISPLAY_NAMES: Record<string, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
  stamina: 'STA'
};
