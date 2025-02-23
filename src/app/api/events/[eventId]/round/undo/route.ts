import { NextResponse } from 'next/server';
import { EventService } from '../../../../../../api/services/EventService';

import { compareHash } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventService = new EventService();

  try {
    const { password } = await request.json();
    
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

    await eventService.undoCompleteRound(params.eventId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error undoing round completion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to undo round completion' },
      { status: 500 }
    );
  }
}
