# Event Page Pairings Integration

## Overview
Integrate the new EventRoundPairings component into the existing event page structure, maintaining consistency with current tabs and layout.

## Changes Required

### 1. Update TabNav Configuration

Add "Pairings" as a new tab in the existing TabNav component:

```typescript
<TabNav
  defaultTab="matches"
  tabs={[
    {
      id: "pairings",
      label: "Pairings",
      content: (
        <div className="rounded-lg border border-onyx-200 dark:border-onyx-800">
          <EventRoundPairings
            eventId={eventId}
            currentRound={eventData.metadata?.currentRound || 1}
            matches={matches}
          />
        </div>
      ),
    },
    // Existing tabs...
    {
      id: "matches",
      label: "Matches",
      content: matchesForDisplay.length > 0 ? (
        <EventMatchHistory matches={matchesForDisplay} />
      ) : (
        <div className="text-center py-8 text-onyx-500 dark:text-onyx-400">
          No matches played yet.
        </div>
      ),
    },
    {
      id: "rankings",
      label: "Rankings",
      content: (
        <div className="rounded-lg border border-onyx-200 dark:border-onyx-800">
          <PlayerRankings eventRanking={eventRanking} />
        </div>
      ),
    },
    {
      id: "statistics",
      label: "Statistics",
      content: // ... existing statistics content
    },
  ]}
/>
```

### 2. Imports
Add import for the new component:
```typescript
import EventRoundPairings from "@/app/components/EventRoundPairings";
```

### 3. Data Flow
The component will use the existing data fetching:
- Event data already fetched via `getEvent`
- Matches already fetched via `getMatches`
- No additional data fetching needed

### 4. Styling
- Match the existing dark mode support
- Use consistent border styling with other tabs
- Maintain responsive layout patterns

### 5. Tab Order
Place "Pairings" first in the tab order since it's most relevant for ongoing events:
1. Pairings (new)
2. Matches (existing)
3. Rankings (existing)
4. Statistics (existing)

## Next Steps
1. Switch to Code mode
2. Implement the changes to src/app/event/[eventId]/page.tsx
3. Test the integration
4. Verify dark mode appearance
5. Test responsive behavior