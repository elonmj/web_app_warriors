import { EventTypeType, EventStatusType } from './Enums';

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
}

export interface EventMetadata {
  totalPlayers: number;
  totalMatches: number;
  currentRound: number;
  totalRounds: number;
  lastUpdated: string;
  roundDates?: { [round: number]: string };  // ISO-8601 dates for each round
  roundHistory: { [round: number]: RoundStats };
  byeHistory: ByeHistory[];
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