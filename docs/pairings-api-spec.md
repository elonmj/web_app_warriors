# Pairings API Specification

## Overview
API endpoints to support match pairing functionality for events, including round management and pairing generation.

## Endpoints

### 1. Get Round Pairings
```typescript
GET /api/events/{eventId}/rounds/{round}

Response {
  round: number;
  scheduledDate: string;  // ISO-8601
  matches: Match[];
  metadata: {
    totalMatches: number;
    completedMatches: number;
    pendingMatches: number;
  }
}
```

### 2. Get Current Round
```typescript
GET /api/events/{eventId}/rounds/current

Response {
  currentRound: number;
  pairings: {
    round: number;
    scheduledDate: string;
    matches: Match[];
  }
}
```

### 3. Generate New Round Pairings
```typescript
POST /api/events/{eventId}/rounds/generate

Request {
  scheduledDate?: string;  // Optional scheduling
  options?: {
    avoidRematches: boolean;  // Default true
    balanceCategories: boolean;  // Default true
  }
}

Response {
  round: number;
  generatedPairings: Match[];
}
```

## Service Layer Updates

```typescript
// src/api/services/EventService.ts

interface PairingOptions {
  avoidRematches: boolean;
  balanceCategories: boolean;
}

interface GeneratePairingsResult {
  round: number;
  matches: Match[];
  warnings?: string[];  // For cases where perfect pairing wasn't possible
}

class EventService {
  // Existing methods...

  async getCurrentRound(eventId: string): Promise<number> {
    // Get current round number for event
  }

  async getRoundPairings(
    eventId: string,
    round: number
  ): Promise<RoundPairings> {
    // Get all pairings for specific round
  }

  async generatePairings(
    eventId: string,
    options: PairingOptions
  ): Promise<GeneratePairingsResult> {
    // Generate new round of pairings
  }

  private async checkForRematches(
    eventId: string,
    proposedPairings: Match[]
  ): Promise<boolean> {
    // Verify no recent rematches in proposed pairings
  }

  private async balanceCategoryPairings(
    eventId: string,
    proposedPairings: Match[]
  ): Promise<Match[]> {
    // Adjust pairings to balance category matchups
  }
}
```

## Pairing Algorithm

### Base Implementation
1. Sort players by current rating
2. Split into top/bottom halves
3. Pair players across halves
4. Apply modifications based on constraints

```typescript
function generatePairings(
  players: Player[],
  options: PairingOptions
): Match[] {
  // 1. Sort by rating
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);

  // 2. Split into halves
  const midpoint = Math.floor(sortedPlayers.length / 2);
  const topHalf = sortedPlayers.slice(0, midpoint);
  const bottomHalf = sortedPlayers.slice(midpoint);

  // 3. Create initial pairings
  const pairings = topHalf.map((player, index) => ({
    player1: player,
    player2: bottomHalf[index]
  }));

  // 4. Apply constraints
  return applyPairingConstraints(pairings, options);
}
```

### Constraints Handling

1. **Rematch Prevention**
   - Track recent matches between players
   - Swap pairings to avoid immediate rematches

2. **Category Balance**
   - Ensure fair distribution of cross-category matches
   - Maintain competitive balance

3. **Bye Handling**
   - Assign byes fairly when odd number of players
   - Track bye history to ensure equal distribution

## Data Storage Updates

### 1. Event Metadata Extensions
```typescript
interface EventMetadata {
  // Existing fields...
  currentRound: number;
  totalRounds: number;
  roundHistory: {
    [round: number]: {
      date: string;
      totalMatches: number;
      completedMatches: number;
    }
  }
}
```

### 2. Match History Tracking
```typescript
interface MatchHistory {
  playerIds: [string, string];
  rounds: number[];
  lastMatchDate: string;
}
```

## Error Handling

1. **Invalid Round Numbers**
   - 404 for non-existent rounds
   - 400 for invalid round parameters

2. **Pairing Generation Failures**
   - 409 for constraint violations
   - 500 for algorithm failures

3. **Validation Errors**
   - 400 for invalid request data
   - 422 for business rule violations

## Testing Considerations

1. **Unit Tests**
   - Pairing algorithm logic
   - Constraint validation
   - Edge cases (odd numbers, rematches)

2. **Integration Tests**
   - API endpoint behavior
   - Database interactions
   - Error handling

3. **Load Tests**
   - Large player pools
   - Multiple concurrent requests
   - Performance benchmarks