# Player ID Migration Tools

This directory contains scripts for managing the migration of player IDs from the `name-2025` format to UUIDs.

## Available Scripts

### 1. Migrate Player IDs

Converts all player IDs to UUIDs and updates related match references:

```bash
ts-node scripts/manage-migration.ts migrate
# or directly:
npx tsx scripts/migrate-player-ids.ts
```

### 2. Validate Migration

Checks if all player IDs are valid UUIDs and verifies data consistency:

```bash
ts-node scripts/manage-migration.ts validate
# or directly:
npx tsx scripts/validate-migration.ts
```

### 3. Rollback Migration

Restores data from the most recent backup:

```bash
ts-node scripts/manage-migration.ts rollback
# or directly:
npx tsx scripts/rollback-migration.ts
```

To restore from a specific backup:

```bash
ts-node scripts/manage-migration.ts rollback --path data/backups/2025-03-08-12-00
```

## Migration Process

The migration process follows these steps:

1. Creates a backup of current data (players.json, matches/, rankings/)
2. Updates player IDs to UUIDs in players.json
3. Updates match references to use new UUIDs in all match files
4. Updates ranking references to use new UUIDs
5. Validates the migration
6. Provides rollback capability if needed

## Understanding Player ID Formats

- **Old format**: `name-2025` (e.g., "john-doe-2025")
- **New format**: UUID v4 (e.g., "123e4567-e89b-12d3-a456-426614174000")

The migration normalizes player names by:
1. Removing diacritics (accents)
2. Converting to lowercase
3. Replacing spaces with hyphens

## Common Issues and Solutions

1. **Some player IDs not updated**: 
   - Check if the player exists in players.json
   - Verify name normalization matches between players and matches

2. **Validation errors**:
   - Run the validation script to identify specific issues
   - Check for discrepancies between ID formats
   - Use the detailed error messages to locate problem files

3. **Rollback needed**:
   - Ensure backups exist in data/backups/
   - Use rollback command with specific path if needed
   - Verify all files are restored (players, matches, rankings)

## Safety Features

- **Automatic Backups**: Created before any migration
- **Data Validation**: Comprehensive checks for data integrity
- **Rollback Support**: Ability to restore from backups
- **Error Handling**: Detailed error reporting and logging

## Running Tests

To run the test suite:

```bash
npm test scripts/__tests__/migrate-player-ids.test.ts
npm test scripts/__tests__/validate-migration.test.ts
npm test scripts/__tests__/rollback-migration.test.ts
```

## Error Codes

If any script exits with a non-zero status code, check the error message for details:

- Exit code 1: Operation failed with errors
- Standard output includes detailed error messages and statistics

## Directory Structure

```
scripts/
├── manage-migration.ts     # Main CLI tool
├── migrate-player-ids.ts   # Migration implementation
├── validate-migration.ts   # Validation tools
├── rollback-migration.ts   # Rollback functionality
└── __tests__/             # Test files
```

## Data Backup Location

Backups are stored in:
```
data/backups/YYYY-MM-DD-HH-mm/
├── players.json
├── matches/
│   └── **/*.json
└── rankings/
    └── **/*.json
```

## Troubleshooting

1. If migration fails:
   - Check the error messages
   - Run validation to identify issues
   - Use rollback if necessary

2. If validation fails:
   - Review the validation report
   - Check for missing references
   - Verify UUID format

3. If rollback is needed:
   - Use the most recent backup by default
   - Specify a backup path if needed
   - Check the rollback results