interface Event {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isOpen: boolean;
}

// Input type for creating new events
interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

export type { Event, CreateEventInput };