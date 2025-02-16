# Match Pairings Implementation Plan

## Overview
Implement a dedicated pairing display system for events that shows both upcoming pairings and completed matches in an organized, round-based format.

## Data Structure
Current data model supports pairings through:
- Match.metadata.round: Tracks round numbers
- Match.status: 'pending' for upcoming matches
- Match.result: Contains completed match details

## UI Components

### 1. Round-based Pairings Display
```tsx
// src/app/components/EventRoundPairings.tsx
interface RoundPairingsProps {
  eventId: string;
  round: number;
  matches: Match[];
}
```

Key features:
- Group matches by round number
- Show player names, ratings, and categories
- Display match status (pending/completed)
- Include scheduling information

### 2. Match Status Indicators
Visual indicators for different match states:
- Pending: Awaiting play
- In Progress: Match day arrived but no result
- Completed: Show result
- Disputed/Forfeit: Special status indicators

### 3. Integration with Event Page

Update event page layout to include:
1. Event Header (existing)
2. Current Round Pairings (new)
3. Match History (existing)
4. Rankings (existing)

## Implementation Steps

1. Backend Enhancements
```typescript
// src/api/services/EventService.ts
interface RoundPairings {
  round: number;
  matches: Match[];
  scheduledDate?: Date;
}

// Add methods:
getRoundPairings(eventId: string, round: number): Promise<RoundPairings>
getCurrentRoundPairings(eventId: string): Promise<RoundPairings>
```

2. Frontend Components
- Create EventRoundPairings component
- Add round navigation controls
- Implement status indicators
- Add loading states

3. API Endpoints
```typescript
// src/app/api/events/[eventId]/rounds/[round]/route.ts
GET /api/events/{eventId}/rounds/{round}
```

4. UI/UX Considerations
- Clear visual hierarchy for rounds
- Responsive design for mobile/desktop
- Loading states and error handling
- Accessibility considerations

## Visual Design

### Desktop Layout
```
[Round Navigator]
Round X - Date

[Pairing Card]
Player 1 (1200) vs Player 2 (1150)
Status: Pending
Schedule: Feb 20, 2025

[Pairing Card]
Player 3 (1300) vs Player 4 (1280)
Result: 3-1
```

### Mobile Layout
- Stack pairings vertically
- Collapse additional information
- Swipe between rounds

## Error States
- Handle loading states
- Show appropriate messages for:
  - No pairings available
  - Round not started
  - Network errors

## Future Enhancements
1. Add filtering capabilities
2. Implement match rescheduling
3. Add tournament bracket visualization
4. Enable pairing modifications by admins

## Testing Plan
1. Unit tests for pairing logic
2. Integration tests for API endpoints
3. UI component testing
4. End-to-end testing of full flow

## Documentation
- Update API documentation
- Add component usage examples
- Document pairing display logic
- Include accessibility guidelines