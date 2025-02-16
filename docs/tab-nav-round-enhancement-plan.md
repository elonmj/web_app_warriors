# TabNav Round Enhancement Plan

## Current State Analysis

### TabNav Component
- Currently handles section navigation (matches, rankings, statistics, pairings)
- Uses URL-based navigation between sections
- Has no concept of rounds

### Event Page
- Gets current round from event metadata
- Passes data to each section independently
- No unified round handling

## Requirements

1. Add round selection that affects all sections
2. Use current round as default
3. Make round selection URL-based for sharing/bookmarking
4. Keep sections synchronized to selected round

## Minimal Changes Required

### 1. URL Structure
```
/event/[eventId]?round=2
```
- Keep it simple with just round parameter
- No need to change section handling

### 2. TabNav Component
- Keep existing tab functionality untouched
- Add minimal round handling:
  ```typescript
  interface TabNavProps {
    // Existing props
    tabs: Tab[];
    defaultTab?: string;
    
    // New props
    currentRound: number;
    roundCount: number;
  }
  ```

### 3. Event Page Updates
- Read round from URL query parameter
- Default to event's current round if not specified
- Filter section data by selected round
- Pass filtered data to sections

## Implementation Strategy

1. **Phase 1: URL Integration**
   - Add round parameter to URL
   - Update event page to read/respect round parameter
   - Default to current round from event metadata

2. **Phase 2: Data Filtering**
   - Filter matches by round
   - Update rankings for selected round
   - Adjust statistics for round context

3. **Phase 3: Round Selection UI**
   - Add minimal round selector above tabs
   - Update URL when round changes
   - Refresh data on round change

## UI Design Considerations

1. **Round Selector**
- Simple dropdown or number input
- Clear indication of current round
- Minimal visual impact on existing layout

2. **Layout**
```
[Event Header]
[Stats Overview]
[Round Selector] <-- New addition
[Tab Navigation]
[Section Content]
```

## Data Flow

1. User visits event page
   - Check URL for round parameter
   - Default to current round if not specified

2. User changes round
   - Update URL with new round
   - Filter all section data for new round
   - Update all section displays

3. User changes tabs
   - Keep existing tab behavior
   - Maintain selected round across tab changes

## Next Steps

1. Review this plan
2. Get feedback on URL structure and round selector placement
3. Confirm data filtering approach
4. Proceed with phased implementation

## Questions to Consider

1. Should round selection be global or per-section?
2. How to handle invalid round numbers in URL?
3. Should we cache data for quick round switching?
4. How to handle sections that may not need round filtering?