# Match Result Implementation Plan

## Match Result Page
Location: `src/app/event/[eventId]/match/[matchId]/page.tsx`

### Components Structure
```tsx
// Main Page Component
export default function MatchResultPage({ params }) {
  // Get match and player data
  // Display match details and form
  // Handle result submission
}

// Layout will include:
1. Match header with player names and categories
2. MatchResultForm component
3. Status/validation indicators
4. Success/error messages
```

### Data Flow
1. Load match details and player info
2. Display form with:
   - Score inputs for both players
   - Automatic calculations (PR, PDI, DS)
   - Validation status
3. On submit:
   - Save match result
   - Update rankings
   - Show success message
   - Redirect to event page

### Enhanced MatchResultForm Component
Update `src/app/components/MatchResultForm.tsx`:

```tsx
interface MatchResultFormProps {
  match: Match;
  player1: Player;
  player2: Player;
  onSubmit: (result: MatchResult) => void;
}

interface MatchResult {
  score: [number, number];
  pr: number;    // Points Ranking
  pdi: number;   // Point Difference Index
  ds: number;    // Dominant Score
  validation: {
    player1Approved: boolean;
    player2Approved: boolean;
    timestamp: string;
    status: ValidationStatusType;
  };
}
```

Add new features:
1. Automatic PR calculation:
   - Win = 3 points
   - Draw = 1 point
   - Loss = 0 points

2. PDI calculation:
   ```typescript
   const calculatePDI = (score1: number, score2: number) => {
     const totalPoints = score1 + score2;
     if (totalPoints === 0) return 0;
     return Math.abs(score1 - score2) / totalPoints;
   };
   ```

3. DS (Dominant Score) calculation:
   ```typescript
   const calculateDS = (score1: number, score2: number) => {
     const pdi = calculatePDI(score1, score2);
     const threshold = 0.8; // configurable
     return pdi >= threshold ? 100 : Math.floor(pdi * 100);
   };
   ```

4. Form validation:
   - Scores must be non-negative
   - At least one score must be > 0
   - PDI calculation must be valid
   - Both players must eventually approve

### API Updates

1. Update `/api/matches/result` endpoint:
```typescript
POST /api/matches/result
Body: {
  matchId: string;
  eventId: string;
  score: [number, number];
  pr: number;
  pdi: number;
  ds: number;
}
```

2. Add validation middleware:
```typescript
const validateMatchResult = (req, res, next) => {
  // Validate all required fields
  // Check score format
  // Verify calculations
  // Check player permissions
};
```

3. Update sequence:
```typescript
try {
  // Save match result
  await matchService.saveResult(matchId, result);
  
  // Update rankings
  await rankingService.updateEventRankings(eventId);
  
  // Return success
  res.json({ success: true });
} catch (error) {
  // Handle errors
}
```

### UI/UX Considerations

1. Real-time calculations:
   - Show PR as scores are entered
   - Display PDI percentage
   - Indicate DS threshold

2. Validation feedback:
   - Highlight invalid inputs
   - Show calculation explanations
   - Display clear error messages

3. Status indicators:
   - Match status (pending/completed)
   - Validation status
   - Player approvals

4. Responsive design:
   - Mobile-friendly inputs
   - Clear CTAs
   - Accessible form controls

### Testing Plan

1. Unit Tests:
   - PR calculation
   - PDI calculation
   - DS calculation
   - Form validation

2. Integration Tests:
   - API endpoints
   - Data flow
   - Rankings update

3. E2E Tests:
   - Full submission flow
   - Error handling
   - Navigation

### Implementation Steps

1. Frontend:
   - Create match result page
   - Enhance MatchResultForm
   - Add real-time calculations
   - Implement validation

2. Backend:
   - Update API endpoints
   - Add validation middleware
   - Enhance error handling
   - Integrate with RankingService

3. Testing:
   - Write test cases
   - Add test data
   - Test edge cases

4. Documentation:
   - API documentation
   - Component usage
   - Calculation formulas
   - Testing guide