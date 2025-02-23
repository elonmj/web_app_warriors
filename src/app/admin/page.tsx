"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPasswordDialog from "@/app/components/AdminPasswordDialog";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [targetPath, setTargetPath] = useState("");

  const handleClick = (path: string) => {
    setTargetPath(path);
    setShowDialog(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      // If password is valid, navigate to the target page
      setShowDialog(false);
      router.push(targetPath);
    } catch (error) {
      console.error('Password verification failed:', error);
      throw error;
    }
  };

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
              <button
                onClick={() => handleClick('/admin/events')}
                className="inline-block rounded bg-amethyste-600 px-4 py-2 text-sm font-medium text-white hover:bg-amethyste-700"
              >
                Manage Events
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
              <button
                onClick={() => handleClick('/admin/players')}
                className="inline-block rounded bg-amethyste-600 px-4 py-2 text-sm font-medium text-white hover:bg-amethyste-700"
              >
                Manage Players
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
              <button
                onClick={() => handleClick('/admin/matches')}
                className="inline-block rounded bg-amethyste-600 px-4 py-2 text-sm font-medium text-white hover:bg-amethyste-700"
              >
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
              <button
                onClick={() => handleClick('/admin/logs')}
                className="inline-block rounded bg-amethyste-600 px-4 py-2 text-sm font-medium text-white hover:bg-amethyste-700"
              >
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminPasswordDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handlePasswordConfirm}
        title="Admin Access Required"
        description="Please enter your admin password to continue."
      />
    </div>
  );
}
