import { EventTypeType, EventStatusType } from './Enums';
import type { EventRanking } from './Ranking';

export interface ByeHistory {
  playerId: string;
  rounds: number[];
  lastByeRound: number;
}

export interface RoundStats {
  date: string;          // ISO-8601 date
  totalMatches: number;
  completedMatches: number;
  byePlayerId?: string;
  rankings?: EventRanking | null | undefined;
  completedAt?: string;  // ISO-8601 date of round completion
}

export interface RoundCompletion {
  round: number;
  timestamp: string;     // ISO-8601 date
  totalMatches: number;
  completionHistory?: { round: number; timestamp: string; totalMatches: number; completedMatches: number }[];
  lastCompletedRound?: number;

  completedMatches: number;
}

export interface EventMetadata {
  totalPlayers: number;
  totalMatches: number;
  currentRound: number;
  totalRounds: number;
  maxRounds?: number;
  lastUpdated: string;
  roundDates?: { [round: number]: string };  // ISO-8601 dates for each round
  roundHistory: { [round: number]: RoundStats };
  byeHistory: ByeHistory[];
  lastCompletedRound?: number;
  completionHistory?: RoundCompletion[];
  category?: string;
}

export interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: EventTypeType;
  status: EventStatusType;
  metadata?: EventMetadata;
}

export interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
  type: EventTypeType;
}

export interface UpdateEventInput {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  type?: EventTypeType;
  status?: EventStatusType;
  metadata?: Partial<EventMetadata>;
}
