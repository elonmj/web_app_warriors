# Data Display Implementation Plan

## Current Issues
1. Event API route incorrectly parses events.json structure
2. Missing API routes for rankings and matches data
3. Event page not showing complete event information
4. Rankings calculation not implemented

## Implementation Steps

### 1. Fix Event API Route
- Update src/app/api/event/[id]/route.ts to properly parse events.json structure
- Add proper error handling and type checking
- Ensure all event metadata is returned (totalPlayers, totalMatches, etc.)

### 2. Create Rankings API Route
- Create new API route: src/app/api/rankings/[eventId]/route.ts
- Read rankings data from data/rankings/{eventId}.json
- Include proper error handling for missing files
- Return full rankings data with player information

### 3. Create Matches API Route
- Create new API route: src/app/api/matches/[eventId]/route.ts  
- Read matches data from data/matches/{eventId}.json
- Include proper error handling
- Return complete match history for the event

### 4. Update Event Page Components
- Update calculateRankings() to fetch from rankings API
- Modify EventHeader to show all event metadata
- Update EventStats to display complete statistics
- Enhance PlayerRankings to show full ranking information

### 5. Data Integration Testing
- Test all API routes with sample data
- Verify proper error handling
- Ensure all data is displayed correctly on frontend
- Add loading states for data fetching

## Next Steps
1. Fix event API route bug
2. Implement rankings and matches API routes
3. Update frontend components
4. Test with sample data