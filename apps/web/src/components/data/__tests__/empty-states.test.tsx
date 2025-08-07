import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { EmptyState } from '../empty-states'

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState
        title="No Data"
        description="There are no items to display"
      />
    )
    
    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    const MockIcon = () => <div data-testid="mock-icon">Icon</div>
    
    render(
      <EmptyState
        title="No Data"
        description="There are no items to display"
        icon={MockIcon}
      />
    )
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('should render with action button', () => {
    const action = {
      label: 'Add Item',
      onClick: () => {},
    }
    
    render(
      <EmptyState
        title="No Data"
        description="There are no items to display"
        action={action}
      />
    )
    
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState
        title="No Data"
        description="Test"
        className="custom-class"
      />
    )
    
    const emptyState = container.firstChild
    expect(emptyState).toHaveClass('custom-class')
  })

  it('should render without action when not provided', () => {
    render(
      <EmptyState
        title="No Data"
        description="Test"
      />
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})