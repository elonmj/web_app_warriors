export default function PlayerStatsSkeleton() {
  return (
    <div className="grid gap-6 animate-pulse sm:grid-cols-2 lg:grid-cols-4">
      {/* Rating Card Skeleton */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Matches Card Skeleton */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Win Rate Card Skeleton */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Performance Card Skeleton */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Additional Stats Skeleton */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="mt-2 h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match History Skeleton */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center space-x-4">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trends Skeleton */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}