"use client";

import { ExclamationCircleIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Body } from "@/components/ui/Typography";
import Link from "next/link";

interface PlayerProfileErrorProps {
  message: string;
}

export default function PlayerProfileError({ message }: PlayerProfileErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="text-center">
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
            onClick={() => window.location.reload()}
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
        <div className="mt-4 text-center">
          <Link
            href="/rankings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}