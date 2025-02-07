# Match System Refactoring Plan

## Current Issues
1. Match model incorrectly includes a `category` field suggesting matches are category-restricted
2. This doesn't align with the Swiss pairing system described in classment.md
3. Player categories are attributes of players, not matches
4. Current implementation may restrict matchmaking by category

## Required Changes

### 1. Match Model Updates
- Remove `category` field from Match interface
- Add player category tracking:
  ```typescript
  interface Match {
    id: string;
    date: string;
    createdAt?: string;
    updatedAt?: string;
    player1: string;
    player2: string;
    player1Rating: number;
    player2Rating: number;
    player1Category: string;  // Category of player1 at match time
    player2Category: string;  // Category of player2 at match time
    status: 'pending' | 'completed' | 'forfeit' | 'disputed';
    result?: MatchResult;
    isRandom: boolean;
    eventId?: string;
  }
  ```
- This change:
  1. Removes the incorrect assumption that matches belong to a category
  2. Preserves historical category information for both players
  3. Maintains all existing functionality while aligning with Swiss pairing system
  4. Allows proper tracking of category changes over time

### 2. MatchManager Updates
- Update createMatch method signature and implementation:
  ```typescript
  createMatch(player1: Player, player2: Player): Match {
    // No more category parameter
    return {
      id: `${Date.now()}-${player1.id}-${player2.id}`,
      date: new Date().toISOString().split('T')[0],
      player1: player1.id,
      player2: player2.id,
      player1Rating: player1.currentRating,
      player2Rating: player2.currentRating,
      player1Category: player1.category,  // Track category at match time
      player2Category: player2.category,  // Track category at match time
      status: 'pending',
      isRandom: false
    };
  }
  ```

- Update processMatch and processForfeitMatch:
  1. Replace all usage of `match.category` with player-specific categories
  2. Update PlayerMatch interface usage:
     ```typescript
     const player1Match: PlayerMatch = {
       // ... other fields ...
       categoryAtTime: match.player1Category  // Use player1's category
     };
     
     const player2Match: PlayerMatch = {
       // ... other fields ...
       categoryAtTime: match.player2Category  // Use player2's category
     };
     ```

- Remove category validation:
  - Delete isValidCategory check from createMatch
  - Categories are validated when setting on Player objects instead

- Update rating calculations:
  - Ensure RatingSystem properly handles players of different categories
  - Maintain K-factor adjustments based on player categories

### 3. Test Updates
- Update system.test.ts:
  ```typescript
  describe('Match Creation', () => {
    it('should create match between players of different categories', () => {
      player1.category = 'ONYX';
      player2.category = 'AMÉTHYSTE';
      const match = matchManager.createMatch(player1, player2);
      
      expect(match).toMatchObject({
        player1Category: 'ONYX',
        player2Category: 'AMÉTHYSTE',
        player1Rating: player1.currentRating,
        player2Rating: player2.currentRating
      });
    });

    it('should preserve categories at match time', async () => {
      // Test that categories are preserved even if player categories change later
      const match = matchManager.createMatch(player1, player2);
      const originalCategories = {
        player1: match.player1Category,
        player2: match.player2Category
      };
      
      // Simulate category changes
      player1.category = 'AMÉTHYSTE';
      player2.category = 'TOPAZE';
      
      expect(match.player1Category).toBe(originalCategories.player1);
      expect(match.player2Category).toBe(originalCategories.player2);
    });
  });
  ```

### 4. API Updates
- Update route handlers:
  ```typescript
  // Example of updated match creation endpoint
  export async function POST(request: Request) {
    try {
      const { player1Id, player2Id } = await request.json();
      const player1 = await getPlayer(player1Id);
      const player2 = await getPlayer(player2Id);
      
      // No category parameter needed
      const match = matchManager.createMatch(player1, player2);
      
      return NextResponse.json(match);
    } catch (error) {
      console.error('Error creating match:', error);
      return NextResponse.json(
        { error: 'Failed to create match' },
        { status: 500 }
      );
    }
  }
  ```

### 5. Database/Repository Layer
- Update any queries or schemas that reference match categories
- Ensure existing matches are migrated properly

## Implementation Order
1. Update Match interface and tests first
2. Modify MatchManager implementation
3. Update API endpoints
4. Update database layer
5. Run full test suite to verify changes

## Migration Considerations
- Existing matches in the database need category information moved
- Consider a data migration script if needed
- Ensure backwards compatibility during transition

## Validation Points
1. Verify Swiss pairing system works correctly
2. Confirm matches between different categories are allowed
3. Check historical tracking of player categories
4. Ensure rating calculations remain accurate
5. Verify all statistics and reporting still function