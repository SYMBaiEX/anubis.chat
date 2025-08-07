import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { LoadingSpinner, LoadingSkeleton, QueryStateIndicator } from '../loading-states'

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('custom-class')
  })
})

describe('LoadingSkeleton', () => {
  it('should render skeleton with default props', () => {
    render(<LoadingSkeleton />)
    const skeleton = screen.getByTestId('loading-skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('h-4', 'w-full')
  })

  it('should render skeleton with custom dimensions', () => {
    render(<LoadingSkeleton width="w-32" height="h-8" />)
    const skeleton = screen.getByTestId('loading-skeleton')
    expect(skeleton).toHaveClass('h-8', 'w-32')
  })

  it('should render circular skeleton', () => {
    render(<LoadingSkeleton variant="circular" />)
    const skeleton = screen.getByTestId('loading-skeleton')
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('should render multiple skeleton lines', () => {
    render(<LoadingSkeleton lines={3} />)
    const container = screen.getByTestId('loading-skeleton-container')
    const skeletons = container.querySelectorAll('[data-testid="loading-skeleton"]')
    expect(skeletons).toHaveLength(3)
  })
})

describe('QueryStateIndicator', () => {
  it('should show loading state', () => {
    render(
      <QueryStateIndicator 
        isLoading={true}
        hasError={false}
        isEmpty={false}
        loadingText="Loading..."
      />
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should show error state', () => {
    render(
      <QueryStateIndicator 
        isLoading={false}
        hasError={true}
        isEmpty={false}
        errorText="Error occurred"
      />
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(
      <QueryStateIndicator 
        isLoading={false}
        hasError={false}
        isEmpty={true}
        emptyText="No data"
      />
    )
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should not render when not loading, no error, and not empty', () => {
    const { container } = render(
      <QueryStateIndicator 
        isLoading={false}
        hasError={false}
        isEmpty={false}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should prioritize error over loading state', () => {
    render(
      <QueryStateIndicator 
        isLoading={true}
        hasError={true}
        isEmpty={false}
        loadingText="Loading..."
        errorText="Error occurred"
      />
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})