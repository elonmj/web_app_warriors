import { Match } from '@/types/Match';
import { MatchDisplay } from '@/types/MatchHistory';
import { MatchStatus } from '@/types/MatchStatus';
import { Body, Heading } from "@/components/ui/Typography";
import { useRouter } from 'next/navigation';
import { TrophyIcon } from "@heroicons/react/24/outline";
import { getCategoryColor } from "./utils/styles";
import PlayerNameDisplay from "@/components/shared/PlayerNameDisplay";

interface PairingCardProps {
  match: MatchDisplay;
  isCurrentRound: boolean;
  isProjected?: boolean;
}

const PairingCard = ({ match, isCurrentRound, isProjected }: PairingCardProps) => {
  const router = useRouter();

  // Check if this is a bye match
  const isByeMatch = match.player2.id === 'BYE';
  
  const getStatusDisplay = (status: MatchStatus) => {
    if (isProjected) {
      return {
        label: 'Projected',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      };
    }

    switch (status) {
      case 'pending':
        return {
          label: 'Upcoming',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
        };
      case 'disputed':
        return {
          label: 'Disputed',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
        };
      case 'forfeit':
        return {
          label: 'Forfeit',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300'
        };
    }
  };

  const { label, className } = getStatusDisplay(match.status);

  return (
    <div 
      onClick={() => router.push(`/event/${match.eventId}/match/${match.id}`)}
      className={`border rounded-lg p-4 sm:p-6 mb-4 cursor-pointer 
      hover:border-amethyste-200 hover:shadow-sm transition-all duration-200
      ${isByeMatch ? 'bg-onyx-50 dark:bg-onyx-900/50' : 'bg-white dark:bg-onyx-900'} 
      ${isProjected ? 'border-purple-200 dark:border-purple-800/30' : 'border-onyx-200 dark:border-onyx-800'}`}>
      
      <div className="flex justify-between items-center mb-4">
        {isByeMatch && (
          <span className="absolute -top-2 left-4 bg-gray-500 text-white text-xs px-2 py-1 rounded">
            Bye Match
          </span>
        )}
        
        <div className="text-onyx-500 dark:text-onyx-400">
          <Body.Caption>
            {isCurrentRound && !isProjected && (
              <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">Current Round</span>
            )}
            {isProjected ? (
              <span className="text-purple-600 dark:text-purple-400 font-medium">Projected</span>
            ) : (
              `Round ${match.metadata.round}`
            )}
          </Body.Caption>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
            {label}
          </span>
        </div>
      </div>

      {/* Match Content */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* Player 1 */}
        <div className="text-center sm:text-left">
          <PlayerNameDisplay
            name={match.player1Details?.name || match.player1.id.replace(/-\d+$/, '')}
            iscUsername={match.player1Details?.iscUsername}
          />
          {match.player1.categoryBefore && (
            <Body.Caption className={getCategoryColor(match.player1.categoryBefore)}>
              {match.player1.categoryBefore}
            </Body.Caption>
          )}
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">
            Rating: {match.player1.ratingBefore}
          </Body.Caption>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-3">
          {match.status === 'completed' && match.result ? (
            <>
              <Heading.H3 className="text-onyx-900 dark:text-white">
                {match.result.score[0]}
              </Heading.H3>
              <Body.Text className="text-onyx-400">vs</Body.Text>
              <Heading.H3 className="text-onyx-900 dark:text-white">
                {match.result.score[1]}
              </Heading.H3>
            </>
          ) : (
            <Body.Text className="text-onyx-400">vs</Body.Text>
          )}
        </div>

        {/* Player 2 */}
        <div className="text-center sm:text-right">
          {isByeMatch ? (
            <Body.Text className="font-medium text-onyx-400 dark:text-onyx-500">BYE</Body.Text>
          ) : (
            <>
              <PlayerNameDisplay
                name={match.player2Details?.name || match.player2.id.replace(/-\d+$/, '')}
                iscUsername={match.player2Details?.iscUsername}
              />
              {match.player2.categoryBefore && (
                <Body.Caption className={getCategoryColor(match.player2.categoryBefore)}>
                  {match.player2.categoryBefore}
                </Body.Caption>
              )}
              <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                Rating: {match.player2.ratingBefore}
              </Body.Caption>
            </>
          )}
        </div>
      </div>

      {/* Match Stats */}
      {match.result && !isProjected && (
        <div className="mt-4 pt-4 border-t border-onyx-100 dark:border-onyx-800">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Body.Caption>PR</Body.Caption>
              <Body.Text className="font-medium text-onyx-900 dark:text-white">
                {match.result.pr}
              </Body.Text>
            </div>
            <div className="text-center">
              <Body.Caption>PDI</Body.Caption>
              <Body.Text className="font-medium text-onyx-900 dark:text-white">
                {(match.result.pdi * 100).toFixed(0)}%
              </Body.Text>
            </div>
            <div className="text-center">
              <Body.Caption>DS</Body.Caption>
              <Body.Text className="font-medium text-onyx-900 dark:text-white">
                {match.result.ds}
              </Body.Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EventRoundPairingsProps {
  eventId: string;
  currentRound: number;
  matches: MatchDisplay[];
  isLoading?: boolean;
  isProjected?: boolean;
}

const EventRoundPairings = ({
  eventId,
  currentRound,
  matches,
  isLoading = false,
  isProjected = false
}: EventRoundPairingsProps) => {
  // Remove player fetching since we should already have enriched data

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2].map((j) => (
                <div key={j} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
          dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          No matches available for this round yet.
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {matches.map(match => (
        <PairingCard
          key={match.id}
          match={match}
          isCurrentRound={match.metadata.round === currentRound}
          isProjected={isProjected}
        />
      ))}
    </div>
  );
};

export default EventRoundPairings;
