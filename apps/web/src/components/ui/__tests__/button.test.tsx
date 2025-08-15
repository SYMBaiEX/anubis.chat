import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    let button = screen.getByText('Default');
    expect(button.className).toContain('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByText('Destructive');
    expect(button.className).toContain('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByText('Outline');
    expect(button.className).toContain('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByText('Ghost');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    let button = screen.getByText('Default');
    expect(button.className).toContain('h-9');

    rerender(<Button size="sm">Small</Button>);
    button = screen.getByText('Small');
    expect(button.className).toContain('h-8');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByText('Large');
    expect(button.className).toContain('h-10');

    rerender(<Button size="icon">I</Button>);
    button = screen.getByText('I');
    expect(button.className).toContain('size-9');
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button.className).toContain('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>
    );

    const link = screen.getByText('Link Button');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/link');
  });

  it('should have type="button" by default', () => {
    render(<Button>Button</Button>);
    const button = screen.getByText('Button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should accept different button types', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>);
    let button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');

    rerender(<Button type="reset">Reset</Button>);
    button = screen.getByText('Reset');
    expect(button).toHaveAttribute('type', 'reset');
  });
});
