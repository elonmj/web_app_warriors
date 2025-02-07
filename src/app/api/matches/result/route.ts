import { NextRequest, NextResponse } from 'next/server';
import { MatchService } from '@/api/services/MatchService';
import { UpdateMatchResultInput, Match } from '@/lib/Match';
import { Player } from '@/lib/Player';

const matchService = new MatchService();

interface MatchUpdate {
  id: string;
  newRating: number;
  newCategory: string;
  ratingChange: number;
}

interface MatchResponse {
  match: Match;
  updates: {
    player1: MatchUpdate;
    player2: MatchUpdate;
  };
}

interface ProcessMatchResult {
  updatedMatch: Match;
  updatedPlayer1: Player;
  updatedPlayer2: Player;
}

/**
 * POST /api/matches/result
 * Process a match result
 */
export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse | { error: string }>> {
  try {
    const input: UpdateMatchResultInput = await request.json();
    
    // Validate required fields
    if (!input.matchId || !input.score || typeof input.score.player1Score !== 'number' || typeof input.score.player2Score !== 'number') {
      return NextResponse.json(
        { error: 'Failed to process match result' },
        { status: 500 }
      );
    }

    const { matchId } = input;

    // Temporary mock data for testing
    const mockMatch: Match = {
      id: 'test-match-1',
      date: '2024-02-06',
      player1: 'player1',
      player2: 'player2',
      player1Rating: 1200,
      player2Rating: 1100,
      player1Category: 'ONYX',
      player2Category: 'ONYX',
      status: 'pending',
      isRandom: false
    };
    const matches: Match[] = [mockMatch];
    const match = await matchService.getMatch(matchId, matches);
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get players from repository (to be implemented)
    // In the actual implementation, these would be fetched from the repository
    const mockPlayer1: Player = {
      id: match.player1,
      name: 'Player 1',
      currentRating: match.player1Rating,
      category: match.player1Category,
      matches: [],
      statistics: {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0
      }
    };

    const mockPlayer2: Player = {
      id: match.player2,
      name: 'Player 2',
      currentRating: match.player2Rating,
      category: match.player2Category,
      matches: [],
      statistics: {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalPR: 0,
        averageDS: 0,
        inactivityWeeks: 0
      }
    };

    try {
      // Process match result
      const result: ProcessMatchResult = await matchService.processMatchResult(
        input,
        match,
        mockPlayer1,
        mockPlayer2,
        [] // previousMatches
      );

      const { updatedMatch, updatedPlayer1, updatedPlayer2 } = result;

      const response: MatchResponse = {
        match: updatedMatch,
        updates: {
          player1: {
            id: updatedPlayer1.id,
            newRating: updatedPlayer1.currentRating,
            newCategory: updatedPlayer1.category,
            ratingChange: updatedPlayer1.currentRating - mockPlayer1.currentRating
          },
          player2: {
            id: updatedPlayer2.id,
            newRating: updatedPlayer2.currentRating,
            newCategory: updatedPlayer2.category,
            ratingChange: updatedPlayer2.currentRating - mockPlayer2.currentRating
          }
        }
      };

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Error processing match:', error);
      return NextResponse.json(
        { error: 'Failed to process match result' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing match result:', error);
    return NextResponse.json(
      { error: 'Failed to process match result' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/result/[id]
 * Get match result by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<Match | { error: string }>> {
  try {
    // Temporary mock data for testing
    const mockMatch: Match = {
      id: 'test-match-1',
      date: '2024-02-06',
      player1: 'player1',
      player2: 'player2',
      player1Rating: 1200,
      player2Rating: 1100,
      player1Category: 'ONYX',
      player2Category: 'ONYX',
      status: 'pending',
      isRandom: false
    };
    const matches: Match[] = [mockMatch];
    const match = await matchService.getMatch(params.id, matches);

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error retrieving match:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve match' },
      { status: 500 }
    );
  }
}