'use client';

import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FieldError } from './field-error';

interface BaseFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  error?: string;
  children?: ReactNode;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number';
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

interface CheckboxFieldProps extends BaseFieldProps {
  defaultChecked?: boolean;
}

interface RadioGroupFieldProps extends BaseFieldProps {
  defaultValue?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

/**
 * FormField - Input field for Server Actions forms
 */
export const FormField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      name,
      label,
      type = 'text',
      required = false,
      disabled = false,
      placeholder,
      autoComplete,
      defaultValue,
      className,
      description,
      error,
      children,
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label
            className={
              required
                ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
                : ''
            }
            htmlFor={name}
          >
            {label}
          </Label>
        )}

        <Input
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
          autoComplete={autoComplete}
          className={cn(
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          defaultValue={defaultValue}
          disabled={disabled}
          id={name}
          name={name}
          placeholder={placeholder}
          ref={ref}
          required={required}
          type={type}
        />

        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}

        <FieldError message={error} show={hasError} />
        {children}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * TextareaField - Textarea field for Server Actions forms
 */
export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(
  (
    {
      name,
      label,
      required = false,
      disabled = false,
      placeholder,
      rows = 4,
      defaultValue,
      className,
      description,
      error,
      children,
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label
            className={
              required
                ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
                : ''
            }
            htmlFor={name}
          >
            {label}
          </Label>
        )}

        <Textarea
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
          className={cn(
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          defaultValue={defaultValue}
          disabled={disabled}
          id={name}
          name={name}
          placeholder={placeholder}
          ref={ref}
          required={required}
          rows={rows}
        />

        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}

        <FieldError message={error} show={hasError} />
        {children}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';

/**
 * SelectField - Select field for Server Actions forms
 */
export function SelectField({
  name,
  label,
  required = false,
  disabled = false,
  placeholder = 'Select an option...',
  defaultValue,
  options,
  className,
  description,
  error,
  children,
}: SelectFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          className={
            required
              ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
              : ''
          }
          htmlFor={name}
        >
          {label}
        </Label>
      )}

      <Select
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger
          className={cn(
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      <FieldError message={error} show={hasError} />
      {children}
    </div>
  );
}

/**
 * CheckboxField - Checkbox field for Server Actions forms
 */
export function CheckboxField({
  name,
  label,
  required = false,
  disabled = false,
  defaultChecked = false,
  className,
  description,
  error,
  children,
}: CheckboxFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
          defaultChecked={defaultChecked}
          disabled={disabled}
          id={name}
          name={name}
          required={required}
        />
        {label && (
          <Label
            className={cn(
              'font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && 'after:ml-0.5 after:text-red-500 after:content-["*"]'
            )}
            htmlFor={name}
          >
            {label}
          </Label>
        )}
      </div>

      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      <FieldError message={error} show={hasError} />
      {children}
    </div>
  );
}

/**
 * RadioGroupField - Radio group field for Server Actions forms
 */
export function RadioGroupField({
  name,
  label,
  required = false,
  disabled = false,
  defaultValue,
  options,
  className,
  description,
  error,
  children,
}: RadioGroupFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          className={
            required
              ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
              : ''
          }
        >
          {label}
        </Label>
      )}

      <RadioGroup
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        required={required}
      >
        {options.map((option) => (
          <div className="flex items-center space-x-2" key={option.value}>
            <RadioGroupItem
              disabled={option.disabled}
              id={`${name}-${option.value}`}
              value={option.value}
            />
            <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>

      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      <FieldError message={error} show={hasError} />
      {children}
    </div>
  );
}
