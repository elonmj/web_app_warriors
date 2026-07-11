import React from 'react';
import { Label } from '@/components/ui/Typography';

interface PlayerNameDisplayProps {
  name: string;
  /** Platform username shown under the name (Woogles, or legacy ISC) */
  platformUsername?: string;
  /** @deprecated use platformUsername */
  iscUsername?: string;
  isWinner?: boolean;
  className?: string;
}

export const PlayerNameDisplay: React.FC<PlayerNameDisplayProps> = ({
  name,
  platformUsername,
  iscUsername,
  isWinner,
  className = ''
}) => {
  const username = platformUsername ?? iscUsername;
  return (
    <div className="flex flex-col">
      <Label className={`text-lg ${isWinner ? 'font-bold text-blue-600' : ''} ${className}`}>
        {name}
      </Label>
      {username && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          @{username}
        </div>
      )}
    </div>
  );
};

export default PlayerNameDisplay;
