# API Reorganization Safety Plan

## Current Structure

### Files
```
data/matches/[eventId].json      # All matches in single file
data/rankings/[eventId].json     # All rankings in single file
```

### APIs
```
/api/events/[eventId]/...
/api/matches/[eventId]/...
/api/rankings/[eventId]/...
```

## Target Structure

### Files
```
data/matches/[eventId]/[round].json     # Matches per round
data/rankings/[eventId]/[round].json    # Rankings per round
```

### APIs
```
/api/events/[eventId]/rounds/[round]/matches    # Round matches
/api/events/[eventId]/rounds/[round]/rankings   # Round rankings
```

## Safe Reorganization Steps

### 1. Preparation Phase
- Document all current API endpoints and their usage
- Map out which components use which endpoints
- Create test cases for current functionality
- List all data access patterns

### 2. New Structure Implementation
1. Create new round-based directory structure
2. Add new API routes WITHOUT removing old ones
3. Implement new routes to work with both old and new structure
4. Test new routes thoroughly while keeping old ones working

### 3. Data Migration
1. Keep existing flat files as source of truth
2. Create round-specific files alongside existing ones
3. Validate data consistency between old and new structure
4. Only proceed when validation passes

### 4. Component Updates
1. Update one component at a time
2. Test each component with both structures
3. Keep ability to switch back to old endpoints
4. Verify no functionality is lost

## Safety Checkpoints

### Before Each Change
- [ ] Current functionality fully documented
- [ ] Test cases cover all use cases
- [ ] Clear rollback path identified
- [ ] All dependent components identified

### During Changes
- [ ] Old APIs remain functional
- [ ] Data integrity maintained
- [ ] All tests passing
- [ ] No user-facing disruption

### After Each Change
- [ ] Functionality verified
- [ ] Performance checked
- [ ] No data inconsistencies
- [ ] Clean rollback still possible

## Risk Areas

1. **Data Consistency**
- Risk: Data mismatch between old and new structure
- Mitigation: Thorough validation before proceeding

2. **API Compatibility**
- Risk: Breaking changes in API responses
- Mitigation: Maintain consistent response formats

3. **Performance**
- Risk: Slowdown during transition
- Mitigation: Optimize new structure before full switch

## Validation Requirements

### Data Integrity
- Match counts consistent
- Rankings accurate
- Round information complete
- No orphaned data

### API Functionality
- All endpoints respond correctly
- Response formats unchanged
- Error handling works
- Rate limits respected

### Component Behavior
- All features working
- No regression in UX
- Performance maintained
- Error states handled

## Success Gates

### Phase 1: Structure Ready
- [ ] New directories created
- [ ] New routes implemented
- [ ] Basic tests passing
- [ ] No impact on current system

### Phase 2: Data Ready
- [ ] Data correctly organized by rounds
- [ ] Validation tests passing
- [ ] Performance acceptable
- [ ] No data loss or corruption

### Phase 3: Components Ready
- [ ] All components updated
- [ ] Using new API structure
- [ ] Full test coverage
- [ ] No functionality loss

### Phase 4: Cleanup Ready
- [ ] Old structure fully retired
- [ ] Documentation updated
- [ ] No deprecated code
- [ ] All tests green

## Emergency Response

If Issues Found:
1. Stop further changes
2. Assess impact
3. Use old structure
4. Fix issues
5. Revalidate

## Final Verification

Before Completing:
1. All features working with new structure
2. No dependency on old structure
3. All components updated
4. Performance metrics good
5. Full test coverage

Remember: Always maintain the ability to serve data through old structure until transition is fully complete and verified.