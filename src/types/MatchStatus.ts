export type MatchStatus = 
  | 'pending'     // Match created but not played
  | 'completed'   // Match played with valid result
  | 'forfeit'     // Match ended due to forfeit
  | 'disputed'    // Match result under dispute
  | 'cancelled'   // Match cancelled before completion
  | 'invalidated' // Match result invalidated by admin
  ;