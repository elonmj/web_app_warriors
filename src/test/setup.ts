import '@testing-library/jest-dom';
import type { Config } from 'jest';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveTextContent: (text: string) => R;
      toBeInTheDocument: () => R;
      toBeEnabled: () => R;
    }
  }
}

// Configure Jest
const config: Config = {
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testEnvironment: 'jsdom',
};

export default config;