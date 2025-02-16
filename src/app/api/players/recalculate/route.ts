import { NextRequest, NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { MatchRepository } from '@/api/repository/MatchRepository';
import { PlayerMatch } from '@/types/Player';
import { Match } from '@/types/Match';

function convertToPlayerMatch(match: Match, playerId: string): PlayerMatch {
  // Determine if this player is player1 or player2
  const isPlayer1 = match.player1.id === playerId;
  const player = isPlayer1 ? match.player1 : match.player2;
  const opponent = isPlayer1 ? match.player2 : match.player1;
  
  const playerMatch: PlayerMatch = {
    date: match.date,
    eventId: match.eventId,
    matchId: match.id,
    opponent: {
      id: opponent.id,
      ratingAtTime: opponent.ratingBefore,
      categoryAtTime: opponent.categoryBefore
    },
    result: {
      score: isPlayer1 ? match.result!.score : [match.result!.score[1], match.result!.score[0]],
      pr: isPlayer1 ? match.result!.pr : match.result!.pr === 3 ? 0 : (match.result!.pr === 0 ? 3 : 1),
      pdi: match.result!.pdi,
      ds: match.result!.ds
    },
    ratingChange: {
      before: player.ratingBefore,
      after: player.ratingAfter,
      change: player.ratingAfter - player.ratingBefore
    },
    categoryAtTime: player.categoryBefore
  };

  console.log('Converted match for player:', {
    playerId,
    matchId: match.id,
    status: match.status,
    result: playerMatch.result.score,
    ratingChange: playerMatch.ratingChange
  });

  return playerMatch;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting player statistics recalculation...");
    const playerRepo = new PlayerRepository();
    const matchRepo = new MatchRepository();
    let players = await playerRepo.getAllPlayers();
    console.log(`Found ${players.length} players to process`);

    // Get all matches with results
    console.log("Fetching matches...");
    const allMatches = await matchRepo.getAllMatches();
    console.log('Raw matches from repository:', allMatches.length);
    
    const validMatches = allMatches.filter(m => {
      const hasResult = m.result && (m.status === 'completed' || m.status === 'forfeit');
      if (!hasResult) {
        console.log('Skipping invalid match:', { id: m.id, status: m.status, hasResult: !!m.result });
      }
      return hasResult;
    });
    
    console.log(`Found ${validMatches.length} valid matches (completed + forfeit)`);

    // First pass: Collect matches for each player
    console.log("Processing matches for each player...");
    const playerUpdates = players.map(player => {
      // Find all matches for this player
      const playerMatches = validMatches
        .filter(m => {
          const isParticipant = m.player1.id === player.id || m.player2.id === player.id;
          console.log(`Match ${m.id} (${m.status}) for ${player.id}: ${isParticipant ? 'participant' : 'not participant'}`);
          return isParticipant;
        })
        .map(match => convertToPlayerMatch(match, player.id));

      console.log(`Found ${playerMatches.length} matches for player ${player.name}`);

      return {
        ...player,
        matches: playerMatches
      };
    });

    // Second pass: Update all players
    console.log("Updating player records...");
    for (const player of playerUpdates) {
      console.log(`Updating player ${player.name} with ${player.matches.length} matches`);
      await playerRepo.updatePlayer(player.id, player);
      await playerRepo.recalculatePlayerStatistics(player.id, false);
    }

    console.log("Recalculation completed successfully");
    return NextResponse.json({ 
      message: 'Player statistics recalculated successfully',
      summary: playerUpdates.map(p => ({
        id: p.id,
        name: p.name,
        matchCount: p.matches?.length || 0,
        matches: p.matches.map(m => ({
          id: m.matchId,
          result: m.result.score,
          ratingChange: m.ratingChange
        }))
      }))
    });
  } catch (error) {
    console.error('Error recalculating player statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recalculate player statistics' },
      { status: 500 }
    );
  }
}