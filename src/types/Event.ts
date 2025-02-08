import { EventTypeType, EventStatusType } from './Enums';

export interface EventMetadata {
  totalPlayers: number;
  totalMatches: number;
  currentRound: number;
  lastUpdated: string;
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