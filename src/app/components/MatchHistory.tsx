"use client";

import { FC } from 'react';
import Link from 'next/link';
import { MatchStatusType } from '@/types/Enums';

interface MatchData {
  id: string;
  eventId: string;
  date: string;
  status: MatchStatusType;
  player1Id: string;
  player2Id: string;
  player1Details: {
    name: string;
    category: string;
  };
  player2Details: {
    name: string;
    category: string;
  };
  result?: {
    score: [number, number];
    pr: number;
    pdi: number;
    ds: number;
  };
}

interface Props {
  matches: MatchData[];
}

const MatchItem: FC<{ match: MatchData }> = ({ match }) => {
  const statusClasses = match.status === 'completed'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';

  const linkClasses = match.status === 'pending'
    ? 'text-blue-600 hover:text-blue-900'
    : 'text-gray-600 hover:text-gray-900';

  return (
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(match.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{match.player1Details.name}</div>
          <div className="text-xs text-gray-500">({match.player1Details.category})</div>
          <div className="text-xs text-gray-500 my-1">vs</div>
          <div className="font-medium text-gray-900">{match.player2Details.name}</div>
          <div className="text-xs text-gray-500">({match.player2Details.category})</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}`}>
          {match.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {match.result ? `${match.result.score[0]} - ${match.result.score[1]}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {match.result ? (
          <div className="text-sm text-gray-900 space-y-1">
            <div>PR: {match.result.pr}</div>
            <div>PDI: {match.result.pdi.toFixed(2)}</div>
            <div>DS: {match.result.ds}</div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <Link
          href={`/event/${match.eventId}/match/${match.id}`}
          className={linkClasses}
        >
          {match.status === 'pending' ? 'Submit Result' : 'View Details'}
        </Link>
      </td>
    </tr>
  );
};

const MatchHistory: FC<Props> = ({ matches }) => {
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Players</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {matches.map((match) => (
            <MatchItem key={match.id} match={match} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatchHistory;