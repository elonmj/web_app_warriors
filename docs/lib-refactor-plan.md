# Library Refactoring Plan

## Current Issues
- Duplicate type definitions between src/lib/ and src/types/
- Mixed concerns between domain models and business logic
- Some functionality better suited for services layer

## Proposed Structure

### 1. Move to src/types/ ✅
All type definitions and interfaces should move to src/types/:
- Event.ts ✅
- Match.ts ✅
- Player.ts ✅
- Ranking.ts ✅
- Classification.ts ✅

### 2. Keep in src/lib/
Core algorithms and business logic:
- RatingSystem.ts (ELO rating calculations) ✅
- StatisticsCalculator.ts (Match and event statistics) ✅
- CategoryManager.ts (Category determination and validation) ✅

### 3. Move to src/api/services/ (TODO)
Service-layer implementations:
- EventManager.ts -> EventService.ts
- MatchManager.ts -> MatchService.ts

## Benefits
1. Clear Separation of Concerns:
   - Types: Data structures and interfaces
   - Lib: Core business logic and algorithms
   - Services: Application-specific implementations
   - Repository: Data access layer

2. Better Organization:
   - Reduced duplication
   - Clear responsibilities
   - Easier testing
   - Better dependency management

3. Improved Maintainability:
   - Each layer has a single responsibility
   - Clear boundaries between layers
   - Easier to modify individual components

## Migration Steps
1. ✅ Create new type files in src/types/
2. ✅ Update imports in existing files
3. ⏳ Move business logic to appropriate locations
   - Need to move EventManager and MatchManager to services layer
4. ✅ Remove redundant files
   - Removed duplicate type definitions from src/lib
5. ✅ Update tests to reflect new structure
   - Updated test imports from src/lib to src/types
6. ✅ Update documentation
   - Updated lib-refactor-plan.md with progress

## Final Structure
```
src/
├── types/         # All TypeScript interfaces and types
├── lib/           # Core business logic and algorithms
├── api/
│   ├── services/  # Application services
│   └── repository/# Data access layer
└── app/           # Next.js components and routes
```

## Next Steps
1. Create new service files:
   - src/api/services/EventService.ts
   - src/api/services/MatchService.ts
2. Move business logic from EventManager and MatchManager to respective services
3. Update imports in components and API routes to use new service layer
4. Remove old manager files from src/lib after migration is complete