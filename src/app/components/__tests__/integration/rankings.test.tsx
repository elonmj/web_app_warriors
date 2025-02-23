import { render, screen, waitFor } from '@testing-library/react'
import PlayerRankings from '../../PlayerRankings'
import { server, createHandlers } from '@/test/mswSetup'
import { http, HttpResponse } from 'msw'
import { PlayerCategory } from '@/types/Enums'
import { EventRanking } from '@/types/Ranking'

// Mock API responses
const mockEventRanking: EventRanking = {
  eventId: 'test-event',
  lastUpdated: new Date().toISOString(),
  rankings: [
    {
      playerId: 'player1',
      rank: 1,
      points: 100,
      matches: 5,
      wins: 4,
      losses: 1,
      draws: 0,
      rating: 1550,
      ratingChange: 25,
      category: PlayerCategory.ONYX,
      playerDetails: {
        name: 'Player One',
        currentRating: 1550,
        category: PlayerCategory.ONYX
      }
    },
    {
      playerId: 'player2',
      rank: 2,
      points: 75,
      matches: 5,
      wins: 3,
      losses: 2,
      draws: 0,
      rating: 1480,
      ratingChange: -15,
      category: PlayerCategory.AMÉTHYSTE,
      playerDetails: {
        name: 'Player Two',
        currentRating: 1480,
        category: PlayerCategory.AMÉTHYSTE
      }
    }
  ],
  metadata: {
    round: 1,
    isCurrentRound: true,
    totalRounds: 3,
    completed: false
  }
}

interface HandlerParams {
  eventId?: string;
  round?: string;
}

// Set up request handlers
server.use(
  ...createHandlers([
    {
      path: '/api/rankings/:eventId',
      method: 'get',
      response: mockEventRanking
    },
    {
      path: '/api/rankings/:eventId/round/:round',
      method: 'get',
      response: (_req: Request, params: HandlerParams) => {
        if (params?.eventId === 'test-event' && params?.round === '1') {
          return mockEventRanking
        }
        return new Response(null, { status: 404 })
      }
    }
  ])
)

describe('PlayerRankings Integration Tests', () => {
  test('fetches and displays rankings data correctly', async () => {
    render(
      <PlayerRankings
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={3}
      />
    )

    // Verify rankings are displayed
    await waitFor(() => {
      expect(screen.getByText('Player One')).toBeInTheDocument()
      expect(screen.getByText('Player Two')).toBeInTheDocument()
    })

    // Verify ranking details
    expect(screen.getByText('1550')).toBeInTheDocument() // Rating
    expect(screen.getByText('100')).toBeInTheDocument() // Points
    expect(screen.getByText('+25')).toBeInTheDocument() // Rating change
  })

  test('handles API error states correctly', async () => {
    // Override handler to simulate error
    server.use(
      http.get('/api/rankings/:eventId', () => {
        return HttpResponse.json(null, { status: 500 })
      })
    )

    render(
      <PlayerRankings
        eventRanking={{
          eventId: 'test-event',
          lastUpdated: new Date().toISOString(),
          rankings: []
        } as EventRanking}
        currentRound={1}
        totalRounds={3}
      />
    )

    // Verify error state
    await waitFor(() => {
      expect(screen.getByText(/no rankings available/i)).toBeInTheDocument()
    })
  })

  test('updates rankings when round changes', async () => {
    const onRoundChange = jest.fn()
    
    const { rerender } = render(
      <PlayerRankings
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={3}
        onRoundChange={onRoundChange}
      />
    )

    // Mock new rankings for round 2
    const round2Rankings = {
      ...mockEventRanking,
      metadata: { ...mockEventRanking.metadata, round: 2 }
    }

    // Simulate round change
    rerender(
      <PlayerRankings
        eventRanking={round2Rankings}
        currentRound={2}
        totalRounds={3}
        onRoundChange={onRoundChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Round 2 of 3')).toBeInTheDocument()
    })
  })
})