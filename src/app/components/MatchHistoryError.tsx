"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Body } from "@/components/ui/Typography";

interface MatchHistoryErrorProps {
  message: string;
  onRetry: () => void;
}

export default function MatchHistoryError({ message, onRetry }: MatchHistoryErrorProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4
        dark:bg-red-900">
        <ExclamationCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <Body.Text className="text-gray-900 font-medium dark:text-white mb-2">
        {message}
      </Body.Text>
      <Body.Text className="text-gray-600 dark:text-gray-400 mb-4">
        Please try again later or contact support if the problem persists.
      </Body.Text>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
          rounded-md shadow-sm text-white bg-amethyste-600 hover:bg-amethyste-700 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amethyste-500 
          transition-colors duration-200
          dark:bg-amethyste-500 dark:hover:bg-amethyste-600
          dark:focus:ring-offset-gray-900"
      >
        Try Again
      </button>
    </div>
  );
}