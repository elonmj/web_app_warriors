# Improvement Specification: Refine EventService.completeRound

This document details the specification for enhancing the `EventService.completeRound` method to improve automation and robustness in the event management workflow.

## 1. Target Functionality

*   **Service:** `EventService` (`src/api/services/EventService.ts`)
*   **Method:** `completeRound(eventId: string, round: number, pairings: Match[]): Promise<void>`
*   **Current Purpose (Deduced):** Marks a specific round of an event as completed. It likely involves updating the event's status and potentially triggering subsequent processes like rating updates or ranking calculations, although the degree of automation is currently unclear.

## 2. Proposed Modification

The `completeRound` method will be modified to ensure it acts as a definitive final step for a round, automating necessary calculations and performing checks before proceeding.

**Functional Changes:**

1.  **Pre-Completion Checks:**
    *   Before proceeding, the method must verify that all matches within the specified `round` for the given `eventId` have a resolved status (e.g., "Completed", "Forfeit", "Bye").
    *   If any matches are still in an unresolved state (e.g., "Pending Input", "Pending Validation"), the method should:
        *   **Option A (Strict):** Throw an error, preventing round completion until all matches are resolved.
        *   **Option B (Warning + Override):** Log a warning detailing the unresolved matches but allow the process to continue if an explicit `forceComplete` flag (new optional parameter) is set to `true` by the calling admin action. *Decision needed on which option to implement.*
2.  **Automated Rating & Statistics Updates:**
    *   Upon successful pre-completion checks (or override), the method *must* automatically trigger the necessary updates based on the completed round's results. This involves:
        *   Calling the appropriate `RatingService` method(s) to finalize rating changes for all players involved in the round's matches.
        *   Calling the appropriate `StatisticsService` method(s) to update player statistics based on the round's outcomes.
3.  **Automated Ranking Update:**
    *   After ratings and statistics are updated, the method *must* automatically trigger the update of the official rankings for the *completed* round by calling `RankingService.updateRoundRankings(eventId, round)`.
4.  **Status Updates:**
    *   Update the status of the specific `round` within the event data to "Completed".
    *   Update the `currentRound` field of the parent `Event` object to increment it (if applicable, depending on event structure).
5.  **Return Value/Error Handling:**
    *   The method should return `void` upon successful completion.
    *   It should throw specific, informative errors if pre-completion checks fail (and strict mode is chosen) or if any of the automated update steps (rating, stats, ranking) encounter an error.

**Note:** This modification assumes that player-driven result submission/validation updates individual match statuses to "Completed" independently *before* `completeRound` is called by the admin. `completeRound` becomes the admin's final confirmation step for the round.

## 3. Testing Strategy (End-to-End Browser Testing)

Validation will focus on end-to-end scenarios simulating admin actions within the browser and verifying the application's state and console output. Assumes the application is running at `http://localhost:3000`.

**Prerequisites:**

*   A test event (`test-event-complete-round`) must be created in the database.
*   Test players (`player-a`, `player-b`, `player-c`, `player-d`) must exist.
*   The test event should have participants added (`player-a`, `player-b`, `player-c`, `player-d`).
*   Round 1 pairings should be generated for the test event (e.g., A vs B, C vs D).
*   A mechanism to easily set match results/status in the database for setup purposes (or simulate player actions if feasible).

**Test Scenarios:**

*   **Scenario 1: Successful Round Completion**
    1.  **Setup:** Ensure all matches for `test-event-complete-round`, Round 1, have a resolved status ("Completed" or "Forfeit") in the database. Note initial ratings/stats for players A, B, C, D.
    2.  **Action:**
        *   Navigate to `http://localhost:3000/admin`.
        *   Authenticate if required.
        *   Navigate to the admin view for `test-event-complete-round`.
        *   Locate and click the "Complete Round 1" button (assuming component `CompleteRoundButton` is used).
        *   Observe UI feedback (e.g., success message, button state change).
    3.  **Verification:**
        *   Check browser console for any errors logged during the action.
        *   Navigate to the public rankings page (`/rankings`) or event-specific ranking view. Verify that Round 1 rankings are updated correctly.
        *   Navigate to player profile pages (`/player/player-a`, etc.). Verify that ratings and statistics reflect the completed Round 1 matches.
        *   *(Optional: Check database directly)* Verify player documents, ranking documents, and event status in Firebase.

*   **Scenario 2: Attempt Completion with Unresolved Matches (Strict Mode - Assuming Option A)**
    1.  **Setup:** Ensure at least one match for `test-event-complete-round`, Round 1, has an unresolved status ("Pending Input" or "Pending Validation") in the database.
    2.  **Action:**
        *   Navigate to `http://localhost:3000/admin`.
        *   Authenticate if required.
        *   Navigate to the admin view for `test-event-complete-round`.
        *   Locate and click the "Complete Round 1" button.
    3.  **Verification:**
        *   Observe UI feedback: An error message should be displayed indicating completion is blocked due to unresolved matches.
        *   Check browser console for any specific error messages logged by the frontend.
        *   Verify that player ratings/stats/rankings *have not* changed from the initial state.
        *   *(Optional: Check database directly)* Verify no unintended data changes occurred.

*   **Scenario 3: Attempt Completion with Unresolved Matches (Override Mode - Assuming Option B)**
    1.  **Setup:** Ensure at least one match for `test-event-complete-round`, Round 1, has an unresolved status.
    2.  **Action:**
        *   Navigate to `http://localhost:3000/admin`.
        *   Authenticate if required.
        *   Navigate to the admin view for `test-event-complete-round`.
        *   Locate and click the "Complete Round 1" button.
        *   *(Assumption)* A confirmation/warning modal appears due to unresolved matches, offering a "Force Complete" option. Click "Force Complete".
        *   Observe UI feedback (e.g., success message).
    3.  **Verification:**
        *   Check browser console for the specific warning message logged about overriding unresolved matches. Check for any *other* errors.
        *   Verify that player ratings/stats/rankings *have* been updated (as if the unresolved match didn't count or was handled according to specific override logic).
        *   *(Optional: Check database directly)* Verify data changes occurred as expected under the override condition.

*   **Scenario 4: Error During Backend Processing**
    1.  **Setup:** Ensure all matches for Round 1 are resolved. Introduce a temporary condition in the backend (e.g., simulate a database write failure during rating update) that will cause an error *after* the pre-checks pass.
    2.  **Action:**
        *   Navigate to `http://localhost:3000/admin`.
        *   Authenticate if required.
        *   Navigate to the admin view for `test-event-complete-round`.
        *   Click the "Complete Round 1" button.
    3.  **Verification:**
        *   Observe UI feedback: An error message should be displayed indicating a server-side problem occurred.
        *   Check browser console for error messages (likely indicating a failed API request, e.g., 500 Internal Server Error).
        *   *(Crucial)* Verify the *state* of the application/database. Was the process rolled back correctly? Are ratings/rankings/statuses inconsistent? Check if partial updates occurred.