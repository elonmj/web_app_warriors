import { AttendanceService } from '../AttendanceService';
import { Match } from '@/types/Match';

/** Match minimal suffisant pour le tri d'assiduité. */
function match(
  p1: string,
  p2: string,
  status: Match['status'],
  score?: [number, number]
): Match {
  return {
    id: `${p1}-${p2}`,
    eventId: 'e1',
    date: '2026-07-26T10:00:00Z',
    player1: { id: p1, ratingBefore: 1000, ratingAfter: 1000, categoryBefore: 'ONYX', categoryAfter: 'ONYX' },
    player2: { id: p2, ratingBefore: 1000, ratingAfter: 1000, categoryBefore: 'ONYX', categoryAfter: 'ONYX' },
    status,
    result: score ? { score, pr: 0, ds: 0 } : undefined,
    metadata: { round: 1, isRandom: false, createdAt: '', updatedAt: '' },
  } as unknown as Match;
}

describe('AttendanceService.splitByAttendance (Règlement V3 §VI)', () => {
  it('compte les deux joueurs absents sur une ronde non jouée', () => {
    const { played, missed } = AttendanceService.splitByAttendance([
      match('a', 'b', 'forfeit', [0, 0]),
    ]);
    expect(Array.from(missed).sort()).toEqual(['a', 'b']);
    expect(played.size).toBe(0);
  });

  it('compte les deux joueurs présents sur un match joué', () => {
    const { played, missed } = AttendanceService.splitByAttendance([
      match('a', 'b', 'completed', [420, 380]),
    ]);
    expect(Array.from(played).sort()).toEqual(['a', 'b']);
    expect(missed.size).toBe(0);
  });

  it('traite le bye comme une présence', () => {
    // Le joueur n'a pas été appelé à jouer : on ne peut rien lui reprocher.
    const { played, missed } = AttendanceService.splitByAttendance([
      match('a', 'BYE', 'pending'),
    ]);
    expect(Array.from(played)).toEqual(['a']);
    expect(missed.size).toBe(0);
  });

  it('ne tranche pas un match encore en cours', () => {
    const { played, missed } = AttendanceService.splitByAttendance([
      match('a', 'b', 'pending'),
    ]);
    expect(played.size).toBe(0);
    expect(missed.size).toBe(0);
  });

  it('relit un forfait simple d’avant la V3 comme une partie jouée', () => {
    // Scores différents : ce n'est pas une ronde non jouée au sens V3.
    const { missed } = AttendanceService.splitByAttendance([
      match('a', 'b', 'forfeit', [400, 0]),
    ]);
    expect(missed.size).toBe(0);
  });

  it('répartit correctement une ronde complète', () => {
    const { played, missed } = AttendanceService.splitByAttendance([
      match('a', 'b', 'completed', [420, 380]),
      match('c', 'd', 'forfeit', [0, 0]),
      match('e', 'BYE', 'pending'),
    ]);
    expect(Array.from(played).sort()).toEqual(['a', 'b', 'e']);
    expect(Array.from(missed).sort()).toEqual(['c', 'd']);
  });
});
