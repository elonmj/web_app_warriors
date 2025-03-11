import { Heading, Body } from "@/components/ui/Typography";
import { GlobalRankings } from "@/app/components/GlobalRankings";

export default function RankingsPage() {
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
        <div className="bg-white shadow-sm rounded-lg dark:bg-onyx-900">
          <GlobalRankings />
        </div>
      </div>
    </div>
  );
}