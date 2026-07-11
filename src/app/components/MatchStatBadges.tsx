import { Body } from "@/components/ui/Typography";

interface MatchStatBadgesProps {
  pr: number;
  pdi: number;
  ds: number;
  className?: string;
  /** 'inline' (default) = plain text, used in match lists/cards.
   *  'card' = boxed emphasis cards, used in the result popup. */
  variant?: "inline" | "card";
  /** 'percent' (default) matches list/card display; 'decimal' matches the popup's raw ratio. */
  pdiFormat?: "percent" | "decimal";
}

/**
 * The PR / PDI / DS row shown wherever a match's result appears
 * (event pairings, match history, match page, result popup).
 */
export default function MatchStatBadges({
  pr,
  pdi,
  ds,
  className = "",
  variant = "inline",
  pdiFormat = "percent",
}: MatchStatBadgesProps) {
  const pdiDisplay = pdiFormat === "percent" ? `${(pdi * 100).toFixed(0)}%` : pdi.toFixed(2);

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-3 gap-6 ${className}`}>
        {[
          { label: "PR", value: pr },
          { label: "PDI", value: pdiDisplay },
          { label: "DS", value: ds },
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
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="text-center">
        <Body.Caption>PR</Body.Caption>
        <Body.Text className="font-medium text-onyx-900 dark:text-white">
          {pr}
        </Body.Text>
      </div>
      <div className="text-center">
        <Body.Caption>PDI</Body.Caption>
        <Body.Text className="font-medium text-onyx-900 dark:text-white">
          {pdiDisplay}
        </Body.Text>
      </div>
      <div className="text-center">
        <Body.Caption>DS</Body.Caption>
        <Body.Text className="font-medium text-onyx-900 dark:text-white">
          {ds}
        </Body.Text>
      </div>
    </div>
  );
}
