# Handling "BYE" in the Tournament System

## What is a "BYE"?

In tournament formats, when there's an odd number of players, one player will not have an opponent in a given round. This player receives a "bye" - meaning they automatically advance to the next round without playing a match.

## How BYEs are handled in our system

### Representation in the Database

BYE matches are stored with the following structure:
- The player receiving the BYE is assigned as Player 1
- Player 2 has the special ID "BYE"
- The match status is set to "completed"
- No score is recorded, but the player receiving the BYE typically gets ranking points

### Technical Implementation

1. During round generation:
   - If there's an odd number of players, the system identifies who should receive a BYE
   - Typically, the player with the lowest ranking who hasn't yet received a BYE
   - A match document is created with Player 2 having the ID "BYE"

2. For rating calculations:
   - Matches with a BYE player are filtered out from regular rating calculations
   - The player receiving the BYE typically gets a predefined number of ranking points

3. In the UI:
   - BYE matches are visually distinguished from regular matches
   - No option to report results for these matches

### Special Considerations for Firebase

When working with Firebase:
- Special IDs like "BYE" are stored as strings
- Type checking should be in place to handle comparisons with "BYE" properly
- Queries that fetch opponents need to filter out BYE players when appropriate