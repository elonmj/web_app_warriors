import { Match } from './Match';
import { PlayerCategoryType } from './Enums';
import { MatchResult } from './Match';
import { MatchStatus } from './MatchStatus';

export interface MatchHistoryResponse {
  matches: MatchDisplay[];
  pagination: {
    hasMore: boolean;
    total: number;
  };
  statistics: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface PlayerDetails {
  name: string;
  iscUsername?: string;
  category: PlayerCategoryType;
}

export interface PlayerDisplayDetails {
  name: string;
  iscUsername?: string;
  category?: PlayerCategoryType;
}

export interface MatchDisplay {
  id: string;
  eventId: string;
  date: string;
  player1: {
    id: string; 
    ratingBefore: number;
    ratingAfter: number;
    categoryBefore: PlayerCategoryType;
    categoryAfter: PlayerCategoryType;
  };
  player2: {
    id: string;
    ratingBefore: number;
    ratingAfter: number;
    categoryBefore: PlayerCategoryType;
    categoryAfter: PlayerCategoryType;
  };
  status: MatchStatus; // Make sure to use the same MatchStatus type
  result?: MatchResult;
  metadata: {
    round: number;
    isRandom: boolean;
    createdAt: string;
    updatedAt: string;
  };
  player1Details?: PlayerDisplayDetails;
  player2Details?: PlayerDisplayDetails;
}

export interface PlayerPairHistory {
  playerIds: [string, string];  // Changed from number to string
  rounds: number[];            // Rounds where they played
  lastMatchDate: string;       // ISO-8601 date
}

export interface MatchHistoryRecord {
  eventId: string;
  history: PlayerPairHistory[];
}

export function createPlayerPairKey(player1Id: string, player2Id: string): string {
  // Sort IDs to ensure consistent key regardless of player order
  const [id1, id2] = [player1Id, player2Id].sort();
  return `${id1}-${id2}`;
}

export function getRecentMatches(
  history: PlayerPairHistory[],
  player1Id: string,
  player2Id: string,
  lookbackRounds: number = 3
): number[] {
  const pair = history.find(h => 
    (h.playerIds[0] === player1Id && h.playerIds[1] === player2Id) ||
    (h.playerIds[0] === player2Id && h.playerIds[1] === player1Id)
  );

  if (!pair) return [];

  // Return the most recent rounds where these players matched
  return pair.rounds
    .sort((a, b) => b - a)  // Sort descending
    .slice(0, lookbackRounds);
}

export function shouldAvoidRematch(
  history: PlayerPairHistory[],
  player1Id: string,
  player2Id: string,
  currentRound: number,
  minRoundsBetweenMatches: number = 3
): boolean {
  const recentMatches = getRecentMatches(history, player1Id, player2Id);
  if (recentMatches.length === 0) return false;

  // Check if the most recent match was too recent
  const lastMatchRound = Math.max(...recentMatches);
  return (currentRound - lastMatchRound) < minRoundsBetweenMatches;
}
