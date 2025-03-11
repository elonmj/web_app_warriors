"use client";

import React from 'react';
import { Player } from '@/types/Player';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { getCategoryColor } from './utils/styles';
import { Heading, Body } from '@/components/ui/Typography';

interface PlayerStatsProps {
  player: Player;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  // Add null check for matches
  const matches = player.matches || [];
  
  // Sort matches by date
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Prepare data for rating history chart
  const ratingData = sortedMatches.map(match => ({
    date: match.date,
    rating: match.ratingChange.after,
    category: match.categoryAtTime
  }));

  // Calculate win rate
  const { wins = 0, losses = 0, draws = 0 } = player.statistics || {};
  const totalGames = wins + losses + draws;
  const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : '0.0';

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statistics Cards */}
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">Current Rating</Body.Caption>
          <div className="flex items-baseline mt-1">
            <Heading.H3 className="text-onyx-900 dark:text-white">{player.currentRating}</Heading.H3>
            <div className={`ml-2 ${getCategoryColor(player.category)}`}>
              <Body.Caption>{player.category}</Body.Caption>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">Win Rate</Body.Caption>
          <div className="mt-1">
            <Heading.H3 className="text-onyx-900 dark:text-white">{winRate}%</Heading.H3>
            <Body.Caption className="text-onyx-500 dark:text-onyx-400">
              {wins}W - {draws}D - {losses}L
            </Body.Caption>
          </div>
        </div>
        
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">Bingos</Body.Caption>
          <div className="mt-1">
            <Heading.H3 className="text-onyx-900 dark:text-white">
              {player.statistics?.iscData?.totalBingos || 0}
            </Heading.H3>
            <Body.Caption className="text-onyx-500 dark:text-onyx-400">
              {player.statistics?.iscData?.highestScoringMove?.word && (
                <>Best: {player.statistics.iscData.highestScoringMove.word} ({player.statistics.iscData.highestScoringMove.score})</>
              )}
            </Body.Caption>
          </div>
        </div>
        
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">Matches Played</Body.Caption>
          <div className="mt-1">
            <Heading.H3 className="text-onyx-900 dark:text-white">{totalGames}</Heading.H3>
            {matches.length > 0 && (
              <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                Last match: {formatDate(matches[0].date)}
              </Body.Caption>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Body.Caption className="text-onyx-500 dark:text-onyx-400">Best Rating</Body.Caption>
          <div className="mt-1">
            <Heading.H3 className="text-onyx-900 dark:text-white">
              {player.statistics?.bestRating || player.currentRating}
            </Heading.H3>
            {player.statistics?.bestRating && player.statistics.bestRating > player.currentRating && (
              <Body.Caption className="text-red-500">
                {player.currentRating - player.statistics.bestRating} from peak
              </Body.Caption>
            )}
          </div>
        </div>
      </div>
      
      {/* Rating History Chart */}
      {ratingData.length > 0 && (
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Heading.H4 className="mb-4 text-onyx-900 dark:text-white">Rating Progress</Heading.H4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ratingData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  stroke="#888" 
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']} 
                  stroke="#888"
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)} 
                  formatter={(value, name) => [value, name === 'rating' ? 'Rating' : name]} 
                />
                <Area 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#9c27b0" 
                  fill="#9c27b01a"
                  activeDot={{ r: 8 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm">
          <Heading.H4 className="mb-4 text-onyx-900 dark:text-white">Recent Matches</Heading.H4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-onyx-200 dark:divide-onyx-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-onyx-50 dark:bg-onyx-800 text-left text-xs font-medium text-onyx-500 dark:text-onyx-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-onyx-50 dark:bg-onyx-800 text-left text-xs font-medium text-onyx-500 dark:text-onyx-300 uppercase tracking-wider">Opponent</th>
                  <th className="px-6 py-3 bg-onyx-50 dark:bg-onyx-800 text-left text-xs font-medium text-onyx-500 dark:text-onyx-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 bg-onyx-50 dark:bg-onyx-800 text-left text-xs font-medium text-onyx-500 dark:text-onyx-300 uppercase tracking-wider">Rating Change</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-onyx-900 divide-y divide-onyx-200 dark:divide-onyx-700">
                {sortedMatches.slice(0, 5).map(match => (
                  <tr key={match.matchId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-onyx-900 dark:text-white">
                      {formatDate(match.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-onyx-900 dark:text-white">
                      {match.opponent.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-onyx-900 dark:text-white">
                      {match.result.score[0]} - {match.result.score[1]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={match.ratingChange.change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {match.ratingChange.change > 0 ? '+' : ''}{match.ratingChange.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;