import { Match, MatchResult } from '@/types/Match';
import { PlayerRanking, EventRanking } from '@/types/Ranking';
import { Player } from '@/types/Player';
import * as fs from 'fs/promises';
import path from 'path';
import { MatchRepository } from '../repository/MatchRepository';
import { PlayerRepository } from '../repository/playerRepository';

export class RankingService {
  private matchRepository: MatchRepository;
  private playerRepository: PlayerRepository;
  private readonly DATA_DIR = path.join(process.cwd(), 'data');

  constructor() {
    this.matchRepository = new MatchRepository();
    this.playerRepository = new PlayerRepository();
  }

  private isWinner(match: Match & { result: MatchResult }, playerId: string): boolean {
    if (match.player1.id === playerId) {
      return match.result.score[0] > match.result.score[1];
    }
    if (match.player2.id === playerId) {
      return match.result.score[1] > match.result.score[0];
    }
    return false;
  }

  private isLoser(match: Match & { result: MatchResult }, playerId: string): boolean {
    if (match.player1.id === playerId) {
      return match.result.score[0] < match.result.score[1];
    }
    if (match.player2.id === playerId) {
      return match.result.score[1] < match.result.score[0];
    }
    return false;
  }

  private isDraw(match: Match & { result: MatchResult }): boolean {
    return match.result.score[0] === match.result.score[1];
  }

  private async calculatePlayerRanking(
    player: Player,
    matches: Match[],
    playerMatches: Match[]
  ): Promise<PlayerRanking> {
    // Filter completed matches with results
    const completedMatches = playerMatches.filter(
      (m): m is Match & { result: MatchResult } => 
        (m.status === 'completed' || m.status === 'forfeit') && m.result !== undefined
    );

    const wins = completedMatches.filter(m => this.isWinner(m, player.id)).length;
    const losses = completedMatches.filter(m => this.isLoser(m, player.id)).length;
    const draws = completedMatches.filter(m => this.isDraw(m)).length;

    // Calculate rating change from first to last match
    const sortedMatches = playerMatches.sort((a, b) => 
      new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime()
    );

    const firstMatch = sortedMatches[0];
    const lastMatch = sortedMatches[sortedMatches.length - 1];

    const initialRating = firstMatch.player1.id === player.id 
      ? firstMatch.player1.ratingBefore 
      : firstMatch.player2.ratingBefore;

    const currentRating = lastMatch.player1.id === player.id
      ? lastMatch.player1.ratingAfter
      : lastMatch.player2.ratingAfter;

    // Calculate total points from PR
    const totalPR = completedMatches.reduce((total, match) => total + match.result.pr, 0);

    return {
      playerId: player.id,
      rank: 0, // Will be set after sorting
      points: totalPR, // Use PR instead of wins/draws
      matches: completedMatches.length,
      wins,
      losses,
      draws,
      rating: currentRating,
      ratingChange: currentRating - initialRating,
      category: player.category,
      playerDetails: {
        name: player.name,
        currentRating: player.currentRating,
        category: player.category
      }
    };
  }

  private sortRankings(rankings: PlayerRanking[]): PlayerRanking[] {
    return rankings.sort((a, b) => {
      // First by points (changed from rating)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Then by wins
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // Then by matches played (more matches = higher rank if tied)
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }
      // Finally by rating if everything else is tied
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return 0;
    });
  }

  async updateEventRankings(eventId: string): Promise<void> {
    try {
      const matches = await this.matchRepository.getEventMatches(eventId);
      const players = await this.playerRepository.getAllPlayers();
      
      // Get active players in this event
      const activePlayerIds = new Set<string>();
      matches.forEach(match => {
        activePlayerIds.add(match.player1.id);
        activePlayerIds.add(match.player2.id);
      });
      const activePlayers = players.filter(p => activePlayerIds.has(p.id));

      // Calculate rankings for each player
      const rankings: PlayerRanking[] = await Promise.all(
        activePlayers.map(async player => {
          const playerMatches = matches.filter(m => 
            (m.player1.id === player.id || m.player2.id === player.id)
          );
          return this.calculatePlayerRanking(player, matches, playerMatches);
        })
      );

      // Sort and assign ranks
      const sortedRankings = this.sortRankings(rankings);
      sortedRankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });

      // Create rankings object
      const eventRanking: EventRanking = {
        eventId,
        lastUpdated: new Date().toISOString(),
        rankings: sortedRankings
      };

      // Ensure rankings directory exists
      const rankingsDir = path.join(this.DATA_DIR, 'rankings');
      try {
        await fs.access(rankingsDir);
      } catch {
        await fs.mkdir(rankingsDir, { recursive: true });
      }

      // Save to file
      const rankingsPath = path.join(rankingsDir, `${eventId}.json`);
      await fs.writeFile(rankingsPath, JSON.stringify(eventRanking, null, 2));
    } catch (error) {
      console.error('Error updating rankings:', error);
      throw error;
    }
  }
}