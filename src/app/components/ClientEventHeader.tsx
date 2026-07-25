"use client";

import { Event } from "@/types/Event";
import { EventStatus } from "@/types/Enums";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Heading, Body } from "@/components/ui/Typography";
import CompleteRoundButton from "./CompleteRoundButton";

interface ClientEventHeaderProps {
  event: Event;
  /** Les actions d'organisation restent invisibles pour les joueurs. */
  isAdmin?: boolean;
}

const getStatusDisplay = (status: string) => {
  switch (status) {
    case EventStatus.OPEN:
      return {
        text: "Ouvert",
        classes: "bg-green-100 text-green-800 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-200"
      };
    case EventStatus.IN_PROGRESS:
      return {
        text: "En cours",
        classes: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-200"
      };
    default:
      return {
        text: "Terminé",
        classes: "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-600/20 dark:bg-onyx-800 dark:text-onyx-200"
      };
  }
};

export default function ClientEventHeader({ event, isAdmin = false }: ClientEventHeaderProps) {
  const status = getStatusDisplay(event.status);
  const metadata = event.metadata;

  return (
    <div className="relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amethyste-500/10 to-amethyste-600/10
        dark:from-amethyste-900/20 dark:to-amethyste-800/20" />

      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Heading.H1>{event.name}</Heading.H1>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>
                {status.text}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                bg-amethyste-100 text-amethyste-800 ring-1 ring-amethyste-600/20
                dark:bg-amethyste-900/30 dark:text-amethyste-200"
              >
                {event.type}
              </span>
            </div>
          </div>

          {/* Action Buttons — organisation uniquement */}
          {isAdmin && (
            <div className="flex flex-none flex-wrap items-center justify-end gap-2">
              <CompleteRoundButton
                event={event}
                totalMatches={metadata?.totalMatches || 0}
                completedMatches={metadata?.roundHistory?.[metadata.currentRound]?.completedMatches || 0}
              />
              {metadata?.currentRound === 1 && metadata?.totalMatches === 0 ? (
                <button
                  onClick={() => {
                    fetch(`/api/events/${event.id}/rounds/generate`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        options: {
                          isFirstRound: true,
                          avoidRematches: true,
                          balanceCategories: true
                        }
                      })
                    });
                  }}
                  className="inline-flex items-center rounded-md bg-amethyste-500 px-3 py-2 text-sm
                    font-semibold text-white shadow-sm hover:bg-amethyste-600 focus:outline-none
                    focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2 dark:hover:bg-amethyste-600
                    transition-colors gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Configurer la ronde 1</span>
                </button>
              ) : (
                <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold
                  text-onyx-900 shadow-sm ring-1 ring-inset ring-onyx-300 hover:bg-onyx-50
                  dark:bg-onyx-800 dark:text-white dark:ring-onyx-700 dark:hover:bg-onyx-700
                  transition-colors gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Une seule ligne de méta : le reste appartient à l'onglet Stats. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {metadata && (
            <>
              <Body.Caption>{metadata.totalPlayers} joueurs</Body.Caption>
              <Body.Caption className="text-onyx-300 dark:text-onyx-700">·</Body.Caption>
            </>
          )}
          <Body.Caption>
            Du {format(new Date(event.startDate), "d MMM yyyy", { locale: fr })} au{" "}
            {format(new Date(event.endDate), "d MMM yyyy", { locale: fr })}
          </Body.Caption>
        </div>
      </div>
    </div>
  );
}
