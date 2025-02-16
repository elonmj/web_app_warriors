# Pairings Implementation Completion Plan

## 1. Core Service Updates (EventService.ts)

### Bye Handling
```typescript
interface ByeHistory {
  playerId: string;
  rounds: number[];
  lastByeRound: number;
}

interface EventMetadata {
  // Existing fields...
  byeHistory: ByeHistory[];
}

async function assignBye(players: Player[], byeHistory: ByeHistory[]): Promise<string> {
  // Select player for bye based on:
  // 1. Players who haven't had a bye
  // 2. Players with fewest byes
  // 3. Players whose last bye was longest ago
  // Return selected player ID
}
```

### Category Balance Implementation
```typescript
interface CategoryBalanceMetrics {
  crossCategoryMatches: number;
  sameCategoryMatches: number;
  categorySpread: Record<PlayerCategoryType, number>;
}

function calculateCategoryMetrics(pairings: Match[]): CategoryBalanceMetrics {
  // Analyze category distribution
  // Track cross-category vs same-category matches
  // Calculate spread across categories
  return metrics;
}

async function balanceCategoryPairings(
  pairings: Match[],
  targetMetrics: CategoryBalanceMetrics
): Promise<Match[]> {
  // Adjust pairings to achieve better category balance
  // Swap pairs to improve metrics while maintaining rating differences
  return balancedPairings;
}
```

## 2. UI Component Updates

### PairingCard.tsx Enhancements
```typescript
interface PairingCardProps {
  match: Match;
  isCurrentRound: boolean;
  isByeMatch?: boolean;
}

// Add:
// - Bye match styling
// - Category indicator badges
// - Match scheduling info
```

### EventRoundPairings.tsx Updates
```typescript
// Add:
// - Round navigation controls
// - Date display per round
// - Loading states
// - Error boundaries
```

## 3. Implementation Order

1. Core Service Layer
   - Add ByeHistory interface and tracking
   - Implement assignBye logic
   - Add CategoryBalanceMetrics interface
   - Implement balance calculation and adjustment

2. API Layer
   - Update pairings generation to handle byes
   - Add category balance validation
   - Include bye info in round responses

3. UI Components
   - Enhance PairingCard for bye matches
   - Add round navigation
   - Implement loading states
   - Add error handling

## 4. Testing Requirements

1. Unit Tests
   - Bye assignment algorithm
   - Category balance calculations
   - Round transition logic

2. Integration Tests
   - Full pairing generation flow
   - Round navigation
   - Bye handling edge cases

3. UI Tests
   - Bye match display
   - Loading states
   - Error handling

## 5. Validation & Quality Checks

- Verify bye assignment fairness
- Test category balance improvements
- Ensure smooth round transitions
- Validate UI responsiveness
- Check accessibility compliance

## 6. Final Review

- [ ] Bye handling complete and tested
- [ ] Category balance metrics implemented
- [ ] UI components updated and responsive
- [ ] All tests passing
- [ ] Documentation updated