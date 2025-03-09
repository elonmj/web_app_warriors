import React from 'react';
import { Move } from '@/types/ISC';
import { StarIcon } from '@heroicons/react/24/solid';

interface MoveListProps {
  moves: Move[];
  players: [string, string]; // Array of two player names in order
}

const MoveList: React.FC<MoveListProps> = ({ moves, players }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Move History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Move
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Word
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {moves.map((move, index) => (
              <tr 
                key={index}
                className={`${move.isBingo ? 'bg-yellow-50' : ''} hover:bg-gray-50 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Math.floor(index / 2) + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      move.player === players[0] ? 'text-indigo-600' : 'text-emerald-600'
                    }`}>
                      {move.player}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-900">{move.word}</span>
                    {move.isBingo && (
                      <StarIcon className="h-4 w-4 text-yellow-400" title="Bingo!" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {move.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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