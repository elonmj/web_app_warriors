import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface RollbackResult {
  success: boolean;
  errors: string[];
  stats: {
    restoredFiles: number;
    failedFiles: number;
  };
}

async function getLatestBackup(): Promise<string | null> {
  const backupsDir = path.join(process.cwd(), 'data', 'backups');
  
  try {
    const backupFolders = await fs.readdir(backupsDir, { withFileTypes: false });
    // Sort backup folders by name (timestamp) in descending order
    const sortedFolders = backupFolders.sort((a, b) => b.localeCompare(a));
    
    if (sortedFolders.length === 0) {
      return null;
    }
    
    return path.join(backupsDir, sortedFolders[0]);
  } catch (error) {
    return null;
  }
}

async function rollbackMigration(backupPath?: string): Promise<RollbackResult> {
  const result: RollbackResult = {
    success: true,
    errors: [],
    stats: {
      restoredFiles: 0,
      failedFiles: 0
    }
  };

  try {
    // Get backup path if not provided
    const backupDir = backupPath || await getLatestBackup();
    if (!backupDir) {
      throw new Error('No backup found to restore from');
    }

    console.log(`Rolling back from backup: ${backupDir}`);

    // Restore players.json
    try {
      const backupPlayersPath = path.join(backupDir, 'players.json');
      const targetPlayersPath = path.join(process.cwd(), 'data', 'players.json');
      
      await fs.copyFile(backupPlayersPath, targetPlayersPath);
      result.stats.restoredFiles++;
    } catch (error) {
      result.errors.push(`Failed to restore players.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.stats.failedFiles++;
    }

    // Restore match files
    const backupMatchesDir = path.join(backupDir, 'matches');
    const targetMatchesDir = path.join(process.cwd(), 'data', 'matches');

    try {
      const matchFiles = await glob('**/*.json', { cwd: backupMatchesDir });
      
      for (const matchFile of matchFiles) {
        try {
          const sourcePath = path.join(backupMatchesDir, matchFile);
          const targetPath = path.join(targetMatchesDir, matchFile);
          
          // Ensure target directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.copyFile(sourcePath, targetPath);
          result.stats.restoredFiles++;
        } catch (error) {
          result.errors.push(`Failed to restore match file ${matchFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.stats.failedFiles++;
        }
      }
    } catch (error) {
      result.errors.push(`Failed to read match files from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Restore ranking files
    const backupRankingsDir = path.join(backupDir, 'rankings');
    const targetRankingsDir = path.join(process.cwd(), 'data', 'rankings');

    try {
      const rankingFiles = await glob('**/*.json', { cwd: backupRankingsDir });
      
      for (const rankingFile of rankingFiles) {
        try {
          const sourcePath = path.join(backupRankingsDir, rankingFile);
          const targetPath = path.join(targetRankingsDir, rankingFile);
          
          // Ensure target directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.copyFile(sourcePath, targetPath);
          result.stats.restoredFiles++;
        } catch (error) {
          result.errors.push(`Failed to restore ranking file ${rankingFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.stats.failedFiles++;
        }
      }
    } catch (error) {
      result.errors.push(`Failed to read ranking files from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update success status based on errors
    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Log results
  console.log('\nRollback Results:');
  console.log('----------------');
  console.log(`Status: ${result.success ? 'Success' : 'Failed'}`);
  console.log(`Files Restored: ${result.stats.restoredFiles}`);
  console.log(`Files Failed: ${result.stats.failedFiles}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  return result;
}

// Execute migration if run directly using top-level await
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const result = await rollbackMigration();
        if (result.errors.length > 0) {
            process.exit(1);
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Rollback failed:', error);
        process.exit(1);
    }
}

export { rollbackMigration };
export type { RollbackResult };