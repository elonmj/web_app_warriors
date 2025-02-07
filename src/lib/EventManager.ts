interface EventManager {
  createEvent(input: CreateEventInput): Promise<Event>;
  closeEvent(eventId: number): Promise<Event>;
  reopenEvent(eventId: number): Promise<Event>;
  generateMatches(eventId: number): Promise<Array<Match>>;
}

interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

// Response types
interface GenerateMatchesResponse {
  eventId: number;
  matches: Array<Match>;
  totalGenerated: number;
}

export type { EventManager, CreateEventInput, GenerateMatchesResponse };

// Import related types
import type { Event } from './Event';
import type { Match } from './Match';