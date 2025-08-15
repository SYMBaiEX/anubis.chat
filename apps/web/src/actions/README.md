# Server Actions Implementation

This directory contains Next.js Server Actions for handling form submissions and other server-side operations.

## Overview

Server Actions provide a modern, type-safe way to handle form submissions in Next.js 15+ with React 19. They offer several advantages over traditional API routes:

- **Progressive Enhancement**: Forms work without JavaScript
- **Type Safety**: Full TypeScript support with Zod validation
- **Automatic Error Handling**: Built-in error boundaries and validation
- **Performance**: Reduced client-side JavaScript bundle
- **Security**: Server-side validation and processing

## Architecture

### Actions Structure

```
src/actions/
├── index.ts              # Re-exports all actions
├── user-actions.ts       # User profile and settings actions
├── form-actions.ts       # Contact, feedback, and agent creation actions
└── README.md            # This documentation
```

### Form Components

```
src/components/forms/
├── server-form.tsx       # Modern form wrapper using useActionState
├── form-field.tsx        # Field components for Server Actions
├── form-wrapper.tsx      # Legacy form wrapper (still supported)
├── validated-input.tsx   # Legacy validated input (still supported)
└── field-error.tsx       # Shared error display component
```

## Usage Examples

### Basic Server Action Form

```tsx
import { ServerForm, FormField } from '@/components/forms';
import { updateUserProfile } from '@/actions/user-actions';

export function ProfileForm() {
  return (
    <ServerForm
      action={updateUserProfile}
      submitText="Save Profile"
      submitingText="Saving..."
      onSuccess={(result) => console.log('Success!', result)}
    >
      <FormField
        name="displayName"
        label="Display Name"
        required
        placeholder="Your name"
      />
      
      <FormField
        name="email"
        type="email"
        label="Email"
        required
        placeholder="your@email.com"
      />
    </ServerForm>
  );
}
```

### Creating a New Server Action

```tsx
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export async function myAction(formData: FormData) {
  try {
    const data = schema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    });
    
    // Process the data
    // await database.create(data);
    
    revalidatePath('/path');
    
    return {
      success: true,
      message: 'Success!',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed',
      };
    }
    
    return {
      success: false,
      message: 'Something went wrong',
    };
  }
}
```

## Migration Guide

### From Legacy FormWrapper to ServerForm

**Before (Legacy)**:
```tsx
import { FormWrapper, ValidatedInput } from '@/components/forms';

function MyForm() {
  const handleSubmit = async (data) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle response...
  };

  return (
    <FormWrapper onSubmit={handleSubmit}>
      <ValidatedInput name="email" type="email" required />
    </FormWrapper>
  );
}
```

**After (Server Actions)**:
```tsx
import { ServerForm, FormField } from '@/components/forms';
import { submitForm } from '@/actions';

function MyForm() {
  return (
    <ServerForm action={submitForm}>
      <FormField name="email" type="email" required />
    </ServerForm>
  );
}
```

## Benefits

1. **Type Safety**: Full TypeScript support with Zod validation
2. **Performance**: Less client-side JavaScript
3. **Progressive Enhancement**: Works without JavaScript
4. **Security**: Server-side validation
5. **Developer Experience**: Simplified error handling
6. **Modern React**: Uses React 19's useActionState hook

## Available Actions

- `updateUserProfile`: Update user profile information
- `updateUserSettings`: Update user preferences and settings
- `deleteUserAccount`: Delete user account (with confirmation)
- `submitContactForm`: Handle contact form submissions
- `subscribeToNewsletter`: Newsletter subscription
- `submitFeedback`: User feedback submissions
- `createAgent`: Create custom AI agents

## Form Fields

- `FormField`: Basic input field with validation
- `TextareaField`: Multi-line text input
- `SelectField`: Dropdown selection
- `CheckboxField`: Single checkbox
- `RadioGroupField`: Radio button group

All fields support:
- Built-in validation display
- Accessibility features
- Error states
- Required field indicators
- Help text descriptions