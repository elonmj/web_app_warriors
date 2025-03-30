import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { Event } from '@/types/Event';
import { EventService } from '@/api/services/EventService';
import { verifyPassword, AUTH_ERROR_MESSAGES } from '@/lib/auth';

const eventRepository = new FirebaseEventRepository();

/**
 * GET /api/events/[eventId]
 * Get event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await eventRepository.getEvent(params.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[eventId]
 * Update event by ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const updates = await request.json();
    
    // Get the current event to make sure it exists
    const event = await eventRepository.getEvent(params.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the event
    const updatedEvent = await eventRepository.updateEvent(params.eventId, updates);
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[eventId]
 * Delete event by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  // Instantiate EventService inside the handler
  const eventService = new EventService();
  try {
    // --- Password Verification ---
    const password = request.headers.get('X-Admin-Password');
    if (!password) {
      return NextResponse.json(
        { error: AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED },
        { status: 400 } // Bad Request
      );
    }
    const isPasswordValid = await verifyPassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: AUTH_ERROR_MESSAGES.INVALID_PASSWORD },
        { status: 401 } // Unauthorized
      );
    }
    // --- End Password Verification ---

    // Check if event exists (using service layer is good practice, though repo call is fine here too)
    const event = await eventService.getEvent(params.eventId); // Use service
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete event using the service layer
    await eventService.deleteEvent(params.eventId);
    
    // Return success with no content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
