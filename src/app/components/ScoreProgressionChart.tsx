import React, { useMemo } from 'react';
import { ISCGameData } from '@/types/ISC';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScoreProgressionChartProps {
  gameData: ISCGameData;
}

const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({ gameData }) => {
  const chartData = useMemo(() => {
    const scores = {
      [gameData.players[0]]: 0,
      [gameData.players[1]]: 0
    };

    return gameData.move_history.map((move, index) => {
      scores[move.player] += move.score;
      return {
        moveNumber: index + 1,
        [gameData.players[0]]: scores[gameData.players[0]],
        [gameData.players[1]]: scores[gameData.players[1]]
      };
    });
  }, [gameData]);

  return (
    <div className="w-full h-64">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Progression</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="moveNumber"
            label={{ value: 'Move', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={gameData.players[0]}
            stroke="#8884d8"
            name={gameData.players[0]}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey={gameData.players[1]}
            stroke="#82ca9d"
            name={gameData.players[1]}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreProgressionChart;