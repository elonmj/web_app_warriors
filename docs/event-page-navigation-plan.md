# Event Page Navigation Enhancement Plan

## Objective
Create a unified navigation system for event pages that enables seamless navigation between rounds while maintaining consistent data across all four main sections: Matches, Statistics, Rankings, and Pairings.

## Data Flow Analysis

### 1. Data Sources
- **Events** (`events.json`):
  - Current round information
  - Event metadata
  - Total rounds
- **Matches** (`matches/[eventId].json`):
  - Round-specific match data
  - Match status and results
- **Rankings** (`rankings/[eventId].json`):
  - Round-specific rankings
  - Historical ranking data

## Implementation Plan

### 1. Page Structure

```typescript
// src/app/event/[eventId]/page.tsx
interface EventPageProps {
  params: {
    eventId: string;
    round?: string;  // Optional round parameter
  };
}
```

### 2. Navigation Components

#### A. Main Section Tabs
```typescript
interface MainNavProps {
  eventId: string;
  currentRound: number;
  activeSection: 'matches' | 'statistics' | 'rankings' | 'pairings';
}

const sections = [
  { id: 'matches', label: 'Matches' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'pairings', label: 'Pairings' }
];
```

#### B. Round Navigation
```typescript
interface RoundNavProps {
  eventId: string;
  currentRound: number;
  totalRounds: number;
  onRoundChange: (round: number) => void;
}
```

### 3. Data Management

#### A. Round State Management
```typescript
interface RoundState {
  currentRound: number;
  matches: Match[];
  rankings: Ranking[];
  statistics: EventStatistics;
  projectedPairings?: Match[];
}
```

#### B. API Routes
1. Update existing routes to support round parameter:
```typescript
// src/app/api/events/[eventId]/rounds/[round]/route.ts
GET /api/events/[eventId]/rounds/[round]
```

2. New endpoints for round-specific data:
```typescript
GET /api/events/[eventId]/rounds/[round]/matches
GET /api/events/[eventId]/rounds/[round]/rankings
GET /api/events/[eventId]/rounds/[round]/statistics
GET /api/events/[eventId]/rounds/[round]/pairings
```

### 4. Component Updates

#### A. Event Page Layout
```tsx
<div className="space-y-6">
  <EventHeader eventId={eventId} />
  
  <div className="flex items-center justify-between">
    <MainSectionTabs
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
    <RoundNavigation
      currentRound={currentRound}
      totalRounds={totalRounds}
      onRoundChange={handleRoundChange}
    />
  </div>

  <div className="mt-6">
    {activeSection === 'matches' && (
      <EventRoundMatches
        eventId={eventId}
        round={currentRound}
        matches={roundData.matches}
      />
    )}
    {/* Similar conditionals for other sections */}
  </div>
</div>
```

#### B. Round Navigation Component
```tsx
const RoundNavigation = ({ currentRound, totalRounds, onRoundChange }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onRoundChange(currentRound - 1)}
      disabled={currentRound === 1}
      className="round-nav-button"
    >
      Previous
    </button>
    
    <select 
      value={currentRound}
      onChange={(e) => onRoundChange(Number(e.target.value))}
      className="round-selector"
    >
      {Array.from({ length: totalRounds }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          Round {i + 1}
        </option>
      ))}
    </select>

    <button
      onClick={() => onRoundChange(currentRound + 1)}
      disabled={currentRound === totalRounds}
      className="round-nav-button"
    >
      Next
    </button>
  </div>
);
```

### 5. State and Data Loading

1. **URL State Management**
```typescript
// Update URL when round or section changes
const updateURL = (section: string, round: number) => {
  router.push(`/event/${eventId}?section=${section}&round=${round}`);
};
```

2. **Data Loading Strategy**
```typescript
const loadRoundData = async (round: number) => {
  const [matches, rankings, statistics, pairings] = await Promise.all([
    fetchRoundMatches(eventId, round),
    fetchRoundRankings(eventId, round),
    fetchRoundStatistics(eventId, round),
    fetchProjectedPairings(eventId, round)
  ]);

  setRoundData({ matches, rankings, statistics, pairings });
};
```

### 6. Implementation Steps

1. **Phase 1: Navigation Structure**
   - Create MainSectionTabs component
   - Implement RoundNavigation component
   - Set up URL-based state management

2. **Phase 2: Data Integration**
   - Update API routes for round-specific data
   - Implement data loading functions
   - Add loading states and error handling

3. **Phase 3: Component Updates**
   - Update EventRoundPairings to remove internal round navigation
   - Modify other section components to accept round prop
   - Implement round-aware displays

4. **Phase 4: State Management**
   - Set up centralized round state
   - Implement data caching for better performance
   - Add state persistence where needed

### 7. Testing Requirements

1. **Navigation Testing**
   - Round changes update all sections correctly
   - URL updates reflect current state
   - Navigation controls disabled appropriately

2. **Data Consistency**
   - All sections show correct data for selected round
   - Data remains consistent across section switches
   - Loading states handled properly

3. **Performance Testing**
   - Smooth transitions between rounds
   - Efficient data loading and caching
   - Minimal unnecessary re-renders

## Next Steps

1. Begin implementation of navigation structure
2. Update API routes to support round parameters
3. Modify existing components for round awareness
4. Implement state management system
5. Add loading and error states
6. Test and validate all functionality