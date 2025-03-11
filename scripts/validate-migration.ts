import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

import type { Match } from '@/types/Match';
import type { EventRanking } from '@/types/EventRanking';

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    stats: {
        totalPlayers: number;
        totalMatches: number;
        totalRankings: number;
        invalidPlayerIds: number;
        invalidMatchIds: number;
        invalidRankingIds: number;
        missingReferences: number;
    };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const MATCHES_DIR = path.join(DATA_DIR, 'matches');
const RANKINGS_DIR = path.join(DATA_DIR, 'rankings');

// Update this function to validate numeric IDs instead of UUIDs
function isValidId(id: unknown): boolean {
  // Check if the ID is a number or a string containing only digits
  return (
    typeof id === 'number' || 
    (typeof id === 'string' && /^\d+$/.test(id))
  );
}

async function validateMigrationData(): Promise<ValidationResult> {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        stats: {
            totalPlayers: 0,
            totalMatches: 0,
            totalRankings: 0,
            invalidPlayerIds: 0,
            invalidMatchIds: 0,
            invalidRankingIds: 0,
            missingReferences: 0
        }
    };

    try {
        // Load players data
        const playersData = await fs.readFile(PLAYERS_FILE, 'utf-8');
        const { players } = JSON.parse(playersData);
        result.stats.totalPlayers = players.length;

        // Validate player IDs
        const playerIds = new Set<number>();
        for (const player of players) {
            if (!isValidId(player.id)) {
                result.errors.push(`Invalid ID found for player: ${player.name} (${player.id})`);
                result.stats.invalidPlayerIds++;
                result.isValid = false;
            }
            playerIds.add(typeof player.id === 'string' ? parseInt(player.id) : player.id);
        }

      // Load and validate match files
      const matchFiles = await glob('**/*.json', { cwd: MATCHES_DIR });
      result.stats.totalMatches = matchFiles.length;

      // Track matches with non-UUID IDs for better reporting
      const matchesWithOldIds = new Set<string | number>();

      for (const matchFile of matchFiles) {
        const filePath = path.join(MATCHES_DIR, matchFile);
        const data = await fs.readFile(filePath, 'utf-8');
        const matchData = JSON.parse(data) as { matches: Match[] };

        // Validate matches
        if (Array.isArray(matchData.matches)) {
          for (const match of matchData.matches) {
            // Check if player1 ID is a valid numeric ID
            if (match.player1?.id) {
              if (!isValidId(match.player1.id)) {
                result.errors.push(`Invalid ID found for player1 in match: ${match.id} in file ${matchFile} (ID: ${match.player1.id})`);
                result.stats.invalidMatchIds++;
                result.isValid = false;
                matchesWithOldIds.add(String(match.id));
              }

              // Check if player reference exists
              const player1Id = typeof match.player1.id === 'string' ? parseInt(match.player1.id) : match.player1.id;
              if (!playerIds.has(player1Id)) {
                result.errors.push(`Missing player reference: ${match.player1.id} in match file: ${matchFile}`);
                result.stats.missingReferences++;
                result.isValid = false;
              }
            }

            // Check if player2 ID is a valid numeric ID
            if (match.player2?.id) {
              if (!isValidId(match.player2.id)) {
                result.errors.push(`Invalid ID found for player2 in match: ${match.id} in file ${matchFile} (ID: ${match.player2.id})`);
                result.stats.invalidMatchIds++;
                result.isValid = false;
                matchesWithOldIds.add(String(match.id));
              }

              // Check if player reference exists
              const player2Id = typeof match.player2.id === 'string' ? parseInt(match.player2.id) : match.player2.id;
              if (!playerIds.has(player2Id)) {
                result.errors.push(`Missing player reference: ${match.player2.id} in match file: ${matchFile}`);
                result.stats.missingReferences++;
                result.isValid = false;
              }
            }
          }
        }
      }

      // Log summary of matches with old IDs if any
      if (matchesWithOldIds.size > 0) {
        result.errors.push(`Found ${matchesWithOldIds.size} matches with non-numeric player IDs that need migration`);
      }

      // Load and validate ranking files
      const rankingFiles = await glob('**/*.json', { cwd: RANKINGS_DIR });
      result.stats.totalRankings = rankingFiles.length;

      for (const rankingFile of rankingFiles) {
        const filePath = path.join(RANKINGS_DIR, rankingFile);
        const data = await fs.readFile(filePath, 'utf-8');
        const rankingData = JSON.parse(data) as { ranking: EventRanking[] };

        // Validate ranking entries
        if (Array.isArray(rankingData.ranking)) {
          for (const entry of rankingData.ranking) {
            if (entry.playerId) {
              if (!isValidId(entry.playerId)) {
                result.errors.push(
                  `Invalid ID found for player in ranking file: ${rankingFile} (player ID: ${entry.playerId})`
                );
                result.stats.invalidRankingIds++;
                result.isValid = false;
              }
              const playerId = typeof entry.playerId === 'string' ? parseInt(entry.playerId) : entry.playerId;
              if (!playerIds.has(playerId)) {
                result.errors.push(
                  `Missing player reference: ${entry.playerId} in ranking file: ${rankingFile}`
                );
                result.stats.missingReferences++;
                result.isValid = false;
              }
            }
          }
        }
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

// Execute validation if run directly using top-level await
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const result = await validateMigrationData();
        console.log('\nMigration Validation Results:');
        console.log('---------------------------');
        console.log(`Valid: ${result.isValid ? 'Yes' : 'No'}`);
        console.log('\nStatistics:');
        console.log(`Total Players: ${result.stats.totalPlayers}`);
        console.log(`Total Matches: ${result.stats.totalMatches}`);
        console.log(`Total Rankings: ${result.stats.totalRankings}`);
        console.log(`Invalid Player IDs: ${result.stats.invalidPlayerIds}`);
        console.log(`Invalid Match IDs: ${result.stats.invalidMatchIds}`);
        console.log(`Invalid Ranking IDs: ${result.stats.invalidRankingIds}`);
        console.log(`Missing References: ${result.stats.missingReferences}`);

        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        process.exit(result.isValid ? 0 : 1);
    }
    catch (error) {
        console.error('Validation script failed:', error);
        process.exit(1);
    }
}

export { validateMigrationData };
export type { ValidationResult };