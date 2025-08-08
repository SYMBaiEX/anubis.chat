import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormWrapper } from '../form-wrapper';

describe('FormWrapper', () => {
  it('should render form with children', () => {
    render(
      <FormWrapper onSubmit={vi.fn()}>
        <input data-testid="test-input" />
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    expect(screen.getByTestId('test-input')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', () => {
    const onSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={onSubmit}>
        <input data-testid="test-input" defaultValue="test value" name="test" />
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    const form = screen.getByRole('form') || document.querySelector('form')!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      test: 'test value',
    });
  });

  it('should show submitting state', () => {
    const slowOnSubmit = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <FormWrapper onSubmit={slowOnSubmit}>
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Form should be in submitting state
    expect(submitButton).toBeDisabled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormWrapper className="custom-form-class" onSubmit={vi.fn()}>
        <input />
      </FormWrapper>
    );

    const form = container.querySelector('form');
    expect(form).toHaveClass('custom-form-class');
  });

  it('should reset form when resetOnSubmit is true', () => {
    const onSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={onSubmit} resetOnSubmit={true}>
        <input data-testid="test-input" name="test" />
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    const input = screen.getByTestId('test-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test value' } });
    const form = screen.getByRole('form') || document.querySelector('form')!;
    fireEvent.submit(form);

    // Input should be reset after submit
    expect(input.value).toBe('');
  });

  it('should handle form data correctly', () => {
    const onSubmit = vi.fn();

    render(
      <FormWrapper onSubmit={onSubmit}>
        <input defaultValue="text value" name="text" />
        <input defaultValue="42" name="number" type="number" />
        <input defaultChecked name="checkbox" type="checkbox" />
        <select defaultValue="option2" name="select">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    const form = screen.getByRole('form') || document.querySelector('form')!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      text: 'text value',
      number: '42',
      checkbox: 'on',
      select: 'option2',
    });
  });
});
