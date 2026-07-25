import { NextRequest, NextResponse } from 'next/server';
import { FirebaseMatchRepository } from '@/api/repository/FirebaseMatchRepository';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { RankingService } from '@/api/services/RankingService';
import { verifyPassword } from '@/lib/auth';

const matchRepository = new FirebaseMatchRepository();
const eventRepository = new FirebaseEventRepository();
const rankingService = new RankingService();

/**
 * Annulation de la pénalité d'absence d'un joueur (Règlement V3 §V).
 *
 * Recours prévu pour le joueur qui a réellement cherché à jouer sans réponse.
 * Il repasse à 0 PR pour la ronde et ne reçoit PAS les 3 points d'une victoire :
 * aucune partie n'a été jouée, aucun point de performance n'est distribué.
 * L'adversaire conserve son −1.
 *
 * Réservé à l'administrateur — c'est le seul acteur authentifié de
 * l'application, et un bouton public serait actionnable par n'importe qui au
 * nom de n'importe qui.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; matchId: string } }
) {
  const password = request.headers.get('X-Admin-Password');
  if (!password) {
    return NextResponse.json({ error: 'Admin password required' }, { status: 401 });
  }
  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
  }

  try {
    const { playerId } = await request.json();
    if (typeof playerId !== 'string' || !playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const match = await matchRepository.getMatch(params.matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (playerId !== match.player1.id && playerId !== match.player2.id) {
      return NextResponse.json(
        { error: 'Ce joueur ne participe pas à ce match' },
        { status: 400 }
      );
    }

    const isMissedRound =
      match.status === 'forfeit' &&
      match.result !== undefined &&
      match.result.score[0] === match.result.score[1];

    if (!isMissedRound) {
      return NextResponse.json(
        { error: "Ce match n'est pas une ronde non jouée : il n'y a aucune pénalité à annuler" },
        { status: 400 }
      );
    }

    const waived = new Set(match.metadata.penaltyWaived ?? []);
    waived.add(playerId);

    const updatedMatch = {
      ...match,
      metadata: {
        ...match.metadata,
        penaltyWaived: Array.from(waived),
        updatedAt: new Date().toISOString()
      }
    };

    await eventRepository.updateEventMatch(match.eventId, match.id, updatedMatch);
    await rankingService.updateRoundRankings(match.eventId, match.metadata.round);

    return NextResponse.json({
      matchId: match.id,
      round: match.metadata.round,
      penaltyWaived: Array.from(waived)
    });
  } catch (error) {
    console.error('[API] Failed to waive penalty:', error);
    return NextResponse.json({ error: 'Failed to waive penalty' }, { status: 500 });
  }
}
