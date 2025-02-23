import '@testing-library/jest-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';

// Mock HeroIcons since they're not needed in tests
jest.mock('@heroicons/react/24/outline', () => ({
  ExclamationCircleIcon: () => 'ExclamationCircleIcon',
  ArrowLeftIcon: () => 'ArrowLeftIcon',
  ArrowRightIcon: () => 'ArrowRightIcon',
  ArrowTrendingUpIcon: () => 'ArrowTrendingUpIcon',
  ArrowTrendingDownIcon: () => 'ArrowTrendingDownIcon',
  TrophyIcon: () => 'TrophyIcon'
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/'
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  }
}));

// Performance testing utilities
export const measureRenderTime = (component: ReactElement): number => {
  const start = performance.now();
  render(component);
  return performance.now() - start;
};

export const renderWithPerformance = (
  component: ReactElement,
  options?: RenderOptions
) => {
  const renderTime = measureRenderTime(component);
  const result = render(component, options);
  return {
    ...result,
    renderTime,
  };
};

// Custom render function with optional providers
export const customRender = (
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & {
    route?: string;
    initialState?: Record<string, unknown>;
  } = {}
) => {
  const { route = '/', initialState = {}, ...renderOptions } = options;
  
  // Mock window.location for the specified route
  Object.defineProperty(window, 'location', {
    value: new URL(`http://localhost${route}`),
    writable: true,
  });

  return render(ui, renderOptions);
};

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };