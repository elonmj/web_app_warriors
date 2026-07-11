import React from 'react';
import { Move } from '@/types/ISC';
import { StarIcon } from '@heroicons/react/24/solid';

interface MoveListProps {
  moves: Move[];
  players: [string, string]; // Array of two player names in order
}

const headerCell =
  'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-onyx-400 uppercase tracking-wider';

const MoveList: React.FC<MoveListProps> = ({ moves, players }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Move History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-onyx-700">
          <thead className="bg-gray-50 dark:bg-onyx-800">
            <tr>
              <th scope="col" className={headerCell}>
                Move
              </th>
              <th scope="col" className={headerCell}>
                Player
              </th>
              <th scope="col" className={headerCell}>
                Word
              </th>
              <th scope="col" className={headerCell}>
                Position
              </th>
              <th scope="col" className={headerCell}>
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-onyx-900 divide-y divide-gray-200 dark:divide-onyx-800">
            {moves.map((move, index) => (
              <tr
                key={index}
                className={`${
                  move.isBingo ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                } hover:bg-gray-50 dark:hover:bg-onyx-800 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {Math.floor(index / 2) + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span
                      className={`text-sm font-medium ${
                        move.player === players[0]
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {move.player}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{move.word}</span>
                    {move.isBingo && (
                      <StarIcon className="h-4 w-4 text-yellow-400" title="Bingo!" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-onyx-400">
                  {move.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {move.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveList;
