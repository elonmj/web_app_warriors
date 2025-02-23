import { NextResponse } from 'next/server';
import { EventService } from '../../../../../api/services/EventService';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventService = new EventService();
    const projectedPairings = await eventService.generatePairings(
      params.eventId,
      { 
        avoidRematches: true, 
        balanceCategories: true,
        preview: true  // Use preview mode to avoid saving to disk
      }
    );
    
    return NextResponse.json(projectedPairings);
  } catch (error) {
    console.error('Error generating pairings:', error);
    return NextResponse.json(
      { error: 'Failed to generate pairings' },
      { status: 500 }
    );
  }
}