import { FirebaseEventRepository } from '../repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '../repository/FirebasePlayerRepository';
import { EventRanking, PlayerRanking } from '@/types/Ranking';
import { Match } from '@/types/Match';
import { ValidationStatus } from '@/types/ValidationStatus';
import { calculatePR, calculateSpread, FORFEIT_SPREAD } from '@/lib/scoring';

export class RankingService {
  private eventRepository: FirebaseEventRepository;
  private playerRepository: FirebasePlayerRepository;

  constructor(
    eventRepo?: FirebaseEventRepository,
    playerRepo?: FirebasePlayerRepository
  ) {
    this.eventRepository = eventRepo || new FirebaseEventRepository();
    this.playerRepository = playerRepo || new FirebasePlayerRepository();
  }

  public async getGlobalRankings(): Promise<EventRanking> {
    try {
      // Get all players
      const players = await this.playerRepository.getAllPlayers();
      
      // Map players to ranking format
      const rankings: PlayerRanking[] = players.map(player => ({
          playerId: player.id,
          rank: 0, // Will be calculated after sorting
          points: 0, // Not used in global rankings
          matches: player.statistics.totalMatches || 0,
          wins: player.statistics.wins || 0,
          draws: player.statistics.draws || 0,
          losses: player.statistics.losses || 0,
          rating: player.currentRating || 1000,
          ratingChange: player.statistics.bestRating
            ? player.currentRating - player.statistics.bestRating
            : 0,
          category: player.category,
          playerDetails: {
            name: player.name,
            currentRating: player.currentRating,
            category: player.category
          }
        }));

      // Sort and assign ranks
      this.sortAndAssignRanks(rankings, 'rating');

      const globalRanking: EventRanking = {
        eventId: 'global', // Special ID for global rankings
        lastUpdated: new Date().toISOString(),
        rankings
      };

      return globalRanking;
    } catch (error) {
      console.error('Error generating global rankings:', error);
      throw new Error('Failed to generate global rankings');
    }
  }

  public async updateRoundRankings(eventId: string, round: number): Promise<EventRanking> {
    try {
      // Get event and validate round
      const event = await this.eventRepository.getEvent(eventId);
      if (!event || !event.metadata) {
        throw new Error('Event not found');
      }
      if (round > event.metadata.totalRounds) {
        throw new Error('Invalid round number');
      }

      // Classement cumulé : toutes les rondes jusqu'à `round` incluse
      // (Règlement V2 §III — le classement saisonnier agrège les rondes,
      // l'ancien code ne classait que sur la ronde courante)
      const matches: Match[] = [];
      for (let r = 1; r <= round; r++) {
        matches.push(...(await this.eventRepository.getRoundMatches(eventId, r)));
      }

      // Filter for completed and forfeit matches that are validated
      const completedMatches = matches.filter(match => {
        return (match.status === 'completed' || match.status === 'forfeit') &&
               match.result !== undefined ;
      });

      const playerPerformance = this.calculatePlayerPerformance(completedMatches);

      // Buchholz : somme des PR finaux des adversaires rencontrés (§III.C)
      for (const stats of playerPerformance.values()) {
        stats.buchholz = stats.opponents.reduce(
          (sum: number, id: string) => sum + (playerPerformance.get(id)?.points ?? 0),
          0
        );
      }

      const rankings = await this.createRankings(playerPerformance);

      // Sort rankings by points and assign ranks
      this.sortAndAssignRanks(rankings, 'points', this.buildHeadToHead(completedMatches));

      const eventRanking: EventRanking = {
        eventId,
        lastUpdated: new Date().toISOString(),
        rankings
      };

      // Save round-specific rankings
      await this.eventRepository.saveRoundRankings(eventId, round, eventRanking);

      return eventRanking;
    } catch (error) {
      console.error('Error updating round rankings:', error);
      throw new Error('Failed to update round rankings');
    }
  }

  public async getRoundRankings(eventId: string, round: number): Promise<EventRanking> {
    try {
      const ranking = await this.eventRepository.getRoundRankings(eventId, round);
      if (!ranking) {
        // Generate rankings if they don't exist
        return await this.updateRoundRankings(eventId, round);
      }
      return ranking;
    } catch (error) {
      console.error('Error getting round rankings:', error);
      throw new Error('Failed to get round rankings');
    }
  }

