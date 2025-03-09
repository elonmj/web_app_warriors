import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { remove as removeDiacritics } from 'diacritics';
import type { Player } from '@/types/Player';
import { mkdir } from 'node:fs/promises';

interface PlayerIdMap {
    [oldId: string]: number;
}

interface MigrationStats {
  totalPlayers: number;
  totalMatches: number;
  totalRankings: number;
  updatedPlayers: number;
  updatedMatches: number;
  updatedRankings: number;
  errors: string[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const MATCHES_DIR = path.join(DATA_DIR, 'matches');
const RANKINGS_DIR = path.join(DATA_DIR, 'rankings');
const BACKUP_DIR = path.join(DATA_DIR, 'backups', getTimestamp());

// Helper function to generate timestamp for backup folders
function getTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
}

// Create initial backup of all data files
async function createInitialBackup(): Promise<void> {
  console.log('Creating initial backup...');

  // Create backup directory
  await mkdir(BACKUP_DIR, { recursive: true });

  // Backup players.json
  const playersData = await fs.readFile(PLAYERS_FILE);
  await fs.writeFile(path.join(BACKUP_DIR, 'players.json'), playersData);

  // Backup all match files
  const matchFiles = await glob('**/*.json', { cwd: MATCHES_DIR });
  for (const matchFile of matchFiles) {
    const matchData = await fs.readFile(path.join(MATCHES_DIR, matchFile));
    const backupPath = path.join(BACKUP_DIR, 'matches', matchFile);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, matchData);
  }

  // Backup all ranking files
  const rankingFiles = await glob('**/*.json', { cwd: RANKINGS_DIR });
  for (const rankingFile of rankingFiles) {
    const rankingData = await fs.readFile(path.join(RANKINGS_DIR, rankingFile));
    const backupPath = path.join(BACKUP_DIR, 'rankings', rankingFile);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, rankingData);
  }
  console.log(`Backup created at: ${BACKUP_DIR}`);
}

// Load players data directly from players.json
async function loadPlayersData(): Promise<Player[]> {
  const data = await fs.readFile(PLAYERS_FILE, 'utf-8');
  return JSON.parse(data).players;
}

// Assign sequential IDs to all players (sorted by name)
async function assignSequentialIds(players: Player[]): Promise<{
  oldToNew: Record<string, number>,
  nameToId: Record<string, number>
}> {
  console.log('Assigning new sequential IDs to players...');
  
  // Sort players by name for consistent ID assignment
  const sortedPlayers = [...players].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, {sensitivity: 'base'})
  );
  
  const oldToNew: Record<string, number> = {};
  const nameToId: Record<string, number> = {};
  
  // Assign sequential IDs (starting from 1)
  sortedPlayers.forEach((player, index) => {
    const newId = index + 1;
    
    // Map old ID to new ID
    oldToNew[player.id] = newId;
    
    // Also map names to new IDs (lowercase and normalized for better matching)
    nameToId[player.name.toLowerCase()] = newId;
    nameToId[removeDiacritics(player.name).toLowerCase()] = newId;
    
    // Add ISC username mapping if available
    if (player.iscUsername) {
      nameToId[player.iscUsername.toLowerCase()] = newId;
    }
    
    console.log(`${player.name}: ${player.id} → ${newId}`);
  });
  
  console.log(`Created mappings for ${Object.keys(oldToNew).length} players`);
  
  return { oldToNew, nameToId };
}

// Update players.json with new sequential IDs
async function updatePlayersFile(oldToNew: Record<string, number>): Promise<number> {
  console.log('Updating players.json with new IDs...');
  
  const data = await fs.readFile(PLAYERS_FILE, 'utf-8');
  const playersData = JSON.parse(data);
  let updatedCount = 0;
  
  // Update player IDs
  for (const player of playersData.players) {
    const oldId = player.id;
    const newId = oldToNew[oldId];
    
    if (newId) {
      player.id = newId;
      updatedCount++;
      
      // Also update opponent references in match history
      if (player.matches && Array.isArray(player.matches)) {
        for (const match of player.matches) {
          if (match.opponent?.id) {
            const opponentNewId = oldToNew[match.opponent.id];
            if (opponentNewId) {
              match.opponent.id = opponentNewId;
            }
          }
        }
      }
    }
  }
  
  // Write updated data
  await fs.writeFile(PLAYERS_FILE, JSON.stringify(playersData, null, 2));
  console.log(`Updated ${updatedCount} players in players.json`);
  
  return updatedCount;
}

