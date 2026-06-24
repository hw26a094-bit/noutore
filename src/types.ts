export type GameType = 'menu' | 'stroop' | 'arithmetic' | 'grid' | 'counting' | 'nback' | 'janken';

export interface GameScore {
  game: GameType;
  score: number;
  date: string;
}
