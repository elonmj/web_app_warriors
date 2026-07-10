import { NextResponse, NextRequest } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { EventService } from '@/api/services/EventService';
import { EventStatus } from '@/types/Enums';
import { verifyPassword } from '@/lib/auth';

const eventRepository = new FirebaseEventRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  console.log(`[API] Received request to start event: ${eventId}`);

  // 1. Verify Admin Password
  const password = request.headers.get('X-Admin-Password');
  if (!password) {
      console.log(`[API] Missing X-Admin-Password header for event start: ${eventId}`);
      return NextResponse.json({ error: 'Admin password required' }, { status: 401 });
  }

  const isPasswordValid = await verifyPassword(password);
  if (!isPasswordValid) {
      console.log(`[API] Invalid admin password for event start: ${eventId}`);
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
  }
  console.log(`[API] Admin password verified for event start: ${eventId}`);

  try {
    // 2. Fetch the event
    console.log(`[API] Fetching event data for event start: ${eventId}`);
    const event = await eventRepository.getEvent(eventId);
    if (!event) {
      console.log(`[API] Event not found for start: ${eventId}`);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    console.log(`[API] Fetched event ${eventId}, current status: ${event.status}`);

    // 3. Check if event can be started
    if (event.status !== EventStatus.OPEN) {
      console.log(`[API] Event ${eventId} cannot be started. Status: ${event.status}`);
      return NextResponse.json({ error: `Event cannot be started. Current status: ${event.status}` }, { status: 400 });
    }
    if (!event.playerIds || event.playerIds.length < 2) {
      console.log(`[API] Event ${eventId} has insufficient participants: ${event.playerIds?.length || 0}`);
      return NextResponse.json({ error: 'Cannot start event with fewer than 2 participants.' }, { status: 400 });
    }
    console.log(`[API] Event ${eventId} validation passed for starting.`);

    // 4. Update Event Status to IN_PROGRESS
    console.log(`[API] Updating event ${eventId} status to IN_PROGRESS.`);
    await eventRepository.updateEvent(eventId, { status: EventStatus.IN_PROGRESS });

    // 5. Generate Round 1 Pairings
    console.log(`[API] Generating pairings and saving matches for event ${eventId}, round 1.`);
    const eventService = new EventService();
    const round1Matches = await eventService.generatePairingsForRound(eventId, 1);

    // 6. Return updated event data (or just success)
    // Re-fetching ensures the client gets the absolute latest state after updates.
    console.log(`[API] Re-fetching updated event data for ${eventId}.`);
    const updatedEvent = await eventRepository.getEvent(eventId); // Re-fetch to confirm changes
    console.log(`[API] Event ${eventId} started successfully. Returning updated data.`);
    return NextResponse.json(updatedEvent);

  } catch (error) {
    console.error(`[API] Error starting event ${eventId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to start event', details: message }, { status: 500 });
  }
}

// Optional: Add OPTIONS handler for CORS preflight if needed
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust for production
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    },
  });
}