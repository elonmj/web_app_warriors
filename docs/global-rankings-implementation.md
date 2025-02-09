# Global Rankings Implementation Details

## Overview
This document provides specific implementation details for adding global player rankings based on the approved plan in `global-rankings-plan.md`.

## Backend Implementation

### 1. RankingService Changes

Add new method to RankingService:

```typescript
public async getGlobalRankings(): Promise<EventRanking> {
  try {
    // Get all players
    const players = await this.playerRepository.getAllPlayers();
    
    // Map players to ranking format
    const rankings: PlayerRanking[] = players
      .filter(player => player.active) // Only include active players
      .map(player => ({
        playerId: player.id,
        rank: 0, // Will be calculated after sorting
        points: 0, // Not used in global rankings
        matches: player.statistics.totalMatches,
        wins: player.statistics.wins,
        draws: player.statistics.draws,
        losses: player.statistics.losses,
        rating: player.currentRating,
        ratingChange: 0, // Could calculate from last match if needed
        category: player.category,
        playerDetails: {
          name: player.name,
          currentRating: player.currentRating,
          category: player.category
        }
      }));

    // Sort rankings by rating (descending)
    rankings.sort((a, b) => {
      // First by rating
      if (b.rating !== a.rating) return b.rating - a.rating;
      // Then by win ratio for tiebreaking
      const aWinRatio = a.wins / (a.matches || 1);
      const bWinRatio = b.wins / (b.matches || 1);
      return bWinRatio - aWinRatio;
    });

    // Assign ranks with proper tie handling
    let currentRank = 1;
    let currentRating = -1;
    let currentWinRatio = -1;
    let tiedCount = 0;

    rankings.forEach((ranking, index) => {
      const winRatio = ranking.wins / (ranking.matches || 1);
      
      if (ranking.rating === currentRating && 
          winRatio === currentWinRatio) {
        // Same rank for tied players
        ranking.rank = currentRank;
        tiedCount++;
      } else {
        // New rank, accounting for any previous ties
        currentRank = index + 1;
        ranking.rank = currentRank;
        currentRating = ranking.rating;
        currentWinRatio = winRatio;
        tiedCount = 0;
      }
    });

    const globalRanking: EventRanking = {
      eventId: 'global', // Special ID for global rankings
      lastUpdated: new Date().toISOString(),
      rankings
    };

    return globalRanking;
  } catch (error) {
    console.error('Error generating global rankings:', error);
    throw new Error('Failed to generate global rankings');
  }
}
```

### 2. API Endpoint

Create new file `src/app/api/rankings/global/route.ts`:

```typescript
import { RankingService } from '@/api/services/RankingService';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const rankingService = new RankingService();
    const globalRankings = await rankingService.getGlobalRankings();
    
    return Response.json(globalRankings);
  } catch (error) {
    console.error('Global rankings error:', error);
    return Response.json(
      { error: 'Failed to fetch global rankings' },
      { status: 500 }
    );
  }
}
```

## Frontend Implementation

### 1. Rankings Page

Create new file `src/app/rankings/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import PlayerRankings from '@/app/components/PlayerRankings';
import { EventRanking } from '@/types/Ranking';

export default function RankingsPage() {
  const [rankings, setRankings] = useState<EventRanking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings/global');
        if (!response.ok) throw new Error('Failed to fetch rankings');
        const data = await response.json();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Global Rankings
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Players ranked by their current rating
      </p>
      <PlayerRankings eventRanking={rankings} isGlobal={true} />
    </main>
  );
}
```

### 2. PlayerRankings Component Changes

Modify `src/app/components/PlayerRankings.tsx` to add isGlobal prop:

```typescript
interface PlayerRankingsProps {
  eventRanking: EventRanking | null;
  isGlobal?: boolean;
}

export default function PlayerRankings({ eventRanking, isGlobal }: PlayerRankingsProps) {
  // Existing code...

  return (
    <div className="mt-8 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {isGlobal ? 'Current Global Rankings' : 'Current Rankings'}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(eventRanking.lastUpdated).toLocaleString()}
        </p>
      </div>
      
      {/* Rest of the existing component code... */}
      {/* No need to modify table structure as it already shows relevant info */}
    </div>
  );
}
```

### 3. Navigation Link

Modify the layout.tsx file to add the rankings link:

```typescript
// Add between Events and Rules links:
<Link
  href="/rankings"
  className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
>
  Rankings
</Link>
```

## Implementation Steps

1. Backend Changes:
   - Add getGlobalRankings to RankingService
   - Create and test /api/rankings/global endpoint
   - Add tests for new functionality

2. Frontend Changes:
   - Create /rankings page
   - Update PlayerRankings component
   - Add navigation link
   - Test responsive design and dark mode

3. Testing:
   - Verify rankings calculation logic
   - Test sorting and tie-breaking
   - Check navigation and routing
   - Verify data loading states
   - Test error handling
   - Verify dark mode compatibility

4. Deployment:
   - Deploy backend changes first
   - Verify API endpoint functionality
   - Deploy frontend changes
   - Verify end-to-end functionality

## Next Steps

Once implementation plan is approved, we can switch to Code mode to implement these changes step by step.