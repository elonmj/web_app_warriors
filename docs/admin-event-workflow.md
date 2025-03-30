# Admin Workflow: Event Management

This document outlines the current and proposed ideal workflows for administrators managing events within the Word Warriors League (WWL) web application. It analyzes the current process, identifies weaknesses, and suggests adaptations for improvement.

## Current Workflow (Deduced from Code and Documentation)

This workflow is inferred from the existing API endpoints, service methods, components, and documentation.

1.  **Access Admin Section:**
    *   Navigate to `/admin`.
    *   (Presumably) Authenticate, potentially using the basic password check (`src/lib/auth.ts`) or the planned NextAuth system. The `src/middleware.ts` redirects direct access to sub-pages back to `/admin` if not referred from there.

2.  **Navigate to Event Management:**
    *   Navigate to `/admin/events` (likely via a link on the main `/admin` page).

3.  **Create New Event:**
    *   Use the `CreateEventForm` component (`src/app/components/CreateEventForm.tsx`).
    *   Input event details (name, dates, type, etc.).
    *   Submit the form, triggering the `POST /api/events` endpoint, which calls `EventService.createEvent`.
    *   The service interacts with `FirebaseEventRepository.createEvent` to save the new event data.

4.  **Manage Players for the Event:**
    *   *(Assumption)* There must be a mechanism to associate registered players (`data/players.json` or Firebase `players` collection) with a specific event. This process isn't explicitly detailed in the provided component/API list but is logically necessary. It might involve selecting players from a list within the event's admin view.

5.  **Start Event / Generate Initial Pairings:**
    *   Trigger an action (e.g., a "Start Event" button) associated with the newly created event.
    *   This likely calls an endpoint like `POST /api/events/{eventId}/start` (or similar, potentially integrated into event creation/update) which might call `EventService.startEvent`.
    *   `EventService.startEvent` could then call `EventService.generatePairings` for round 1.
    *   `EventService.generatePairings` uses logic (likely involving `MatchManager`) to create pairings based on player ratings/rankings, avoiding rematches if possible, and saves them via `FirebaseEventRepository.addEventMatch` (or similar batch operation).

