import React, { useState } from 'react';
import { Match } from '@/types/Match';
import PlayerNameDisplay from '@/components/shared/PlayerNameDisplay';

interface ModifyMatchResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: [number, number]) => Promise<void>;
  match: Match;
}

export const ModifyMatchResultPopup: React.FC<ModifyMatchResultPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  match,
}) => {
  const [scores, setScores] = useState<[number, number]>(
    match.result ? [match.result.score[0], match.result.score[1]] : [0, 0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

    // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);


  const calculatePR = (score1: number, score2: number) => {
    if (score1 > score2) return 3;
    if (score1 === score2) return 1;
    return 0;
  };

  const calculatePDI = (score1: number, score2: number) => {
    const totalPoints = score1 + score2;
    if (totalPoints === 0) return 0;
    return Math.abs(score1 - score2) / totalPoints;
  };

  const calculateDS = (score1: number, score2: number) => {
    const pdi = calculatePDI(score1, score2);
    const threshold = 0.8;
    return pdi >= threshold ? 100 : Math.floor(pdi * 100);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Modify Match Result
        </h2>

        <div className="space-y-6">
          {/* Score Display */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-4">
              {/* Player 1 Score */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start">
                  <PlayerNameDisplay
                    name={match.player1.name || ''}
                    isWinner={false}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={scores[0]}
                    onChange={(e) => {
                      // Only allow positive numbers or empty string
                      if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                        const newScore = [...scores] as [number, number];
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
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Player 2 Score */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-start">
                  <PlayerNameDisplay
                    name={match.player2.name || ''}
                    isWinner={false}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={scores[1]}
                    onChange={(e) => {
                      // Only allow positive numbers or empty string
                      if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                        const newScore = [...scores] as [number, number];
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
                </div>
              </div>
            </div>
          </div>

          {/* Match Statistics (Calculated) */}
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
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onSubmit(scores);
              } catch (error) {
                console.error('Failed to update match result:', error);
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
                  <span>Updating...</span>
                </>
              ) : (
                'Update Result'
              )}
            </span>
          </button>
          <button
                onClick={onClose}
                className="w-full px-4 py-3 text-gray-600 text-lg font-semibold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyMatchResultPopup;
