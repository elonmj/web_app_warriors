import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { MISSED_ROUNDS_BEFORE_SLEEP } from '@/lib/scoring';

export interface AttendanceOutcome {
  /** Joueurs venant d'être mis en sommeil à l'issue de cette ronde. */
  fellAsleep: string[];
  /** Joueurs réveillés parce qu'ils ont joué. */
  wokeUp: string[];
  /** Joueurs ayant manqué cette ronde (compteur incrémenté). */
  missed: string[];
}

/**
 * Assiduité et mise en sommeil (Règlement V3 §VI).
 *
 * Appelé une fois par ronde, après résolution des matchs : le compteur
 * d'absences consécutives monte pour qui n'a pas joué, retombe à zéro pour qui
 * a joué, et le joueur sort du pool au-delà du seuil.
 *
 * Le sommeil n'est pas une sanction supplémentaire — c'est l'inverse : il
 * arrête l'hémorragie de points, et il évite qu'un joueur parti trois semaines
 * prive un adversaire différent de sa partie tous les trois jours.
 */
export class AttendanceService {
  private playerRepository: FirebasePlayerRepository;

  constructor(playerRepository = new FirebasePlayerRepository()) {
    this.playerRepository = playerRepository;
  }

  /**
   * Répartit les joueurs d'une ronde entre « a joué » et « a manqué ».
   * Un bye compte comme une présence : le joueur n'a pas été appelé à jouer,
   * on ne peut donc rien lui reprocher.
   */
  static splitByAttendance(matches: Match[]): { played: Set<string>; missed: Set<string> } {
    const played = new Set<string>();
    const missed = new Set<string>();

    for (const match of matches) {
      if (match.player2.id === 'BYE') {
        played.add(match.player1.id);
        continue;
      }

      const isMissedRound =
        match.status === 'forfeit' &&
        match.result !== undefined &&
        match.result.score[0] === match.result.score[1];

      if (isMissedRound) {
        missed.add(match.player1.id);
        missed.add(match.player2.id);
      } else if (match.status === 'completed') {
        played.add(match.player1.id);
        played.add(match.player2.id);
      }
      // Un match encore `pending` n'est pas tranché : on ne touche à rien.
    }

    return { played, missed };
  }

  /** Applique l'assiduité de la ronde à tous les joueurs concernés. */
  async applyRoundAttendance(matches: Match[]): Promise<AttendanceOutcome> {
    const { played, missed } = AttendanceService.splitByAttendance(matches);
    const outcome: AttendanceOutcome = { fellAsleep: [], wokeUp: [], missed: [] };

    for (const playerId of Array.from(played)) {
      const player = await this.playerRepository.getPlayer(playerId);
      if (!player) continue;

      // Jouer remet le compteur à zéro et réveille : le retour d'un joueur ne
      // demande aucune démarche, la partie suffit (§VI).
      const wasAsleep = player.asleep === true;
      if (wasAsleep || (player.consecutiveMissedRounds ?? 0) > 0) {
        await this.playerRepository.updatePlayer(playerId, {
          consecutiveMissedRounds: 0,
          asleep: false,
          asleepSince: undefined,
        } as Partial<Player>);
        if (wasAsleep) outcome.wokeUp.push(playerId);
      }
    }

    for (const playerId of Array.from(missed)) {
      const player = await this.playerRepository.getPlayer(playerId);
      if (!player) continue;

      const count = (player.consecutiveMissedRounds ?? 0) + 1;
      const shouldSleep = count >= MISSED_ROUNDS_BEFORE_SLEEP;

      await this.playerRepository.updatePlayer(playerId, {
        consecutiveMissedRounds: count,
        ...(shouldSleep && !player.asleep
          ? { asleep: true, asleepSince: new Date().toISOString() }
          : {}),
      } as Partial<Player>);

      outcome.missed.push(playerId);
      if (shouldSleep && !player.asleep) outcome.fellAsleep.push(playerId);
    }

    return outcome;
  }

  /** Réveil manuel par l'administrateur (§VI). */
  async wake(playerId: string): Promise<void> {
    await this.playerRepository.updatePlayer(playerId, {
      consecutiveMissedRounds: 0,
      asleep: false,
      asleepSince: undefined,
    } as Partial<Player>);
  }
}

export const attendanceService = new AttendanceService();
