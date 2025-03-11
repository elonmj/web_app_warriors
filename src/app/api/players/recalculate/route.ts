import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { FirebaseMatchRepository } from '@/api/repository/FirebaseMatchRepository';
import { StatisticsService } from '@/api/services/StatisticsService';

const playerRepo = new FirebasePlayerRepository();
const matchRepo = new FirebaseMatchRepository();
const statsService = new StatisticsService();

export async function POST(
  request: NextRequest
) {
  try {
    // This is an admin-only endpoint, so we might want some authentication
    // However, for simplicity, we'll skip that for now
    
    // 1. Get all players and matches
    const players = await playerRepo.getAllPlayers();
    const matches = await matchRepo.getAllMatches();
    
    // Sort matches by date to process them chronologically
    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Reset player statistics
    const resetPlayers = await Promise.all(players.map(async player => {
      // Reset statistics while keeping player info
      const resetPlayer = {
        ...player,
        matches: [],
        currentRating: 1000,
        statistics: {
          ...player.statistics,
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          totalPR: 0,
          bestRating: 1000,
          worstRating: 1000,
        }
      };
      
      return await playerRepo.updatePlayer(player.id, resetPlayer);
    }));
    
    // 3. Process each match and update player statistics
    let processedMatches = 0;
    for (const match of matches) {
      if (!match.result || match.status !== 'completed') {
        continue;
      }
      
      processedMatches++;
      
      // Get players
      const player1 = resetPlayers.find(p => p.id === match.player1.id);
      const player2 = resetPlayers.find(p => p.id === match.player2.id);
      
      if (!player1 || !player2 || player2.id === 'BYE') {
        console.warn(`Skipping match ${match.id} - player(s) not found`);
        continue;
      }
      
      // Update each player's statistics
      const updatedPlayer1 = await statsService.updatePlayerStatistics(player1, match);
      const updatedPlayer2 = await statsService.updatePlayerStatistics(player2, match);
      
      // Save updated stats back to players array
      const p1Index = resetPlayers.findIndex(p => p.id === player1.id);
      const p2Index = resetPlayers.findIndex(p => p.id === player2.id);
      
      if (p1Index >= 0) resetPlayers[p1Index] = updatedPlayer1;
      if (p2Index >= 0) resetPlayers[p2Index] = updatedPlayer2;
    }
    
    // 4. Calculate derived statistics
    for (let player of resetPlayers) {
      const matches = player.matches || [];
      
      // Calculate win rate, average PR, etc.
      if (matches.length > 0) {
        const totalGames = matches.length;
        const wins = matches.filter(m => m.result.score[0] > m.result.score[1]).length;
        const draws = matches.filter(m => m.result.score[0] === m.result.score[1]).length;
        const losses = totalGames - wins - draws;
        
        const totalPR = matches.reduce((sum, match) => sum + match.result.pr, 0);
        const totalDS = matches.reduce((sum, match) => sum + match.result.ds, 0);
        
        player.statistics = {
          ...player.statistics,
          totalMatches: totalGames,
          wins,
          draws,
          losses,
          totalPR,
          averageDS: totalDS / totalGames,
          bestRating: Math.max(...matches.map(m => m.ratingChange.after)),
          worstRating: Math.min(...matches.map(m => m.ratingChange.after))
        };
      }
      
      await playerRepo.updatePlayer(player.id, player);
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        playersProcessed: resetPlayers.length,
        matchesProcessed: processedMatches
      }
    });
  } catch (error) {
    console.error('Error recalculating player statistics:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate player statistics' },
      { status: 500 }
    );
  }
}