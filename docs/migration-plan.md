# Migration Plan: Data Structure Refactoring

## Phase 1: Setup & Preparation

### 1.1 Create New Directory Structure
```bash
data/
  ├── events.json
  ├── players.json
  ├── matches/
  └── rankings/
```

### 1.2 Create Type Definitions

```typescript
// types/Event.ts
interface Event {
  id: string;
  name: string;
  startDate: string; // ISO-8601
  endDate: string;   // ISO-8601
  type: 'initial-random-pairing' | string;
  status: 'open' | 'closed';
  metadata: {
    totalPlayers: number;
    totalMatches: number;
    currentRound: number;
    lastUpdated: string; // ISO-8601
  };
}

// types/Match.ts
interface MatchPlayer {
  id: string;
  ratingBefore: number;
  ratingAfter: number;
  categoryBefore: string;
  categoryAfter: string;
}

interface Match {
  id: string;
  date: string; // ISO-8601
  player1: MatchPlayer;
  player2: MatchPlayer;
  status: 'pending' | 'completed' | 'forfeit' | 'disputed';
  result?: {
    score: [number, number];
    pr: number;
    pdi: number;
    ds: number;
    validation: {
      player1Approved: boolean;
      player2Approved: boolean;
      timestamp: string; // ISO-8601
    };
  };
  metadata: {
    round: number;
    isRandom: boolean;
    createdAt: string;  // ISO-8601
    updatedAt: string;  // ISO-8601
  };
}

// types/Ranking.ts
interface RankingEntry {
  playerId: string;
  rank: number;
  points: number;
  matchesPlayed: number;
  category: string;
  history: Array<{
    timestamp: string; // ISO-8601
    rank: number;
    points: number;
    category: string;
  }>;
}
```

## Phase 2: Data Migration

### 2.1 Create Migration Scripts

```typescript
// scripts/migrateData.ts

async function migrateEvents(parcoursData: any): Promise<void> {
  const event = {
    id: parcoursData.event.id,
    name: parcoursData.event.name,
    startDate: parcoursData.event.date,
    endDate: parcoursData.event.date, // Or calculate based on matches
    type: parcoursData.event.type,
    status: 'open',
    metadata: {
      totalPlayers: parcoursData.players.length,
      totalMatches: parcoursData.matches.length,
      currentRound: 1, // Calculate based on matches
      lastUpdated: new Date().toISOString()
    }
  };
  
  await writeFile('data/events.json', JSON.stringify({ events: [event] }, null, 2));
}

async function migratePlayers(parcoursData: any): Promise<void> {
  const players = parcoursData.players.map(player => ({
    id: player.id,
    name: player.name,
    currentRating: player.currentRating,
    category: player.category,
    joinDate: parcoursData.event.date,
    active: true,
    statistics: player.statistics
  }));
  
  await writeFile('data/players.json', JSON.stringify({ players }, null, 2));
}

async function migrateMatches(parcoursData: any): Promise<void> {
  const eventId = parcoursData.event.id;
  const matches = parcoursData.matches.map(match => ({
    id: match.id,
    date: match.date,
    player1: {
      id: match.player1,
      ratingBefore: match.player1Rating,
      ratingAfter: match.player1Rating, // Calculate from result
      categoryBefore: match.player1Category,
      categoryAfter: match.player1Category // Calculate from result
    },
    player2: {
      id: match.player2,
      ratingBefore: match.player2Rating,
      ratingAfter: match.player2Rating, // Calculate from result
      categoryBefore: match.player2Category,
      categoryAfter: match.player2Category // Calculate from result
    },
    status: match.status,
    result: match.result,
    metadata: {
      round: 1, // Calculate based on match sequence
      isRandom: match.isRandom,
      createdAt: match.date,
      updatedAt: match.date
    }
  }));
  
  await writeFile(`data/matches/${eventId}.json`, JSON.stringify({ 
    eventId,
    matches 
  }, null, 2));
}

async function migrateRankings(parcoursData: any): Promise<void> {
  const eventId = parcoursData.event.id;
  const rankings = parcoursData.players.map((player, index) => ({
    playerId: player.id,
    rank: index + 1, // Calculate based on points
    points: calculatePoints(player, parcoursData.matches),
    matchesPlayed: player.statistics.totalMatches,
    category: player.category,
    history: [{
      timestamp: parcoursData.event.date,
      rank: index + 1,
      points: 0,
      category: player.category
    }]
  }));
  
  await writeFile(`data/rankings/${eventId}.json`, JSON.stringify({
    eventId,
    lastUpdated: new Date().toISOString(),
    rankings
  }, null, 2));
}
```

