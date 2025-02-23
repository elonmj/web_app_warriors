import { NextResponse } from 'next/server';
import { EventRepository } from '@/api/repository/eventRepository';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import path from 'path';
import * as fs from 'fs/promises';

const eventRepository = new EventRepository();
const DATA_DIR = path.join(process.cwd(), 'data');

interface EnrichedMatch extends Match {
  player1Details?: {
    name: string;
    category: string;
  };
  player2Details?: {
    name: string;
    category: string;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  try {
    // Get event to check existence and metadata
    const event = await eventRepository.getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all matches using repository
    const matches = await eventRepository.getEventMatches(eventId);

    // Read players data to enrich match information
    const playersPath = path.join(DATA_DIR, 'players.json');
    const playersContent = await fs.readFile(playersPath, 'utf-8');
    const playersData = JSON.parse(playersContent);
    const players: Player[] = playersData.players || [];

    // Enrich matches with player details
    const enrichedMatches: EnrichedMatch[] = matches.map(match => {
      const player1 = players.find(p => p.id === match.player1.id);
      const player2 = players.find(p => p.id === match.player2.id);

      return {
        ...match,
        player1Details: player1 ? {
          name: player1.name,
          category: player1.category
        } : undefined,
        player2Details: player2 ? {
          name: player2.name,
          category: player2.category
        } : undefined
      };
    });

    // Calculate metadata
    const metadata = {
      totalMatches: enrichedMatches.length,
      matchesByRound: enrichedMatches.reduce((acc, match) => {
        const round = match.metadata.round;
        if (!acc[round]) acc[round] = 0;
        acc[round]++;
        return acc;
      }, {} as Record<number, number>),
      currentRound: event.metadata?.currentRound || 0
    };

    return NextResponse.json({
      matches: enrichedMatches,
      metadata
    });

  } catch (error) {
    console.error('Error reading matches data:', error);
    return NextResponse.json(
      { error: 'Failed to load matches data' },
      { status: 500 }
    );
  }
}