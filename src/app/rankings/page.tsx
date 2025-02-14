import PlayerRankings from "@/app/components/PlayerRankings";
import { Heading, Body } from "@/components/ui/Typography";
import { TrophyIcon } from "@heroicons/react/24/outline";

async function getGlobalRankings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Force recalculate rankings first
    await fetch(`${baseUrl}/api/rankings/global`, {
      method: 'POST',
      cache: 'no-store'
    });

    // Then get the latest rankings
    const response = await fetch(
      `${baseUrl}/api/rankings/global`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch rankings');
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch global rankings:', error);
    return null;
  }
}

export default async function RankingsPage() {
  const globalRankings = await getGlobalRankings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading.H1 className="bg-clip-text text-transparent bg-gradient-to-r from-amethyste-500 to-amethyste-600">
              Global Rankings
            </Heading.H1>
            <Body.Text className="text-onyx-600 dark:text-onyx-400">
              Current standings across all events
            </Body.Text>
          </div>
        </div>

        {/* Rankings Table */}
        {globalRankings ? (
          <div className="bg-white shadow-sm rounded-lg dark:bg-onyx-900">
            <PlayerRankings eventRanking={globalRankings} />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
              dark:bg-onyx-800">
              <TrophyIcon className="w-6 h-6 text-onyx-400" />
            </div>
            <Heading.H3 className="mb-2">No Rankings Available</Heading.H3>
            <Body.Text className="text-onyx-600 dark:text-onyx-400">
              Rankings data could not be loaded. Please try again later.
            </Body.Text>
          </div>
        )}
      </div>
    </div>
  );
}