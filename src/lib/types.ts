export interface PlayerStint {
  teamId: string;
  season: number;
}

export interface Player {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  nbaComId?: number;
  allStar?: boolean;
  firstRound?: boolean;
  careerGames?: number;
  hof?: boolean;
  bgColor?: string;
  stints?: PlayerStint[];
}

export interface PlayerDetail extends Player {
  stints: PlayerStint[];
  headshotUrl: string | null;
}

export interface GameState {
  startPlayer: Player;
  finishPlayer: Player;
  chain: Player[];
  currentPlayer: Player;
  guessCount: number;
  correctGuesses: number;
  isComplete: boolean;
}

export interface RandomFilters {
  modernEra: boolean;
  minSeasons: boolean;
  minGames: boolean;
  allStar: boolean;
  firstRound: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  score: number;
}

export interface TeammateCheckResult {
  isTeammate: boolean;
  sharedTeams: { team: string; season: number }[];
}

export interface GameResult {
  startPlayer: Player;
  finishPlayer: Player;
  chain: Player[];
  guessCount: number;
  pathLength: number;
}
