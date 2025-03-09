import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerCategoryType } from '@/types/Enums';
import { Label } from '@/components/ui/Typography';
import { ISCCredentials, ISCGameData } from '@/types/ISC';

import PlayerNameDisplay from '@/components/shared/PlayerNameDisplay';
import ScoreProgressionChart from './ScoreProgressionChart';
import MoveList from './MoveList';

interface PlayerDetails {
  name: string;
  iscUsername?: string;
  id?: number; // Updated to use number type
}

// Missing function - adding placeholder based on context
const fetchPlayerDetails = async (playerId: number): Promise<PlayerDetails> => {
  const response = await fetch(`/api/players/${playerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch player details: ${response.statusText}`);
  }
  return response.json();
};

interface MatchResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: [number, number]) => Promise<void>;
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  eventId: string;
  matchResult?: {
    player1: { name: string; score: number };
    player2: { name: string; score: number };
    pr: number;
    pdi: number;
    ds: number;
    ratingChanges?: {
      player1: { newRating: number; newCategory: PlayerCategoryType; ratingChange: number };
      player2: { newRating: number; newCategory: PlayerCategoryType; ratingChange: number };
    };
  };
}

// Calculate Points Ranking (PR)
const calculatePR = (score1: number, score2: number) => {
  if (score1 > score2) return 3;
  if (score1 === score2) return 1;
  return 0;
};

// Keep PDI as internal helper for DS calculation
const calculatePDI = (score1: number, score2: number) => {
  const totalPoints = score1 + score2;
  if (totalPoints === 0) return 0;
  return Math.abs(score1 - score2) / totalPoints;
};

// Calculate Dominant Score (DS) based on PDI
const calculateDS = (score1: number, score2: number) => {
  const pdi = calculatePDI(score1, score2);
  const threshold = 0.8;
  return pdi >= threshold ? 100 : Math.floor(pdi * 100);
};

