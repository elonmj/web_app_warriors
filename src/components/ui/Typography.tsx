import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export const H1: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-onyx-900 dark:text-white ${className}`}>
    {children}
  </h1>
);

export const H2: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h2 className={`text-xl sm:text-2xl md:text-3xl font-semibold text-onyx-900 dark:text-white ${className}`}>
    {children}
  </h2>
);

export const H3: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg sm:text-xl md:text-2xl font-semibold text-onyx-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

export const H4: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h4 className={`text-base sm:text-lg md:text-xl font-semibold text-onyx-900 dark:text-white ${className}`}>
    {children}
  </h4>
);

export const Text: React.FC<TypographyProps & { variant?: 'base' | 'lg' | 'sm' | 'xs' }> = ({ 
  children, 
  className = '',
  variant = 'base'
}) => {
  const baseStyles = 'text-onyx-800 dark:text-onyx-200';
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg sm:text-base md:text-lg'
  };

  return (
    <p className={`${baseStyles} ${sizeStyles[variant]} ${className}`}>
      {children}
    </p>
  );
};

export const Label: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <span className={`text-sm font-medium text-onyx-700 dark:text-onyx-300 ${className}`}>
    {children}
  </span>
);

export const Caption: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <span className={`text-xs text-onyx-600 dark:text-onyx-400 ${className}`}>
    {children}
  </span>
);

export const Heading = {
  H1,
  H2,
  H3,
  H4,
};

export const Body = {
  Text,
  Label,
  Caption,
};