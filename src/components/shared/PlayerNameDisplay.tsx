import React from 'react';
import { Label } from '@/components/ui/Typography';

interface PlayerNameDisplayProps {
  name: string;
  iscUsername?: string;
  isWinner?: boolean;
  className?: string;
}

export const PlayerNameDisplay: React.FC<PlayerNameDisplayProps> = ({
  name,
  iscUsername,
  isWinner,
  className = ''
}) => {
  return (
    <div className="flex flex-col">
      <Label className={`text-lg ${isWinner ? 'font-bold text-blue-600' : ''} ${className}`}>
        {name}
      </Label>
      {iscUsername && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          (ISC: {iscUsername})
        </div>
      )}
    </div>
  );
};

export default PlayerNameDisplay;