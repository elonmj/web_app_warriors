# API Structure Plan for Round-Based Operations

## Current API Analysis

### Existing API Structure
```
/api/events/[eventId]/...                    # Event operations
/api/events/[eventId]/rounds/[round]/...     # Round-specific operations
/api/matches/[eventId]/...                   # Match operations
/api/rankings/[eventId]/...                  # Ranking operations
```

## Proposed API Reorganization

### New Structure
```
/api/events/[eventId]/...                              # Event operations
/api/events/[eventId]/rounds/[round]/                  # Round info
/api/events/[eventId]/rounds/[round]/matches           # Round matches
/api/events/[eventId]/rounds/[round]/rankings          # Round rankings
/api/events/[eventId]/rounds/[round]/pairings          # Round pairings
```

### Endpoints Detail

1. **Round Information**
```typescript
// Get round status
GET /api/events/[eventId]/rounds/[round]
Response: {
  round: number;
  status: 'active' | 'completed';
  completedMatches: number;
  totalMatches: number;
  startedAt: string;
  completedAt?: string;
}
```

2. **Round Matches**
```typescript
// Get matches for specific round
GET /api/events/[eventId]/rounds/[round]/matches
Response: Match[]

// Update match result in round
POST /api/events/[eventId]/rounds/[round]/matches/[matchId]
Body: MatchResult
```

3. **Round Rankings**
```typescript
// Get rankings after specific round
GET /api/events/[eventId]/rounds/[round]/rankings
Response: Ranking[]

// Calculate rankings for round
POST /api/events/[eventId]/rounds/[round]/rankings/calculate
Response: Ranking[]
```

4. **Round Pairings**
```typescript
// Get pairings for next round
GET /api/events/[eventId]/rounds/[round]/pairings
Response: Match[]

// Generate pairings for next round
POST /api/events/[eventId]/rounds/[round]/pairings/generate
Response: Match[]
```

## Benefits of New Structure

1. **Consistency**
   - All round-related operations under event namespace
   - Clear hierarchy: event -> round -> resource
   - Matches existing rounds route pattern

2. **Clarity**
   - Explicit round context in URLs
   - Resource relationships clearly shown
   - Easy to understand API structure

3. **Maintainability**
   - Organized by domain concepts
   - Easy to add new round-related features
   - Consistent with event-centric design

## Implementation Approach

### 1. Create New Round-Based Routes
```typescript
// src/app/api/events/[eventId]/rounds/[round]/matches/route.ts
export async function GET(
  request: Request,
  { params }: { params: { eventId: string, round: string } }
) {
  const { eventId, round } = params;
  return getRoundMatches(eventId, parseInt(round));
}
```

### 2. Deprecation Strategy for Old Routes
1. Add new routes while keeping old ones
2. Mark old routes as deprecated in documentation
3. Gradually migrate clients to new endpoints
4. Remove old routes in future version

### 3. Client Updates
- Update EventRoundPairings component to use new APIs
- Update other components that need round data
- Add round parameter to relevant API calls

## Migration Steps

1. **Phase 1: New Routes**
   - Implement new round-based routes
   - Keep existing routes functional
   - Add route handlers and controllers

2. **Phase 2: Data Access**
   - Update services to handle round-specific operations
   - Implement new repository methods
   - Maintain backward compatibility

3. **Phase 3: Client Updates**
   - Update components to use new endpoints
   - Add round selection handling
   - Test all round-based operations

4. **Phase 4: Cleanup**
   - Remove deprecated routes
   - Clean up old handlers
   - Update documentation

## Next Steps

1. Review this API structure
2. Discuss any concerns about the organization
3. Plan implementation timeline
4. Create detailed technical specifications

The focus is on creating a clear, consistent API structure that properly represents the round-based nature of the operations while maintaining good API design practices.