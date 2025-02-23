import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerRankings } from '@/app/components/PlayerRankings';
import { RankingService } from '@/api/services/RankingService';
import { EventRepository } from '@/api/repository/eventRepository';
import { 
  PlayerCategory, 
  EventStatus, 
  EventType,
  PlayerCategoryType 
} from '@/types/Enums';
import { Event } from '@/types/Event';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// Mock repositories and services
jest.mock('@/api/repository/eventRepository');
jest.mock('@/api/services/RankingService');

const mockEventRepo = new EventRepository() as jest.Mocked<EventRepository>;
const mockRankingService = new RankingService() as jest.Mocked<RankingService>;

// Base mock data
const mockEvent: Event = {
  id: 'test-event',
  name: 'Test Event',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  type: EventType.ROUND_ROBIN,
  status: EventStatus.OPEN,
  metadata: {
    totalPlayers: 4,
    totalMatches: 2,
    currentRound: 1,
    totalRounds: 3,
    lastUpdated: new Date().toISOString(),
    roundHistory: {},
    byeHistory: []
  }
};

describe('Rankings Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles missing rankings data gracefully', () => {
    render(
      <ErrorBoundary>
        <PlayerRankings
          eventRanking={{
            eventId: 'test-event',
            lastUpdated: new Date().toISOString(),
            rankings: [],
            metadata: { round: 1, totalRounds: 3 }
          }}
          currentRound={1}
          totalRounds={3}
        />
      </ErrorBoundary>
    );

    expect(screen.getByText(/no rankings available/i)).toBeInTheDocument();
  });

  it('shows loading state during round navigation', async () => {
    // Create a promise that never resolves to keep loading state
    const handleRoundChange = jest.fn().mockImplementation(() => 
      new Promise(() => {})
    );

    render(
      <PlayerRankings
        eventRanking={{
          eventId: 'test-event',
          lastUpdated: new Date().toISOString(),
          rankings: [{
            playerId: '1',
            rank: 1,
            points: 12,
            matches: 4,
            wins: 3,
            losses: 1,
            draws: 0,
            rating: 1250,
            ratingChange: 50,
            category: PlayerCategory.DIAMANT as PlayerCategoryType,
            playerDetails: {
              name: 'Player One',
              currentRating: 1250,
              category: PlayerCategory.DIAMANT as PlayerCategoryType
            }
          }],
          metadata: { round: 1, totalRounds: 3, isCurrentRound: true }
        }}
        currentRound={1}
        totalRounds={3}
        onRoundChange={handleRoundChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next round/i });
    fireEvent.click(nextButton);

    // Verify loading skeleton appears
    expect(await screen.findByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('handles malformed ranking data', () => {
    render(
      <PlayerRankings
        eventRanking={{
          eventId: 'test-event',
          lastUpdated: new Date().toISOString(),
          rankings: [{
            playerId: '1',
            // Missing required fields
            rank: 1,
            category: PlayerCategory.DIAMANT as PlayerCategoryType
          }] as any[],
          metadata: { round: 1, totalRounds: 3 }
        }}
        currentRound={1}
        totalRounds={3}
      />
    );

    // Should show "Unknown Player" for malformed data
    expect(screen.getByText('Unknown Player')).toBeInTheDocument();
  });

  it('handles race conditions during round changes', () => {
    const delayedRoundChange = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <PlayerRankings
        eventRanking={{
          eventId: 'test-event',
          lastUpdated: new Date().toISOString(),
          rankings: [{
            playerId: '1',
            rank: 1,
            points: 12,
            matches: 4,
            wins: 3,
            losses: 1,
            draws: 0,
            rating: 1250,
            ratingChange: 50,
            category: PlayerCategory.DIAMANT as PlayerCategoryType,
            playerDetails: {
              name: 'Player One',
              currentRating: 1250,
              category: PlayerCategory.DIAMANT as PlayerCategoryType
            }
          }],
          metadata: { round: 1, totalRounds: 3, isCurrentRound: true }
        }}
        currentRound={1}
        totalRounds={3}
        onRoundChange={delayedRoundChange}
      />
    );

    // Click next round to trigger loading state
    const nextButton = screen.getByRole('button', { name: /next round/i });
    fireEvent.click(nextButton);

    // Verify navigation buttons are disabled during loading
    expect(nextButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous round/i })).toBeDisabled();
  });
});