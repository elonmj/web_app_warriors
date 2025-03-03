export interface ISCCredentials {
  username: string;
  password: string;
}

export interface ISCPlayerIdentifier {
  iscId: string;
  iscUsername?: string; // Optional for backward compatibility
}

export interface ISCMatchResult {
  player1Score: number;
  player2Score: number;
  timestamp: string;
}

export interface ISCFetchResponse {
  success: boolean;
  data?: ISCMatchResult;
  error?: string;
}
