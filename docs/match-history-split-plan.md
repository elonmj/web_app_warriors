# Match History Component Split Plan

## Current Usage Analysis

The MatchHistory component is currently being used in two distinct ways:

### 1. Player Profile View
Location: `src/app/player/[playerId]/page.tsx`
```typescript
<MatchHistory playerId={player.id} />
```

**Characteristics:**
- Receives a player ID as prop
- Makes API calls to `/api/players/{playerId}/matches`
- Implements pagination (10 matches per page)
- Shows matches across all events
- Needs loading states and error handling for API calls
- Matches are filtered to show only those involving the specified player

### 2. Event View
Location: `src/app/event/[eventId]/page.tsx`
```typescript
<MatchHistory matches={matchesForDisplay} />
```

**Characteristics:**
- Receives matches directly as props
- No API calls needed
- Shows all matches at once (no pagination)
- Matches are pre-filtered for the specific event
- No loading states needed (data is already available)

## Proposed Solution: Component Split

Instead of making one component handle both cases, we should split it into two specialized components:

### 1. PlayerMatchHistory Component
```typescript
interface PlayerMatchHistoryProps {
  playerId: string;
}

// Specialized for displaying a player's match history
// with pagination and API integration
```

### 2. EventMatchHistory Component
```typescript
interface EventMatchHistoryProps {
  matches: MatchDisplay[];
}

// Specialized for displaying pre-fetched event matches
// no API calls or pagination needed
```

## Benefits of Split

1. **Single Responsibility Principle**
   - Each component has one clear purpose
   - Code is more focused and maintainable

2. **Simplified Props**
   - No need for conditional prop types
   - Clear what data is needed for each use case

3. **Optimized Performance**
   - Event view doesn't initialize unnecessary state or effects
   - Player view properly handles pagination and loading states

4. **Better Type Safety**
   - No undefined checks needed for playerId
   - More predictable component behavior

5. **Easier Testing**
   - Can test each use case independently
   - Clearer test scenarios for each component

## Implementation Steps

1. Create new components:
   - Create `src/app/components/PlayerMatchHistory.tsx`
   - Create `src/app/components/EventMatchHistory.tsx`

2. Extract common display logic:
   - Move match display UI to shared component
   - Keep business logic separate

3. Update usage:
   - Update player profile to use PlayerMatchHistory
   - Update event page to use EventMatchHistory

4. Add proper types:
   - Define clear interfaces for both components
   - Share common types where appropriate

5. Implement proper error boundaries:
   - Add specific error handling for API calls
   - Add validation for required props

## Migration Strategy

1. Create new components alongside existing one
2. Test new components in isolation
3. Replace usages one at a time
4. Verify functionality after each replacement
5. Remove old component once all usages are migrated

## Post-Implementation Tasks

1. Update documentation
2. Add comprehensive tests for both components
3. Review and optimize performance
4. Add proper error messages and loading states
5. Consider adding Storybook stories for both components