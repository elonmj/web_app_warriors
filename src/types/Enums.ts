export const EventType = {
  INITIAL_RANDOM_PAIRING: "initial-random-pairing",
  KNOCKOUT: "knockout",
  ROUND_ROBIN: "round-robin"
} as const;

export const EventStatus = {
  OPEN: "open",
  CLOSED: "closed",
  CANCELLED: "cancelled"
} as const;

export const PlayerCategory = {
  "ONYX": "ONYX",
  "AMÉTHYSTE": "AMÉTHYSTE",
  "TOPAZE": "TOPAZE",
  "DIAMANT": "DIAMANT"
} as const;

export const MatchStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FORFEIT: "forfeit",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
  INVALIDATED: "invalidated"
} as const;

export const ValidationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  DISPUTED: "disputed"
} as const;

// Type exports
export type EventTypeType = typeof EventType[keyof typeof EventType];
export type EventStatusType = typeof EventStatus[keyof typeof EventStatus];
export type PlayerCategoryType = typeof PlayerCategory[keyof typeof PlayerCategory];
export type MatchStatusType = typeof MatchStatus[keyof typeof MatchStatus];
export type ValidationStatusType = typeof ValidationStatus[keyof typeof ValidationStatus];