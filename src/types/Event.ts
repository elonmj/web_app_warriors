import { EventTypeType, EventStatusType } from './Enums';
import type { EventRanking } from './Ranking';

export interface ByeHistory {
  playerId: string;
  rounds: number[];
  lastByeRound: number;
}

export interface RoundStats {
  date: string;          // ISO-8601 date
  /** Ouverture de la fenêtre de ronde (Règlement V3 §III.B). Absent sur les
   *  rondes créées avant la V3 : on retombe alors sur `date`. */
  startsAt?: string;
  /** Clôture de la fenêtre : 20 h Bénin, au moins 3 jours après `startsAt`.
   *  Seules les parties jouées dans [startsAt, endsAt[ comptent pour la ronde. */
  endsAt?: string;
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
  /** @deprecated Supprimé par le Règlement V3 §III.A : il n'y a plus de phase
   *  d'inscription, tout le monde est apparié. Conservé en lecture seule pour
   *  les événements créés sous la V2. */
  roundAvailability?: { [round: number]: string[] };
}

export interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: EventTypeType;
  status: EventStatusType;
  metadata?: EventMetadata;
  playerIds?: string[]; // Add optional array for participant IDs
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
