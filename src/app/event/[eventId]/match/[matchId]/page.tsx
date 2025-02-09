"use client";

import { useEffect, useState } from 'react';
import { Match, MatchResult } from '@/types/Match';
import MatchResultForm from '@/app/components/MatchResultForm';
import { MatchResultPopup } from '@/app/components/MatchResultPopup';
import { PlayerCategoryType } from '@/types/Enums';

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
        if (matchData.status === 'completed' && matchData.result) {
          setShowCompletedPopup(true);
        }
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
        <div className="text-lg text-gray-500">Loading match details...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="text-sm text-yellow-700">Match not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {match.result ? 'Match Result' : 'Submit Match Result'}
        </h1>
      </div>

      {!match.result && (
        <MatchResultForm
          player1Name={match.player1.id}
          player2Name={match.player2.id}
          onSubmit={handleSubmit}
          eventId={params.eventId}
          error={error}
        />
      )}

      {match.result && showCompletedPopup && (
        <MatchResultPopup
          isOpen={showCompletedPopup}
          onClose={() => setShowCompletedPopup(false)}
          matchResult={{
            player1: { name: match.player1.id, score: match.result.score[0] },
            player2: { name: match.player2.id, score: match.result.score[1] },
            pr: match.result.pr,
            pdi: match.result.pdi,
            ds: match.result.ds,
            ratingChanges: ratingChanges && {
              player1: ratingChanges.player1,
              player2: ratingChanges.player2
            }
          }}
          eventId={params.eventId}
        />
      )}
    </div>
  );
}