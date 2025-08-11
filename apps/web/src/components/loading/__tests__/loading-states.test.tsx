import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  LoadingSkeleton,
  LoadingSpinner,
  QueryStateIndicator,
} from '../loading-states';

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('custom-class');
  });
});

describe('LoadingSkeleton', () => {
  it('should render skeleton with default props', () => {
    render(<LoadingSkeleton />);
    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-4', 'w-full');
  });

  it('should render skeleton with custom dimensions', () => {
    render(<LoadingSkeleton height="h-8" width="w-32" />);
    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveClass('h-8', 'w-32');
  });

  it('should render circular skeleton', () => {
    render(<LoadingSkeleton variant="circular" />);
    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should render multiple skeleton lines', () => {
    render(<LoadingSkeleton lines={3} />);
    const container = screen.getByTestId('loading-skeleton-container');
    const skeletons = container.querySelectorAll(
      '[data-testid="loading-skeleton"]'
    );
    expect(skeletons).toHaveLength(3);
  });
});

describe('QueryStateIndicator', () => {
  it('should show loading state', () => {
    render(
      <QueryStateIndicator
        hasError={false}
        isEmpty={false}
        isLoading={true}
        loadingText="Loading..."
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <QueryStateIndicator
        errorText="Error occurred"
        hasError={true}
        isEmpty={false}
        isLoading={false}
      />
    );
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(
      <QueryStateIndicator
        emptyText="No data"
        hasError={false}
        isEmpty={true}
        isLoading={false}
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should not render when not loading, no error, and not empty', () => {
    const { container } = render(
      <QueryStateIndicator hasError={false} isEmpty={false} isLoading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should prioritize error over loading state', () => {
    render(
      <QueryStateIndicator
        errorText="Error occurred"
        hasError={true}
        isEmpty={false}
        isLoading={true}
        loadingText="Loading..."
      />
    );
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
