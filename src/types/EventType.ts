export type EventType = 
  | 'initial-random-pairing'    // First event with random pairings
  | 'rating-based-pairing'      // Pairings based on player ratings
  | 'tournament'                // Tournament format with brackets
  | 'league'                    // League format with multiple rounds
  | 'challenge'                 // Challenge-based matches
  ;