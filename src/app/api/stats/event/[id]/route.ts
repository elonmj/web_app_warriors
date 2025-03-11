import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/api/services/StatisticsService';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';

const statsService = new StatisticsService();
const eventRepository = new FirebaseEventRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate event exists
    const event = await eventRepository.getEvent(params.id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Calculate event statistics
    const stats = await statsService.calculateEventStats(params.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating event statistics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate event statistics' },
      { status: 500 }
    );
  }
}