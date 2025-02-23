import React from 'react';

export function RoundLoadingSkeleton() {
  return (
    <div 
      className="animate-pulse space-y-4"
      data-testid="loading-skeleton"
      role="status"
      aria-label="Loading rankings"
    >
      {/* Round Navigation */}
      <div className="flex items-center justify-between px-4">
        <div className="w-28 h-8 bg-onyx-100 rounded dark:bg-onyx-800"></div>
        <div className="w-24 h-6 bg-onyx-100 rounded dark:bg-onyx-800"></div>
        <div className="w-28 h-8 bg-onyx-100 rounded dark:bg-onyx-800"></div>
      </div>

      {/* Table Header Skeleton */}
      <div className="overflow-hidden shadow ring-1 ring-onyx-200 dark:ring-onyx-800 rounded-lg">
        <div className="min-w-full">
          <div className="bg-onyx-50 dark:bg-onyx-900 px-4 py-5">
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
              <div className="h-4 bg-onyx-100 rounded col-span-2 dark:bg-onyx-800"></div>
              <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
              <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
              <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
            </div>
          </div>
          
          {/* Row Skeletons */}
          <div className="divide-y divide-onyx-200 bg-white dark:divide-onyx-800 dark:bg-onyx-900">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-4">
                <div className="grid grid-cols-6 gap-4">
                  <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
                  <div className="h-4 bg-onyx-100 rounded col-span-2 dark:bg-onyx-800"></div>
                  <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
                  <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
                  <div className="h-4 bg-onyx-100 rounded col-span-1 dark:bg-onyx-800"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Round Info Skeleton */}
      <div className="p-4 bg-onyx-50 rounded-lg dark:bg-onyx-800/50">
        <div className="flex items-center justify-between">
          <div className="w-48 h-4 bg-onyx-100 rounded dark:bg-onyx-800"></div>
          <div className="w-24 h-4 bg-onyx-100 rounded dark:bg-onyx-800"></div>
        </div>
      </div>
    </div>
  );
}