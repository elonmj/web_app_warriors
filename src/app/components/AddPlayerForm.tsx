"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PlayerCategory, type PlayerCategoryType } from "@/types/Enums";
import { CreatePlayerInput, PLAYER_CONSTANTS } from "@/types/Player";
import AdminPasswordDialog from "./AdminPasswordDialog";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth";

interface AddPlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlayerForm({ isOpen, onClose }: AddPlayerFormProps) {
  const [formData, setFormData] = useState<CreatePlayerInput>({
    name: "",
    iscUsername: "",
    initialRating: PLAYER_CONSTANTS.DEFAULT_RATING,
    initialCategory: PLAYER_CONSTANTS.DEFAULT_CATEGORY
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formSubmitData, setFormSubmitData] = useState<CreatePlayerInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormSubmitData(formData);
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      // First verify the password
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!verifyResponse.ok) {
        throw new Error(AUTH_ERROR_MESSAGES.INVALID_PASSWORD);
      }

      // If password is valid, proceed with player creation
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formSubmitData,
          password, // Include password for additional server-side verification
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create player');
      }

      const newPlayer = await response.json();
      setSuccess(`Player "${newPlayer.name}" created successfully!`);
      setShowPasswordDialog(false);
      
      // Reset form
      setFormData({
        name: "",
        iscUsername: "",
        initialRating: PLAYER_CONSTANTS.DEFAULT_RATING,
        initialCategory: PLAYER_CONSTANTS.DEFAULT_CATEGORY
      });
    } catch (error) {
      console.error("Error creating player:", error);
      setError(error instanceof Error ? error.message : 'Failed to create player');
      setShowPasswordDialog(false);
    }
  };

  const categories = Object.entries(PlayerCategory).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-onyx-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-onyx-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md text-onyx-400 hover:text-onyx-500 focus:outline-none dark:text-onyx-600 dark:hover:text-onyx-400"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-onyx-900 dark:text-white">
                        Add New Player
                      </Dialog.Title>
                      <div className="mt-6">
                        {error && (
                          <div className="rounded-md bg-red-50 p-4 mb-4 dark:bg-red-900">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                          </div>
                        )}
                        {success && (
                          <div className="rounded-md bg-green-50 p-4 mb-4 dark:bg-green-900">
                            <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                          </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Player Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="iscUsername" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              ISC Username
                            </label>
                            <input
                              type="text"
                              name="iscUsername"
                              id="iscUsername"
                              value={formData.iscUsername}
                              onChange={(e) =>
                                setFormData({ ...formData, iscUsername: e.target.value })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="initialRating" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Initial Rating
                            </label>
                            <input
                              type="number"
                              name="initialRating"
                              id="initialRating"
                              value={formData.initialRating}
                              onChange={(e) =>
                                setFormData({ ...formData, initialRating: parseInt(e.target.value, 10) })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="initialCategory" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Initial Category
                            </label>
                            <select
                              id="initialCategory"
                              name="initialCategory"
                              value={formData.initialCategory}
                              onChange={(e) =>
                                setFormData({ ...formData, initialCategory: e.target.value as PlayerCategoryType })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            >
                              {categories.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md bg-amethyste-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amethyste-600 sm:ml-3 sm:w-auto"
                            >
                              Add Player
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-onyx-900 shadow-sm ring-1 ring-inset ring-onyx-300 hover:bg-onyx-50 sm:mt-0 sm:w-auto
                                dark:bg-onyx-800 dark:text-white dark:ring-onyx-700 dark:hover:bg-onyx-700"
                              onClick={onClose}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <AdminPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Player Creation"
        description="Please enter your admin password to continue."
      />
    </>
  );
}