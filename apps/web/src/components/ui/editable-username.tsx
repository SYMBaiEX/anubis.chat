'use client';

import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';
import { Check, Edit2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableUsernameProps {
  currentUsername?: string | null;
  placeholder?: string;
  className?: string;
  onUpdate?: (newUsername: string) => void;
}

export function EditableUsername({
  currentUsername,
  placeholder = 'Set Username',
  className,
  onUpdate,
}: EditableUsernameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useMutation(api.users.updateProfile);

  // Update local state when prop changes
  useEffect(() => {
    setUsername(currentUsername || '');
  }, [currentUsername]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();

    // Validation
    if (!trimmedUsername) {
      toast.error('Username cannot be empty');
      return;
    }

    if (trimmedUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 30) {
      toast.error('Username must be less than 30 characters');
      return;
    }

    // Check if username actually changed
    if (trimmedUsername === currentUsername) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({ displayName: trimmedUsername });
      toast.success('Username updated successfully');
      onUpdate?.(trimmedUsername);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update username:', error);
      toast.error('Failed to update username');
      // Reset to original value on error
      setUsername(currentUsername || '');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUsername || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          className="h-8 max-w-[200px]"
          disabled={isUpdating}
          maxLength={30}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter username"
          ref={inputRef}
          type="text"
          value={username}
        />
        <div className="flex items-center gap-1">
          <Button
            className="h-7 w-7"
            disabled={isUpdating}
            onClick={handleSave}
            size="icon"
            variant="ghost"
          >
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button
            className="h-7 w-7"
            disabled={isUpdating}
            onClick={handleCancel}
            size="icon"
            variant="ghost"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={cn(
        'group inline-flex items-center gap-1.5 rounded px-2 py-1',
        'transition-colors hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        !currentUsername && 'text-muted-foreground italic',
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm">{currentUsername || placeholder}</span>
      <Edit2 className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
