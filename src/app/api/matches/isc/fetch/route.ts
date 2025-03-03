import { NextResponse } from 'next/server';
import { iscService } from '@/api/services/ISCService';
import { ISCCredentials, ISCPlayerIdentifier } from '@/types/ISC';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player1, player2 } = body as {
      player1: ISCPlayerIdentifier;
      player2: ISCPlayerIdentifier;
    };

    const credentials: ISCCredentials = {
      username: process.env.ISC_USERNAME!,
      password: process.env.ISC_PASSWORD!
    };

    if (!credentials.username || !credentials.password) {
      return NextResponse.json(
        { success: false, error: 'ISC credentials not configured' },
        { status: 500 }
      );
    }

    const result = await iscService.fetchMatchResult(player1, player2, credentials);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
