# Match Data Flow Implementation Overview

## Match Creation Process

### Step 1: Initial Match Creation
```typescript
// Via MatchService.createMatch()
Input required:
- eventId: string      // Event the match belongs to
- player1Id: string    // First player identifier
- player2Id: string    // Second player identifier
- isRandom?: boolean   // Whether match was randomly assigned
- round?: number       // Tournament round number

Process:
1. Validate player existence
2. Generate match ID: `${Date.now()}-${player1Id}-${player2Id}`
3. Initialize match with:
   - status: "pending"
   - date: current date
   - Initial player ratings/categories copied from current values
   - metadata (round, isRandom, timestamps)
4. Save to data/matches/{eventId}.json
```

### Step 2: Match Result Processing
```typescript
// Via MatchService.processMatchResult()
Input required:
- matchId: string
- eventId: string
- score: {
    player1Score: number
    player2Score: number
  }
- forfeit?: {
    winner: string
    reason: string
  }

Process:
1. Validate scores (non-negative)
2. Calculate match metrics:
   - PR (Points de Rencontre): 
     * Win = 3 points
     * Draw = 1 point
     * Loss = 0 points
   - PDI (Points de Départage Interne): |score1 - score2| / (score1 + score2)
   - DS (Différence de Score): Normalized score difference (0-100)
3. Calculate new player ratings via RatingSystem
4. Determine new player categories via CategoryManager
```

## Player Updates on Match Entry

### Rating Updates
```typescript
Process:
1. Calculate rating changes based on:
   - Current player ratings
   - Match result (win/loss/draw)
   - Score difference
   - Category difference
   - Random match factor

2. Update player documents:
   - currentRating: number      // New calculated rating
   - category: PlayerCategory   // New category if rating threshold crossed
```

### Match History Updates
```typescript
For each player, add PlayerMatch entry:
{
  date: string            // Match timestamp
  eventId: string        // Event identifier
  matchId: string        // Match reference
  opponent: {
    id: string           // Opponent's ID
    ratingAtTime: number // Opponent's rating at match time
    categoryAtTime: string // Opponent's category at match time
  }
  result: {
    score: [number, number]  // [player score, opponent score]
    pr: number              // Points earned
    pdi: number             // Points de Départage Interne
    ds: number              // Différence de Score
  }
  ratingChange: {
    before: number        // Rating before match
    after: number         // Rating after match
    change: number        // Delta (can be positive/negative)
  }
  categoryAtTime: string  // Player's category at match time
}
```

### Data Consistency Steps
1. File Locking:
```typescript
// In MatchRepository
await this.withLock(`matches_${eventId}`, async () => {
  // All match updates happen within lock
})
```

2. Atomic Updates:
```typescript
Transaction-like process:
1. Update match document
2. Update player ratings/categories
3. Add match to player histories
4. If any step fails, entire operation fails
```

3. Validation System:
```typescript
Match validation flow:
1. Match created (status: "pending")
2. Result entered (validation status: "pending")
3. Players approve result:
   - player1Approved: boolean
   - player2Approved: boolean
4. When both approve, validation status -> "completed"
```

## Current Limitations & Bottlenecks

### Match Creation
- No batch match creation support
- Limited validation of player eligibility
- No conflict detection for concurrent matches

### Player Updates
- Full player document loaded for each update
- No optimistic locking for concurrent updates
- Limited rollback capability on partial failures

## Recommended Improvements

### 1. Match Creation Enhancements
- Add batch match creation API
- Implement player eligibility checking
- Add match scheduling validation

### 2. Player Update Optimizations
- Implement partial document updates
- Add optimistic locking
- Create proper transaction support
- Add automated rollback mechanism

### 3. Process Improvements
- Add match validation timeouts
- Implement dispute resolution system
- Create match modification audit trail
- Add real-time rating updates

### 4. Architecture Upgrades
- Move to proper database system
- Implement caching layer
- Add event sourcing for match history
- Create proper API versioning