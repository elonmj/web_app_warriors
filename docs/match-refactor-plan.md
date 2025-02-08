# Mentoring League Data Implementation Plan

## Event Details
- Name: Mentoring League
- Date: 02-02-2025
- Type: Initial Random Pairing Event

## Data Structure Requirements

### Players
Each player needs:
- Unique ID
- Name
- Initial Rating (all players start in low category)
- Category: "low"
- Empty matches array
- Initial statistics

### Matches
Each match needs:
- Match ID
- Date
- Player pairs from initial random pairing
- Match status (completed/forfeit/pending)
- Scores where applicable
- Event ID

## Implementation Steps

1. Create player data for all 28 players:
   - Elie, Divin, Hermann, Trinité, Géraldo, Oslie, William, Lorinda
   - Oswalde, Pinocché, Foréol, Joaïda, Référil, Rodrigue
   - Fructueux, Alain, Naofal, Mya, Prosper, Léonel
   - Raissa, StWill, Mickaël, Charbel, Kevin, Joy, Elonm, Solène

2. Process match results:
   - Regular matches:
     - Divin vs Elie (461-204)
     - Référil vs Rodrigue (223-191)
     - Mya vs Naofal (380-350)
     - Charbel vs Mickaël (512-154)
   
   - Forfeit matches:
     - Géraldo wins by forfeit vs Oslie
     - Pinocché wins by forfeit vs Oswalde
     - Joaïda vs Foréol (Joaïda wins)
     - StWill wins by forfeit vs Raissa
     - Joy wins by forfeit vs Kevin
     - Solène wins by forfeit vs Elonm

   - No games (status: pending):
     - Hermann vs Trinité
     - William vs Lorinda
     - Fructueux vs Alain
     - Prosper vs Léonel

3. Calculate initial rankings based on match results

## JSON Structure

Will create a data.json file with:
1. Player definitions
2. Match definitions
3. Event definition

The format will follow the interfaces defined in Player.ts and Match.ts.

## Notes
- All players start with equal initial rating in low category
- Match statuses will be:
  - 'completed' for played matches
  - 'forfeit' for forfeit matches
  - 'pending' for no-game matches
- Event ID will be needed to link all matches