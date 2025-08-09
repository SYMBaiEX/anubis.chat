'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef } from 'react';

export function useTypingIndicator(
  chatId: string | undefined,
  walletAddress: string | undefined
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Convex mutations and queries
  const setTyping = useMutation(api.typing.setTyping);
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    chatId && walletAddress
      ? {
          chatId: chatId as Id<'chats'>,
          excludeWallet: walletAddress,
        }
      : 'skip'
  );

  // Start typing
  const startTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) return;

    try {
      await setTyping({
        chatId: chatId as Id<'chats'>,
        walletAddress,
        isTyping: true,
      });

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  }, [chatId, walletAddress, setTyping]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) return;

    try {
      await setTyping({
        chatId: chatId as Id<'chats'>,
        walletAddress,
        isTyping: false,
      });
    } catch (error) {
      console.error('Failed to clear typing status:', error);
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [chatId, walletAddress, setTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when component unmounts
      stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers: typingUsers || [],
    startTyping,
    stopTyping,
    isAnyoneTyping: (typingUsers?.length || 0) > 0,
  };
}
