import { NextRequest, NextResponse } from 'next/server';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { UpdateMatchResultInput, Match } from '@/types/Match';
import { PlayerCategoryType } from '@/types/Enums';
import { FirebaseMatchRepository } from '@/api/repository/FirebaseMatchRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { wooglesService } from '@/api/services/WooglesService';
import { gamePersistenceService } from '@/api/services/GamePersistenceService';

const matchService = new MatchService();
const rankingService = new RankingService();
const matchRepository = new FirebaseMatchRepository();
const playerRepository = new FirebasePlayerRepository();

interface MatchUpdate {
  id: string;
  newRating: number;
  newCategory: PlayerCategoryType;
  ratingChange: number;
}

interface MatchResponse {
  match: Match;
  updates: {
    player1: MatchUpdate;
    player2: MatchUpdate;
  };
  /** Non-blocking validation warnings (e.g. Woogles unreachable) */
  warnings?: string[];
}

/**
 * POST /api/matches/result
 * Process a match result and update rankings
 */
export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse | { error: string }>> {
  try {
    const input: UpdateMatchResultInput = await request.json();

    // Validate required fields
    if (!input.matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    if (!input.score) {
      return NextResponse.json(
        { error: 'Score is required' },
        { status: 400 }
      );
    }

    if (typeof input.score.player1Score !== 'number' || typeof input.score.player2Score !== 'number') {
      return NextResponse.json(
        { error: 'Player scores must be numbers' },
        { status: 400 }
      );
    }

    // Get match from repository
    const match = await matchRepository.getMatch(input.matchId);

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Validate submitted scores against Woogles using the players' REAL
    // usernames (the legacy code wrongly used player.name as the username).
    const warnings: string[] = [];
    try {
      const [p1, p2] = await Promise.all([
        playerRepository.getPlayer(match.player1.id),
        playerRepository.getPlayer(match.player2.id),
      ]);

      const u1 = p1?.wooglesUsername ?? p1?.iscUsername;
      const u2 = p2?.wooglesUsername ?? p2?.iscUsername;

      if (u1 && u2) {
        const validation = await wooglesService.validateSubmittedScore(
          u1,
          u2,
          input.score.player1Score,
          input.score.player2Score
        );

        if (validation.valid && validation.game) {
          // Persist the game + run the statistical analysis (fire-and-forget)
          void gamePersistenceService.persistAndAnalyze(validation.game, {
            matchId: match.id,
            eventId: match.eventId,
          });
        }

        if (!validation.valid && validation.game) {
          // A game exists on Woogles but scores differ: hard reject.
          return NextResponse.json(
            {
              error: `Submitted scores do not match Woogles results (${validation.reason}). Please check the scores and try again.`,
            },
            { status: 400 }
          );
        }

        if (!validation.valid) {
          warnings.push(
            `No game found on Woogles between ${u1} and ${u2} — result accepted without platform validation.`
          );
        }
      } else {
        warnings.push(
          'Woogles username missing for one or both players — result accepted without platform validation.'
        );
      }
    } catch (wooglesError) {
      // Woogles being unreachable must not dead-end result submission.
      console.error('Error validating against Woogles:', wooglesError);
      warnings.push(
        'Woogles could not be reached — result accepted without platform validation.'
      );
    }

    try {
      // Process match result with all updates
      const { updatedMatch, player1Update, player2Update } = await matchService.processMatchResult(match, input);

      // Update rankings - utiliser une méthode existante ou mettre à jour RankingService
      try {
        await rankingService.updateRoundRankings(match.eventId, updatedMatch.metadata.round);
      } catch (rankingError) {
        console.error('Error updating rankings:', rankingError);
        // Rankings update failure shouldn't block match result response
      }

      // Return response with player updates
      const response: MatchResponse = {
        match: updatedMatch,
        updates: {
          player1: {
            id: player1Update.id || match.player1.id,
            newRating: player1Update.currentRating || match.player1.ratingBefore,
            newCategory: (player1Update.category || match.player1.categoryBefore || 'ONYX') as PlayerCategoryType,
            ratingChange: (player1Update.currentRating || match.player1.ratingBefore) - match.player1.ratingBefore
          },
          player2: {
            id: player2Update.id || match.player2.id,
            newRating: player2Update.currentRating || match.player2.ratingBefore,
            newCategory: (player2Update.category || match.player2.categoryBefore || 'ONYX') as PlayerCategoryType,
            ratingChange: (player2Update.currentRating || match.player2.ratingBefore) - match.player2.ratingBefore
          }
        },
        ...(warnings.length > 0 ? { warnings } : {})
      };

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Error processing match:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process match result' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing match result:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error processing match result' },
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
    const match = await matchRepository.getMatch(params.id);

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