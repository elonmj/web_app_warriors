# Improved Round Data Architecture

## Core Principle
Keep data organization consistent and predictable, treating all rounds equally while maintaining data integrity.

## Directory Structure
```
data/
  ├── events.json          # Contains event metadata including current round
  ├── players.json         # Global player data
  ├── matches/
  │   ├── event-id-1/
  │   │   ├── 1.json      # First round matches
  │   │   ├── 2.json      # Second round matches
  │   │   └── 3.json      # Third round matches
  │   └── event-id-2/
  │       ├── 1.json
  │       └── 2.json
  └── rankings/
      ├── event-id-1/
      │   ├── 1.json      # Rankings after round 1
      │   ├── 2.json      # Rankings after round 2
      │   └── 3.json      # Rankings after round 3
      └── event-id-2/
          ├── 1.json
          └── 2.json
```

## Data Models

### Event Data (events.json)
```typescript
{
  "events": [
    {
      "id": string,
      "name": string,
      "startDate": string,
      "endDate": string,
      "type": EventType,
      "status": EventStatus,
      "metadata": {
        "currentRound": number,
        "totalRounds": number,
        "lastUpdated": string,
        "roundsCompleted": number[],     // Array of completed round numbers
        "activeRound": {
          "number": number,
          "startedAt": string,
          "completedMatches": number,
          "totalMatches": number
        }
      }
    }
  ]
}
```

### Round Match File (matches/[eventId]/[round].json)
```typescript
{
  "eventId": string,
  "round": number,
  "matches": Match[],
  "metadata": {
    "createdAt": string,
    "completedMatches": number,
    "totalMatches": number,
    "isComplete": boolean,
    "completedAt": string | null
  }
}
```

### Round Rankings File (rankings/[eventId]/[round].json)
```typescript
{
  "eventId": string,
  "round": number,
  "rankings": Ranking[],
  "metadata": {
    "calculatedAt": string,
    "basedOnMatchIds": string[]  // For tracking which matches affected these rankings
  }
}
```

## Key Features

### 1. Round Status Tracking
- Track round status in event metadata
- Maintain list of completed rounds
- Store active round information
- No special files needed for current/active round

### 2. File Operations
```typescript
const getRoundPath = (eventId: string, round: number, type: 'matches' | 'rankings') => {
  return path.join('data', type, eventId, `${round}.json`);
};
```

### 3. Data Access Patterns

#### Reading Round Data
```typescript
async function getRoundData(eventId: string, round: number) {
  const matchPath = getRoundPath(eventId, round, 'matches');
  const rankingPath = getRoundPath(eventId, round, 'rankings');
  
  const [matches, rankings] = await Promise.all([
    readJson(matchPath),
    readJson(rankingPath)
  ]);
  
  return { matches, rankings };
}
```

#### Writing Round Data
```typescript
async function updateRoundData(eventId: string, round: number, data: RoundData) {
  const path = getRoundPath(eventId, round, 'matches');
  await writeJsonAtomically(path, data);
}
```

## Implementation Strategy

### 1. Round Creation
- Create round directory if it doesn't exist
- Initialize round files with empty arrays
- Update event metadata with new round info

### 2. Round Updates
- Write directly to round-specific files
- Update event metadata as needed
- Maintain atomic operations

### 3. Round Completion
- Mark round as complete in event metadata
- Add to completedRounds array
- Generate rankings for completed round

## Benefits

1. **Consistency**
   - All rounds follow same structure
   - No special cases to handle
   - Clear, predictable file paths

2. **Data Integrity**
   - Each round's data is isolated
   - Atomic operations per round
   - Clear tracking of round status

3. **Performance**
   - Load only needed round data
   - Efficient updates
   - Easy to implement caching

4. **Scalability**
   - No file size limitations
   - Easy to add new rounds
   - Simple backup strategy

## API Design

### Round-specific Endpoints
```typescript
// Matches
GET    /api/events/{eventId}/rounds/{round}/matches
POST   /api/events/{eventId}/rounds/{round}/matches/{matchId}
PATCH  /api/events/{eventId}/rounds/{round}/matches/{matchId}

// Rankings
GET    /api/events/{eventId}/rounds/{round}/rankings
POST   /api/events/{eventId}/rounds/{round}/rankings/calculate
```

## Migration Steps

1. Create round directories for each event
2. Split existing match data by round
3. Generate round-specific ranking files
4. Update event metadata with round information
5. Validate data consistency
6. Update application code to use new structure

## Next Steps

1. Review this improved architecture
2. Discuss implementation priority
3. Plan phased migration
4. Update UI components to work with new structure