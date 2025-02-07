# Page Plan

## 1. Home Page (`/`)
* Displays a list of all events with their status (Open or Closed)
* Open events are visually distinct from closed events
* Links to Closed Event Pages
* Triggers the Open Event Pop-up

## 2. Closed Event Page (`/event/[eventId]`)
* Displays statistics for the event
* Links to player files
* Displays the final ranking
* Shows event history and modifications
* Archive of all matches and disputes

## 3. Open Event Pop-up
* Mini app bar with three sections:
  * Pending Matches tab
  * Played Matches tab
  * Current Ranking button
* Quick access to match entry and rankings

## 4. Match Results Entry Page (`/event/[eventId]/match/[matchId]`)
* Form for entering match scores
* Approval mechanism for both players
* Warning system for unapproved results
* Dispute resolution interface for administrators
* Match history and modifications log

## 5. Current Ranking Page (`/event/[eventId]/ranking`)
* Displays current standings with:
  * Player names and ranks
  * Points de Rencontre (PR)
  * Points de Départage Interne (PDI)
  * Différence de Score (DS)
  * Number of matches played
  * Recent performance metrics
* Category badges (ONYX, AMÉTHYSTE, TOPAZE, DIAMANT)

## 6. Admin Dashboard (`/admin`)
* Dispute resolution management
* Match history modifications
* Player category management
* Event management (open/close events)
* Access to centralized history
* System configuration (tie-breaking rules, rating evolution parameters)

## 7. Player Profile Page (`/player/[playerId]`)
* Player's current category and rating
* Match history
* Performance statistics
* Rating evolution chart
* Head-to-head records