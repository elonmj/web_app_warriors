# Match History URL Construction Fix

## Current Issue
The match history component fails with the error "Failed to parse URL from /api/players/elie-2025" due to problematic URL construction in the client component.

## Root Cause
1. URL construction happens before ID validation
2. Inconsistent URL handling between server and client components
3. Potential race condition with window.location.origin

## Solution
1. Modify PlayerMatchHistory.tsx to use relative URLs consistently:
   - Remove dependence on process.env.NEXT_PUBLIC_API_URL
   - Remove window.location.origin usage
   - Use relative URLs like the server components

2. Implementation steps:
   ```typescript
   // Before validation checks
   if (!playerId || typeof playerId !== 'string') {
     return <MatchHistoryError message="Invalid player ID" onRetry={handleReload} />;
   }

   if (!playerId.match(/^[a-zA-Z0-9-]+$/)) {
     return <MatchHistoryError message="Invalid player ID format" onRetry={handleReload} />;
   }

   // After validation, use relative URL
   const response = await fetch(
     `/api/players/${playerId}/matches?limit=${limit}&offset=${offset}`
   );
   ```

3. Benefits:
   - Consistent URL handling between server and client
   - No dependency on environment variables or window object
   - Simpler, more reliable implementation

## Testing
1. Verify match history loads correctly for existing players
2. Confirm proper error handling for invalid player IDs
3. Test pagination functionality

## Notes
- This approach aligns with Next.js best practices for API routes
- Maintains existing validation logic while improving reliability
- No changes needed to the API route implementation