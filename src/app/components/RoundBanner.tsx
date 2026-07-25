"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClockIcon, ShareIcon } from "@heroicons/react/24/outline";
import { Body } from "@/components/ui/Typography";
import { LEAGUE_UTC_OFFSET_HOURS } from "@/lib/roundWindow";

interface RoundBannerProps {
  eventName: string;
  currentRound: number;
  totalRounds: number;
  /** Clôture de la ronde en ISO, ou null si la ronde n'a pas de fenêtre connue. */
  roundEndsAt: string | null;
  totalMatches: number;
  completedMatches: number;
}

const HOUR_MS = 3_600_000;

/** « 23/07 à 20:00 », toujours à l'heure du club — jamais celle du téléphone. */
function formatDeadline(iso: string): string {
  const local = new Date(new Date(iso).getTime() + LEAGUE_UTC_OFFSET_HOURS * HOUR_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(local.getUTCDate())}/${p(local.getUTCMonth() + 1)} à ${p(local.getUTCHours())}:${p(
    local.getUTCMinutes()
  )}`;
}

/** Temps restant en clair. Null tant que le composant n'est pas monté côté client. */
function formatCountdown(endsAt: Date, now: Date): { text: string; urgent: boolean; over: boolean } {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return { text: "Ronde clôturée", urgent: false, over: true };

  const hours = Math.floor(ms / HOUR_MS);
  if (hours >= 48) return { text: `Il reste ${Math.floor(hours / 24)} jours`, urgent: false, over: false };
  if (hours >= 24) return { text: "Il reste 1 jour", urgent: true, over: false };
  if (hours >= 1) return { text: `Il reste ${hours} h`, urgent: true, over: false };
  return { text: "Dernière heure", urgent: true, over: false };
}

export default function RoundBanner({
  eventName,
  currentRound,
  totalRounds,
  roundEndsAt,
  totalMatches,
  completedMatches,
}: RoundBannerProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Calculé après le montage : `new Date()` au rendu ferait diverger serveur et client.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const deadline = roundEndsAt ? formatDeadline(roundEndsAt) : null;
  const countdown = roundEndsAt && now ? formatCountdown(new Date(roundEndsAt), now) : null;

  const handleRoundChange = (round: number) => {
    router.push(`${pathname}?round=${round}`, { scroll: false });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${pathname}?round=${currentRound}`;
    const isOver = !!roundEndsAt && new Date(roundEndsAt).getTime() <= Date.now();
    const lines = [
      `${eventName} — Ronde ${currentRound}`,
      [
        `${totalMatches} appariement${totalMatches > 1 ? "s" : ""}.`,
        deadline && (isOver ? `Ronde clôturée le ${deadline}.` : `À jouer avant le ${deadline}.`),
      ]
        .filter(Boolean)
        .join(" "),
      url,
    ];
    const text = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: `${eventName} — Ronde ${currentRound}`, text });
        return;
      } catch (error) {
        // L'utilisateur a fermé la feuille de partage : ne pas enchaîner sur WhatsApp.
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const toneClasses = !countdown
    ? "bg-onyx-100 text-onyx-700 dark:bg-onyx-800 dark:text-onyx-300"
    : countdown.over
    ? "bg-onyx-100 text-onyx-600 dark:bg-onyx-800 dark:text-onyx-400"
    : countdown.urgent
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";

  return (
    <div className="border-b border-onyx-200 bg-onyx-50 px-4 py-3 dark:border-onyx-800 dark:bg-onyx-800/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-onyx-900 dark:text-white">
            Ronde {currentRound}
            <span className="ml-1 font-normal text-onyx-500 dark:text-onyx-400">/ {totalRounds}</span>
          </div>
          <Body.Caption>
            {totalMatches} match{totalMatches > 1 ? "s" : ""} · {completedMatches} joué
            {completedMatches > 1 ? "s" : ""}
          </Body.Caption>
        </div>

        <div className="flex flex-none items-center gap-2">
          <select
            value={currentRound}
            onChange={(e) => handleRoundChange(Number(e.target.value))}
            aria-label="Changer de ronde"
            className="rounded-md border border-onyx-300 bg-white px-2 py-1.5 text-sm
              dark:border-onyx-700 dark:bg-onyx-900 dark:text-white"
          >
            {Array.from({ length: totalRounds }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                R{i + 1}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-md bg-amethyste-500 px-2.5 py-1.5
              text-sm font-medium text-white shadow-sm transition-colors hover:bg-amethyste-600"
          >
            <ShareIcon className="h-4 w-4" />
            Partager
          </button>
        </div>
      </div>

      {deadline && (
        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${toneClasses}`}>
          <ClockIcon className="h-3.5 w-3.5" />
          {countdown?.over ? `Clôturée le ${deadline}` : `À jouer avant le ${deadline}`}
          {countdown && !countdown.over && ` · ${countdown.text}`}
        </div>
      )}
    </div>
  );
}
