import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayerCategoryType } from '@/types/Enums';

interface MatchResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchResult: {
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
  eventId: string;
}

export const MatchResultPopup: React.FC<MatchResultPopupProps> = ({
  isOpen,
  onClose,
  matchResult,
  eventId,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleReturnToEvent = () => {
    router.push(`/event/${eventId}`);
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
      onClose();
    }
  };

  const winner = matchResult.player1.score > matchResult.player2.score
    ? matchResult.player1.name
    : matchResult.player2.score > matchResult.player1.score
    ? matchResult.player2.name
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
          {/* Score Display */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-4">
              {/* Player 1 Score */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-lg ${winner === matchResult.player1.name ? 'font-bold text-blue-600' : 'font-medium'}`}>
                    {matchResult.player1.name}
                  </span>
                  <span className="text-2xl font-bold">{matchResult.player1.score}</span>
                </div>
                {matchResult.ratingChanges && (
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
                <div className="flex justify-between items-center">
                  <span className={`text-lg ${winner === matchResult.player2.name ? 'font-bold text-blue-600' : 'font-medium'}`}>
                    {matchResult.player2.name}
                  </span>
                  <span className="text-2xl font-bold">{matchResult.player2.score}</span>
                </div>
                {matchResult.ratingChanges && (
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
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleReturnToEvent}
            className="w-full px-4 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Event
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-gray-600 text-lg font-semibold hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchResultPopup;