export type GameType = 'menu' | 'stroop' | 'arithmetic' | 'grid' | 'counting' | 'nback';

export interface GameScore {
  game: GameType;
  score: number;
  date: string;
}
