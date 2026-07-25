import { NextRequest, NextResponse } from 'next/server';
import { attendanceService } from '@/api/services/AttendanceService';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { verifyPassword } from '@/lib/auth';

const playerRepository = new FirebasePlayerRepository();

/**
 * Réveil d'un joueur en sommeil (Règlement V3 §VI).
 *
 * Réservé à l'administrateur : l'application n'a pas d'authentification joueur,
 * un bouton public permettrait donc de remettre n'importe qui dans le pool —
 * et de priver son adversaire d'une partie tous les trois jours.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const password = request.headers.get('X-Admin-Password');
  if (!password) {
    return NextResponse.json({ error: 'Admin password required' }, { status: 401 });
  }
  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
  }

  try {
    const player = await playerRepository.getPlayer(params.id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    await attendanceService.wake(params.id);

    return NextResponse.json({
      playerId: params.id,
      name: player.name,
      asleep: false,
      consecutiveMissedRounds: 0
    });
  } catch (error) {
    console.error('[API] Failed to wake player:', error);
    return NextResponse.json({ error: 'Failed to wake player' }, { status: 500 });
  }
}
