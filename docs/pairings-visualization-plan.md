# Pairings Visualization Enhancement Plan

## Objective
Create a real-time visualization of current round status and projected next round pairings that updates dynamically as match results are entered, following the tournament rules specified in classment.md.

## Implementation Plan

### 1. Component Restructuring

#### A. Simplified Props for EventRoundPairings
```typescript
interface EventRoundPairingsProps {
  eventId: string;
  currentRound: number;
  currentMatches: Match[];         // Current round matches
  projectedPairings: Match[];      // Next round projected pairings
  completedMatchCount: number;     // Number of completed matches in current round
  totalMatchCount: number;         // Total matches in current round
}
```

#### B. Remove Round Navigation
- Remove RoundSelector component
- Focus on current round and projected next round only
- Simplify the component to two main sections:
  1. Current Round Status
  2. Projected Next Round Pairings

### 2. Visual Design

#### A. Current Round Section
```tsx
<div className="mb-6">
  <h3 className="text-xl font-semibold mb-4">Current Round Status</h3>
  <div className="mb-4">
    <ProgressBar 
      completed={completedMatchCount}
      total={totalMatchCount}
    />
  </div>
  <div className="space-y-4">
    {currentMatches.map(match => (
      <CurrentRoundPairingCard
        key={match.id}
        match={match}
      />
    ))}
  </div>
</div>
```

#### B. Projected Pairings Section
```tsx
<div>
  <div className="flex items-center gap-2 mb-4">
    <h3 className="text-xl font-semibold">Next Round Projected Pairings</h3>
    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
      Based on {completedMatchCount} completed matches
    </span>
  </div>
  <div className="space-y-4">
    {projectedPairings.map(match => (
      <ProjectedPairingCard
        key={match.id}
        match={match}
      />
    ))}
  </div>
</div>
```

### 3. Real-time Updates

- Subscribe to match result updates
- On each result update:
  1. Update current round status
  2. Recalculate player rankings
  3. Generate new projected pairings using rules from classment.md
  4. Animate changes in projected pairings

### 4. Visual Indicators

#### A. Current Round Status
- Clear progress indicator showing completed vs total matches
- Match status indicators (pending, completed, disputed, forfeit)
- Match result display with scores and statistics

#### B. Projected Pairings
- Visual distinction for projected pairings
- Highlight changes when projections update
- Include current player rankings/categories in projected matchups

### 5. Implementation Steps

1. **Phase 1: Core Restructuring**
   - Remove round navigation
   - Split into current/projected sections
   - Implement basic layouts

2. **Phase 2: Real-time Updates**
   - Integrate with match result updates
   - Implement ranking recalculation
   - Update projected pairings
   - Add change animations

3. **Phase 3: Visual Polish**
   - Enhance progress indicators
   - Add status displays
   - Implement change highlighting
   - Add tooltips and explanations

### 6. Integration Points

1. **Event Page Integration**
- Ensure proper placement within the 4 main sections:
  - Matches (current round)
  - Statistics
  - Rankings
  - Pairings (projected)

2. **Data Flow**
- Match results from MatchResultForm
- Rankings recalculation
- Pairing algorithm application
- Real-time updates to projected pairings

### 7. Testing Requirements

1. **Functionality Testing**
- Real-time updates working correctly
- Ranking recalculation accuracy
- Pairing algorithm compliance
- Progress tracking accuracy

2. **Visual Testing**
- Layout in all states
- Animation smoothness
- Status indicator clarity
- Mobile responsiveness

3. **Integration Testing**
- Event page interaction
- Data flow verification
- Performance testing

## Next Steps

1. Begin core restructuring of EventRoundPairings component
2. Remove round navigation and implement new layout
3. Add real-time update capabilities
4. Integrate with ranking and pairing systems
5. Implement visual enhancements
6. Test and validate against requirements