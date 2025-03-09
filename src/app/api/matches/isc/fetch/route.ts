import { NextResponse } from 'next/server';
import { iscService } from '@/api/services/ISCService';
import { ISCCredentials, ISCPlayerIdentifier } from '@/types/ISC';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player1, player2 } = body as {
      player1: ISCPlayerIdentifier;
      player2?: ISCPlayerIdentifier; // player2 is now optional
    };

    if (!player1 || !player1.iscUsername) {
      return NextResponse.json(
        { success: false, error: 'Missing ISC username for player 1' },
        { status: 400 } // Bad Request
      );
    }


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

  let result: any;

   if (player2 && player2.iscUsername) {
     // Fetch a specific match between two players
     result = await iscService.fetchMatchResult(player1, player2, credentials);
   } else {
     // Since we need two players for ISC fetch, return an error
     return NextResponse.json(
       { success: false, error: 'Two player usernames required for ISC match fetch' },
       { status: 400 }
     );
   }


    // Check the status field to determine if match was found
    if (result.status === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: true,
          data: [], // Return an empty array when no matches are found
          message: result.message || `No match found for player ${player1.iscUsername}.`
        },
        { status: 200 } // Return 200 OK even when no matches are found
      );
    }


    return NextResponse.json({ success: true, data: result.gameData, warnings: result.warnings });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
