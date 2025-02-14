"use client";

import React, { useState } from 'react';
import { MatchResultPopup } from './MatchResultPopup';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Heading, Body } from '@/components/ui/Typography';

interface MatchResultFormProps {
  onSubmit: (score: [number, number]) => Promise<void>;
  player1Name: string;
  player2Name: string;
  eventId: string;
  error?: string;
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
  player2Name,
  eventId,
  error
}) => {
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate stats based on current scores
  const stats = {
    pdi: calculatePDI(score[0], score[1]),
    ds: calculateDS(score[0], score[1]),
    pr: calculatePR(score[0], score[1]),
  };

  const handleChange = (index: number, value: string) => {
    // Only allow positive numbers or empty string (which becomes 0)
    if (value === '' || /^\d+$/.test(value)) {
      const newScore = [...score] as [number, number];
      newScore[index] = value === '' ? 0 : parseInt(value, 10);
      setScore(newScore);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(score);
      setIsPopupOpen(true);
    } catch (err) {
      console.error('Failed to submit match result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <Body.Text className="text-red-700 dark:text-red-300">
              {error}
            </Body.Text>
          </div>
        )}

        <div className="bg-onyx-50 p-4 sm:p-6 rounded-lg border border-onyx-100 
          dark:bg-onyx-900/50 dark:border-onyx-800">
          <div className="space-y-6">
            {/* Player 1 score */}
            <div className="flex flex-col space-y-2">
              <Body.Label>
                {player1Name}
                <span className="ml-2 text-xs font-medium text-onyx-500 dark:text-onyx-400">
                  {score[0] > score[1] ? 'Leading' : ''}
                </span>
              </Body.Label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={score[0]}
                onChange={e => handleChange(0, e.target.value)}
                className="w-24 h-12 text-2xl text-center border border-onyx-200 rounded-md 
                  bg-white text-onyx-800 
                  focus:ring-2 focus:ring-amethyste-500 focus:border-amethyste-500 
                  hover:border-amethyste-400
                  transition-all duration-150 ease-in-out
                  dark:bg-onyx-900 dark:border-onyx-700 dark:text-white"
                aria-label={`Score for ${player1Name}`}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-onyx-200 dark:bg-onyx-700"></div>
              <Body.Text className="text-onyx-500 font-medium dark:text-onyx-400 text-lg">vs</Body.Text>
              <div className="h-px flex-1 bg-onyx-200 dark:bg-onyx-700"></div>
            </div>

            {/* Player 2 score */}
            <div className="flex flex-col space-y-2">
              <Body.Label>
                {player2Name}
                <span className="ml-2 text-xs font-medium text-onyx-500 dark:text-onyx-400">
                  {score[1] > score[0] ? 'Leading' : ''}
                </span>
              </Body.Label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={score[1]}
                onChange={e => handleChange(1, e.target.value)}
                className="w-24 h-12 text-2xl text-center border border-onyx-200 rounded-md 
                  bg-white text-onyx-800 
                  focus:ring-2 focus:ring-amethyste-500 focus:border-amethyste-500 
                  hover:border-amethyste-400
                  transition-all duration-150 ease-in-out
                  dark:bg-onyx-900 dark:border-onyx-700 dark:text-white"
                aria-label={`Score for ${player2Name}`}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Real-time stats display */}
        <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-onyx-100 
          dark:bg-onyx-900 dark:border-onyx-800">
          <div className="flex items-center justify-between p-3 bg-onyx-50 rounded-md dark:bg-onyx-800/50">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>PR</Body.Label>
            </div>
            <Heading.H4>{stats.pr}</Heading.H4>
          </div>
          <div className="flex items-center justify-between p-3 bg-onyx-50 rounded-md dark:bg-onyx-800/50">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>DS</Body.Label>
            </div>
            <Heading.H4>{stats.ds}</Heading.H4>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-amethyste-500 text-white rounded-md font-medium
            hover:bg-amethyste-600 active:bg-amethyste-700
            focus:outline-none focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2
            transition-all duration-150 ease-in-out shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:hover:bg-amethyste-600
            group"
          disabled={isSubmitting}
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
      </form>

      <MatchResultPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        matchResult={{
          player1: { name: player1Name, score: score[0] },
          player2: { name: player2Name, score: score[1] },
          pr: stats.pr,
          pdi: stats.pdi,
          ds: stats.ds
        }}
        eventId={eventId}
      />
    </>
  );
};

export default MatchResultForm;