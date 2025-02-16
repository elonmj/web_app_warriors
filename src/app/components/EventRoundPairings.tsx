import React from 'react';
import { Match } from '@/types/Match';
import { MatchStatus } from '@/types/MatchStatus';

interface PairingCardProps {
  match: Match;
  isCurrentRound: boolean;
}

const RoundSelector = ({
  currentRound,
  rounds,
  onChange
}: {
  currentRound: number;
  rounds: number[];
  onChange: (round: number) => void;
}) => (
  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
    {rounds.map(round => (
      <button
        key={round}
        onClick={() => onChange(round)}
        className={`px-4 py-2 rounded-lg transition-colors ${
          round === currentRound
            ? 'bg-blue-500 text-white'
            : 'bg-onyx-100 text-onyx-700 hover:bg-onyx-200 dark:bg-onyx-800 dark:text-onyx-200 dark:hover:bg-onyx-700'
        }`}
      >
        Round {round}
      </button>
    ))}
  </div>
);

const PairingCard = ({ match, isCurrentRound }: PairingCardProps) => {
  // Check if this is a bye match
  const isByeMatch = match.player2.id === 'BYE';
  const getStatusDisplay = (status: MatchStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Upcoming',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800'
        };
      case 'disputed':
        return {
          label: 'Disputed',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'forfeit':
        return {
          label: 'Forfeit',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const { label, className } = getStatusDisplay(match.status);

  return (
    <div className={`border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow ${
      isByeMatch ? 'bg-gray-50 dark:bg-onyx-900' : ''
    }`}>
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
            <span className="text-sm text-gray-600">
              ({match.player1.ratingBefore})
            </span>
            <span className="text-xs text-gray-500">
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
                <span className="text-sm text-gray-600">
                  ({match.player2.ratingBefore})
                </span>
                <span className="text-xs text-gray-500">
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
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
              Automatic Win
            </span>
          ) : (
            <>
              <span className={`px-2 py-1 rounded ${className}`}>
                {label}
              </span>
              {match.result && (
                <span className="text-gray-600">
                  PR: {match.result.pr} | PDI: {match.result.pdi} | DS: {match.result.ds}
                </span>
              )}
            </>
          )}
        </div>
        <span className="text-gray-500">
          {isCurrentRound && (
            <span className="text-blue-600 font-medium mr-2">Current Round</span>
          )}
          Round {match.metadata.round}
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
}

const EventRoundPairings = ({
  eventId,
  currentRound,
  matches,
  isLoading = false
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

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.metadata.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Sort rounds in descending order
  const sortedRounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => b - a);

  if (sortedRounds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No matches available for this event yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedRounds.map(round => (
        <div key={round} className="border-b pb-6 last:border-b-0">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span>Round {round}</span>
            {round === currentRound && (
              <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                Current
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {matchesByRound[round].map(match => (
              <PairingCard
                key={match.id}
                match={match}
                isCurrentRound={round === currentRound}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventRoundPairings;