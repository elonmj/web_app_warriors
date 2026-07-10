import { NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { Player } from '@/types/Player';

const playerRepository = new FirebasePlayerRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }
  console.log(`[API] Received search request:`, {
    url: request.url,
    query: query,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    const players: Player[] = await playerRepository.searchPlayers(query);
    console.log(`[API] Search complete. Found ${players.length} results:`, players);
    return NextResponse.json(players);
  } catch (error) {
    console.error('[API] Error searching players:', error);
    return NextResponse.json({ error: 'Failed to search players' }, { status: 500 });
  }
}