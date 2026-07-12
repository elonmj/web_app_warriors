import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';

const eventRepository = new FirebaseEventRepository();

/**
 * Disponibilité par ronde (Règlement V2 §IV.A).
 * GET  → { round, availablePlayerIds, isDefault } — sans liste enregistrée,
 *        tous les participants sont réputés disponibles (isDefault: true).
 * POST → { playerIds: string[] } enregistre le pool d'inscription de la ronde.
 *        Ne pas figurer dans la liste est neutre : pas de match, pas de PR.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; round: string } }
) {
  try {
    const round = parseInt(params.round, 10);
    if (!Number.isInteger(round) || round < 1) {
      return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    const event = await eventRepository.getEvent(params.eventId);
    if (!event || !event.metadata) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const stored = event.metadata.roundAvailability?.[round];
    return NextResponse.json({
      round,
      availablePlayerIds: stored ?? event.playerIds ?? [],
      isDefault: stored === undefined
    });
  } catch (error) {
    console.error('Error getting round availability:', error);
    return NextResponse.json({ error: 'Failed to get availability' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; round: string } }
) {
  try {
    const round = parseInt(params.round, 10);
    if (!Number.isInteger(round) || round < 1) {
      return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    const { playerIds } = await request.json();
    if (!Array.isArray(playerIds) || playerIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json(
        { error: 'playerIds must be an array of player ids' },
        { status: 400 }
      );
    }

    const event = await eventRepository.getEvent(params.eventId);
    if (!event || !event.metadata) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Ne garder que des participants réels de l'événement
    const participants = new Set(event.playerIds ?? []);
    const validIds = playerIds.filter((id: string) => participants.has(id));

    const metadata = {
      ...event.metadata,
      roundAvailability: {
        ...(event.metadata.roundAvailability ?? {}),
        [round]: validIds
      },
      lastUpdated: new Date().toISOString()
    };
    await eventRepository.updateEvent(params.eventId, { metadata });

    return NextResponse.json({ round, availablePlayerIds: validIds, isDefault: false });
  } catch (error) {
    console.error('Error setting round availability:', error);
    return NextResponse.json({ error: 'Failed to set availability' }, { status: 500 });
  }
}
