import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { Player, PlayerMatch } from '@/types/Player';

const playerRepository = new FirebasePlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the player
    const player = await playerRepository.getPlayer(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    
    // Get all opponents this player has faced
    const matches = player.matches || [];
    
    if (!matches.length) {
      return NextResponse.json({
        playerId: id,
        opponents: [],
        totalMatches: 0
      });
    }
    
    // Calculate head-to-head statistics by opponent
    type OpponentRecord = {
      opponentId: string;
      matches: number;
      wins: number; 
      losses: number;
      draws: number;
      totalPointsFor: number;
      totalPointsAgainst: number;
      avgPointsFor: number;
      avgPointsAgainst: number;
      lastMatch: string;
      matchList: Array<{
        date: string;
        playerScore: number;
        opponentScore: number;
        ratingChange: number;
      }>;
    };
    
    // Group matches by opponent
    const opponentStatsMap = matches.reduce((acc: Record<string, OpponentRecord>, match) => {
      const opponentId = match.opponent.id;
      
      if (!acc[opponentId]) {
        acc[opponentId] = {
          opponentId,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalPointsFor: 0,
          totalPointsAgainst: 0,
          avgPointsFor: 0,
          avgPointsAgainst: 0,
          lastMatch: '',
          matchList: []
        };
      }
      
      const record = acc[opponentId];
      record.matches++;
      
      const playerScore = match.result.score[0];
      const opponentScore = match.result.score[1];
      
      if (playerScore > opponentScore) {
        record.wins++;
      } else if (playerScore < opponentScore) {
        record.losses++;
      } else {
        record.draws++;
      }
      
      record.totalPointsFor += playerScore;
      record.totalPointsAgainst += opponentScore;
      
      record.matchList.push({
        date: match.date,
        playerScore,
        opponentScore,
        ratingChange: match.ratingChange.change
      });
      
      // Keep track of last match date
      if (!record.lastMatch || match.date > record.lastMatch) {
        record.lastMatch = match.date;
      }
      
      return acc;
    }, {});
    
    // Calculate averages and sort match lists
    for (const opponentId in opponentStatsMap) {
      const record = opponentStatsMap[opponentId];
      record.avgPointsFor = Math.round(record.totalPointsFor / record.matches);
      record.avgPointsAgainst = Math.round(record.totalPointsAgainst / record.matches);
      
      // Sort match list by date (newest first)
      record.matchList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    
    // Fetch opponent details and add to result
    const opponentIds = Object.keys(opponentStatsMap);
    const opponents = await Promise.all(
      opponentIds.map(async (opponentId) => {
        const opponent = await playerRepository.getPlayer(opponentId);
        const record = opponentStatsMap[opponentId];
        
        return {
          ...record,
          opponentName: opponent?.name || 'Unknown',
          opponentCategory: opponent?.category || 'Unknown',
          winPercentage: (record.wins / record.matches * 100).toFixed(1)
        };
      })
    );
    
    // Sort by most matches first
    const sortedOpponents = opponents.sort((a, b) => b.matches - a.matches);
    
    return NextResponse.json({
      playerId: id,
      playerName: player.name,
      opponents: sortedOpponents,
      totalMatches: matches.length
    });
  } catch (error) {
    console.error('Error retrieving head-to-head statistics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve head-to-head statistics' },
      { status: 500 }
    );
  }
}