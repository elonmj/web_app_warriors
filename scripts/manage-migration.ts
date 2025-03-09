#!/usr/bin/env node
import { Command } from 'commander';
import { migratePlayerIds } from './migrate-player-ids';
import { validateMigrationData } from './validate-migration';
import { rollbackMigration } from './rollback-migration';

const program = new Command();

program
  .name('manage-migration')
  .description('CLI to manage player ID migration process')
  .version('1.0.0');

program.command('migrate')
  .description('Migrate player IDs from name-based to UUID format')
  .action(async () => {
    try {
      console.log('Starting player ID migration...');
      const stats = await migratePlayerIds();
      
      if (stats.errors.length > 0) {
        console.error('\nMigration completed with errors:');
        stats.errors.forEach((error, index) => {
          console.error(`${index + 1}. ${error}`);
        });
        process.exit(1);
      } else {
        console.log('\nMigration completed successfully!');
        console.log(`Players file: ${stats.updatedPlayers} references updated`);
        console.log(`Match files: ${stats.totalMatches} files (${stats.updatedMatches} references) updated`);
        console.log(`Ranking files: ${stats.totalRankings} files (${stats.updatedRankings} references) updated`);
        process.exit(0);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  });

program.command('validate')
  .description('Validate the current player ID format')
  .action(async () => {
    try {
      console.log('Validating player IDs...');
      const result = await validateMigrationData();
      
      console.log('\nValidation Results:');
      console.log('------------------');
      console.log(`Status: ${result.isValid ? 'Valid' : 'Invalid'}`);
      console.log('\nStatistics:');
      console.log(`Total Players: ${result.stats.totalPlayers}`);
      console.log(`Total Matches: ${result.stats.totalMatches}`);
      console.log(`Invalid Player IDs: ${result.stats.invalidPlayerIds}`);
      console.log(`Invalid Match IDs: ${result.stats.invalidMatchIds}`);
      console.log(`Missing References: ${result.stats.missingReferences}`);

      if (result.errors.length > 0) {
        console.error('\nErrors found:');
        result.errors.forEach((error, index) => {
          console.error(`${index + 1}. ${error}`);
        });
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  });

interface RollbackOptions {
  path?: string;
}

program.command('rollback')
  .description('Rollback to the most recent backup')
  .option('-p, --path <path>', 'Specific backup path to restore from')
  .action(async (options: RollbackOptions) => {
    try {
      console.log('Starting rollback...');
      const result = await rollbackMigration(options.path);
      
      console.log('\nRollback Results:');
      console.log('----------------');
      console.log(`Status: ${result.success ? 'Success' : 'Failed'}`);
      console.log(`Files Restored: ${result.stats.restoredFiles}`);
      console.log(`Files Failed: ${result.stats.failedFiles}`);

      if (result.errors.length > 0) {
        console.error('\nErrors encountered:');
        result.errors.forEach((error, index) => {
          console.error(`${index + 1}. ${error}`);
        });
        process.exit(1);
      }

      console.log('\nRollback completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Rollback failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);