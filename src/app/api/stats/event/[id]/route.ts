import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { EventStatisticsCalculator } from '@/lib/Statistics';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  try {
    // Read necessary data files
    const eventsContent = await fs.readFile(path.join(DATA_DIR, 'events.json'), 'utf-8');
    const matchesContent = await fs.readFile(path.join(DATA_DIR, 'matches', `${eventId}.json`), 'utf-8');
    const playersContent = await fs.readFile(path.join(DATA_DIR, 'players.json'), 'utf-8');

    // Parse the data
    const events = JSON.parse(eventsContent).events;
    const event = events.find((e: Event) => e.id === eventId);
    const matches = JSON.parse(matchesContent).matches as Match[];
    const players = JSON.parse(playersContent).players as Player[];

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = EventStatisticsCalculator.calculate(event, matches, players);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating event statistics:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Required data not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to calculate statistics' },
      { status: 500 }
    );
  }
}