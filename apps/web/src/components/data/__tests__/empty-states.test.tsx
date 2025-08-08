import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '../empty-states';

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState description="There are no items to display" title="No Data" />
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(
      screen.getByText('There are no items to display')
    ).toBeInTheDocument();
  });

  it('should render with icon', () => {
    const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

    render(
      <EmptyState
        description="There are no items to display"
        icon={MockIcon}
        title="No Data"
      />
    );

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('should render with action button', () => {
    const action = {
      label: 'Add Item',
      onClick: () => {},
    };

    render(
      <EmptyState
        action={action}
        description="There are no items to display"
        title="No Data"
      />
    );

    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState className="custom-class" description="Test" title="No Data" />
    );

    const emptyState = container.firstChild;
    expect(emptyState).toHaveClass('custom-class');
  });

  it('should render without action when not provided', () => {
    render(<EmptyState description="Test" title="No Data" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
