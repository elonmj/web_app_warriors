import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  const matchesPath = path.join(DATA_DIR, 'matches', `${eventId}.json`);
  const playersPath = path.join(DATA_DIR, 'players.json');

  try {
    // Read matches data
    const matchesContent = await fs.readFile(matchesPath, 'utf-8');
    const matchesData = JSON.parse(matchesContent);

    // Read players data to enrich match information
    const playersContent = await fs.readFile(playersPath, 'utf-8');
    const playersData = JSON.parse(playersContent);

    // Enrich matches with player details
    const enrichedMatches = matchesData.matches.map((match: any) => {
      const player1 = playersData.players.find((p: any) => p.id === match.player1Id);
      const player2 = playersData.players.find((p: any) => p.id === match.player2Id);

      return {
        ...match,
        player1Details: player1 ? {
          name: player1.name,
          category: player1.category
        } : null,
        player2Details: player2 ? {
          name: player2.name,
          category: player2.category
        } : null
      };
    });

    return NextResponse.json({
      matches: enrichedMatches,
      metadata: matchesData.metadata || {}
    });

  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Matches not found for this event' },
        { status: 404 }
      );
    }

    console.error('Error reading matches data:', error);
    return NextResponse.json(
      { error: 'Failed to load matches data' },
      { status: 500 }
    );
  }
}