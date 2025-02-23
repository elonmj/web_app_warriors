import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { Event } from '@/types/Event';
import { EventType, EventStatus, type EventTypeType } from '@/types/Enums';
import { verifyPassword } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');

interface CreateEventInput {
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  password: string;
}

export async function GET() {
  try {
    const filePath = path.join(DATA_DIR, 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      return NextResponse.json(
        { error: 'Invalid data structure in events.json' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data.events });
  } catch (error) {
    console.error('Error reading events data:', error);
    return NextResponse.json(
      { error: 'Failed to load events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input: CreateEventInput = await request.json();

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

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      type: input.type as EventTypeType,
      status: EventStatus.OPEN,
      metadata: {
        totalPlayers: 0,
        totalMatches: 0,
        currentRound: 1,
        totalRounds: 0,
        lastUpdated: new Date().toISOString(),
        roundHistory: {},
        byeHistory: []
      }
    };

    // Read existing events
    const filePath = path.join(DATA_DIR, 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.events || !Array.isArray(data.events)) {
      data.events = [];
    }

    // Add new event
    data.events.push(newEvent);

    // Save updated events
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    // Create initial files for matches and rankings
    await fs.mkdir(path.join(DATA_DIR, 'matches', newEvent.id), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'rankings', newEvent.id), { recursive: true });

    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
