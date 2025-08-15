'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('form-actions');

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  type: z.enum(['support', 'feedback', 'business', 'bug']).default('support'),
});

/**
 * Server Action for contact form submissions
 */
export async function submitContactForm(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      type: formData.get('type') as string,
    };

    const validatedData = contactFormSchema.parse(rawData);
    
    log.info('Contact form submitted', {
      operation: 'contact_form',
      type: validatedData.type,
      email: validatedData.email,
    });

    // TODO: Send email or save to database
    // await sendContactEmail(validatedData);
    // await convex.mutation(api.contact.create, validatedData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Thank you for your message. We\'ll get back to you soon!',
    };
  } catch (error) {
    log.error('Failed to submit contact form', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'contact_form',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your input and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to send message. Please try again.',
    };
  }
}

// Newsletter subscription schema
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  interests: z.array(z.string()).default([]),
});

/**
 * Server Action for newsletter subscription
 */
export async function subscribeToNewsletter(formData: FormData) {
  try {
    const interests = formData.getAll('interests') as string[];
    const rawData = {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      interests,
    };

    const validatedData = newsletterSchema.parse(rawData);
    
    log.info('Newsletter subscription', {
      operation: 'newsletter_subscribe',
      email: validatedData.email,
      interests: validatedData.interests,
    });

    // TODO: Add to mailing list
    // await addToMailingList(validatedData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
    };
  } catch (error) {
    log.error('Failed to subscribe to newsletter', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'newsletter_subscribe',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your email and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to subscribe. Please try again.',
    };
  }
}

// Feedback form schema
const feedbackSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  category: z.enum(['ui', 'performance', 'feature', 'bug', 'other']),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  email: z.string().email('Invalid email address').optional(),
  canContact: z.boolean().default(false),
});

/**
 * Server Action for feedback submissions
 */
export async function submitFeedback(formData: FormData) {
  try {
    const rawData = {
      rating: formData.get('rating'),
      category: formData.get('category') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      email: formData.get('email') as string,
      canContact: formData.get('canContact') === 'on',
    };

    const validatedData = feedbackSchema.parse(rawData);
    
    log.info('Feedback submitted', {
      operation: 'feedback_submit',
      category: validatedData.category,
      rating: validatedData.rating,
      canContact: validatedData.canContact,
    });

    // TODO: Save feedback to database
    // await convex.mutation(api.feedback.create, validatedData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    revalidatePath('/feedback');
    
    return {
      success: true,
      message: 'Thank you for your feedback!',
    };
  } catch (error) {
    log.error('Failed to submit feedback', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'feedback_submit',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your input and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to submit feedback. Please try again.',
    };
  }
}

// Agent creation schema
const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  instructions: z.string().min(1, 'Instructions are required').max(2000),
  model: z.enum(['claude-3-5-sonnet', 'gpt-4o', 'gemini-2.0-flash', 'deepseek-v3']),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().min(100).max(4000).default(1000),
  tools: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

/**
 * Server Action for creating custom agents
 */
export async function createAgent(formData: FormData) {
  try {
    const tools = formData.getAll('tools') as string[];
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      instructions: formData.get('instructions') as string,
      model: formData.get('model') as string,
      temperature: formData.get('temperature'),
      maxTokens: formData.get('maxTokens'),
      tools,
      isPublic: formData.get('isPublic') === 'on',
    };

    const validatedData = createAgentSchema.parse(rawData);
    
    log.info('Creating custom agent', {
      operation: 'create_agent',
      name: validatedData.name,
      model: validatedData.model,
      isPublic: validatedData.isPublic,
      toolCount: validatedData.tools.length,
    });

    // TODO: Save agent to database
    // await convex.mutation(api.agents.create, validatedData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    revalidatePath('/agents');
    revalidatePath('/agents/new');
    
    return {
      success: true,
      message: 'Agent created successfully!',
      agentId: 'agent_' + Date.now(), // Temporary ID
    };
  } catch (error) {
    log.error('Failed to create agent', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'create_agent',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your input and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to create agent. Please try again.',
    };
  }
}