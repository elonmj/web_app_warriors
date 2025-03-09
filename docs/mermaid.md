graph LR
    subgraph Frontend
        A[Next.js App]
        
        subgraph Pages
          HomePage(Home Page - /)
          EventPage(Event Page - /event/[eventId])
          PlayerPage(Player Page - /player/[playerId])
          RankingsPage(Rankings Page - /rankings)
          AdminPage(Admin Page - /admin)
          AdminEventsPage(Admin Events Page- /admin/events)
          AdminPlayersPage(Admin Players Page- /admin/players)
          AdminMatchesPage(Admin Matches Page- /admin/matches)
          AdminLogsPage(Admin Logs Page- /admin/logs)
        end

        subgraph Components
          ClientHomePage
          EventHeader
          StatsOverview
          ClientEventTabs
          PlayerStats
          PlayerMatchHistory
          HeadToHeadStats
          PlayerRankings
          MatchResultPopup
          AdminPasswordDialog
          CreateEventForm
          CompleteRoundButton
          ModifyMatchResultPopup
          MoveList
          ProjectedPairings
          EventRoundPairings
          EventMatchHistory
          EventCard
          ClientEventCard
          ClientEventHeader
          TabNav
          
        end
        
        A --> HomePage
        A --> EventPage
        A --> PlayerPage
        A --> RankingsPage
        A --> AdminPage
        AdminPage --> AdminEventsPage
        AdminPage --> AdminPlayersPage
        AdminPage --> AdminMatchesPage
        AdminPage --> AdminLogsPage

        HomePage --> ClientHomePage
        EventPage --> EventHeader
        EventPage --> StatsOverview
        EventPage --> ClientEventTabs
        PlayerPage --> PlayerStats
        PlayerPage --> PlayerMatchHistory
        PlayerPage --> HeadToHeadStats
        RankingsPage --> PlayerRankings
        
        ClientHomePage -.-> C
        EventHeader -.-> C
        StatsOverview -.-> C
        ClientEventTabs -.-> C
        PlayerStats -.-> C
        PlayerMatchHistory -.-> C
        HeadToHeadStats -.-> C
        PlayerRankings -.-> C
        AdminPasswordDialog -.-> C
        CreateEventForm -.-> C
        CompleteRoundButton -.-> C
        ModifyMatchResultPopup -.-> C
        
        C{API Endpoints}
    end

    subgraph Backend
      subgraph API_Routes
        C --> GetEvents[/api/events - GET]
        C --> CreateEvent[/api/events - POST]
        C --> GetEvent[/api/event/[id] - GET]
        C --> UpdateEvent[/api/event/[id] - PUT]
        C --> GetPlayers[/api/players - GET]
        C --> GetPlayer[/api/players/[id] - GET]
        C --> GetGlobalRankings[/api/rankings/global - GET]
        C --> UpdateGlobalRankings[/api/rankings/global - POST]
        C --> GetEventRankings[/api/rankings/[eventId] - GET]
        C --> UpdateEventRankings[/api/rankings/[eventId] - POST]
        C --> GetRoundMatches[/api/events/[eventId]/rounds/[round]/matches - GET]
        C --> ProcessMatchResult[/api/matches/result - POST]
        C --> GetMatch[/api/matches/[eventId]/[matchId] - GET]
        C --> FetchISC[/api/matches/isc/fetch - GET]
        C --> VerifyAuth[/api/auth/verify - POST]
        C --> RecalculateCategories[/api/categories/recalculate - POST]
        C --> RecalculatePlayers[/api/players/recalculate - POST]
        C --> GetEventStats[/api/stats/event/[id] - GET]
        C --> GetPlayerHeadToHead[/api/players/[id]/head-to-head - GET]
        C --> GetPlayerMatches[/api/players/[id]/matches - GET]
        C --> GetPlayerStatistics[/api/players/[id]/statistics - GET]
      end
      
      subgraph Services
        EventService
        MatchService
        RankingService
        StatisticsService
        ISCService
        CategoryService
        RatingService
      end

      subgraph Repositories
        EventRepository
        PlayerRepository
        MatchRepository
      end
      
      subgraph lib
        RatingSystemLib[RatingSystem]
        MatchManagerLib[MatchManager]
        StatisticsLib[Statistics]
        CategoryManagerLib[CategoryManager]
        AuthLib[Auth]
      end

        GetEvents --> EventService
        CreateEvent --> EventService
        GetEvent --> EventService
        UpdateEvent --> EventService
        GetPlayers --> PlayerRepository
        GetPlayer --> PlayerRepository
        GetGlobalRankings --> RankingService
        UpdateGlobalRankings --> RankingService
        GetEventRankings --> RankingService
        UpdateEventRankings --> RankingService
        GetRoundMatches --> EventService
        ProcessMatchResult --> MatchService
        GetMatch --> MatchService
        FetchISC --> ISCService
        VerifyAuth --> AuthLib
        RecalculateCategories --> CategoryService
        RecalculatePlayers --> PlayerRepository
        GetEventStats --> StatisticsService
        GetPlayerHeadToHead --> PlayerRepository
        GetPlayerMatches --> PlayerRepository
        GetPlayerStatistics --> PlayerRepository

        EventService --> EventRepository
        MatchService --> EventRepository
        MatchService --> PlayerRepository
        MatchService --> RatingSystemLib
        MatchService --> CategoryManagerLib
        RankingService --> EventRepository
        RankingService --> PlayerRepository
        StatisticsService --> EventRepository
        StatisticsService --> PlayerRepository
        StatisticsService --> StatisticsLib
        
        EventRepository --> EventsJSON(events.json)
        PlayerRepository --> PlayersJSON(players.json)
        MatchRepository --> MatchesJSON(matches/{eventId}/{round}.json)
        EventRepository --> RankingsJSON(rankings/{eventId}/{round}.json)
        PlayerRepository -.-> PlayerMatchesJSON(player_matches/{playerId}.json)
    end

    subgraph External
      ISCService -.-> ISCAPICall(ISC API)
    end

    classDef external fill:#f9f,stroke:#333,stroke-width:2px
    class ISCAPICall external