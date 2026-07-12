import { Body } from "@/components/ui/Typography";

interface MatchStatBadgesProps {
  pr: number;
  /** Spread signé, plafonné ±100 (Règlement V2 §III.B). Recalculer depuis le
   *  score au point d'appel pour les matchs antérieurs à la V2. */
  spread: number;
  className?: string;
  /** 'inline' (default) = plain text, used in match lists/cards.
   *  'card' = boxed emphasis cards, used in the result popup. */
  variant?: "inline" | "card";
}

/**
 * The PR / Spread row shown wherever a match's result appears
 * (event pairings, match history, match page, result popup).
 */
export default function MatchStatBadges({
  pr,
  spread,
  className = "",
  variant = "inline",
}: MatchStatBadgesProps) {
  const spreadDisplay = spread > 0 ? `+${spread}` : `${spread}`;

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-2 gap-6 ${className}`}>
        {[
          { label: "PR", value: pr },
          { label: "Spread", value: spreadDisplay },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 dark:bg-onyx-800 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 dark:text-onyx-400 mb-1">{stat.label}</div>
            <div className="text-xl font-bold text-blue-600">{stat.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="text-center">
        <Body.Caption>PR</Body.Caption>
        <Body.Text className="font-medium text-onyx-900 dark:text-white">
          {pr}
        </Body.Text>
      </div>
      <div className="text-center">
        <Body.Caption>Spread</Body.Caption>
        <Body.Text className="font-medium text-onyx-900 dark:text-white">
          {spreadDisplay}
        </Body.Text>
      </div>
    </div>
  );
}
