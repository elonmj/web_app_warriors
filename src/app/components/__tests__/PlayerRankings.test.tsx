import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlayerRankings } from '../PlayerRankings';
import { EventRanking } from '@/types/Ranking';
import { PlayerCategory } from '@/types/Enums';

const mockEventRanking: EventRanking = {
  eventId: 'test-event',
  lastUpdated: new Date().toISOString(),
  rankings: [
    {
      playerId: '1',
      rank: 1,
      points: 12,
      matches: 4,
      wins: 3,
      losses: 1,
      draws: 0,
      rating: 1250,
      ratingChange: 50,
      category: PlayerCategory.DIAMANT,
      playerDetails: {
        name: 'Player One',
        currentRating: 1250,
        category: PlayerCategory.DIAMANT
      }
    },
    {
      playerId: '2',
      rank: 2,
      points: 9,
      matches: 4,
      wins: 2,
      losses: 1,
      draws: 1,
      rating: 1200,
      ratingChange: -20,
      category: PlayerCategory.AMÉTHYSTE,
      playerDetails: {
        name: 'Player Two',
        currentRating: 1200,
        category: PlayerCategory.AMÉTHYSTE
      }
    }
  ],
  metadata: {
    round: 1,
    totalRounds: 3,
    isCurrentRound: true,
    completed: false
  }
};

describe('PlayerRankings', () => {
  it('renders rankings table with correct data', () => {
    render(<PlayerRankings eventRanking={mockEventRanking} />);
    
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // points
  });

  it('shows round navigation when enabled', () => {
    render(
      <PlayerRankings 
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={3}
        onRoundChange={jest.fn()}
      />
    );

    expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous round/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next round/i })).toBeEnabled();
  });

  it('calls onRoundChange when navigating', () => {
    const handleRoundChange = jest.fn();
    render(
      <PlayerRankings 
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={3}
        onRoundChange={handleRoundChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /next round/i }));
    expect(handleRoundChange).toHaveBeenCalledWith(2);
  });

  it('shows empty state when no rankings', () => {
    render(
      <PlayerRankings 
        eventRanking={{
          ...mockEventRanking,
          rankings: []
        }}
        currentRound={1}
        totalRounds={3}
      />
    );

    expect(screen.getByText(/no rankings available/i)).toBeInTheDocument();
  });

  it('displays current round indicator', () => {
    render(<PlayerRankings eventRanking={mockEventRanking} />);
    expect(screen.getByText('Current Round')).toBeInTheDocument();
  });

  it('applies correct color coding for rating changes', () => {
    render(<PlayerRankings eventRanking={mockEventRanking} />);
    
    const positiveChange = screen.getByText('+50');
    const negativeChange = screen.getByText('-20');
    
    expect(positiveChange.className).toContain('text-green-600');
    expect(negativeChange.className).toContain('text-red-600');
  });

  it('displays player category with correct styling', () => {
    render(<PlayerRankings eventRanking={mockEventRanking} />);
    
    const diamantCategory = screen.getByText(PlayerCategory.DIAMANT);
    const amethysteCategory = screen.getByText(PlayerCategory.AMÉTHYSTE);
    
    expect(diamantCategory.className).toContain('text-diamant-600');
    expect(amethysteCategory.className).toContain('text-amethyste-600');
  });

  it('shows loading skeleton during round changes', async () => {
    const onRoundChange = jest.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 100));
    });

    render(
      <PlayerRankings 
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={3}
        onRoundChange={onRoundChange}
      />
    );

    // Click next round to trigger loading state
    fireEvent.click(screen.getByRole('button', { name: /next round/i }));

    // Verify loading skeleton appears
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('preserves sorting order', () => {
    render(<PlayerRankings eventRanking={mockEventRanking} />);
    
    const rows = screen.getAllByRole('row');
    // Header row + 2 player rows
    expect(rows).toHaveLength(3);
    
    // Verify order by rank
    const firstRow = rows[1];
    const secondRow = rows[2];
    expect(firstRow).toHaveTextContent('Player One');
    expect(secondRow).toHaveTextContent('Player Two');
  });
});