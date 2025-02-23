"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title: string;
  description: string;
  warningMessage?: string;
}

export default function AdminPasswordDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningMessage
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete action");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-onyx-900">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md text-onyx-400 hover:text-onyx-500 focus:outline-none dark:hover:text-onyx-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  {warningMessage && (
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                    </div>
                  )}
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-onyx-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-onyx-600 dark:text-onyx-300">
                        {description}
                      </p>
                      {warningMessage && (
                        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                          {warningMessage}
                        </p>
                      )}
                      {error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-onyx-900 shadow-sm ring-1 ring-inset 
                          ring-onyx-300 placeholder:text-onyx-400 focus:ring-2 focus:ring-inset focus:ring-amethyste-600 
                          dark:bg-onyx-800 dark:text-white dark:ring-onyx-700 dark:focus:ring-amethyste-500"
                        placeholder="Enter admin password"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading || !password}
                    className="inline-flex w-full justify-center rounded-md bg-amethyste-600 px-3 py-2 text-sm 
                      font-semibold text-white shadow-sm hover:bg-amethyste-500 focus-visible:outline 
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyste-600 
                      disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                  >
                    {isLoading ? "Processing..." : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm 
                      font-semibold text-onyx-900 shadow-sm ring-1 ring-inset ring-onyx-300 hover:bg-onyx-50 
                      dark:bg-onyx-800 dark:text-white dark:ring-onyx-700 dark:hover:bg-onyx-700
                      sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}