  /**
   * Performance par joueur selon le Règlement V2 §III :
   * PR 3/1/0 par joueur, spread cumulé plafonné, adversaires rencontrés
   * (pour le Buchholz). Byes : 3 PR, pas de spread, pas d'adversaire.
   * Forfaits : 3/0, spread ±50. Double forfait : 0 partout.
   * (L'ancien code attribuait `result.pr` — le PR du joueur 1 — au
   * vainqueur quel qu'il soit : une victoire du joueur 2 rapportait 0.)
   */
  private calculatePlayerPerformance(matches: Match[]): Map<string, {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    matches: number;
    spread: number;
    opponents: string[];
    buchholz?: number;
    rating: number;
    ratingChange: number;
    category: string;
  }> {
    const playerPerformance = new Map();

    const ensurePlayer = (info: Match['player1']) => {
      if (!playerPerformance.has(info.id)) {
        playerPerformance.set(info.id, {
          points: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          matches: 0,
          spread: 0,
          opponents: [] as string[],
          rating: info.ratingAfter,
          ratingChange: info.ratingAfter - info.ratingBefore,
          category: info.categoryAfter
        });
      }
      const stats = playerPerformance.get(info.id)!;
      // Keep the most recent rating snapshot as rounds accumulate
      stats.rating = info.ratingAfter;
      stats.category = info.categoryAfter;
      return stats;
    };

    for (const match of matches) {
      const { player1, player2, result } = match;
      if (!result) continue;

      // Bye : 3 PR, aucun spread, pas d'adversaire (Règlement V2 §IV.C)
      if (player2.id === 'BYE') {
        const stats = ensurePlayer(player1);
        stats.matches++;
        stats.wins++;
        stats.points += 3;
        continue;
      }

      const p1Stats = ensurePlayer(player1);
      const p2Stats = ensurePlayer(player2);
      const [p1Score, p2Score] = result.score;

      p1Stats.matches++;
      p2Stats.matches++;
      p1Stats.opponents.push(player2.id);
      p2Stats.opponents.push(player1.id);

      if (match.status === 'forfeit') {
        // Double forfait (score 0-0) : 0 PR chacun, aucun spread (§VI)
        if (p1Score === p2Score) {
          p1Stats.losses++;
          p2Stats.losses++;
          continue;
        }
        // Forfait simple : 3 PR / +50 au présent, 0 PR / −50 au forfait
        const [winner, loser] = p1Score > p2Score ? [p1Stats, p2Stats] : [p2Stats, p1Stats];
        winner.wins++;
        winner.points += 3;
        winner.spread += FORFEIT_SPREAD;
        loser.losses++;
        loser.spread -= FORFEIT_SPREAD;
        continue;
      }

      p1Stats.points += calculatePR(p1Score, p2Score);
      p2Stats.points += calculatePR(p2Score, p1Score);
      p1Stats.spread += calculateSpread(p1Score, p2Score);
      p2Stats.spread += calculateSpread(p2Score, p1Score);

      if (p1Score > p2Score) {
        p1Stats.wins++;
        p2Stats.losses++;
      } else if (p1Score < p2Score) {
        p1Stats.losses++;
        p2Stats.wins++;
      } else {
        p1Stats.draws++;
        p2Stats.draws++;
      }
    }

    return playerPerformance;
  }

  private async createRankings(playerPerformance: Map<string, any>): Promise<PlayerRanking[]> {
    const rankings: PlayerRanking[] = [];
    const players = await this.playerRepository.getAllPlayers();

    for (const [playerId, stats] of playerPerformance.entries()) {
      // No need to convert string ID - it's already a string
      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      rankings.push({
        playerId, // Use string ID directly
        rank: 0, // Will be calculated after sorting
        points: stats.points,
        matches: stats.matches,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        rating: stats.rating,
        ratingChange: stats.ratingChange,
        category: stats.category,
        buchholz: stats.buchholz ?? 0,
        spread: stats.spread ?? 0,
        playerDetails: {
          name: player.name,
          currentRating: player.currentRating,
          category: player.category
        }
      });
    }

    return rankings;
  }

