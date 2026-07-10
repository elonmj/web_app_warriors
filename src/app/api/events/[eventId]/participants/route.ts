import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/api/services/EventService';
import { verifyPassword, AUTH_ERROR_MESSAGES } from '@/lib/auth';

const eventService = new EventService();

/**
 * POST /api/events/[eventId]/participants
 * Add a participant to an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // 1. Verify Admin Password
    const password = request.headers.get('X-Admin-Password');
    if (!password) {
      return NextResponse.json({ error: AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED }, { status: 400 });
    }
    const isPasswordValid = await verifyPassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: AUTH_ERROR_MESSAGES.INVALID_PASSWORD }, { status: 401 });
    }

    // 2. Get Player ID from request body
    const body = await request.json();
    const { playerId } = body;
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'Player ID is required in the request body' }, { status: 400 });
    }

    const { eventId } = params;
    if (!eventId) {
       return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 3. Call Service Method (to be implemented)
    await eventService.addParticipant(eventId, playerId);

    // 4. Return Success Response
    return NextResponse.json({ message: 'Participant added successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Error adding participant to event ${params.eventId}:`, error);
    // Provide specific error messages if possible
    const errorMessage = error instanceof Error ? error.message : 'Failed to add participant';
    const statusCode = errorMessage.includes('not found') ? 404 : 500; // Basic error status mapping
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}