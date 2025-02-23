import React from 'react';
import { Match } from '@/types/Match';
import { MatchStatus } from '@/types/MatchStatus';

interface PairingCardProps {
  match: Match;
  isCurrentRound: boolean;
  isProjected?: boolean;
}

const PairingCard = ({ match, isCurrentRound, isProjected }: PairingCardProps) => {
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
    <div className={`border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow ${
      isByeMatch ? 'bg-gray-50 dark:bg-onyx-900' : ''
    } ${isProjected ? 'border-purple-200 dark:border-purple-800/30' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        {isByeMatch && (
          <span className="absolute -top-2 left-4 bg-gray-500 text-white text-xs px-2 py-1 rounded">
            Bye Match
          </span>
        )}
        <div className="flex-1">
          {/* Player 1 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">{match.player1.id}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({match.player1.ratingBefore})
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {match.player1.categoryBefore}
            </span>
          </div>
        </div>
        
        <div className="mx-4 font-bold">
          {match.status === 'completed' && match.result ? (
            <span>
              {match.result.score[0]} - {match.result.score[1]}
            </span>
          ) : (
            'vs'
          )}
        </div>

        <div className="flex-1 text-right">
          {/* Player 2 */}
          <div className="flex items-center gap-2 justify-end">
            {isByeMatch ? (
              <span className="font-medium text-gray-500">BYE</span>
            ) : (
              <>
                <span className="font-semibold">{match.player2.id}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({match.player2.ratingBefore})
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {match.player2.categoryBefore}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          {isByeMatch ? (
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300">
              Automatic Win
            </span>
          ) : (
            <>
              <span className={`px-2 py-1 rounded ${className}`}>
                {label}
              </span>
              {match.result && !isProjected && (
                <span className="text-gray-600 dark:text-gray-400">
                  PR: {match.result.pr} | PDI: {match.result.pdi} | DS: {match.result.ds}
                </span>
              )}
            </>
          )}
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          {isCurrentRound && !isProjected && (
            <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">Current Round</span>
          )}
          {isProjected ? (
            <span className="text-purple-600 dark:text-purple-400 font-medium">Projected</span>
          ) : (
            `Round ${match.metadata.round}`
          )}
        </span>
      </div>
    </div>
  );
};

interface EventRoundPairingsProps {
  eventId: string;
  currentRound: number;
  matches: Match[];
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
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2].map((j) => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No matches available for this round yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

const ExportedEventRoundPairings = EventRoundPairings;
export { ExportedEventRoundPairings as default };