export type EventStatus = 
  | 'open'      // Event is currently active and accepting matches
  | 'closed'    // Event has ended, no new matches allowed
  | 'paused'    // Event temporarily suspended
  | 'cancelled' // Event cancelled before completion
  | 'draft'     // Event created but not yet started
  ;