"use client";

import { useEffect, useState } from 'react';
import { Match, MatchResult } from '@/types/Match';
import { MatchDisplay } from '@/types/MatchHistory';
import { MatchResultPopup } from '@/app/components/MatchResultPopup';
import { PlayerCategoryType } from '@/types/Enums';
import { ClockIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Body, Heading } from "@/components/ui/Typography";
import { format } from "date-fns";
import { getCategoryColor } from "@/app/components/utils/styles";
import Link from "next/link";

interface MatchResponse {
  match: Match;
  updates: {
    player1: {
      id: string;
      newRating: number;
      newCategory: PlayerCategoryType;
      ratingChange: number;
    };
    player2: {
      id: string;
      newRating: number;
      newCategory: PlayerCategoryType;
      ratingChange: number;
    };
  };
}

async function getMatch(eventId: string, matchId: string): Promise<Match | null> {
  try {
    const res = await fetch(`/api/matches/${eventId}/${matchId}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
}

async function submitMatchResult(
  eventId: string, 
  matchId: string, 
  result: MatchResult
): Promise<MatchResponse | { error: string }> {
  try {
    const res = await fetch('/api/matches/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId,
        score: {
          player1Score: result.score[0],
          player2Score: result.score[1]
        }
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to submit result' };
    }
    
    return data as MatchResponse;
  } catch (error) {
    return { error: 'Failed to submit match result' };
  }
}

export default function MatchResultPage({
  params
}: {
  params: { eventId: string; matchId: string }
}) {
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showCompletedPopup, setShowCompletedPopup] = useState(false);
  const [ratingChanges, setRatingChanges] = useState<{
    player1: { newRating: number; newCategory: PlayerCategoryType; ratingChange: number };
    player2: { newRating: number; newCategory: PlayerCategoryType; ratingChange: number };
  } | undefined>(undefined);

  useEffect(() => {
    async function loadMatch() {
      const matchData = await getMatch(params.eventId, params.matchId);
      if (matchData) {
        setMatch(matchData);
      } else {
        setError("Failed to load match details");
      }
      setLoading(false);
    }

    loadMatch();
  }, [params.eventId, params.matchId]);

  const handleSubmit = async (score: [number, number]) => {
    setError("");
    
    try {
      const response = await submitMatchResult(
        params.eventId,
        params.matchId,
        {
          score,
          pr: 0, // These will be calculated server-side
          pdi: 0,
          ds: 0,
          validation: {
            player1Approved: false,
            player2Approved: false,
            timestamp: new Date().toISOString(),
            status: 'pending'
          }
        }
      );

      if ('error' in response) {
        setError(response.error);
        return;
      }

      // Update match with server response data
      setMatch(response.match);
      setRatingChanges({
        player1: {
          newRating: response.updates.player1.newRating,
          newCategory: response.updates.player1.newCategory,
          ratingChange: response.updates.player1.ratingChange
        },
        player2: {
          newRating: response.updates.player2.newRating,
          newCategory: response.updates.player2.newCategory,
          ratingChange: response.updates.player2.ratingChange
        }
      });
      setShowCompletedPopup(true);
    } catch (err) {
      setError("Failed to submit match result");
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-lg text-onyx-500 dark:text-onyx-400">Loading match details...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20 dark:border dark:border-yellow-800">
        <div className="text-sm text-yellow-700 dark:text-yellow-400">Match not found</div>
      </div>
    );
  }

  // A match is available for submission if it's not completed and not a bye match
  const isCompleted = match.status === 'completed';
  const canSubmit = !isCompleted && match.player2.id !== 'BYE';

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <Heading.H2 className="text-onyx-900 dark:text-white">
          {isCompleted ? 'Match Result' : 'Submit Match Result'}
        </Heading.H2>
        
        <Link 
          href={`/event/${params.eventId}`}
          className="text-amethyste-600 hover:text-amethyste-500 text-sm font-medium dark:text-amethyste-400 dark:hover:text-amethyste-300"
        >
          Back to Event
        </Link>
      </div>
      
      <div className="rounded-lg border border-onyx-200 bg-white p-4 sm:p-6
            hover:border-amethyste-200 hover:shadow-sm transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800 dark:hover:border-amethyste-700">
            
        {/* Match Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-onyx-500 dark:text-onyx-400">
            <ClockIcon className="w-4 h-4" />
            <Body.Caption>
              {match.date ? format(new Date(match.date), "MMM d, yyyy") : "Date not available"}
            </Body.Caption>
          </div>
          <div className={`flex items-center gap-2 ${
            isCompleted ? "text-green-600 dark:text-green-400" : "text-onyx-500 dark:text-onyx-400"
          }`}>
            <Body.Caption className="font-medium">
              {isCompleted ? "Completed" : "In Progress"}
            </Body.Caption>
          </div>
        </div>

        {/* Match Content */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* Player 1 */}
          <div className="text-center sm:text-left">
            <Body.Text className="font-medium">
              {match.player1.name || match.player1.id}
            </Body.Text>
            <Body.Caption className={getCategoryColor(match.player1.categoryBefore)}>
              {match.player1.categoryBefore}
            </Body.Caption>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-3">
            {match.result ? (
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
            <Body.Text className="font-medium">
              {match.player2.name || match.player2.id}
            </Body.Text>
            <Body.Caption className={getCategoryColor(match.player2.categoryBefore)}>
              {match.player2.categoryBefore}
            </Body.Caption>
          </div>
        </div>

        {/* Match Stats */}
        {match.result && (
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
        
        {/* Actions Section */}
        {canSubmit && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowCompletedPopup(true)}
          className="px-4 py-2 bg-amethyste-600 text-white rounded-md hover:bg-amethyste-500
              transform transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2
              dark:bg-amethyste-700 dark:hover:bg-amethyste-600"
            >
              Submit Match Result
            </button>
          </div>
        )}
      </div>

      {/* Show error if any */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20 dark:border dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Result Popup */}
      {showCompletedPopup && (
        <MatchResultPopup
          isOpen={showCompletedPopup}
          onClose={() => setShowCompletedPopup(false)}
          onSubmit={handleSubmit}
          player1Name={match.player1.id}
          player2Name={match.player2.id}
          matchResult={match.result ? {
            player1: { name: match.player1.name || match.player1.id, score: match.result.score[0] },
            player2: { name: match.player2.name || match.player2.id, score: match.result.score[1] },
            pr: match.result.pr,
            pdi: match.result.pdi,
            ds: match.result.ds,
            ratingChanges: ratingChanges && {
              player1: ratingChanges.player1,
              player2: ratingChanges.player2
            }
          } : undefined}
          eventId={params.eventId}
        />
      )}
    </div>
  );
}
