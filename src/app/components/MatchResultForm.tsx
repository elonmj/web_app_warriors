import React, { useState, useMemo } from 'react';

interface MatchResultFormProps {
  onSubmit: (score: [number, number]) => void;
  player1Name: string;  // Add player names
  player2Name: string;
}

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

// Calculate Points Ranking (PR)
const calculatePR = (score1: number, score2: number) => {
  if (score1 > score2) return 3;
  if (score1 === score2) return 1;
  return 0;
};

export const MatchResultForm: React.FC<MatchResultFormProps> = ({ 
  onSubmit, 
  player1Name,
  player2Name 
}) => {
  // Initialize scores to [0, 0] instead of empty strings
  const [score, setScore] = useState<[number, number]>([0, 0]);

  const handleChange = (index: number, value: string) => {
    // Only allow positive numbers or empty string (which becomes 0)
    if (value === '' || /^\d+$/.test(value)) {
      const newScore = [...score] as [number, number];
      newScore[index] = value === '' ? 0 : parseInt(value, 10);
      setScore(newScore);
    }
  };

  // Calculate stats in real-time
  const stats = useMemo(() => ({
    ds: calculateDS(score[0], score[1]),
    pr: calculatePR(score[0], score[1])
  }), [score]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(score);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Player 1 score */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">{player1Name}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={score[0]}
            onChange={e => handleChange(0, e.target.value)}
            className="w-20 h-10 text-center border rounded"
            aria-label={`Score for ${player1Name}`}
          />
        </div>

        <div className="flex justify-center">
          <span className="text-gray-500">vs</span>
        </div>

        {/* Player 2 score */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">{player2Name}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={score[1]}
            onChange={e => handleChange(1, e.target.value)}
            className="w-20 h-10 text-center border rounded"
            aria-label={`Score for ${player2Name}`}
          />
        </div>
      </div>

      {/* Real-time stats display */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="text-gray-600">PR:</span>
          <span className="font-medium">{stats.pr}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="text-gray-600">DS:</span>
          <span className="font-medium">{stats.ds}</span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
};

export default MatchResultForm;