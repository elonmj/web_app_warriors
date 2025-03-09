# API Documentation

This document describes the API endpoints for the web application.

## Events

### `GET /api/events`

- **Purpose:** Retrieves a list of all events.
- **Parameters:** None
- **Returns:** A list of event objects.
- **Service:** `EventService.getEvents`
- **Repository:** `EventRepository.getAll`

### `GET /api/event/{id}`

- **Purpose:** Retrieves a specific event by its ID.
- **Parameters:**
    - `id` (path): The ID of the event.
- **Returns:** The event object.
- **Service:** `EventService.getEvent`
- **Repository:** `EventRepository.getById`

### `POST /api/events`

- **Purpose:** Creates a new event.
- **Parameters:**
    - Request body: An object containing the event data.
- **Returns:** The created event object.
- **Service:** `EventService.createEvent`
- **Repository:** `EventRepository.create`

### `GET /api/events/{eventId}/rounds`
- **Purpose:** Get all the rounds of an event
- **Parameters:**
 - `eventId` (path): The ID of the event.
- **Returns:** The rounds of the event.
- **Service:** `EventService.getRounds`
- **Repository:** `EventRepository.getById`

### `POST /api/events/{eventId}/pairings`
- **Purpose:** Generate pairings for a specific round of an event.
- **Parameters:**
 - `eventId` (path): The ID of the event.
 - `round` (query): The round number.
- **Returns:** Pairings
- **Service:** `EventService.generatePairingsForRound`
- **Repository:** `EventRepository.getById`

## Players

### `GET /api/players`

- **Purpose:** Retrieves a list of all players.
- **Parameters:** None
- **Returns:** A list of player objects.
- **Service:** `PlayerService.getPlayers` (This service doesn't exist, but the functionality is implied)
- **Repository:** `PlayerRepository.getAll`

### `GET /api/players/{id}`

- **Purpose:** Retrieves a specific player by ID.
- **Parameters:**
    - `id` (path): The ID of the player.
- **Returns:** The player object.
- **Service:** `PlayerService.getPlayer` (This service doesn't exist, but the functionality is implied)
- **Repository:** `PlayerRepository.getById`

### `POST /api/players/recalculate`
- **Purpose:** Recalculate all the players
- **Parameters:** None
- **Returns:** Success or error message
- **Service:** `PlayerService.recalculatePlayers`
- **Repository:** `PlayerRepository.getAll`

## Matches

### `GET /api/matches/{eventId}`

- **Purpose:** Retrieves matches for a specific event.
- **Parameters:**
    - `eventId` (path): The ID of the event.
- **Returns:** A list of match objects.
- **Service:** `MatchService.getMatchesByEventId`
- **Repository:** `MatchRepository.getByEventId`

### `POST /api/matches/result`

- **Purpose:** Processes the result of a match.
- **Parameters:**
    - Request body: An object containing the match result data.
- **Returns:** The updated match object.
- **Service:** `MatchService.processMatchResult`
- **Repository:** `MatchRepository.update`, `PlayerRepository.update`

### `POST /api/matches/modify`

- **Purpose:** Modifies an existing match.
- **Parameters:**
  - Request body: An object containing the updated match data.
- **Returns:** The updated match object.
- **Service:** `MatchService.modifyMatch`
- **Repository:** `MatchRepository.update`

### `GET /api/matches/isc/fetch`
- **Purpose:** Fetch the result of match from ISC
- **Parameters:**
 - `p1` (query): Player 1 username
 - `p2` (query): Player 2 username
- **Returns:** Result of match
- **Service:** `ISCService.fetchMatchResult`

### `POST /api/matches/isc/zoom-fix`
- **Purpose:** Fix the zoom for ISC
- **Parameters:** None
- **Returns:** Success or error message

### `POST /api/matches/isc/debug`
- **Purpose:** Debug ISC
- **Parameters:** None
- **Returns:** Success or error message

## Rankings

### `GET /api/rankings/{eventId}`

- **Purpose:** Retrieves rankings for a specific event.
- **Parameters:**
    - `eventId` (path): The ID of the event.
    - `round` (query, optional): The round number. Defaults to the current round.
- **Returns:** A list of ranking objects.
- **Service:** `RankingService.getRoundRankings`
- **Repository:** `RankingRepository.getByEventAndRound`

### `POST /api/rankings/{eventId}`

- **Purpose:** Forces an update of the rankings for a specific event and round.
- **Parameters:**
    - `eventId` (path): The ID of the event.
    - `round` (query, optional): The round number.
- **Returns:**  Confirmation message.
- **Service:** `RankingService.updateRoundRankings`
- **Repository:** `RankingRepository.update`

### `GET /api/rankings/global`

- **Purpose:** Retrieves the global rankings.
- **Parameters:** None
- **Returns:** A list of global ranking objects.
- **Service:** `RankingService.getGlobalRankings`
- **Repository:** Uses player data to calculate global rankings.

### `POST /api/rankings/global`
- **Purpose:** Update global rankings
- **Parameters:** None
- **Returns:** Success or error message
- **Service:** `RankingService.updateGlobalRankings`

## Categories
### `POST /api/categories/recalculate`
- **Purpose:** Recalculate all the categories
- **Parameters:** None
- **Returns:** Success or error message
- **Service:** `CategoryService.recalculateCategories`
- **Repository:** `PlayerRepository.getAll`

## Stats
### `GET /api/stats/event/{eventId}`
- **Purpose:** Get event statistics
- **Parameters:**
 - `eventId` (path): The ID of the event.
- **Returns:** Event statistics
- **Service:** `StatisticsService.getEventStatistics`
- **Repository:** `EventRepository.getById`