import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { EventRanking } from '@/types/Ranking';
import { RankingService } from '@/api/services/RankingService';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  const rankingsPath = path.join(DATA_DIR, 'rankings', `${eventId}.json`);

  try {
    // Try to read existing rankings
    try {
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8');
      const rankingData = JSON.parse(rankingsContent);

      // If data is in EventRanking format, return it
      if (rankingData.eventId && rankingData.rankings) {
        return NextResponse.json(rankingData);
      }
    } catch (error) {
      // If file doesn't exist, we'll generate rankings from matches
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // If we reach here, either the file doesn't exist or isn't in the right format
    // Generate rankings from matches
    const rankingService = new RankingService();
    await rankingService.updateEventRankings(eventId);

    // Now read and return the newly generated rankings
    const updatedRankingsContent = await fs.readFile(rankingsPath, 'utf-8');
    const updatedRankings: EventRanking = JSON.parse(updatedRankingsContent);

    return NextResponse.json(updatedRankings);
  } catch (error) {
    console.error('Error handling rankings:', error);
    return NextResponse.json(
      { error: 'Failed to load rankings data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  
  try {
    // Force regenerate rankings
    const rankingService = new RankingService();
    await rankingService.updateEventRankings(eventId);

    const rankingsPath = path.join(DATA_DIR, 'rankings', `${eventId}.json`);
    const rankingsContent = await fs.readFile(rankingsPath, 'utf-8');
    const rankings = JSON.parse(rankingsContent);

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}