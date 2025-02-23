"use client";

import { useState } from "react";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import AdminPasswordDialog from "./AdminPasswordDialog";
import { Event } from "@/types/Event";

interface CompleteRoundButtonProps {
  event: Event;
  totalMatches: number;
  completedMatches: number;
}

export default function CompleteRoundButton({ 
  event, 
  totalMatches,
  completedMatches 
}: CompleteRoundButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async (password: string) => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/round/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password,
          round: event.metadata?.currentRound || 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete round');
      }

      // Reload the page to show new round
      window.location.reload();
    } catch (error) {
      throw error;
    } finally {
      setIsCompleting(false);
    }
  };

  const hasIncompleteMatches = completedMatches < totalMatches;
  const warningMessage = hasIncompleteMatches 
    ? `${totalMatches - completedMatches} matches are still incomplete. Are you sure you want to proceed?`
    : undefined;

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-x-2 rounded-md bg-amethyste-600 px-3.5 py-2.5 text-sm 
          font-semibold text-white shadow-sm hover:bg-amethyste-500 focus-visible:outline 
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyste-600
          dark:bg-amethyste-700 dark:hover:bg-amethyste-600"
      >
        Complete Round
        <ArrowRightCircleIcon className="-mr-0.5 h-5 w-5" aria-hidden="true" />
      </button>

      <AdminPasswordDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleComplete}
        title="Complete Current Round"
        description="Enter admin password to complete the current round and generate next round pairings."
        warningMessage={warningMessage}
      />
    </>
  );
}