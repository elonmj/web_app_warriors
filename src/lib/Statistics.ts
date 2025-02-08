import { Match, MatchResult } from "@/types/Match";
import { MatchStatusType } from "@/types/Enums";
import { Player } from "@/types/Player";
import { Event } from "@/types/Event";

export interface EventStatistics {
  eventId: string;
  totalMatches: number;
  completedMatches: number;
  activePlayers: number;
  averageRating: number;
  averageDS: number;
  matchesPerCategory: {
    [key: string]: number;
  };
  categoryDistribution: {
    [key: string]: number;
  };
  playerStats: {
    playerId: string;
    name: string;
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    averageRating: number;
    averageDS: number;
  }[];
  lastUpdated?: string;
}

export class StatisticsCalculator {
  static calculateAverageRating(players: Player[]): number {
    if (players.length === 0) return 0;
    const sum = players.reduce((acc, player) => acc + player.currentRating, 0);
    return Math.round(sum / players.length);
  }

  static calculateAverageDS(matches: Match[]): number {
    const playedMatches = matches.filter((match): match is Match & { result: MatchResult } =>
      match.status === 'completed' && match.result !== undefined && match.result.ds > 0
    );
    if (playedMatches.length === 0) return 0;
    const sum = playedMatches.reduce((acc, match) => acc + match.result.ds, 0);
    return Math.round((sum / playedMatches.length) * 10) / 10;
  }

  static calculateCategoryDistribution(players: Player[]): { [key: string]: number } {
    return players.reduce((acc, player) => {
      acc[player.category] = (acc[player.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }
}

export class EventStatisticsCalculator {
  static calculate(event: Event, matches: Match[], allPlayers: Player[]): EventStatistics {
    // Get completed and played matches
    const completedMatches = matches.filter((m): m is Match & { result: MatchResult } =>
      (m.status === 'completed' || m.status === 'forfeit') && m.result !== undefined
    );
    const playedMatches = completedMatches.filter(m => m.status === 'completed');

    // Get active player IDs and players
    const activePlayerIds = new Set<string>();
    matches.forEach(m => {
      activePlayerIds.add(m.player1.id);
      activePlayerIds.add(m.player2.id);
    });
    const eventPlayers = allPlayers.filter(p => activePlayerIds.has(p.id));
    
    const matchesPerCategory = matches.reduce((acc, match) => {
      const player1 = eventPlayers.find((p: Player) => p.id === match.player1.id);
      const player2 = eventPlayers.find((p: Player) => p.id === match.player2.id);
      if (player1) acc[player1.category] = (acc[player1.category] || 0) + 1;
      if (player2) acc[player2.category] = (acc[player2.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const playerStats = eventPlayers.map((player: Player) => {
      const playerMatches = matches.filter(
        m => m.player1.id === player.id || m.player2.id === player.id
      );

      const playerMatchesWithResults = playerMatches.filter((m): m is Match & { result: MatchResult } => 
        m.result !== undefined
      );

      const wins = playerMatchesWithResults.filter(m => 
        (m.player1.id === player.id && m.result.score[0] > m.result.score[1]) ||
        (m.player2.id === player.id && m.result.score[1] > m.result.score[0])
      ).length;

      const losses = playerMatchesWithResults.filter(m =>
        (m.player1.id === player.id && m.result.score[0] < m.result.score[1]) ||
        (m.player2.id === player.id && m.result.score[1] < m.result.score[0])
      ).length;
      
      return {
        playerId: player.id,
        name: player.name,
        matches: playerMatches.length,
        wins,
        losses,
        draws: playerMatchesWithResults.length - wins - losses,
        averageRating: player.currentRating,
        averageDS: StatisticsCalculator.calculateAverageDS(playerMatches)
      };
    });

    return {
      eventId: event.id,
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      activePlayers: eventPlayers.length,
      averageRating: StatisticsCalculator.calculateAverageRating(eventPlayers),
      averageDS: StatisticsCalculator.calculateAverageDS(playedMatches),
      matchesPerCategory,
      categoryDistribution: StatisticsCalculator.calculateCategoryDistribution(eventPlayers),
      playerStats,
      lastUpdated: matches.length > 0
        ? new Date(Math.max(...matches.map(match => new Date(match.metadata.updatedAt).getTime()))).toISOString()
        : undefined,
    };
  }
}