// Update all match files with new sequential IDs
async function updateMatchFiles(
  oldToNew: Record<string, number>,
  nameToId: Record<string, number>
): Promise<{ updatedFiles: number, updatedReferences: number }> {
  console.log('Updating match files with new IDs...');
  
  let updatedFiles = 0;
  let updatedReferences = 0;
  const matchFiles = await glob('**/*.json', { cwd: MATCHES_DIR });
  
  for (const matchFile of matchFiles) {
    const filePath = path.join(MATCHES_DIR, matchFile);
    console.log(`Processing ${matchFile}...`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    let matchData = JSON.parse(data);
    
    // Ensure matches array exists
    if (!matchData.matches) {
      matchData = { matches: Array.isArray(matchData) ? matchData : [matchData] };
    }
    
    let fileUpdated = false;
    
    // Update player IDs in matches
    if (Array.isArray(matchData.matches)) {
      for (const match of matchData.matches) {
        // Update player1 ID
        if (match.player1?.id) {
          // Try direct mapping from old ID
          let newId = oldToNew[match.player1.id];
          
          // If not found, try by player name
          if (!newId && match.player1.name) {
            newId = nameToId[match.player1.name.toLowerCase()];
          }
          
          if (newId) {
            console.log(`Updating player1 ID: ${match.player1.id} → ${newId}`);
            match.player1.id = newId;
            fileUpdated = true;
            updatedReferences++;
          }
        }
        
        // Update player2 ID
        if (match.player2?.id) {
          // Try direct mapping from old ID
          let newId = oldToNew[match.player2.id];
          
          // If not found, try by player name
          if (!newId && match.player2.name) {
            newId = nameToId[match.player2.name.toLowerCase()];
          }
          
          if (newId) {
            console.log(`Updating player2 ID: ${match.player2.id} → ${newId}`);
            match.player2.id = newId;
            fileUpdated = true;
            updatedReferences++;
          }
        }
      }
    }
    
    if (fileUpdated) {
      await fs.writeFile(filePath, JSON.stringify(matchData, null, 2));
      updatedFiles++;
    }
  }
  
  console.log(`Updated ${updatedReferences} references in ${updatedFiles} match files`);
  return { updatedFiles, updatedReferences };
}

// Update all ranking files with new sequential IDs
async function updateRankingFiles(
  oldToNew: Record<string, number>,
  nameToId: Record<string, number>
): Promise<{ updatedFiles: number, updatedReferences: number }> {
  console.log('Updating ranking files with new IDs...');
  
  let updatedFiles = 0;
  let updatedReferences = 0;
  
  // First, verify if ranking directory exists
  try {
    await fs.access(RANKINGS_DIR);
  } catch (error) {
    console.warn(`Rankings directory not found at ${RANKINGS_DIR}. Creating it...`);
    await fs.mkdir(RANKINGS_DIR, { recursive: true });
    return { updatedFiles, updatedReferences };
  }
  
  // Find all ranking files
  const rankingFiles = await glob('**/*.json', { cwd: RANKINGS_DIR });
  console.log(`Found ${rankingFiles.length} ranking files`);
  
  if (rankingFiles.length === 0) {
    console.log("No ranking files found. If you have rankings data, check that it's in the correct location.");
    return { updatedFiles, updatedReferences };
  }
  
  for (const rankingFile of rankingFiles) {
    const filePath = path.join(RANKINGS_DIR, rankingFile);
    console.log(`Processing ranking file: ${filePath}`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      let rankingData = JSON.parse(data);
      
      let fileUpdated = false;
      let fileReferenceCount = 0;
      
      // Handle your specific ranking structure - "rankings" with an 's'
      if (rankingData.rankings && Array.isArray(rankingData.rankings)) {
        console.log(`Found ${rankingData.rankings.length} ranking entries`);
        for (const entry of rankingData.rankings) {
          // Update playerId
          if (entry.playerId) {
            let newId = null;
            
            // Check if it's in the name-2025 format (must be string to use endsWith)
            if (typeof entry.playerId === 'string' && entry.playerId.endsWith('-2025')) {
              const playerName = entry.playerId.replace(/-2025$/, '');
              newId = nameToId[playerName.toLowerCase()];
              console.log(`Found name-2025 format ID: ${entry.playerId} -> ${playerName}`);
            } else {
              // Convert to string for lookups if needed
              const idStr = String(entry.playerId);
              
              // Try direct mapping from old ID
              newId = oldToNew[idStr] || oldToNew[entry.playerId];
            }
            
            // If still not found, try by player name
            if (!newId && entry.playerDetails?.name) {
              newId = nameToId[entry.playerDetails.name.toLowerCase()];
            }
            
            if (newId) {
              console.log(`Updating ranking playerId: ${entry.playerId} → ${newId}`);
              entry.playerId = newId;
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            } else {
              console.warn(`⚠️ Could not find mapping for player ID: ${entry.playerId} (name: ${entry.playerDetails?.name || 'unknown'})`);
            }
          }
          
          // Update playerDetails.id if present
          if (entry.playerDetails?.id) {
            // Try direct mapping (handle both string and number cases)
            const idStr = String(entry.playerDetails.id);
            let newId = oldToNew[idStr] || oldToNew[entry.playerDetails.id];
            
            // Try by name if available
            if (!newId && entry.playerDetails.name) {
              newId = nameToId[entry.playerDetails.name.toLowerCase()];
            }
            
            if (newId) {
              console.log(`Updating ranking playerDetails.id: ${entry.playerDetails.id} → ${newId}`);
              entry.playerDetails.id = newId;
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            }
          }
        }
      } 
      // Keep fallback handlers for other structures
      else if (rankingData.ranking && Array.isArray(rankingData.ranking)) {
        // Handle original "ranking" property
        console.log(`Found ${rankingData.ranking.length} ranking entries`);
        for (const entry of rankingData.ranking) {
          // Update playerId
          if (entry.playerId) {
            // Try direct mapping from old ID
            let newId = oldToNew[entry.playerId];
            
            // If not found, try by player name
            if (!newId && entry.playerName) {
              newId = nameToId[entry.playerName.toLowerCase()];
            }
            
            if (newId) {
              console.log(`Updating ranking playerId: ${entry.playerId} → ${newId}`);
              entry.playerId = newId;
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            } else {
              console.warn(`⚠️ Could not find mapping for player ID: ${entry.playerId} (name: ${entry.playerName || 'unknown'})`);
            }
          }
          
          // Update playerDetails.id if present
          if (entry.playerDetails?.id) {
            // Try direct mapping
            let newId = oldToNew[entry.playerDetails.id];
            
            // Try by name if available
            if (!newId && entry.playerDetails.name) {
              newId = nameToId[entry.playerDetails.name.toLowerCase()];
            }
            
            if (newId) {
              console.log(`Updating ranking playerDetails.id: ${entry.playerDetails.id} → ${newId}`);
              entry.playerDetails.id = newId;
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            }
          }
        }
      }
      // Structure 2: Array of ranking entries directly
      else if (Array.isArray(rankingData)) {
        console.log(`Found ${rankingData.length} ranking entries in array`);
        for (const entry of rankingData) {
          if (entry.playerId) {
            let newId = oldToNew[entry.playerId];
            if (!newId && entry.playerName) {
              newId = nameToId[entry.playerName.toLowerCase()];
            }
            
            if (newId) {
              console.log(`Updating ranking playerId: ${entry.playerId} → ${newId}`);
              entry.playerId = newId;
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            }
          }
        }
      }
      // Structure 3: Other custom formats - add logging to inspect
      else {
        console.log("Unknown ranking data format. Structure:", Object.keys(rankingData));
        // If it's an object with player IDs directly as keys
        if (typeof rankingData === 'object' && rankingData !== null) {
          for (const key in rankingData) {
            if (oldToNew[key]) {
              console.log(`Found key ${key} that matches an old player ID`);
              const newId = oldToNew[key];
              rankingData[newId] = rankingData[key];
              delete rankingData[key];
              fileUpdated = true;
              fileReferenceCount++;
              updatedReferences++;
            }
          }
        }
      }
      
      if (fileUpdated) {
        console.log(`Writing updated ranking data to ${filePath} (${fileReferenceCount} references fixed)`);
        await fs.writeFile(filePath, JSON.stringify(rankingData, null, 2));
        updatedFiles++;
      } else {
        console.log(`No changes needed in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ranking file ${rankingFile}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    }
  }
  
  console.log(`Updated ${updatedReferences} references in ${updatedFiles} ranking files`);
  return { updatedFiles, updatedReferences };
}

// Main migration function
async function migratePlayerIds(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalPlayers: 0,
    totalMatches: 0,
    totalRankings: 0,
    updatedPlayers: 0,
    updatedMatches: 0,
    updatedRankings: 0,
    errors: []
  };

  try {
    console.log('Starting complete ID system rebuild...');

    // Step 1: Create backup
    await createInitialBackup();

    // Step 2: Load players and assign sequential IDs
    const players = await loadPlayersData();
    stats.totalPlayers = players.length;
    const { oldToNew, nameToId } = await assignSequentialIds(players);

    // Step 3: Update players file
    stats.updatedPlayers = await updatePlayersFile(oldToNew);

    // Step 4: Update match files
    const matchResults = await updateMatchFiles(oldToNew, nameToId);
    stats.totalMatches = matchResults.updatedFiles;
    stats.updatedMatches = matchResults.updatedReferences;

    // Step 5: Update ranking files
    const rankingResults = await updateRankingFiles(oldToNew, nameToId);
    stats.totalRankings = rankingResults.updatedFiles;
    stats.updatedRankings = rankingResults.updatedReferences;

    // Log results
    console.log('\nID system rebuild completed:');
    console.log(`- Players updated: ${stats.updatedPlayers} of ${stats.totalPlayers}`);
    console.log(`- Match files updated: ${stats.totalMatches} (${stats.updatedMatches} references)`);
    console.log(`- Ranking files updated: ${stats.totalRankings} (${stats.updatedRankings} references)`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    stats.errors.push(errorMessage);
    console.error('Migration failed:', errorMessage);
  }

  return stats;
}

// Execute migration if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const stats = await migratePlayerIds();
    if (stats.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  }
  catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

export {
  migratePlayerIds,
  createInitialBackup
};

export type {
  MigrationStats,
  PlayerIdMap
};
