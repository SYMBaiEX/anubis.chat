'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup';
import { FieldError } from './field-error';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

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
  ({
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
  }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label
            htmlFor={name}
            className={
              required
                ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
                : ''
            }
          >
            {label}
          </Label>
        )}

        <Input
          ref={ref}
          id={name}
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
          className={cn(
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        />

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
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
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({
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
  }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label
            htmlFor={name}
            className={
              required
                ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
                : ''
            }
          >
            {label}
          </Label>
        )}

        <Textarea
          ref={ref}
          id={name}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          defaultValue={defaultValue}
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
          className={cn(
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        />

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
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
          htmlFor={name}
          className={
            required
              ? 'after:ml-0.5 after:text-red-500 after:content-["*"]'
              : ''
          }
        >
          {label}
        </Label>
      )}

      <Select name={name} defaultValue={defaultValue} disabled={disabled} required={required}>
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
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
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
          id={name}
          name={name}
          required={required}
          disabled={disabled}
          defaultChecked={defaultChecked}
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
        />
        {label && (
          <Label
            htmlFor={name}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && 'after:ml-0.5 after:text-red-500 after:content-["*"]'
            )}
          >
            {label}
          </Label>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
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
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              disabled={option.disabled}
            />
            <Label htmlFor={`${name}-${option.value}`}>
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <FieldError message={error} show={hasError} />
      {children}
    </div>
  );
}