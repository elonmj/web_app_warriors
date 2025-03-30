# Roadmap: Event Management Workflow Testing & Improvement

This document outlines a phased strategy for testing and iteratively improving the event management functionality within the WWL application. It consists of sequential, actionable prompts designed for execution by an AI agent (Roo Code).

**Reference Documents:**

*   `docs/improvement-spec-complete-round.md` (Specifies `EventService.completeRound` enhancement)
*   `docs/admin-event-workflow.md` (Details current/ideal workflows and proposed adaptations)

---

## Phase 0: Baseline Workflow Testing

**Objective:** Verify the core functionality of the existing event management workflow before implementing improvements. Assumes the application is running at `http://localhost:3000`.

**Prerequisites:**



**Prompt 0.1: Verify Admin Access & Navigation**

*   **Task:** Test basic admin access and navigation to the event management section using the current password mechanism.
*   **Action:**
    *   Navigate to `http://localhost:3000/admin`.
    *   Expect a password prompt (likely the `AdminPasswordDialog` component). Enter the password "admin".
    *   Verify successful access (e.g., admin page content is visible). Check console for errors.
    *   Navigate to the event management section (likely `/admin/events`). Verify the page loads correctly. Check console for errors.
*   **Report:** Success/failure of password entry and navigation, any console errors.

**Prompt 0.2: Test Event Creation**

