"use client";

import { useEffect, useState } from 'react';
import { Match, MatchResult } from '@/types/Match';
import MatchResultForm from '@/app/components/MatchResultForm';

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
): Promise<boolean> {
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

    if (!res.ok) throw new Error('Failed to submit result');
    
    // Trigger rankings update
    await fetch(`/api/rankings/${eventId}`, {
      method: 'POST',
    });

    return true;
  } catch (error) {
    console.error('Error submitting result:', error);
    return false;
  }
}

export default function MatchResultPage({
  params
}: {
  params: { eventId: string; matchId: string }
}) {
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setSuccess(false);
    
    const success = await submitMatchResult(
      params.eventId,
      params.matchId,
      {
        score,
        pr: 0, // These will be calculated on the server
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

    if (success) {
      setSuccess(true);
      // Update local match data
      if (match) {
        setMatch({
          ...match,
          status: 'completed',
          result: {
            score,
            pr: 0,
            pdi: 0,
            ds: 0,
            validation: {
              player1Approved: false,
              player2Approved: false,
              timestamp: new Date().toISOString(),
              status: 'pending'
            }
          }
        });
      }
    } else {
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

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
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

  if (match.status === 'completed' && match.result) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="text-sm text-green-700">
          Match result already submitted
        </div>
        <div className="mt-2">
          {match.player1.id} vs {match.player2.id}
        </div>
        <div className="mt-2">
          Score: {match.result.score[0]} - {match.result.score[1]}
        </div>
        <div className="mt-1">
          <div>PR: {match.result.pr}</div>
          <div>PDI: {match.result.pdi.toFixed(2)}</div>
          <div>DS: {match.result.ds}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Submit Match Result
        </h1>
      </div>

      {success ? (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">
            Match result submitted successfully
          </div>
        </div>
      ) : (
        <MatchResultForm
          player1Name={match.player1.id}
          player2Name={match.player2.id}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}