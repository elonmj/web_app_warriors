import { useMemo, useState } from 'react';
import { MatchDisplay } from '@/types/MatchHistory';
import { MatchStatus } from '@/types/MatchStatus';
import { PlayerCategoryType } from '@/types/Enums';
import { Body } from "@/components/ui/Typography";
import Link from 'next/link';
import { ChevronRightIcon, MagnifyingGlassIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { remove as removeDiacritics } from 'diacritics';
import { getCategoryColor } from "./utils/styles";
import MatchStatBadges from "./MatchStatBadges";
import { calculateSpread } from "@/lib/scoring";

/** Nombre d'appariements à partir duquel se chercher à l'œil devient pénible. */
const SEARCH_THRESHOLD = 4;

interface PairingCardProps {
  match: MatchDisplay;
  isProjected?: boolean;
  isAdmin?: boolean;
}

const getStatusDisplay = (status: MatchStatus, isProjected?: boolean) => {
  if (isProjected) {
    return {
      label: 'Projeté',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
  }

  switch (status) {
    case 'pending':
      return {
        label: 'À jouer',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      };
    case 'completed':
      return {
        label: 'Joué',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      };
    case 'forfeit':
      return {
        label: 'Forfait',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300'
      };
  }
};

/**
 * Une ligne = un joueur. Empilées, elles se lisent comme une feuille de match,
 * là où deux colonnes côte à côte forcent les noms à se casser sur 375 px.
 */
const PlayerRow = ({
  name,
  username,
  category,
  rating,
  score,
  isWinner,
}: {
  name: string;
  username?: string;
  category?: PlayerCategoryType;
  rating?: number;
  score?: number;
  isWinner: boolean;
}) => (
  <div className="flex items-baseline gap-2 py-0.5">
    {/* Nom et pseudo sur une seule ligne : deux lignes par joueur faisaient
        déborder la carte hors de l'écran sur mobile. */}
    <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span
        className={`truncate text-[15px] leading-tight sm:text-base ${
          isWinner
            ? 'font-bold text-onyx-900 dark:text-white'
            : 'font-medium text-onyx-800 dark:text-onyx-200'
        }`}
      >
        {name}
      </span>
      {username && (
        <span className="truncate text-xs text-onyx-400 dark:text-onyx-500">@{username}</span>
      )}
    </div>

    {/* La cote suffit sur mobile — la catégorie est déjà portée par la couleur,
        et l'écrire en toutes lettres rognait le nom du joueur. */}
    <Body.Caption className={`flex-none tabular-nums ${getCategoryColor(category)}`}>
      {category && <span className="hidden sm:inline">{category} · </span>}
      {rating}
    </Body.Caption>

    {score !== undefined && (
      <span
        className={`w-12 flex-none text-right text-lg tabular-nums ${
          isWinner ? 'font-bold text-onyx-900 dark:text-white' : 'font-semibold text-onyx-500 dark:text-onyx-400'
        }`}
      >
        {score}
      </span>
    )}
  </div>
);

const PairingCard = ({ match, isProjected, isAdmin }: PairingCardProps) => {
  const isByeMatch = match.player2.id.toString() === 'BYE';
  const { label, className } = getStatusDisplay(match.status, isProjected);

  const scores = match.status === 'completed' && match.result ? match.result.score : undefined;
  const player1Name = match.player1Details?.name || `Joueur ${match.player1.id}`;
  const player2Name = match.player2Details?.name || `Joueur ${match.player2.id}`;

  return (
    <Link
      href={`/event/${match.eventId}/match/${match.id}`}
      className={`relative block rounded-lg border p-3 transition-all duration-200
      hover:border-amethyste-300 hover:shadow-md
      ${isByeMatch ? 'bg-onyx-50 dark:bg-onyx-900/50' : 'bg-white dark:bg-onyx-900'}
      ${isProjected ? 'border-purple-200 dark:border-purple-800/30' : 'border-onyx-200 dark:border-onyx-800'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
        <div className="flex items-center gap-1 text-onyx-400 dark:text-onyx-500">
          {isByeMatch && <Body.Caption>Bye</Body.Caption>}
          {isAdmin && match.status === 'pending' && !isProjected && !isByeMatch && (
            <Body.Caption className="text-amethyste-600 dark:text-amethyste-400">
              Saisir le résultat
            </Body.Caption>
          )}
          <ChevronRightIcon className="h-4 w-4" />
        </div>
      </div>

      <PlayerRow
        name={player1Name}
        username={match.player1Details?.platformUsername ?? match.player1Details?.iscUsername}
        category={match.player1.categoryBefore}
        rating={match.player1.ratingBefore}
        score={scores?.[0]}
        isWinner={!!scores && scores[0] > scores[1]}
      />

      <div className="my-0.5 flex items-center gap-2">
        <div className="h-px flex-1 bg-onyx-100 dark:bg-onyx-800" />
        <Body.Caption className="text-onyx-400">vs</Body.Caption>
        <div className="h-px flex-1 bg-onyx-100 dark:bg-onyx-800" />
      </div>

      {isByeMatch ? (
        <div className="py-1 text-[15px] font-medium text-onyx-400 dark:text-onyx-500">BYE</div>
      ) : (
        <PlayerRow
          name={player2Name}
          username={match.player2Details?.platformUsername ?? match.player2Details?.iscUsername}
          category={match.player2.categoryBefore}
          rating={match.player2.ratingBefore}
          score={scores?.[1]}
          isWinner={!!scores && scores[1] > scores[0]}
        />
      )}

      {match.result && !isProjected && (
        <div className="mt-2 border-t border-onyx-100 pt-2 dark:border-onyx-800">
          <MatchStatBadges
            pr={match.result.pr}
            spread={calculateSpread(match.result.score[0], match.result.score[1])}
          />
        </div>
      )}
    </Link>
  );
};

interface EventRoundPairingsProps {
  eventId: string;
  currentRound: number;
  matches: MatchDisplay[];
  isLoading?: boolean;
  isProjected?: boolean;
  isAdmin?: boolean;
}

const normalize = (value: string) => removeDiacritics(value).toLowerCase();

const EventRoundPairings = ({
  matches,
  isLoading = false,
  isProjected = false,
  isAdmin = false
}: EventRoundPairingsProps) => {
  const [query, setQuery] = useState('');

  const visibleMatches = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return matches;
    // Le pseudo Woogles compte autant que le nom : beaucoup de joueurs se
    // cherchent sous celui qu'ils utilisent en jeu.
    return matches.filter(match =>
      [
        match.player1Details?.name,
        match.player1Details?.platformUsername ?? match.player1Details?.iscUsername,
        match.player2Details?.name,
        match.player2Details?.platformUsername ?? match.player2Details?.iscUsername,
      ]
        .filter((value): value is string => !!value)
        .some(value => normalize(value).includes(needle))
    );
  }, [matches, query]);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-onyx-200 bg-onyx-50 dark:border-onyx-800 dark:bg-onyx-900" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
          dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          Aucun appariement pour cette ronde.
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.length >= SEARCH_THRESHOLD && (
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-onyx-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Trouve-toi : tape ton nom…"
            aria-label="Filtrer les appariements par nom de joueur"
            className="w-full rounded-lg border border-onyx-200 bg-white py-2 pl-9 pr-3 text-sm
              placeholder:text-onyx-400 focus:border-amethyste-400 focus:outline-none focus:ring-1
              focus:ring-amethyste-400 dark:border-onyx-800 dark:bg-onyx-900 dark:text-white"
          />
        </div>
      )}

      {visibleMatches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-onyx-300 py-8 text-center dark:border-onyx-700">
          <Body.Text className="text-onyx-600 dark:text-onyx-400">
            Aucun joueur ne correspond à « {query} ».
          </Body.Text>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-2 text-sm font-medium text-amethyste-600 hover:underline dark:text-amethyste-400"
          >
            Tout afficher
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleMatches.map(match => (
            <PairingCard
              key={match.id}
              match={match}
              isProjected={isProjected}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventRoundPairings;
