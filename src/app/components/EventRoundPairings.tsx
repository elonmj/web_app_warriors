import { useState, useEffect } from 'react';
import { Match } from '@/types/Match';
import { MatchDisplay } from '@/types/MatchHistory';
import { MatchStatus } from '@/types/MatchStatus';
import { Body, Heading } from "@/components/ui/Typography";
import Link from 'next/link';
import { TrophyIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { getCategoryColor } from "./utils/styles";
import PlayerNameDisplay from "@/components/shared/PlayerNameDisplay";
import MatchStatBadges from "./MatchStatBadges";
import { calculateSpread } from "@/lib/scoring";

interface PlayerDetails {
  name: string;
  iscUsername?: string;
}

async function fetchPlayerDetails(playerId: string): Promise<PlayerDetails | null> {
  try {
    const response = await fetch(`/api/players/${playerId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch details for player ${playerId}:`, error);
    return null;
  }
}

interface PairingCardProps {
  match: MatchDisplay;
  isCurrentRound: boolean;
  isProjected?: boolean;
}

const PairingCard = ({ match, isCurrentRound, isProjected }: PairingCardProps) => {
  const [player1Details, setPlayer1Details] = useState<PlayerDetails | null>(null);
  const [player2Details, setPlayer2Details] = useState<PlayerDetails | null>(null);

  // Fetch player details if they're not available in match object
  useEffect(() => {
    async function loadPlayerDetails() {
      // Only fetch if we don't have the details from the match object
      if (!match.player1Details?.name) {
        const details = await fetchPlayerDetails(match.player1.id.toString());
        if (details) {
          setPlayer1Details(details);
        }
      }

      // Only fetch player 2 details if it's not a bye match and we don't have the details
      if (match.player2.id.toString() === 'BYE' && !match.player2Details?.name) {
        const details = await fetchPlayerDetails(match.player2.id.toString());
        if (details) {
          setPlayer2Details(details);
        }
      }
    }

    loadPlayerDetails();
  }, [match.player1.id, match.player2.id, match.player1Details, match.player2Details]);

  // Get the best available name for each player
  const player1Name = match.player1Details?.name || 
    player1Details?.name || 
    `Player ${match.player1.id}`;

  const player2Name = match.player2Details?.name || 
    player2Details?.name || 
    `Player ${match.player2.id}`;

  // Check if this is a bye match - handling string ID correctly
  const isByeMatch = match.player2.id.toString() === 'BYE';

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

  // Ligne discrète "catégorie · cote" — fusionne deux lignes de métadonnées en une
  const metaLine = (category?: string, rating?: number) =>
    [category, rating !== undefined ? `${rating}` : null].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/event/${match.eventId}/match/${match.id}`}
      className={`relative block border rounded-lg p-3 sm:p-4 cursor-pointer
      hover:border-amethyste-300 hover:shadow-md transition-all duration-200
      ${isByeMatch ? 'bg-onyx-50 dark:bg-onyx-900/50' : 'bg-white dark:bg-onyx-900'}
      ${isProjected ? 'border-purple-200 dark:border-purple-800/30' : 'border-onyx-200 dark:border-onyx-800'}`}>

      {isByeMatch && (
        <span className="absolute -top-2 left-4 bg-gray-500 text-white text-xs px-2 py-1 rounded">
          Bye Match
        </span>
      )}

      {/* Header : discret, statut seul mis en avant */}
      <div className="flex justify-between items-center mb-2">
        <Body.Caption className="text-onyx-400 dark:text-onyx-500">
          {isProjected ? (
            <span className="text-purple-600 dark:text-purple-400 font-medium">Projected</span>
          ) : (
            `Round ${match.metadata.round}`
          )}
        </Body.Caption>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>
          {label}
        </span>
      </div>

      {/* Match Content — les deux joueurs resserrés autour du "vs" */}
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {/* Player 1 */}
        <div className="flex-1 min-w-0 text-right">
          <PlayerNameDisplay
            name={player1Name}
            iscUsername={match.player1Details?.iscUsername || player1Details?.iscUsername}
            className="text-base sm:text-lg font-semibold"
          />
          <Body.Caption className={`${getCategoryColor(match.player1.categoryBefore)} block`}>
            {metaLine(match.player1.categoryBefore, match.player1.ratingBefore)}
          </Body.Caption>
        </div>

        {/* Score */}
        <div className="flex-none flex items-center justify-center gap-2 px-1">
          {match.status === 'completed' && match.result ? (
            <>
              <Heading.H4 className="text-onyx-900 dark:text-white">
                {match.result.score[0]}
              </Heading.H4>
              <Body.Caption className="text-onyx-400">–</Body.Caption>
              <Heading.H4 className="text-onyx-900 dark:text-white">
                {match.result.score[1]}
              </Heading.H4>
            </>
          ) : (
            <Body.Caption className="text-onyx-400 font-medium">vs</Body.Caption>
          )}
        </div>

        {/* Player 2 */}
        <div className="flex-1 min-w-0 text-left">
          {isByeMatch ? (
            <Body.Text className="font-medium text-onyx-400 dark:text-onyx-500">BYE</Body.Text>
          ) : (
            <>
              <PlayerNameDisplay
                name={player2Name}
                iscUsername={match.player2Details?.iscUsername || player2Details?.iscUsername}
                className="text-base sm:text-lg font-semibold"
              />
              <Body.Caption className={`${getCategoryColor(match.player2.categoryBefore)} block`}>
                {metaLine(match.player2.categoryBefore, match.player2.ratingBefore)}
              </Body.Caption>
            </>
          )}
        </div>
      </div>

      {/* Match Stats */}
      {match.result && !isProjected && (
        <div className="mt-3 pt-3 border-t border-onyx-100 dark:border-onyx-800">
          <MatchStatBadges
            pr={match.result.pr}
            spread={calculateSpread(match.result.score[0], match.result.score[1])}
          />
        </div>
      )}

      {!isProjected && !isByeMatch && (
        <div className="mt-3 pt-2 flex justify-end">
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md
            ${match.status === 'pending'
              ? 'bg-amethyste-50 text-amethyste-700 dark:bg-amethyste-900/20 dark:text-amethyste-300'
              : 'text-amethyste-600 dark:text-amethyste-400'}`}
          >
            {match.status === 'pending' ? 'Enter Results' : 'View Details / Modify'}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      )}
    </Link>
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
    <div className="space-y-2 sm:space-y-3">
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