*   **Task:** Test creating a new event using the admin interface.
*   **Action:**
    *   From the `/admin/events` page, locate and use the event creation form (`CreateEventForm`).
    *   Enter basic event details (e.g., name: "Baseline Test Event", type: "League").
    *   Submit the form.
    *   Verify UI feedback (e.g., success message, event appears in list). Check console for errors.
    *   *(Optional: Check database)* Verify the "Baseline Test Event" document was created correctly in Firebase Realtime Database (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
*   **Report:** Success/failure of event creation, UI feedback, console errors, database verification result (if performed).

**Prompt 0.3: Test Adding Participants to Event**

*   **Task:** Test adding existing players as participants to the newly created "Baseline Test Event". (Note: The exact UI for this is currently assumed based on `docs/admin-event-workflow.md`).
*   **Action:**
    *   Navigate to the admin view for "Baseline Test Event".
    *   Locate the UI section for managing participants.
    *   Add `Elonm (`-OL8KGbjTRgUqmFzmfW4`)` and `Leonel (`-OL8bXX8eIfgvB2eZKY3`)` to the event.
    *   Verify UI feedback (e.g., players appear in the participant list). Check console for errors.
    *   *(Optional: Check database)* Verify the event document in Firebase Realtime Database now references these players correctly (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
*   **Report:** Success/failure of adding participants, description of the UI used (if found), UI feedback, console errors, database verification result (if performed).

**Prompt 0.4: Test Starting Event & Initial Pairing**

*   **Task:** Test the process of starting the event and generating the first round of pairings.
*   **Action:**
    *   In the admin view for "Baseline Test Event", locate and click the action to "Start Event" (or similar).
    *   Verify UI feedback (e.g., event status changes, Round 1 pairings appear). Check console for errors.
    *   *(Optional: Check database)* Verify the event status is updated and match documents for Round 1 exist in Firebase Realtime Database (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
*   **Report:** Success/failure of starting event and generating pairings, UI feedback, console errors, database verification result (if performed).

**Prompt 0.5: Test Basic Match Result Modification**

*   **Task:** Test modifying a match result using the existing admin tools.
*   **Action:**
    *   Navigate to the admin view for "Baseline Test Event" or `/admin/matches`.
    *   Select one of the Round 1 matches.
    *   Use the modification UI (`ModifyMatchResultPopup`?) to enter scores (e.g., Player 1 wins 450-400).
    *   Save the changes.
    *   Verify UI feedback (e.g., scores are updated in the match list). Check console for errors.
    *   *(Optional: Check database)* Verify the match document in Firebase Realtime Database reflects the updated scores/status (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
*   **Report:** Success/failure of modifying results, UI feedback, console errors, database verification result (if performed).

**Prompt 0.6: Test Basic Event Completion**

*   **Task:** Test marking the event as complete (without involving the `completeRound` logic being improved later).
*   **Action:**
    *   *(Assumption)* Assume Round 1 is the only round for simplicity, or manually resolve all matches if necessary.
    *   In the admin view for "Baseline Test Event", locate and click the action to "Complete Event" or "Finalize Event".
    *   Verify UI feedback (e.g., event status changes to 'completed'). Check console for errors.
    *   *(Optional: Check database)* Verify the event status is updated to 'completed' in Firebase Realtime Database (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
*   **Report:** Success/failure of completing the event, UI feedback, console errors, database verification result (if performed).

**Prompt 0.7: Analyze Middleware Redundancy**

*   **Task:** Analyze the current middleware (`src/middleware.ts`) for potential redundancy.
*   **Action:**
    *   Read the content of `src/middleware.ts`.
    *   Analyze its logic, specifically the check on the `Referer` header for requests to `/admin/*` sub-pages.
    *   Compare this `Referer` check mechanism with the simple password dialog access control tested in Prompt 0.1.
    *   Consider the planned implementation of NextAuth.js for authentication as described in `docs/authentication-implementation-plan.md`.
    *   Evaluate if the current middleware's `Referer` check provides significant additional security or if it is largely redundant given the password check and the future authentication plans.
*   **Report:** Provide an analysis summarizing the middleware's function, its effectiveness in the current context, its potential redundancy, and a recommendation on whether to keep, modify, or remove it in light of the existing password check and future NextAuth implementation.


---


## Phase 1: Implement `completeRound` Enhancement

**Objective:** Modify the core `EventService.completeRound` method and related components according to the specification.

**Prompt 1: Implement `EventService.completeRound` Modifications**

*   **Task:** Modify the `EventService.completeRound` method in `src/api/services/EventService.ts` based on the specification in `docs/improvement-spec-complete-round.md`, Section 2 ("Proposed Modification").
*   **Details:**
    *   Implement **Option B (Warning + Override)** for the "Pre-Completion Checks". This requires adding an optional `forceComplete: boolean` parameter to the method. If `forceComplete` is false (or omitted) and unresolved matches exist, log a warning and throw an error. If `forceComplete` is true, log a warning but proceed.
    *   Ensure the method automatically calls `RatingService`, `StatisticsService`, and `RankingService.updateRoundRankings` upon successful pre-checks (or override).
    *   Implement the specified status updates for the round and event.
    *   Implement appropriate error handling for failures during checks or subsequent service calls.
*   **Action:** Apply the necessary code changes using the `apply_diff` or `write_to_file` tool.

**Prompt 2: Update API Route Handler**

*   **Task:** Modify the API route handler function responsible for completing a round (likely located in `src/app/api/events/[eventId]/rounds/[round]/complete/route.ts` or similar).
*   **Details:**
    *   Update the handler to accept an optional `forceComplete` boolean value from the request body.
    *   Pass this `forceComplete` value when calling `EventService.completeRound`.
*   **Action:** Identify the correct API route file. Read its content. Apply the necessary code changes using `apply_diff`.

**Prompt 3: Update Frontend Component (`CompleteRoundButton`)**

*   **Task:** Modify the frontend component responsible for triggering the round completion (likely `src/app/components/CompleteRoundButton.tsx` or similar within the event admin UI).
*   **Details:**
    *   On button click, initially call the API endpoint (from Prompt 2) *without* the `forceComplete` flag.
    *   Handle the API response:
        *   If successful, show success feedback.
        *   If an error indicating unresolved matches is received (requires specific error handling/status code from the backend), display a confirmation modal (e.g., using Shadcn UI's Dialog or Alert Dialog) to the admin. The modal should explain the situation and ask "Unresolved matches found. Force completion anyway?".
        *   If the admin confirms in the modal, re-call the API endpoint, this time passing `forceComplete: true` in the request body.
        *   Handle other potential API errors gracefully (e.g., display a generic error message).
*   **Action:** Identify the relevant frontend component file. Read its content. Apply the necessary code changes using `apply_diff`.

---

## Phase 2: Test `completeRound` Enhancement (End-to-End)

**Objective:** Validate the implemented changes using end-to-end browser testing scenarios.

**Prompt 4: Prepare Test Environment**

*   **Task:** Set up the testing environment for validating the `completeRound` enhancement.
*   **Details:** Perform the following actions, preferably using the admin UI via browser interaction tools:
    1.  Verify/Create Test Event: Check if an event named `test-event-complete-round` exists. If not, create it using the admin UI (similar to Prompt 0.2).
    2.  Verify/Create Test Players: Ensure players "Elonm" (`-OL8KGbjTRgUqmFzmfW4`) and "Leonel" (`-OL8bXX8eIfgvB2eZKY3`) exist. If necessary, create two additional players (e.g., "PlayerC" with ID `test-player-c`, "PlayerD" with ID `test-player-d`) using the Add Player form (assuming `AddPlayerForm` component exists and is accessible).
    3.  Add Participants: Navigate to the admin view for `test-event-complete-round`. Add "Elonm", "Leonel", "PlayerC", and "PlayerD" as participants (similar to Prompt 0.3).
    4.  Start Event & Generate Pairings: Start the `test-event-complete-round` and ensure Round 1 pairings are generated (e.g., Elonm vs Leonel, PlayerC vs PlayerD) using the admin UI (similar to Prompt 0.4).
*   **Action:** Execute the setup steps above. Report confirmation that the test environment is ready, detailing any entities created or actions taken. If any step fails, report the error.

**Prompt 5: Execute E2E Test - Scenario 1 (Successful Completion)**

*   **Task:** Execute Test Scenario 1 ("Successful Round Completion").
*   **Action:**
    1.  **Setup Match States:** Ensure all Round 1 matches for `test-event-complete-round` have a resolved status ("Completed" or "Forfeit"). Use the admin UI (e.g., `ModifyMatchResultPopup`) or direct database manipulation if necessary to set scores and mark matches as completed. Note initial ratings/stats for players.
    2.  **Execute Test:** Perform the browser actions: Navigate to the admin view for `test-event-complete-round` and click "Complete Round 1".
    3.  **Verify:** Observe UI feedback (expect success). Check console for errors. Navigate to rankings/player profiles to verify correct updates. *(Optional: Check database directly)* Verify player docs, ranking docs, and event status in Firebase (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
    4.  **Report:** Report the outcome: success or failure, including details of UI feedback, console logs, confirmation of correct data updates, and database verification results (if performed).

**Prompt 6: Execute E2E Test - Scenario 3 (Override Completion)**

*   **Task:** Execute Test Scenario 3 ("Attempt Completion with Unresolved Matches - Override Mode").
*   **Action:**
    1.  **Setup Match States:** Ensure at least one Round 1 match for `test-event-complete-round` has an unresolved status ("Pending Input" or "Pending Validation"). Ensure other matches are resolved. Use admin UI or direct database manipulation if necessary.
    2.  **Execute Test:** Perform the browser actions: Navigate to the admin view for `test-event-complete-round`, click "Complete Round 1", expect the override confirmation modal, and confirm the override.
    3.  **Verify:** Observe UI feedback (expect success after override). Check console for the specific warning about override and absence of other errors. Verify data updates reflect the override logic. *(Optional: Check database directly)* Verify data changes in Firebase (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data).
    4.  **Report:** Report the outcome: success or failure, noting modal appearance/confirmation, console warnings/errors, data update verification, and database verification results (if performed).

**Prompt 7: Execute E2E Test - Scenario 4 (Backend Error)**

*   **Task:** Execute Test Scenario 4 ("Error During Backend Processing") as described in `docs/improvement-spec-complete-round.md`, Section 3.
*   **Details:** This test requires simulating a backend error during the `completeRound` process *after* the initial pre-checks have passed.
*   **Action:**
    1.  **Modify Code:** Identify a suitable location within the backend code executed by `EventService.completeRound` *after* the pre-completion checks (e.g., inside the `RatingService` call or a `FirebaseEventRepository` update method). Temporarily modify the code to throw an error unconditionally at this point. Use `apply_diff` to make this temporary change.
    2.  **Execute Test:** Perform the browser actions: Navigate to the admin view for `test-event-complete-round` and click "Complete Round 1".
    3.  **Verify:** Observe UI feedback (expect an error message). Check the browser console for errors (e.g., 500 Internal Server Error). Crucially, verify the state of the data (check Firebase Realtime Database: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) – was the process rolled back correctly? Are ratings/rankings/statuses inconsistent? Did partial updates occur?
    4.  **Revert Code:** **Immediately** revert the temporary code modification made in step 1 using `apply_diff` to restore normal functionality.
    5.  **Report:** Report the outcome: observed UI error, console logs, the state of the data after the failed attempt, and confirmation that the temporary code change was successfully reverted.

---

## Phase 3: Implement Broader Workflow Improvements

**Objective:** Implement selected adaptations from `docs/admin-event-workflow.md` to enhance the overall admin experience.

**Prompt 8: Implement Admin Dashboard (Basic)**

*   **Task:** Implement Adaptation 1 from `docs/admin-event-workflow.md`. Create the basic structure for the Admin Dashboard page/component (`/admin/page.tsx` or a new component).
*   **Details:** Fetch the list of all events from Firebase. Filter/display only the "active" or "in progress" events, showing basic info like name and current status/round.
*   **Action:** Apply code changes to the relevant file(s).

**Prompt 9: Implement Event Participant Management**

*   **Task:** Implement Adaptation 2 from `docs/admin-event-workflow.md`. Enhance the specific event admin view (e.g., `/admin/events/[eventId]/page.tsx`).
*   **Details:** Add a "Participants" tab or section. Fetch and display the list of players currently associated with *this* event. Implement UI elements (e.g., buttons, search/select component) and corresponding API calls/service logic to allow admins to add existing players (from the global player list) to the event and remove participants from the event.
*   **Action:** Apply code changes to frontend component(s), API route(s), and potentially `EventService`/`FirebaseEventRepository`.

**Prompt 10: Implement Pairing Preview**

*   **Task:** Implement Adaptation 4 from `docs/admin-event-workflow.md`. Modify the pairing generation process.
*   **Details:** Update the `EventService.generatePairings` method (and its API route) to optionally return the generated pairings *without* saving them immediately. Update the frontend admin UI to first call the API in "preview" mode, display the pairings, and provide a "Confirm & Publish Pairings" button which calls the API again in "publish" mode to save the pairings.
*   **Action:** Apply code changes to `EventService`, the relevant API route, and the frontend UI component.

**Prompt 11: Implement Confirmation Modals**

*   **Task:** Implement Adaptation 5 (renumbered) from `docs/admin-event-workflow.md`.
*   **Details:** Wrap the frontend triggers (buttons) for critical actions ("Complete Round" - already partially done in Prompt 3, "Undo Complete Round" - if implemented in Prompt 12, "Finalize Event") with confirmation modals (e.g., Shadcn UI Dialog/AlertDialog). Ensure the action only proceeds if the admin confirms in the modal.
*   **Action:** Apply code changes to the relevant frontend components.

**Prompt 12: Implement Undo Round Completion (Optional)**

*   **Task:** Implement Adaptation 6 (renumbered) from `docs/admin-event-workflow.md`, *if* this functionality is desired.
*   **Details:** Create a button in the event admin UI (visible only for the *most recently* completed round). This button should trigger an API call to an endpoint that uses `EventService.undoCompleteRound`. Ensure this button is protected by a confirmation modal (implemented in Prompt 11). Implement the necessary API route. The `EventService.undoCompleteRound` method itself needs to handle the logic for reverting player ratings/stats and rankings (this might require significant logic or storing historical data).
*   **Action:** Apply code changes to the frontend component, create a new API route, and implement/verify the logic in `EventService.undoCompleteRound` and potentially related services/repositories. *Confirm with the user if this feature should be implemented before proceeding.*

**Prompt 13: Implement Expanded Event Creation**

*   **Task:** Implement Adaptation 7 (renumbered) from `docs/admin-event-workflow.md`.
*   **Details:** Add new fields to the `CreateEventForm` component for desired configuration options (e.g., K-Factor settings, DS integration toggle). Update the `Event` type definition (`src/types/Event.ts`). Modify the `EventService.createEvent` method and its corresponding API route handler (`POST /api/events`) to accept and save these new configuration values.
*   **Action:** Apply code changes to the frontend component, type definition, service method, and API route handler.

---

## Phase 4: Test Broader Workflow Improvements (End-to-End)

**Objective:** Validate the workflow improvements implemented in Phase 3.

**(Prompts 14-25: Design and Execute E2E Tests)**

*   **General Task:** For each improvement implemented in Phase 3 (Prompts 8-13), first design specific end-to-end test scenarios (similar in structure to those in Phase 2, including necessary setup steps). Then, perform the required setup and execute these scenarios using browser interaction tools.
*   **Specific Prompts:**
    *   **Prompt 14:** Design E2E tests for Admin Dashboard (Adaptation 1).
    *   **Prompt 15:** Execute E2E tests for Admin Dashboard. Report results, including database verification (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) if applicable to the test cases designed in Prompt 14.
    *   **Prompt 16:** Design E2E tests for Event Participant Management (Adaptation 2).
    *   **Prompt 17:** Execute E2E tests for Event Participant Management. Report results, including database verification (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) to confirm participant lists are updated correctly in the event document.
    *   **Prompt 18:** Design E2E tests for Pairing Preview (Adaptation 4).
    *   **Prompt 19:** Execute E2E tests for Pairing Preview. Report results, including database verification (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) to ensure pairings are only saved after explicit confirmation.
    *   **Prompt 20:** Design E2E tests for Confirmation Modals (Adaptation 5).
    *   **Prompt 21:** Execute E2E tests for Confirmation Modals. Report results.
    *   **Prompt 22:** (If Undo implemented) Design E2E tests for Undo Round Completion (Adaptation 6).
    *   **Prompt 23:** (If Undo implemented) Execute E2E tests for Undo Round Completion. Report results, including database verification (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) to confirm ratings, stats, rankings, and statuses are correctly reverted.
    *   **Prompt 24:** Design E2E tests for Expanded Event Creation (Adaptation 7).
    *   **Prompt 25:** Execute E2E tests for Expanded Event Creation. Report results, including database verification (View at: https://console.firebase.google.com/project/wwl-faizers/database/wwl-faizers-default-rtdb/data) to ensure the new configuration options are saved correctly with the event document.
*   **Action (for each Design prompt):** Create a markdown section outlining the test scenarios, including setup, actions, and verification steps.
*   **Action (for each Execute prompt):** Perform the tests using browser interaction. Report outcomes, console logs, and verification results.

---

## Phase 5: Ongoing Maintenance & Refinement

**Objective:** Establish a cycle for continuous improvement.

**Prompt 26: Periodic Review**

*   **Task:** On a regular basis (e.g., monthly or after major events), review system logs (especially errors related to event/match/ranking services) and any user-reported feedback concerning the admin event management workflow.
*   **Action:** Analyze the collected data. Summarize key findings, identifying any recurring errors, performance bottlenecks, or usability issues.

**Prompt 27: Propose Refinements**

*   **Task:** Based on the findings from Prompt 26, propose specific, actionable improvements or bug fixes.
*   **Details:** If the change is non-trivial, create a brief specification document (similar to `docs/improvement-spec-complete-round.md`) outlining the target, proposed change, and testing plan.
*   **Action:** Generate the list of proposed refinements or the specification document(s).

**Prompt 28: Implement & Test Maintenance Tasks**

*   **Task:** Implement and test the approved refinements or bug fixes identified in Prompt 27.
*   **Action:** Follow the implement-then-test pattern established in earlier phases (using appropriate code modification and E2E testing prompts). Report results upon completion.

---