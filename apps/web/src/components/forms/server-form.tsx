'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface FormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

interface ServerFormProps {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  submitText?: string;
  submitingText?: string;
  className?: string;
  onSuccess?: (result: FormState) => void;
  resetOnSuccess?: boolean;
}

/**
 * ServerForm component - Modern form wrapper using Server Actions
 * Uses React 19's useActionState hook for enhanced form handling
 */
export function ServerForm({
  action,
  children,
  submitText = 'Submit',
  submitingText = 'Submitting...',
  className,
  onSuccess,
  resetOnSuccess = false,
}: ServerFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    message: '',
    errors: {},
  });

  // Handle success/error notifications
  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      onSuccess?.(state);
      
      // Reset form if requested
      if (resetOnSuccess) {
        const form = document.querySelector('form[data-server-form]') as HTMLFormElement;
        form?.reset();
      }
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, onSuccess, resetOnSuccess]);

  return (
    <form action={formAction} className={cn('space-y-6', className)} data-server-form>
      {/* Form fields */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Display field errors */}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Please fix the following errors:
          </h3>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700 dark:text-red-300">
            {Object.entries(state.errors).map(([field, errors]) =>
              errors.map((error, index) => (
                <li key={`${field}-${index}`}>{error}</li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitingText}
          </>
        ) : (
          submitText
        )}
      </Button>
    </form>
  );
}

export default ServerForm;