"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { EventType, type EventTypeType } from "@/types/Enums";
import type { Event } from "@/types/Event";
import AdminPasswordDialog from "./AdminPasswordDialog";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth";

interface CreateEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
  mode?: 'create' | 'edit';
}

export function CreateEventForm({ isOpen, onClose, event, mode = 'create' }: CreateEventFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    type: EventType.INITIAL_RANDOM_PAIRING as EventTypeType
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formSubmitData, setFormSubmitData] = useState<any>(null);

  useEffect(() => {
    if (mode === 'edit' && event) {
      setFormData({
        name: event.name,
        startDate: new Date(event.startDate).toISOString().split('T')[0],
        endDate: new Date(event.endDate).toISOString().split('T')[0],
        type: event.type
      });
    }
  }, [mode, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      type: formData.type,
    };
    setFormSubmitData(submitData);
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

      // If password is valid, proceed with event creation/update
      const url = mode === 'create' ? "/api/events" : `/api/events/${event?.id}`;
      const method = mode === 'create' ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formSubmitData,
          password, // Include password for additional server-side verification
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} event`);
      }

      setShowPasswordDialog(false);
      onClose();
      // Refresh the page to show the changes
      window.location.reload();
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} event:`, error);
      throw error;
    }
  };

  const eventTypes = [
    { value: EventType.INITIAL_RANDOM_PAIRING, label: "Initial Random Pairing" },
    { value: EventType.KNOCKOUT, label: "Knockout" },
    { value: EventType.ROUND_ROBIN, label: "Round Robin" }
  ];

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
                        {mode === 'create' ? 'Create New Event' : 'Edit Event'}
                      </Dialog.Title>
                      <div className="mt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Event Name
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
                            <label htmlFor="startDate" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Start Date
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              id="startDate"
                              required
                              value={formData.startDate}
                              onChange={(e) =>
                                setFormData({ ...formData, startDate: e.target.value })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              End Date
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              id="endDate"
                              required
                              value={formData.endDate}
                              onChange={(e) =>
                                setFormData({ ...formData, endDate: e.target.value })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="type" className="block text-sm font-medium text-onyx-700 dark:text-onyx-300">
                              Event Type
                            </label>
                            <select
                              id="type"
                              name="type"
                              required
                              value={formData.type}
                              onChange={(e) =>
                                setFormData({ ...formData, type: e.target.value as EventTypeType })
                              }
                              className="mt-1 block w-full rounded-md border-onyx-300 shadow-sm focus:border-amethyste-500 focus:ring-amethyste-500 sm:text-sm
                                dark:bg-onyx-800 dark:border-onyx-700 dark:text-white"
                            >
                              {eventTypes.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md bg-amethyste-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amethyste-600 sm:ml-3 sm:w-auto"
                            >
                              {mode === 'create' ? 'Create' : 'Save Changes'}
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
        title={mode === 'create' ? 'Confirm Event Creation' : 'Confirm Event Update'}
        description="Please enter your admin password to continue."
      />
    </>
  );
}
