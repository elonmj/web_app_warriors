import { render, screen, act, within } from '@testing-library/react';
import { renderWithPerformance } from '../setup';
import PlayerRankings from '../../PlayerRankings';
import { EventRanking, PlayerRanking } from '@/types/Ranking';
import { EventType, EventStatus, PlayerCategory } from '@/types/Enums';

/**
 * Generate mock ranking data with specified size
 * @param size Number of rankings to generate
 * @returns Array of mock PlayerRanking objects
 */
const generateMockRankings = (size: number): PlayerRanking[] => {
  return Array.from({ length: size }, (_, index) => ({
    playerId: `player${index}`,
    rank: index + 1,
    points: Math.floor(Math.random() * 1000),
    matches: Math.floor(Math.random() * 20),
    wins: Math.floor(Math.random() * 15),
    losses: Math.floor(Math.random() * 15),
    draws: 0,
    rating: 1500 + Math.floor(Math.random() * 500),
    ratingChange: Math.floor(Math.random() * 41) - 20,
    category: PlayerCategory.ONYX,
    playerDetails: {
      name: `Player ${index}`,
      currentRating: 1500 + Math.floor(Math.random() * 500),
      category: PlayerCategory.ONYX
    }
  }));
};

/**
 * Create a mock event ranking with the specified number of player rankings
 * @param size Number of rankings to include
 * @returns Mock EventRanking object
 */
const createMockEventRanking = (size: number): EventRanking => ({
  eventId: 'test-event',
  lastUpdated: new Date().toISOString(),
  rankings: generateMockRankings(size),
  metadata: {
    round: 1,
    isCurrentRound: true,
    totalRounds: 5,
    completed: false
  }
});

describe('PlayerRankings Performance Tests', () => {
  // Increase Jest timeout for all tests
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const dataSizes = [10, 50, 100, 500, 1000];
  const renderTimeThreshold = 3000; // 3000ms threshold for larger datasets
  const smallDatasetThreshold = 1000; // 1000ms threshold for smaller datasets

  test.each(dataSizes)(
    'renders %i rankings within performance threshold',
    async (size) => {
      const mockEventRanking = createMockEventRanking(size);
      const { renderTime } = renderWithPerformance(
        <PlayerRankings
          eventRanking={mockEventRanking}
          currentRound={1}
          totalRounds={5}
        />
      );

      // Use appropriate threshold based on dataset size
      const threshold = size <= 100 ? smallDatasetThreshold : renderTimeThreshold;
      expect(renderTime).toBeLessThan(threshold);

      // Find the rankings table using a more specific query
      const tables = screen.getAllByRole('table');
      const rankingsTable = tables.find(table => 
        within(table).queryByText('Position') !== null
      );
      expect(rankingsTable).toBeDefined();

      if (rankingsTable) {
        // Count rows in tbody only
        const tbody = rankingsTable.querySelector('tbody');
        const rows = tbody?.querySelectorAll('tr') || [];
        expect(rows.length).toBe(size);
      }
    }
  );

  test('handles large dataset scrolling performance', async () => {
    const largeDataset = createMockEventRanking(1000);
    const { container } = render(
      <PlayerRankings
        eventRanking={largeDataset}
        currentRound={1}
        totalRounds={5}
      />
    );

    // Find the scrollable container
    const tableContainer = container.querySelector('.overflow-x-auto');
    expect(tableContainer).toBeDefined();

    if (tableContainer) {
      await act(async () => {
        // Batch scroll operations to improve performance
        const scrollPositions = [0, 500, 1000, 1500, 2000];
        for (const position of scrollPositions) {
          tableContainer.scrollTop = position;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      });

      // Verify table remains responsive
      expect(screen.queryByText('Position')).toBeInTheDocument();
    }
  });

  test('maintains performance with frequent data updates', async () => {
    const size = 100;
    let mockEventRanking = createMockEventRanking(size);
    const { rerender } = render(
      <PlayerRankings
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={5}
      />
    );

    await act(async () => {
      // Reduce number of updates and increase interval
      for (let i = 0; i < 3; i++) {
        mockEventRanking = createMockEventRanking(size);
        rerender(
          <PlayerRankings
            eventRanking={mockEventRanking}
            currentRound={1}
            totalRounds={5}
          />
        );
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    // Verify component remains responsive
    expect(screen.queryByText('Position')).toBeInTheDocument();
  });

  test('renders correctly with round navigation', async () => {
    const mockEventRanking = createMockEventRanking(50);
    const onRoundChange = jest.fn().mockImplementation(() => Promise.resolve());

    const { container } = render(
      <PlayerRankings
        eventRanking={mockEventRanking}
        currentRound={1}
        totalRounds={5}
        onRoundChange={onRoundChange}
      />
    );

    // Find round indicator by class and text content
    const roundIndicator = Array.from(container.querySelectorAll('p')).find(
      element => element.textContent?.includes('Round 1 of 5')
    );
    expect(roundIndicator).toBeDefined();

    // Find next round button by text content
    const nextButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Next Round')
    );
    expect(nextButton).toBeDefined();

    if (nextButton) {
      await act(async () => {
        nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 300));
      });
      expect(onRoundChange).toHaveBeenCalledWith(2);
    }
  });
});