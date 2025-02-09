# Global Rankings Implementation Plan

## Overview
Add a new feature to display global player rankings based on their current ratings, separate from event-specific rankings.

## Components to Create/Modify

### 1. Backend
- Add new method `getGlobalRankings()` to RankingService that:
  - Gets all players
  - Sorts them by current rating
  - Assigns ranks with tie handling
  - Returns in PlayerRanking format

- Create new API endpoint `/api/rankings/global` that:
  - Uses RankingService.getGlobalRankings()
  - Returns global rankings data

### 2. Frontend
- Create new page `/rankings/page.tsx` to:
  - Display global rankings
  - Use existing PlayerRankings component
  - Add loading and error states

- Modify PlayerRankings component to:
  - Handle both event and global rankings display modes
  - Adjust column visibility based on mode (hide event-specific columns in global mode)

### 3. Navigation
- Add "Rankings" link to navigation bar in layout.tsx
- Place between "Events" and "Rules" links
- Use consistent styling with other nav items

## Implementation Steps

1. Backend Implementation
   - Implement getGlobalRankings in RankingService
   - Create and test API endpoint

2. Frontend Implementation
   - Create rankings page
   - Modify PlayerRankings component
   - Add navigation link

3. Testing
   - Test API endpoint
   - Verify rankings calculation
   - Check responsive design
   - Test navigation and routing

## Validation
- Rankings should be based on current player ratings
- UI should be consistent with existing design
- Navigation should be intuitive
- Performance should be optimized for potentially large player lists

## Notes
- Event rankings and global rankings serve different purposes:
  - Event rankings: Performance in a specific event (points-based)
  - Global rankings: Overall player skill level (rating-based)