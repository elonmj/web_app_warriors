import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/types/Event';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { EventStatusType } from '@/types/Enums'; // Import the enum

const eventRepository = new FirebaseEventRepository();

/**
 * GET /api/events
 * Get all events
 */
export async function GET() {
  try {
    const events = await eventRepository.getAllEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.type || !data.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, startDate' },
        { status: 400 }
      );
    }

    // Create event with correctly structured metadata
    const now = new Date().toISOString();
    const event: Omit<Event, 'id'> = {
      name: data.name,
      type: data.type,
      status: "upcoming" as EventStatusType,
      startDate: data.startDate,
      endDate: data.endDate || null,
      metadata: {
        totalPlayers: 0,
        totalMatches: 0,
        totalRounds: data.totalRounds || 0,
        currentRound: 0,
        roundDates: {},
        roundHistory: {},
        byeHistory: [],
        lastUpdated: now // Use lastUpdated instead of createdAt/updatedAt
      }
    };

    // Add event to repository
    const newEvent = await eventRepository.createEvent(event);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
