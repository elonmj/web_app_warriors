import React, { FC, ComponentType, NamedExoticComponent } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';

// Mock components
const ThrowError: FC = () => {
  throw new Error('Test error');
};

const ThrowErrorWithMessage: FC = () => {
  throw new Error('Custom error message');
};

interface ConditionalErrorProps {
  shouldThrow: boolean;
  message?: string;
}

const ConditionalError: FC<ConditionalErrorProps> = ({ shouldThrow, message = 'No error' }) => {
  if (shouldThrow) {
    throw new Error('Conditional error');
  }
  return <div>{message}</div>;
};

// Configure test environment
beforeAll(() => {
  // Mock console.error to avoid noisy output
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const testMessage = 'Test content';
    const { container } = render(
      <ErrorBoundary>
        <div>{testMessage}</div>
      </ErrorBoundary>
    );
    
    expect(container).toHaveTextContent(testMessage);
  });

  it('displays error message when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /error displaying rankings/i })).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('displays custom error message', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorWithMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('shows try again button that is clickable', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    expect(tryAgainButton).toBeEnabled();
  });

  it('resets error state when try again is clicked', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /error displaying rankings/i })).toBeInTheDocument();

    // Click try again and rerender with no error
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    rerender(
      <ErrorBoundary>
        <ConditionalError shouldThrow={false} message="Success" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /error displaying rankings/i })).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customMessage = 'Custom error view';
    const CustomFallback: FC = () => <div role="alert">{customMessage}</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(customMessage);
  });

  it('maintains error boundary isolation', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
        <div>Other content</div>
      </div>
    );

    expect(screen.getByText('Other content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /error displaying rankings/i })).toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  interface TestComponentProps {
    message: string;
  }

  // Create a named component using memo to ensure displayName works
  const TestComponent = React.memo<TestComponentProps>(({ message }) => <div>{message}</div>);
  TestComponent.displayName = 'TestComponent';
  
  const WrappedComponent = withErrorBoundary<TestComponentProps>(TestComponent);

  it('wraps component with error boundary while maintaining props', () => {
    const testMessage = 'Test message';
    render(<WrappedComponent message={testMessage} />);
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const ErrorComponent = withErrorBoundary(ThrowError);
    render(<ErrorComponent />);
    
    expect(screen.getByRole('heading', { name: /error displaying rankings/i })).toBeInTheDocument();
  });

  it('accepts custom fallback for wrapped component', () => {
    const customMessage = 'Custom HOC fallback';
    const CustomFallback: FC = () => <div role="alert">{customMessage}</div>;
    const ErrorComponent = withErrorBoundary(ThrowError, <CustomFallback />);
    
    render(<ErrorComponent />);
    expect(screen.getByRole('alert')).toHaveTextContent(customMessage);
  });

  it('preserves component display name', () => {
    // Create a memoized component that will have a displayName
    const NamedComponent = React.memo<TestComponentProps>(({ message }) => <div>{message}</div>);
    NamedComponent.displayName = 'NamedComponent';
    
    const WrappedWithName = withErrorBoundary(NamedComponent);
    expect(WrappedWithName.displayName).toBe('WithErrorBoundary(NamedComponent)');
  });
});