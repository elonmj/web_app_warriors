export type ValidationStatus =
  | 'pending'           // Waiting for both players to validate
  | 'partially_valid'   // One player has validated
  | 'valid'            // Both players have validated
  | 'disputed'         // One or both players contest the result
  | 'admin_validated'  // Result validated by administrator
  | 'auto_validated'   // System auto-validated after timeout
  ;