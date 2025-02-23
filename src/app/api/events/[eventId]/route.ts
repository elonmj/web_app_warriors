import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { Event } from '@/types/Event';
import { EventType, type EventTypeType } from '@/types/Enums';
import { verifyPassword } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');

interface UpdateEventInput {
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  password: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const input: UpdateEventInput = await request.json();

    // Validate input
    if (!input.name || !input.startDate || !input.endDate || !input.type || !input.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify event type
    if (!Object.values(EventType).includes(input.type as EventTypeType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Verify admin password
    const isValidPassword = await verifyPassword(input.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Read existing events
    const filePath = path.join(DATA_DIR, 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      return NextResponse.json(
        { error: 'Invalid data structure in events.json' },
        { status: 500 }
      );
    }

    // Find event to update
    const eventIndex = data.events.findIndex((e: Event) => e.id === eventId);
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update event keeping other properties unchanged
    const existingEvent = data.events[eventIndex];
    const updatedEvent = {
      ...existingEvent,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      type: input.type as EventTypeType
    };

    data.events[eventIndex] = updatedEvent;

    // Save updated events
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    const filePath = path.join(DATA_DIR, 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      return NextResponse.json(
        { error: 'Invalid data structure in events.json' },
        { status: 500 }
      );
    }

    const event = data.events.find((e: Event) => e.id === eventId);
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
