export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: LichessPlayer;
    black: LichessPlayer;
  };
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
  moves: string;
  pgn: string;
  clock?: {
    initial: number;
    increment: number;
    totalTime: number;
  };
  winner?: 'white' | 'black';
}

export interface LichessPlayer {
  user?: {
    name: string;
    id: string;
  };
  rating?: number;
  ratingDiff?: number;
}

export interface GameWithAnalysis {
  id: string;
  lichessId: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  timeControl: string;
  perfType: string;
  opening: string | null;
  openingEco: string | null;
  playerColor: string;
  playerRating: number | null;
  opponentRating: number | null;
  playedAt: Date;
  analysis: AnalysisResult | null;
}

export interface AnalysisResult {
  accuracy: number;
  acpl: number;
  bestMoves: number;
  goodMoves: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  missedMates: number;
  timeInTrouble: number;
  avgMoveTime: number | null;
}

export interface MoveAnalysisResult {
  moveNumber: number;
  move: string;
  isWhite: boolean;
  evaluation: number;
  bestMove: string | null;
  evalLoss: number;
  classification: MoveClassification;
  square: string;
  timeSpent: number | null;
  timeRemaining: number | null;
  inTimeTrouble: boolean;
}

export type MoveClassification =
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_mate';

export interface StockfishEvaluation {
  depth: number;
  evaluation: number;
  bestMove: string;
  isMate: boolean;
  mateIn: number | null;
}

export interface OpeningStats {
  name: string;
  eco: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface SquareHeatmapData {
  square: string;
  mistakeCount: number;
  blunderCount: number;
  totalErrors: number;
}

export interface RatingHistoryPoint {
  date: string;
  rating: number;
  gameId: string;
}

export interface PhaseStats {
  phase: 'opening' | 'middlegame' | 'endgame';
  accuracy: number;
  acpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  totalMoves: number;
}

export interface TimeTroubleStats {
  normalMoves: number;
  normalAccuracy: number;
  normalBlunders: number;
  timeTroubleMoves: number;
  timeTroubleAccuracy: number;
  timeTroubleBlunders: number;
  accuracyDrop: number;
  timeTroubleThreshold: number;
}

export interface UserStats {
  totalGames: number;
  analyzedGames: number;
  avgAccuracy: number;
  avgAcpl: number;
  totalBlunders: number;
  totalMistakes: number;
  totalInaccuracies: number;
  mostCommonMistakeSquares: SquareHeatmapData[];
  openingStats: OpeningStats[];
  ratingHistory: RatingHistoryPoint[];
  phaseStats: PhaseStats[];
  timeTroubleStats: TimeTroubleStats | null;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  gameId: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  currentMove?: number;
  totalMoves?: number;
}
