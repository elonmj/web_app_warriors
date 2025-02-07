## WWL Web App

### Home Page

The home page will display a list of events. Events will be categorized as either 'Open' (in progress) or 'Closed' (completed).

- **Event List:**
    - Displays all events, clearly indicating their status (Open or Closed).
    - Open events are visually distinct from closed events.

- **Closed Event View (Archived Events):**
    - Clicking on a closed event (represented as a folder icon) will navigate to a dedicated page for that event.
    - This page will contain links to:
        - **Event Statistics:**  A summary of the event's key statistics.
        - **Player Files:**  Potentially links to individual player performance data within the event.
        - **Final Ranking:**  The final standings for the closed event.

- **Open Event View (Current Events):**
    - Clicking on an open event will trigger a small pop-up window or modal directly on the home page.
    - This pop-up will feature a mini app bar with two sections:
        - **Pending Matches:**
            - Displays a list of matches that are currently pending results.
            - Players can click on a match to enter results.
        - **Played Matches:**
            - Accessible via a tab or button on the mini app bar.
            - Shows a list of completed matches with results displayed inline (e.g., player names and scores).
        - **Current Ranking Button:**
            - Located on the other side of the mini app bar.
            - Provides quick access to the current event ranking.

### Match Results Entry

- **Pending Matches Section:**
    - In the 'Pending Matches' section of an open event, players can:
        - Access a form to input their match scores.
        - 'Sign' or 'Approve' the entered results, indicating their agreement.
    - Both players involved in a match must approve the results.

- **Warning System for Unapproved Results:**
    - If, in a subsequent step or process, match results are found to be unapproved by one or both players, a warning will be generated.
    - This warning will prompt administrators to investigate and resolve any discrepancies or disputes.

### Dispute Resolution Process
- **Rôle du Comité d’Arbitrage (Arbitration Committee Role):** A designated committee (or administrator) will examine the situation in case of a dispute or input error. Any retroactive modification is recorded with an annotation in the history.
- **Archivage (Archiving):** All matches, disputes, and modifications are saved in a centralized history accessible to club administrators.

### Current Ranking Display

- **Accessing Current Ranking:**
    - The 'Current Ranking Button' in the open event pop-up provides direct access to the live ranking.
    - The ranking may also be accessible from the closed event view.

- **Ranking Information:**
    - The ranking display will show the current standings of players within the event.
    - It will likely include player names, ranks, and potentially other relevant ranking metrics.

### Scoring System

The scoring system incorporates the following elements:

- **Points de Rencontre (PR):**
    - Victory: 3 PR
    - Draw: 2 PR each
    - Loss: 1 PR
- **Points de Départage Interne (PDI):**
    - Used to break ties between players who have faced each other.
    - Based on the PR earned in direct matches between the tied players.
- **Différence de Score (DS):**
    - Calculated as a percentage: `DS = min(100, (ΔS / S_loser) * 100)`
    - Where ΔS is the score difference and S_loser is the loser's score.

### Tie-Breaking

In case of a tie in PR, the following tie-breaking criteria will be used:

1.  **Points de Départage Interne (PDI):** Higher PDI wins.
2.  **Différence de Score (DS):** Higher DS wins.
3.  **Number of Matches Played:** More matches played wins.
4.  **Recent Performance:** Weighted average of scores over the last 6 months.
5.  **Club Seniority:** Earlier registration date wins.

### Pairing Algorithm

The pairing algorithm aims to pair players fairly while avoiding repeat matches.

1.  Players are initially ranked based on PR, PDI, and DS.
2.  The top-ranked player is paired with the lowest-ranked available player, checking the match history to avoid repeats.
3.  A permutation process is used to find alternative pairings if a direct match has already occurred.

### Rating Evolution

The rating system uses a formula inspired by the ELO system.

The Différence de Score (DS) can be integrated into the rating evolution to reward decisive victories and penalize severe losses.

### Player Categories

Players are divided into categories based on their rating:

- **ONYX:** 1000 ≤ E < 1400
- **AMÉTHYSTE:** 1400 ≤ E < 1700
- **TOPAZE:** 1700 ≤ E < 1900
- **DIAMANT:** E ≥ 1900