export const MatchResultPopup: React.FC<MatchResultPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  player1Name,
  player1Id,
  player2Id,
  player2Name,
  matchResult,
  eventId,
}) => {
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingISC, setIsFetchingISC] = useState(false);
  const [iscError, setIscError] = useState<string | null>(null);
  const [player1Details, setPlayer1Details] = useState<PlayerDetails | null>(null);
  const [player2Details, setPlayer2Details] = useState<PlayerDetails | null>(null);
  const [gameData, setGameData] = useState<ISCGameData | null>(null);
  const router = useRouter();

  // Load player details on mount
  useEffect(() => {
    const loadPlayerDetails = async () => {
      try {
        // Fetch complete player details using numeric IDs
        const [player1Response, player2Response] = await Promise.all([
          fetchPlayerDetails(player1Id),
          fetchPlayerDetails(player2Id)
        ]);

        setPlayer1Details({
          ...player1Response,
          name: player1Name // Use provided name for consistency
        });

        setPlayer2Details({
          ...player2Response,
          name: player2Name // Use provided name for consistency
        });
      } catch (error) {
        console.error('Failed to load player details:', error);
        setIscError('Failed to load player details');
      }
    };

    if (isOpen) {
      loadPlayerDetails();
    }
  }, [isOpen, player1Name, player2Name]);

  if (!isOpen) return null;

  const handleReturn = () => {
    router.back();
  };

  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleReturn();
    }
  };

  const winner = matchResult ?
    (matchResult.player1.score > matchResult.player2.score
      ? matchResult.player1.name
      : matchResult.player2.score > matchResult.player1.score
        ? matchResult.player2.name
        : null)
    : null;

  const formatRating = (value: number) => Math.round(value);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Match Result
        </h2>

        <div className="space-y-6">
          {/* ISC Fetch Button and Credentials */}
          {!matchResult && (
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    setIscError(null);
                    setIsFetchingISC(true);

                    // Validate ISC usernames
                    if (!player1Details?.iscUsername || !player2Details?.iscUsername) {
                      throw new Error(
                        `Missing ISC username for ${!player1Details?.iscUsername ? player1Name : player2Name
                        }. Please ensure both players have ISC usernames configured.`
                      );
                    }

                    const response = await fetch('/api/matches/isc/fetch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        player1: {
                          name: player1Name,
                          iscUsername: player1Details.iscUsername,
                          id: player1Details.id // Include ID if available
                        },
                        player2: {
                          name: player2Name,
                          iscUsername: player2Details.iscUsername,
                          id: player2Details.id // Include ID if available
                        }
                      })
                    });

                    const data = await response.json();
                    if (!data.success) {
                      throw new Error(data.error || 'Failed to fetch match result from ISC');
                    }

                    // Set game data and scores
                    setGameData(data.data.gameData);
                    setScores([
                      data.data.gameData.scores[player1Details!.iscUsername!],
                      data.data.gameData.scores[player2Details!.iscUsername!]
                    ]);
                    
                    // Update match result
                    await onSubmit([
                      data.data.gameData.scores[player1Details!.iscUsername!],
                      data.data.gameData.scores[player2Details!.iscUsername!]
                    ]);
                  } catch (error) {
                    setIscError(error instanceof Error ? error.message : 'Failed to fetch from ISC');
                    console.error('ISC fetch error:', error);
                  } finally {
                    setIsFetchingISC(false);
                  }
                }}
                disabled={isFetchingISC}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetchingISC ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching from ISC...</span>
                  </span>
                ) : (
                  'Fetch from ISC'
                )}
              </button>
              {iscError && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-lg">
                  Error: {iscError}
                </div>
              )}
            </div>
          )}

          {/* Score Display */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-4">
              {/* Player 1 Score */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start">
                  <PlayerNameDisplay
                    name={matchResult ? matchResult.player1.name : (player1Details?.name || player1Name)}
                    iscUsername={player1Details?.iscUsername}
                    isWinner={matchResult && winner === matchResult.player1.name}
                  />
                  {matchResult ? (
                    <span className="text-2xl font-bold">{matchResult.player1.score}</span>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={scores[0]}
                      onChange={(e) => {
                        // Only allow positive numbers or empty string
                        if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                          const newScore: [number, number] = [...scores] as [number, number];
                          newScore[0] = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setScores(newScore);
                        }
                      }}
                      className="w-24 h-12 text-2xl text-center border border-gray-200 rounded-md 
                        bg-white text-gray-800 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        hover:border-blue-400
                        transition-all duration-150 ease-in-out"
                      disabled={isSubmitting}
                    />
                  )}
                </div>
                {matchResult?.ratingChanges && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {matchResult.ratingChanges.player1.newCategory}
                    </span>
                    <span className={`font-medium ${matchResult.ratingChanges.player1.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {matchResult.ratingChanges.player1.ratingChange >= 0 ? '+' : ''}
                      {formatRating(matchResult.ratingChanges.player1.ratingChange)}
                      ({formatRating(matchResult.ratingChanges.player1.newRating)})
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Player 2 Score */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start">
                  <PlayerNameDisplay
                    name={matchResult ? matchResult.player2.name : (player2Details?.name || player2Name)}
                    iscUsername={player2Details?.iscUsername}
                    isWinner={matchResult && winner === matchResult.player2.name}
                  />
                  {matchResult ? (
                    <span className="text-2xl font-bold">{matchResult.player2.score}</span>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={scores[1]}
                      onChange={(e) => {
                        // Only allow positive numbers or empty string
                        if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                          const newScore: [number, number] = [...scores] as [number, number];
                          newScore[1] = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setScores(newScore);
                        }
                      }}
                      className="w-24 h-12 text-2xl text-center border border-gray-200 rounded-md 
                        bg-white text-gray-800 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        hover:border-blue-400
                        transition-all duration-150 ease-in-out"
                      disabled={isSubmitting}
                    />
                  )}
                </div>
                {matchResult?.ratingChanges && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {matchResult.ratingChanges.player2.newCategory}
                    </span>
                    <span className={`font-medium ${matchResult.ratingChanges.player2.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {matchResult.ratingChanges.player2.ratingChange >= 0 ? '+' : ''}
                      {formatRating(matchResult.ratingChanges.player2.ratingChange)}
                      ({formatRating(matchResult.ratingChanges.player2.newRating)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          {matchResult ? (
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">PR</div>
                <div className="text-xl font-bold text-blue-600">{matchResult.pr}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">PDI</div>
                <div className="text-xl font-bold text-blue-600">{matchResult.pdi.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">DS</div>
                <div className="text-xl font-bold text-blue-600">{matchResult.ds}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">PR</div>
                <div className="text-xl font-bold text-blue-600">{calculatePR(scores[0], scores[1])}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">PDI</div>
                <div className="text-xl font-bold text-blue-600">{calculatePDI(scores[0], scores[1]).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">DS</div>
                <div className="text-xl font-bold text-blue-600">{calculateDS(scores[0], scores[1])}</div>
              </div>
            </div>
          )}

          {/* Detailed Match View */}
          {gameData && (
            <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
              <ScoreProgressionChart gameData={gameData} />
              <MoveList moves={gameData.move_history} players={gameData.players} />
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {matchResult ? (
            <>
              <button
                onClick={handleReturn}
                className="w-full px-4 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return to Event
              </button>
              <button
                onClick={handleReturn}
                className="w-full px-4 py-3 text-gray-600 text-lg font-semibold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await onSubmit(scores);
                } catch (error) {
                  console.error('Failed to submit match result:', error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg 
                hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit'
                )}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchResultPopup;
