
export enum Position {
  ST = 'ST',
  LW = 'LW',
  RW = 'RW',
  CAM = 'CAM',
  CM = 'CM',
  CDM = 'CDM',
  LB = 'LB',
  RB = 'RB',
  CB = 'CB',
  GK = 'GK'
}

export enum PlayStyle {
  FINISHER = 'Finisher',
  PLAYMAKER = 'Playmaker',
  DEFENDER = 'Defender',
  SPEEDSTER = 'Speedster',
  ENGINE = 'Engine'
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  stamina: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  appearances: number;
  cleanSheets: number;
  avgRating: number;
}

export interface Player {
  name: string;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  preferredFoot: 'Left' | 'Right';
  position: Position;
  secondaryPosition: Position;
  playStyle: PlayStyle;
  ovr: number;
  potential: number;
  attributes: PlayerAttributes;
  stats: PlayerStats;
  marketValue: number;
  salary: number;
  reputation: number;
  xp: number;
  level: number;
  currentStamina: number;
  injuryDays: number;
}

export interface Club {
  id: string;
  name: string;
  country: string;
  league: string;
  tier: number;
  budget: number;
  facilities: number;
  reputation: number;
  colors: { primary: string; secondary: string };
}

export interface Message {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  action?: 'contract' | 'news' | 'national';
}

export type CompetitionType = 'LEAGUE' | 'CUP' | 'CONTINENTAL' | 'INTERNATIONAL';

export interface LeagueTableRow {
  clubId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface GameState {
  player: Player;
  currentClubId: string;
  currentDate: string; 
  season: number;
  history: {
    seasons: Array<{
      year: number;
      clubName: string;
      stats: PlayerStats;
    }>;
  };
  inbox: Message[];
  isMatchDay: boolean;
  nextMatchOpponent?: string;
  nextMatchCompetition: CompetitionType;
  leagueTable: LeagueTableRow[];
  isBenched: boolean;
  isIntlCallup: boolean;
}
