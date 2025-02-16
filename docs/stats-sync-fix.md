# Statistics Synchronization Fix

## Issue Identified
The player statistics in `players.json` are not being updated properly when matches are already marked as completed in the match data files. The statistics update logic exists but only triggers for newly completed matches.

## Technical Analysis

The issue occurs because:
1. Match data exists in `data/matches/[eventId].json` with completed status
2. Player data in `players.json` has statistics initialized at 0
3. The statistics update logic in `PlayerRepository.updatePlayerStatistics()` only runs when new matches are completed

## Solution

1. **Short-term Fix**
   - Use the existing `recalculatePlayerStatistics()` method to sync all players' statistics with their match histories
   - This will properly calculate:
     - Total matches played
     - Wins/losses/draws
     - Total PR and average DS
     - Best/worst ratings
     - Event participation stats

2. **Long-term Prevention**
   - Add a validation step in the match loading process to ensure statistics are always in sync
   - Consider adding a periodic background job to check and fix any inconsistencies
   - Add data integrity checks when loading player profiles

## Implementation Steps
1. Create an API endpoint `/api/players/recalculate` that can trigger statistics recalculation
2. Add data validation to the player profile loading process
3. Add automated testing to catch statistics inconsistencies

## Execution Plan
1. Switch to Code mode to implement the fix
2. Create the recalculation endpoint
3. Add validation to the player profile route
4. Test the fix with Elie's profile