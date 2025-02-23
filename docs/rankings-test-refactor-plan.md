# Rankings Test Refactor Plan

## Current Issues
1. Duplicate mock repository declarations and initializations
2. Mixed mocking approaches causing type confusion
3. Redundant beforeEach setup code
4. Overly complex mock repository type assertions

## Proposed Changes

### 1. Streamline Mock Declarations
```typescript
// At the top of the file, after imports
let mockEventRepo: jest.Mocked<EventRepository>;
let mockPlayerRepo: jest.Mocked<EventRepository>;
let rankingService: RankingService;
```

### 2. Simplify Mock Data
- Move all mock data declarations to top of describe block
- Use minimal mock objects that only include required properties
- Define proper TypeScript types for each mock object

### 3. Clean Up Repository Mocking
```typescript
// In beforeEach
mockEventRepo = {
  getEvent: jest.fn(),
  getRoundMatches: jest.fn(),
  saveRoundRankings: jest.fn()
} as jest.Mocked<EventRepository>;

mockPlayerRepo = {
  getAllPlayers: jest.fn()
} as jest.Mocked<PlayerRepository>;
```

### 4. Consolidate Setup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  
  // Initialize mocks with default responses
  mockEventRepo.getEvent.mockResolvedValue(mockEvent);
  mockEventRepo.getRoundMatches.mockResolvedValue(mockMatches);
  mockEventRepo.saveRoundRankings.mockResolvedValue();
  mockPlayerRepo.getAllPlayers.mockResolvedValue(mockPlayers);

  // Create service instance
  rankingService = new RankingService(mockEventRepo, mockPlayerRepo);
});
```

### 5. Implementation Steps
1. Remove duplicate variable declarations
2. Remove redundant jest import (already available in test environment)
3. Simplify mock data structures to only include required fields
4. Use proper TypeScript type assertions
5. Consolidate beforeEach setup into single block
6. Remove unnecessary repository method mocks

## Expected Benefits
1. Improved code clarity and maintainability
2. Better TypeScript type safety
3. Reduced test setup complexity
4. More focused and maintainable test cases

## Next Steps
1. Switch to Code mode to implement these changes
2. Update the test file following this plan
3. Verify all tests still pass
4. Run TypeScript compiler to ensure no type errors