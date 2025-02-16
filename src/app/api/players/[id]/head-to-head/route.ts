import { NextRequest, NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { PlayerMatch } from '@/types/Player';

const playerRepo = new PlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await playerRepo.getPlayer(params.id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const opponentId = searchParams.get('opponent');

    // Ensure matches is an array
    const matches = Array.isArray(player.matches) ? player.matches : [];
    if (matches.length === 0) {
      return NextResponse.json([]);
    }

    // Group matches by opponent and calculate head-to-head statistics
    const headToHead = matches.reduce((acc, match) => {
      const opponent = match.opponent?.id;
      if (!opponent) return acc; // Skip matches with invalid opponent data

      if (!acc[opponent]) {
        acc[opponent] = {
          opponentId: opponent,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalScore: [0, 0],
          averageRatingChange: 0,
          totalRatingChange: 0,
          averagePR: 0,
          totalPR: 0,
          lastMatch: match.date,
          firstMatch: match.date,
          validMatchCount: 0, // Track matches with valid results
        };
      }

      const record = acc[opponent];
      record.matches++;

      if (match.result?.score) {
        record.validMatchCount++;
        // Update win/loss/draw record
        const [playerScore, opponentScore] = match.result.score;
        if (playerScore > opponentScore) record.wins++;
        else if (playerScore < opponentScore) record.losses++;
        else record.draws++;

        // Update totals
        record.totalScore[0] += playerScore;
        record.totalScore[1] += opponentScore;
        record.totalPR += match.result.pr || 0;
      }

      if (match.ratingChange?.change) {
        record.totalRatingChange += match.ratingChange.change;
      }

      // Update date ranges
      const matchDate = new Date(match.date);
      const lastMatchDate = new Date(record.lastMatch);
      const firstMatchDate = new Date(record.firstMatch);

      if (matchDate > lastMatchDate) {
        record.lastMatch = match.date;
      }
      if (matchDate < firstMatchDate) {
        record.firstMatch = match.date;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and format response
    const records = Object.values(headToHead).map(record => {
      const validMatches = Math.max(record.validMatchCount, 1); // Avoid division by zero
      return {
        opponentId: record.opponentId,
        matches: record.matches,
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
        totalScore: record.totalScore,
        averageScore: [
          Math.round(record.totalScore[0] / validMatches),
          Math.round(record.totalScore[1] / validMatches)
        ],
        averageRatingChange: Math.round(record.totalRatingChange / validMatches),
        totalRatingChange: record.totalRatingChange,
        averagePR: Math.round(record.totalPR / validMatches),
        totalPR: record.totalPR,
        lastMatch: record.lastMatch,
        firstMatch: record.firstMatch,
        winRate: record.validMatchCount > 0 
          ? Math.round((record.wins / record.validMatchCount) * 100)
          : 0
      };
    }).filter(record => record.matches > 0); // Only include records with actual matches

    // Sort by number of matches (most played opponents first)
    records.sort((a, b) => b.matches - a.matches);

    // If opponent ID is provided, filter for that specific matchup
    const response = opponentId
      ? records.find(r => r.opponentId === opponentId) || null
      : records;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching head-to-head records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch head-to-head records' },
      { status: 500 }
    );
  }
}