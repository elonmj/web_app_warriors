# Round Pairings Component Example

## Component Structure

```tsx
// src/app/components/EventRoundPairings.tsx

import { Match, PlayerMatchInfo } from '@/types/Match';
import { MatchStatus } from '@/types/MatchStatus';

interface PairingCardProps {
  match: Match;
  isCurrentRound: boolean;
}

const PairingCard = ({ match, isCurrentRound }: PairingCardProps) => {
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
    <div className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1">
          {/* Player 1 */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">{match.player1.id}</span>
            <span className="text-sm text-gray-600">
              ({match.player1.ratingBefore})
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
            <span className="font-semibold">{match.player2.id}</span>
            <span className="text-sm text-gray-600">
              ({match.player2.ratingBefore})
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className={`px-2 py-1 rounded ${className}`}>
          {label}
        </span>
        <span className="text-gray-500">
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
}

const EventRoundPairings = ({
  eventId,
  currentRound,
  matches
}: EventRoundPairingsProps) => {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.metadata.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <div className="space-y-6">
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} className="border-b pb-6 last:border-b-0">
          <h3 className="text-xl font-semibold mb-4">
            Round {round}
            {parseInt(round) === currentRound && (
              <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded">
                Current
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {roundMatches.map(match => (
              <PairingCard
                key={match.id}
                match={match}
                isCurrentRound={parseInt(round) === currentRound}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventRoundPairings;
```

## Integration Example

```tsx
// src/app/event/[eventId]/page.tsx

import EventRoundPairings from '@/app/components/EventRoundPairings';

export default async function EventPage({ params }: { params: { eventId: string } }) {
  const event = await getEvent(params.eventId);
  const matches = await getEventMatches(params.eventId);
  const currentRound = event.metadata?.currentRound ?? 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <EventHeader event={event} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Match Pairings</h2>
        <EventRoundPairings
          eventId={params.eventId}
          currentRound={currentRound}
          matches={matches}
        />
      </div>

      <div className="mt-8">
        <EventMatchHistory eventId={params.eventId} />
      </div>
    </div>
  );
}
```

## Features

1. **Round Organization**
   - Matches grouped by rounds
   - Current round highlighted
   - Clear visual hierarchy

2. **Match Status Display**
   - Color-coded status indicators
   - Clear result display for completed matches
   - Visual distinction between pending and completed matches

3. **Player Information**
   - Player names
   - Current ratings
   - Match scores when available

4. **Responsive Design**
   - Flexible layout
   - Mobile-friendly spacing
   - Clear typography hierarchy

5. **Interactive Elements**
   - Hover effects for cards
   - Clear status indicators
   - Round navigation

## Next Steps

1. Add loading states and error boundaries
2. Implement round navigation controls
3. Add match details expansion/collapse
4. Implement match result updates
5. Add admin controls for match management