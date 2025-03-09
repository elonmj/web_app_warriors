import { Suspense } from "react";
import PlayerStats from "@/app/components/PlayerStats";
import PlayerMatchHistory from "@/app/components/PlayerMatchHistory";
import HeadToHeadStats from "@/app/components/HeadToHeadStats";
import PlayerStatsSkeleton from "@/app/components/PlayerStatsSkeleton";
import PlayerProfileError from "@/app/components/PlayerProfileError";
import { Player } from "@/types/Player";
import { Body, Heading } from "@/components/ui/Typography";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

async function getPlayerData(playerId: string): Promise<Player & { id: number }> {
  if (!playerId || typeof playerId !== 'string') {
    throw new Error('Invalid player ID');
  }

  if (!playerId.match(/^\d+$/)) {
    throw new Error('Invalid player ID format - must be a number');
  }

  // In server components, we need absolute URLs
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  console.log('Server fetching player data:', {
    playerId,
    url: `${baseUrl}/api/players/${playerId}`
  });

  const response = await fetch(
    `${baseUrl}/api/players/${playerId}`,
    {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch player data');
  }

  return response.json();
}

export default async function PlayerProfilePage({
  params,
}: {
  params: { playerId: string };
}) {
  try {
    const player = await getPlayerData(params.playerId);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white shadow dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href="/rankings"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Back to Rankings
                  </Link>
                </div>
                <Heading.H1 className="text-gray-900 dark:text-white">
                  {player.name}
                </Heading.H1>
                <Body.Text className="text-gray-600 dark:text-gray-400">
                  Player ID: {player.id}
                </Body.Text>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Overview Section */}
            <section>
              <Heading.H2 className="mb-4 text-gray-900 dark:text-white">
                Overview
              </Heading.H2>
              <Suspense fallback={<PlayerStatsSkeleton />}>
                <PlayerStats player={player} />
              </Suspense>
            </section>

            {/* Head-to-Head Records Section */}
            <section>
              <Heading.H2 className="mb-4 text-gray-900 dark:text-white">
                Head-to-Head Records
              </Heading.H2>
              <Suspense fallback={<PlayerStatsSkeleton />}>
                <HeadToHeadStats playerId={Number(player.id)} />
              </Suspense>
            </section>

            {/* Match History Section */}
            <section>
              <Heading.H2 className="mb-4 text-gray-900 dark:text-white">
                Match History
              </Heading.H2>
              <Suspense fallback={<PlayerStatsSkeleton />}>
                <PlayerMatchHistory playerId={player.id} />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Player profile error:', {
      playerId: params.playerId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    let errorMessage = "Failed to load player profile";
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid player ID')) {
        errorMessage = `Invalid player ID: ${params.playerId}`;
      } else if (error.message.includes('fetch')) {
        errorMessage = `Network error: Could not load player data. Please try again.`;
      }
    }

    return (
      <PlayerProfileError message={errorMessage} />
    );
  }
}