### 2.2 Update Repository Layer

```typescript
// repository/EventRepository.ts
class EventRepository {
  async getEvent(id: string): Promise<Event> {
    const events = await this.getAllEvents();
    return events.find(e => e.id === id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    const data = await readFile('data/events.json');
    return JSON.parse(data).events;
  }
  
  async updateEvent(event: Event): Promise<void> {
    const events = await this.getAllEvents();
    const index = events.findIndex(e => e.id === event.id);
    events[index] = event;
    await writeFile('data/events.json', JSON.stringify({ events }, null, 2));
  }
}

// Similar updates for PlayerRepository, MatchRepository, RankingRepository
```

## Phase 3: Service Layer Updates

### 3.1 Update Service Classes

```typescript
// services/MatchService.ts
class MatchService {
  private matchRepo: MatchRepository;
  private playerRepo: PlayerRepository;
  private rankingRepo: RankingRepository;

  async processMatch(eventId: string, matchId: string, result: MatchResult): Promise<void> {
    const match = await this.matchRepo.getMatch(eventId, matchId);
    const player1 = await this.playerRepo.getPlayer(match.player1.id);
    const player2 = await this.playerRepo.getPlayer(match.player2.id);
    
    // Calculate new ratings and categories
    const [rating1, rating2] = calculateNewRatings(match, result);
    const category1 = determineCategory(rating1);
    const category2 = determineCategory(rating2);
    
    // Update match with results and rating changes
    match.player1.ratingAfter = rating1;
    match.player1.categoryAfter = category1;
    match.player2.ratingAfter = rating2;
    match.player2.categoryAfter = category2;
    
    // Update all affected data in transaction-like manner
    await Promise.all([
      this.matchRepo.updateMatch(eventId, match),
      this.playerRepo.updatePlayer({ ...player1, currentRating: rating1, category: category1 }),
      this.playerRepo.updatePlayer({ ...player2, currentRating: rating2, category: category2 }),
      this.rankingRepo.updateRankings(eventId)
    ]);
  }
}
```

## Phase 4: Testing & Validation

### 4.1 Create Test Cases

```typescript
// __tests__/migration.test.ts
describe('Data Migration', () => {
  test('migrates events correctly', async () => {
    const result = await migrateEvents(mockParcoursData);
    expect(result).toMatchSnapshot();
  });
  
  test('preserves player statistics', async () => {
    const result = await migratePlayers(mockParcoursData);
    const originalStats = mockParcoursData.players[0].statistics;
    expect(result.players[0].statistics).toEqual(originalStats);
  });
  
  test('calculates correct rating changes', async () => {
    const result = await migrateMatches(mockParcoursData);
    expect(result.matches[0].player1.ratingAfter)
      .not.toBe(result.matches[0].player1.ratingBefore);
  });
});
```

### 4.2 Validation Scripts

```typescript
// scripts/validateMigration.ts
async function validateMigration(): Promise<void> {
  // Check data integrity
  await validateDataIntegrity();
  
  // Verify calculations
  await validateCalculations();
  
  // Test API endpoints
  await validateAPIEndpoints();
  
  // Compare old vs new data
  await compareDatasets();
}
```

## Phase 5: Deployment

### 5.1 Deployment Steps

1. Backup current data
2. Run migration scripts
3. Validate new data structure
4. Deploy updated application code
5. Run integration tests
6. Monitor system for issues

### 5.2 Rollback Plan

1. Keep backup of old data structure
2. Maintain dual-read capability during transition
3. Prepare rollback scripts
4. Document rollback procedures

## Phase 6: Monitoring & Maintenance

### 6.1 Monitoring Plan

1. Track file sizes and growth
2. Monitor access patterns
3. Check for data consistency
4. Log error rates

### 6.2 Optimization Opportunities

1. Implement caching layer
2. Add indexes for common queries
3. Compress historical data
4. Archive old events

## Timeline

1. **Week 1**: Setup & Preparation
2. **Week 2**: Data Migration Development
3. **Week 3**: Service Layer Updates
4. **Week 4**: Testing & Validation
5. **Week 5**: Deployment & Monitoring

## Success Criteria

1. All data successfully migrated
2. No data loss or corruption
3. All tests passing
4. Performance metrics meeting or exceeding targets
5. No regression in functionality
6. Documentation updated
7. Team trained on new structure