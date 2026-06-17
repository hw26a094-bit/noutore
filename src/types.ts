export type GameType = 'menu' | 'stroop' | 'arithmetic' | 'grid';

export interface GameScore {
  game: GameType;
  score: number;
  date: string;
}
