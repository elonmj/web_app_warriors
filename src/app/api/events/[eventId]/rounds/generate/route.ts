import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/api/services/EventService';

const eventService = new EventService();

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const { scheduledDate, options = {} } = await request.json();

    const pairingOptions = {
      avoidRematches: options.avoidRematches ?? true,
      balanceCategories: options.balanceCategories ?? true
    };

    // Generate pairings
    const result = await eventService.generatePairings(
      eventId,
      pairingOptions
    );

    // Update event metadata with scheduled date if provided
    if (scheduledDate) {
      const event = await eventService.getEvent(eventId);
      if (event?.metadata) {
        event.metadata.roundDates = {
          ...event.metadata.roundDates,
          [result.round]: scheduledDate
        };
        // Update event metadata here
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating round pairings:', error);

    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Handle constraint violations
    if (error.message.includes('constraint')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}