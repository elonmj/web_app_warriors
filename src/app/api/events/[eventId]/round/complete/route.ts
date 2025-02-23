import { NextResponse } from 'next/server';
import { EventService } from '@/api/services/EventService';
import { compareHash } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { password, round } = await request.json();
    
    // Verify admin password
    const isValid = await compareHash(
      password,
      process.env.NEXT_ADMIN_PASSWORD_HASH || ''
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 401 }
      );
    }

    const eventService = new EventService();
    
    // Generate pairings for next round
    const pairings = await eventService.generatePairings(
      params.eventId,
      { 
        avoidRematches: true, 
        balanceCategories: true
      }
    );

    // Complete current round and create next
    await eventService.completeRound(params.eventId, round);

    return NextResponse.json({
      success: true,
      message: 'Round completed successfully',
      pairings
    });
  } catch (error) {
    console.error('Error completing round:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete round' },
      { status: 500 }
    );
  }
}