6.  **Manage Rounds:**
    *   **Monitor Progress:** Admins likely monitor match completion status through the `/admin/matches` page or potentially within the specific event view in `/admin/events`.
    *   **Handle Disputes/Corrections:** If players report issues or incorrect results, admins use the `ModifyMatchResultPopup` component (`src/app/components/ModifyMatchResultPopup.tsx`). This likely calls an endpoint (`POST /api/matches/modify`?) that uses `MatchService.modifyMatch` to update match data via `FirebaseMatchRepository`.
    *   **Complete Round:** Once all matches in a round are resolved (results submitted and validated by players, or manually overridden by admin), the admin triggers the round completion.
        *   Use the `CompleteRoundButton` component (`src/app/components/CompleteRoundButton.tsx`).
        *   This calls an endpoint (e.g., `POST /api/events/{eventId}/rounds/{round}/complete`) which executes `EventService.completeRound`.
        *   `EventService.completeRound` likely performs final checks, updates player statistics/ratings (potentially calling `RatingService`, `StatisticsService`), updates event status, and possibly triggers `RankingService.updateRoundRankings`.
    *   **Generate Next Round Pairings:** After completing a round, the admin triggers the pairing generation for the *next* round (likely via a button).
        *   This calls an endpoint like `POST /api/events/{eventId}/pairings?round={nextRound}` which executes `EventService.generatePairings`.
    *   **Undo Round Completion (Optional):** If a mistake is made, the `EventService.undoCompleteRound` method exists, suggesting a potential UI action to revert a completed round (though the UI trigger isn't explicitly shown).

7.  **Repeat Round Management:** Repeat step 6 for all subsequent rounds of the event.

8.  **Complete Event:**
    *   After the final round is completed, the admin marks the entire event as finished.
    *   This likely involves an API call (e.g., `PUT /api/event/{id}`) to update the event's status to 'completed' via `EventService` and `FirebaseEventRepository.updateEvent`.
    *   Final global ranking updates might be triggered (`RankingService.updateGlobalRankings`).

9.  **View Final Results/Archive:**
    *   Completed events are likely displayed differently (e.g., as "Closed" on the home page) and their final rankings/stats can be viewed.

## Ideal Workflow

This workflow is designed for efficiency, clarity, and control, independent of the current implementation.

1.  **Access Secure Admin Dashboard:**
    *   Log in via a robust authentication system (like the planned NextAuth).
    *   Land on a central Admin Dashboard summarizing active events, pending tasks (e.g., disputes, overdue matches), system alerts, and quick links.

2.  **Event Creation & Configuration:**
    *   Navigate to "Events" -> "Create New Event".
    *   Use a comprehensive form:
        *   Basic Info: Name, Description, Dates.
        *   Type & Format: League, Tournament, Pairing System (Swiss, Round Robin), Number of Rounds.
        *   Rating Parameters: K-Factor settings, DS integration toggle.
        *   Player Eligibility Criteria (Optional): Rating range, category restrictions.
    *   Save as "Draft" or "Ready".

3.  **Player Management (Event-Specific):**
    *   Open the "Draft" or "Ready" event.
    *   Go to the "Participants" tab.
    *   Add Players:
        *   Search/select from the global player list.
        *   Bulk import via CSV/list.
        *   Set initial status for the event (e.g., 'Active', 'Bye Requested for Round 1').
    *   Remove Players.
    *   View participant list with current event status.

4.  **Start Event:**
    *   From the event's admin view, click "Start Event".
    *   System performs pre-flight checks (e.g., minimum players, valid configuration).
    *   Automatically generates pairings for Round 1 based on the selected algorithm.
    *   Event status changes to "In Progress". Round 1 status becomes "Active".

5.  **Round Management (Iterative):**
    *   **Monitoring:** View the current round's pairings, match statuses (Pending Input, Pending Validation, Completed, Disputed), and results in real-time on the event dashboard.
    *   **Automated Processing:** As players submit and validate results, the system automatically updates match status to "Completed" and recalculates *provisional* ratings/rankings.
    *   **Intervention:**
        *   **Manual Override:** Admins can manually enter/modify results for any match.
        *   **Player Status:** Mark players as inactive for subsequent rounds if needed.
    *   **Complete Round:**
        *   Admin clicks "Complete Round {N}".
        *   System checks if all matches are resolved (Completed/Forfeit/Bye). Warns if not, but allows override.
        *   Finalizes rating changes for the round.
        *   Updates official round rankings.
        *   Sets Round {N} status to "Completed".
    *   **Start Next Round:**
        *   Admin clicks "Generate Pairings for Round {N+1}".
        *   System generates pairings based on current rankings/ratings. Allows admin preview/manual adjustment *before* publishing.
        *   Admin clicks "Publish Pairings for Round {N+1}".
        *   Round {N+1} status becomes "Active".

6.  **Event Completion:**
    *   After the final round is completed, the admin clicks "Finalize Event".
    *   System performs final calculations (final rankings, event statistics).
    *   Event status changes to "Completed".
    *   Event data is archived for historical viewing.

7.  **Post-Event Analysis:**
    *   Access archived event data, view final rankings, player statistics for the event, and export data if needed.

## Workflow Analysis (Weaknesses in Current Workflow)

Comparing the deduced current workflow to the ideal reveals potential weaknesses:

1.  **Lack of Centralized Admin Dashboard:** The current flow seems page-specific (`/admin/events`, `/admin/players`, etc.). An ideal workflow would benefit from a dashboard summarizing key information and pending actions across all events.
2.  **Unclear Event-Specific Player Management:** How players are added *to an event* and managed *within that event* (e.g., marking as inactive for a round) isn't clearly defined in the current structure overview.
3.  **Manual Triggers vs. Automation:** While `completeRound` exists, the degree of automation is unclear. Ideally, result validation by players should automatically update match status, with `completeRound` being a final confirmation/trigger for the *next* round's pairings, rather than potentially involving manual rating/ranking updates.
4.  **Intervention Clarity:** While modification is possible (`ModifyMatchResultPopup`), ensuring a clear audit trail for any manual changes made by the admin is crucial.
5.  **Feedback and Pre-flight Checks:** The ideal workflow includes more checks (e.g., before starting an event, before completing a round) and previews (e.g., pairing preview) which might be missing or less robust currently.
6.  **Undo Functionality:** While `undoCompleteRound` exists in the service layer, its accessibility and safety in the UI are unknown. Accidental completion should be easily and safely reversible.
7.  **Configuration Granularity:** The ideal workflow allows more granular event configuration (rating params, pairing type) during creation, which might not be present currently.

## Proposed Adaptations

To align the current workflow more closely with the ideal and address weaknesses:

1.  **Implement Admin Dashboard:** Create a new page/component at `/admin` that fetches and displays summary information: list of active events with current round/status, number of pending/disputed matches, system alerts.
2.  **Enhance Event Admin View:** Add a dedicated "Participants" tab/section within the `/admin/events/{eventId}` view to explicitly manage player participation for *that specific event*. Allow adding/removing players and potentially setting event-specific statuses.
3.  **Refine `EventService.completeRound`:** Ensure this service method *automatically* triggers final rating calculations (`RatingService`) and official ranking updates (`RankingService.updateRoundRankings`) for the completed round. Add pre-completion checks (e.g., all matches resolved) with warnings/overrides.
4.  **Improve `EventService.generatePairings`:** Add an option for admins to preview generated pairings before they are finalized and made visible to players. Allow minor manual adjustments if necessary.
5.  **Add Confirmation Modals:** Implement confirmation dialogs for critical actions like "Complete Round", "Undo Complete Round", and "Finalize Event" to prevent accidental clicks.
7.  **Expose `undoCompleteRound`:** Provide a clear and accessible button/action in the UI for authorized admins to undo the completion of the *most recent* round, perhaps requiring re-confirmation.
8.  **Expand `CreateEventForm`:** Add more configuration options during event creation, potentially including K-factor adjustments or DS integration toggles if these are intended to be event-specific.