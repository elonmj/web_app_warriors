import { NextRequest, NextResponse } from 'next/server';
import { RankingService } from '@/api/services/RankingService';
import path from 'path';
import fs from 'fs/promises';

const rankingService = new RankingService();

/**
 * GET /api/rankings/[eventId]
 * Get event rankings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Try to read existing rankings first
    const rankingsPath = path.join(process.cwd(), 'data', 'rankings', `${params.eventId}.json`);
    try {
      const rankingsData = await fs.readFile(rankingsPath, 'utf-8');
      const rankings = JSON.parse(rankingsData);
      return NextResponse.json(rankings);
    } catch (error) {
      // If file doesn't exist or is invalid, recalculate rankings
      const rankings = await rankingService.updateEventRankings(params.eventId);
      return NextResponse.json(rankings);
    }
  } catch (error) {
    console.error('Error retrieving rankings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rankings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rankings/[eventId]
 * Force update event rankings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const rankings = await rankingService.updateEventRankings(params.eventId);
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}