  /**
   * Confrontations directes : clé "a|b" → victoires nettes de a sur b
   * (positif si a a battu b plus souvent que l'inverse).
   */
  private buildHeadToHead(matches: Match[]): Map<string, number> {
    const h2h = new Map<string, number>();
    for (const match of matches) {
      if (!match.result || match.player2.id === 'BYE') continue;
      const [s1, s2] = match.result.score;
      if (s1 === s2) continue;
      const [winner, loser] = s1 > s2
        ? [match.player1.id, match.player2.id]
        : [match.player2.id, match.player1.id];
      h2h.set(`${winner}|${loser}`, (h2h.get(`${winner}|${loser}`) ?? 0) + 1);
      h2h.set(`${loser}|${winner}`, (h2h.get(`${loser}|${winner}`) ?? 0) - 1);
    }
    return h2h;
  }

  /**
   * Tri du classement.
   * - 'points' (classement saisonnier) : PR, puis départages V2 §III.C —
   *   Buchholz, spread cumulé, confrontation directe (égalités à deux),
   *   victoires, cote.
   * - 'rating' (classement général) : cote, puis ratio de victoires, puis PR.
   */
  private sortAndAssignRanks(
    rankings: PlayerRanking[],
    primaryCriteria: 'points' | 'rating',
    headToHead?: Map<string, number>
  ): void {
    if (primaryCriteria === 'rating') {
      rankings.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        const aWinRatio = a.wins / (a.matches || 1);
        const bWinRatio = b.wins / (b.matches || 1);
        if (bWinRatio !== aWinRatio) return bWinRatio - aWinRatio;
        return b.points - a.points;
      });

      let currentRank = 1;
      rankings.forEach((ranking, index) => {
        if (index > 0) {
          const prev = rankings[index - 1];
          const sameRank =
            prev.rating === ranking.rating &&
            prev.wins / (prev.matches || 1) === ranking.wins / (ranking.matches || 1) &&
            prev.points === ranking.points;
          if (!sameRank) currentRank = index + 1;
        }
        ranking.rank = currentRank;
      });
      return;
    }

    rankings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if ((b.buchholz ?? 0) !== (a.buchholz ?? 0)) return (b.buchholz ?? 0) - (a.buchholz ?? 0);
      if ((b.spread ?? 0) !== (a.spread ?? 0)) return (b.spread ?? 0) - (a.spread ?? 0);
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.rating - a.rating;
    });

    // Confrontation directe (§III.C, critère 3) : appliquée aux égalités
    // strictement à deux joueurs sur points + Buchholz + spread.
    if (headToHead) {
      for (let i = 0; i < rankings.length - 1; i++) {
        const a = rankings[i];
        const b = rankings[i + 1];
        const tied =
          a.points === b.points &&
          (a.buchholz ?? 0) === (b.buchholz ?? 0) &&
          (a.spread ?? 0) === (b.spread ?? 0);
        const pairIsolated =
          (i === 0 || rankings[i - 1].points !== a.points ||
            (rankings[i - 1].buchholz ?? 0) !== (a.buchholz ?? 0) ||
            (rankings[i - 1].spread ?? 0) !== (a.spread ?? 0)) &&
          (i + 2 >= rankings.length || rankings[i + 2].points !== b.points ||
            (rankings[i + 2].buchholz ?? 0) !== (b.buchholz ?? 0) ||
            (rankings[i + 2].spread ?? 0) !== (b.spread ?? 0));
        if (tied && pairIsolated) {
          const net = headToHead.get(`${b.playerId}|${a.playerId}`) ?? 0;
          if (net > 0) {
            rankings[i] = b;
            rankings[i + 1] = a;
          }
        }
      }
    }

    // Assign ranks — égalité de rang si points + Buchholz + spread identiques
    let currentRank = 1;
    rankings.forEach((ranking, index) => {
      if (index > 0) {
        const prev = rankings[index - 1];
        const sameRank =
          prev.points === ranking.points &&
          (prev.buchholz ?? 0) === (ranking.buchholz ?? 0) &&
          (prev.spread ?? 0) === (ranking.spread ?? 0);
        if (!sameRank) currentRank = index + 1;
      }
      ranking.rank = currentRank;
    });
  }
}