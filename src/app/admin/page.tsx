import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Event Management Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Event Management
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create, modify, or close events. Review event statistics and history.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Manage Events
              </button>
            </div>
          </div>

          {/* Dispute Resolution Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dispute Resolution
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Handle match result disputes and player complaints.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                View Disputes
              </button>
            </div>
          </div>

          {/* Player Management Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Player Management
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage player categories, review ratings, and handle appeals.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Manage Players
              </button>
            </div>
          </div>

          {/* System Configuration Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Configuration
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Configure rating calculations, categories, and system parameters.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Configure System
              </button>
            </div>
          </div>

          {/* Match History Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Match History
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              View and modify match history, handle result corrections.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                View History
              </button>
            </div>
          </div>

          {/* System Logs Card */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Logs
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Access system logs, audit trails, and modification history.
            </p>
            <div className="mt-4">
              <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}