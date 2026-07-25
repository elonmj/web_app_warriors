/**
 * Source unique du temps de la ligue (Règlement V3 §III).
 *
 * Tout le reste du code doit passer par ce module pour raisonner sur les dates
 * de ronde. Trois choses vivent ici et nulle part ailleurs :
 *   - le fuseau du club (Bénin, UTC+1) ;
 *   - l'heure de bascule d'une ronde (20 h locales) ;
 *   - la durée d'une ronde (3 jours).
 *
 * Le serveur (Vercel) tourne en UTC et Woogles renvoie de l'UTC : sans un seul
 * endroit qui fasse la conversion, les bornes de ronde dérivent d'une heure et
 * des parties se retrouvent du mauvais côté de la fenêtre.
 */

/** Bénin (Africa/Porto-Novo) : UTC+1 toute l'année, aucune heure d'été. */
export const LEAGUE_UTC_OFFSET_HOURS = 1;

/** Heure locale à laquelle une ronde se clôture et la suivante s'ouvre (§III.A). */
export const ROUND_CLOSING_HOUR_LOCAL = 20;

/** Durée d'une ronde en jours (§III.A). */
export const ROUND_DURATION_DAYS = 3;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const OFFSET_MS = LEAGUE_UTC_OFFSET_HOURS * HOUR_MS;

/**
 * Fenêtre de validité d'une ronde, en instants absolus.
 * Intervalle semi-ouvert [startsAt, endsAt[ — deux rondes consécutives ne se
 * recouvrent donc jamais, et une partie appartient à exactement une ronde.
 */
export interface RoundWindow {
  startsAt: Date;
  endsAt: Date;
}

/** Forme minimale d'une ronde stockée, telle que lue depuis Firebase. */
export interface StoredRoundTiming {
  startsAt?: string;
  endsAt?: string;
  /** Ancien champ, seul disponible sur les rondes créées avant la V3. */
  date?: string;
}

/**
 * Le prochain instant de clôture (20 h Bénin) situé à `t` ou après.
 * Si `t` est déjà exactement un instant de clôture, il est renvoyé tel quel.
 */
export function closingInstantOnOrAfter(t: Date): Date {
  // Décaler de l'offset fait coïncider « jour calendaire UTC » et
  // « jour calendaire au Bénin », ce qui rend le calcul du jour local trivial.
  const local = new Date(t.getTime() + OFFSET_MS);
  const localMidnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate()
  );
  const closing = localMidnight + ROUND_CLOSING_HOUR_LOCAL * HOUR_MS - OFFSET_MS;
  return new Date(closing < t.getTime() ? closing + DAY_MS : closing);
}

/**
 * Instant de clôture d'une ronde ouverte à `startsAt` : la première bascule de
 * 20 h située au moins `ROUND_DURATION_DAYS` jours plus tard.
 *
 * Une ronde ouverte pile à une bascule dure donc exactement 3 jours. Une ronde
 * ouverte manuellement à une heure quelconque dure un peu plus, le temps de se
 * recaler sur la grille — après quoi toutes les suivantes tombent à 20 h pile.
 */
export function roundEndFor(startsAt: Date): Date {
  return closingInstantOnOrAfter(new Date(startsAt.getTime() + ROUND_DURATION_DAYS * DAY_MS));
}

/** Fenêtre complète d'une ronde qui s'ouvrirait à `startsAt`. */
export function roundWindowFrom(startsAt: Date): RoundWindow {
  return { startsAt, endsAt: roundEndFor(startsAt) };
}

/**
 * Résout la fenêtre d'une ronde déjà stockée.
 *
 * Ne devine JAMAIS : une ronde dont on ne peut pas établir le début fait lever
 * une erreur. L'ancien code retombait sur la date de début de l'événement, ce
 * qui revenait à accepter n'importe quelle partie jouée depuis la création de
 * la ligue.
 *
 * @param label identifiant lisible pour le message d'erreur (ex. « event abc, ronde 4 »)
 */
export function resolveRoundWindow(round: StoredRoundTiming, label: string): RoundWindow {
  const startsAtRaw = round.startsAt ?? round.date;
  if (!startsAtRaw) {
    throw new Error(
      `Fenêtre de ronde introuvable (${label}) : ni startsAt ni date. ` +
        `Refus de deviner — voir Règlement V3 §III.B.`
    );
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error(`Début de ronde illisible (${label}) : "${startsAtRaw}".`);
  }

  // Rondes créées avant la V3 : pas de fin stockée, on l'en déduit.
  const endsAt = round.endsAt ? new Date(round.endsAt) : roundEndFor(startsAt);
  if (Number.isNaN(endsAt.getTime())) {
    throw new Error(`Fin de ronde illisible (${label}) : "${round.endsAt}".`);
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error(
      `Fenêtre de ronde incohérente (${label}) : fin ${endsAt.toISOString()} ` +
        `avant ou égale au début ${startsAt.toISOString()}.`
    );
  }

  return { startsAt, endsAt };
}

/**
 * Une partie Woogles compte-t-elle pour cette ronde ? (§III.B)
 *
 * Une partie sans date est REJETÉE. L'ancien code sautait le test de date quand
 * `created_at` manquait, ce qui laissait passer des parties de n'importe quel âge.
 */
export function isGameWithinWindow(
  createdAt: string | null | undefined,
  window: RoundWindow
): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return t >= window.startsAt.getTime() && t < window.endsAt.getTime();
}

/** La ronde est-elle arrivée à son terme ? */
export function isRoundOver(window: RoundWindow, now: Date = new Date()): boolean {
  return now.getTime() >= window.endsAt.getTime();
}

/** Heure locale du club, pour les logs et l'affichage (ex. « 28/07/2026 20:00 »). */
export function formatLeagueTime(t: Date): string {
  const local = new Date(t.getTime() + OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${p(local.getUTCDate())}/${p(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} ` +
    `${p(local.getUTCHours())}:${p(local.getUTCMinutes())}`
  );
}
