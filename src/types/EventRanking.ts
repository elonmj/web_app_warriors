export interface EventRanking {
  playerId: string;
  rank: number;
  points: number;
  pdi: number; // Performance Differential Index
  ds: number; // Difficulty Score
  eventMatches: string[]; // IDs of matches in this event
  byeRounds: number[]; // Rounds where player received a bye
}