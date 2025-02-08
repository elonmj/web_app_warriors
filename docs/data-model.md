# Data Model Structure

## Overview

The application requires a robust data model to handle player rankings, matches, and events while maintaining historical data and statistics. Here's a proposed structure using JSON files as the data store.

## Core Entities

### 1. Events (`events.json`)
```json
{
  "events": [
    {
      "id": "string",
      "name": "string",
      "startDate": "ISO-8601",
      "endDate": "ISO-8601",
      "type": "initial-random-pairing | other-types",
      "status": "open | closed",
      "metadata": {
        "totalPlayers": "number",
        "totalMatches": "number",
        "currentRound": "number",
        "lastUpdated": "ISO-8601"
      }
    }
  ]
}
```

Justification:
- Separates event metadata from matches and rankings
- Maintains high-level event information
- Tracks event progress and status

### 2. Players (`players.json`)
```json
{
  "players": [
    {
      "id": "string",
      "name": "string",
      "currentRating": "number",
      "category": "string",
      "joinDate": "ISO-8601",
      "active": "boolean",
      "statistics": {
        "totalMatches": "number",
        "wins": "number",
        "draws": "number",
        "losses": "number",
        "totalPR": "number",
        "averageDS": "number",
        "inactivityWeeks": "number",
        "lastMatch": "ISO-8601"
      }
    }
  ]
}
```

Justification:
- Centralizes player information
- Maintains current state and statistics
- Separates core player data from match history

### 3. Matches (`matches/[eventId].json`)
```json
{
  "eventId": "string",
  "matches": [
    {
      "id": "string",
      "date": "ISO-8601",
      "player1": {
        "id": "string",
        "ratingBefore": "number",
        "ratingAfter": "number",
        "categoryBefore": "string",
        "categoryAfter": "string"
      },
      "player2": {
        "id": "string",
        "ratingBefore": "number",
        "ratingAfter": "number",
        "categoryBefore": "string",
        "categoryAfter": "string"
      },
      "status": "pending | completed | forfeit | disputed",
      "result": {
        "score": ["number", "number"],
        "pr": "number",
        "pdi": "number",
        "ds": "number",
        "validation": {
          "player1Approved": "boolean",
          "player2Approved": "boolean",
          "timestamp": "ISO-8601"
        }
      },
      "metadata": {
        "round": "number",
        "isRandom": "boolean",
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601"
      }
    }
  ]
}
```

Justification:
- Separates matches by event for better organization
- Captures rating changes directly in match data
- Maintains complete match history with all relevant data

### 4. Rankings (`rankings/[eventId].json`)
```json
{
  "eventId": "string",
  "lastUpdated": "ISO-8601",
  "rankings": [
    {
      "playerId": "string",
      "rank": "number",
      "points": "number",
      "matchesPlayed": "number",
      "category": "string",
      "history": [
        {
          "timestamp": "ISO-8601",
          "rank": "number",
          "points": "number",
          "category": "string"
        }
      ]
    }
  ]
}
```

Justification:
- Maintains current rankings per event
- Tracks ranking history for analysis
- Supports historical category changes

## Benefits of This Structure

1. **Data Independence**
   - Each entity type is stored separately
   - Reduces file size and improves read/write performance
   - Easier backup and restoration

2. **Historical Tracking**
   - Maintains rating and category changes
   - Supports analysis and statistics
   - Enables dispute resolution

3. **Performance**
   - Event-specific files reduce data load
   - Efficient updates of specific entities
   - Supports caching strategies

4. **Maintainability**
   - Clear separation of concerns
   - Structured data validation
   - Easy to extend or modify

## Implementation Notes

1. **File Organization**
```
data/
  ├── events.json
  ├── players.json
  ├── matches/
  │   ├── event-id-1.json
  │   └── event-id-2.json
  └── rankings/
      ├── event-id-1.json
      └── event-id-2.json
```

2. **Data Consistency**
   - Use atomic writes for file updates
   - Implement validation before saves
   - Maintain backup copies

3. **Performance Optimization**
   - Cache frequently accessed data
   - Implement partial updates
   - Use indexes for common queries

## Migration Plan

1. **Preparation**
   - Create new directory structure
   - Validate existing data

2. **Migration Steps**
   - Split current data into new structure
   - Verify data integrity
   - Update application to use new structure

3. **Validation**
   - Test all CRUD operations
   - Verify statistics calculation
   - Ensure backward compatibility