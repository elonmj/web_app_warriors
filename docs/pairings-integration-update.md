# Pairings Integration Update Plan

## Current Structure Review
The event page already has:
1. Pairings tab using EventRoundPairings component
2. Round-based organization of matches
3. Filtering of matches by round number

## Required Updates

### 1. EventRoundPairings Component
Current functionality:
- Shows matches grouped by round
- Displays match details and status
- Handles bye matches
- Includes loading states

### 2. Round Organization
Currently uses:
```typescript
matches.filter(m => m.metadata?.round)
```

Update needed:
1. Sort rounds in chronological order (descending)
2. Group matches by round more efficiently
3. Show round dates from event metadata

### 3. Integration with EventService
Already implemented:
- Round number tracking in metadata
- Match round assignment
- Bye handling

### 4. UI Enhancements
1. Round Navigation:
- Keep current round indicator
- Add round dates from event metadata
- Improve round transitions

2. Match Display:
- Retain bye match handling
- Keep category indicators
- Maintain player information display

## Implementation Steps

1. Update EventPage:
```typescript
<EventRoundPairings
  eventId={eventId}
  currentRound={eventData.metadata?.currentRound || 1}
  matches={matches.filter(m => m.metadata?.round)}
  roundDates={eventData.metadata?.roundDates}
  isLoading={false}
/>
```

2. Enhance EventRoundPairings:
- Use round dates from event metadata
- Maintain all existing functionality
- Keep current round highlighting
- Preserve bye match handling

## Expected Result
- Clear round-based organization
- Proper display of current and past rounds
- Maintained bye match support
- Integrated round dates
- Preserved loading and error states

This approach builds on the existing implementation rather than creating new components, ensuring consistency and maintaining current functionality while adding needed improvements.