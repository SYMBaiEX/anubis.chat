'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useTypingIndicator(
  chatId: string | undefined,
  walletAddress: string | undefined
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const [pendingTyping, setPendingTyping] = useState(false);

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

  // Stop typing (declare before startTyping to avoid TDZ issues)
  const stopTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) {
      return;
    }

    try {
      await setTyping({
        chatId: chatId as Id<'chats'>,
        walletAddress,
        isTyping: false,
      });
    } catch (_error) {}

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [chatId, walletAddress, setTyping]);

  // Start typing (throttled)
  const startTyping = useCallback(async () => {
    if (!(chatId && walletAddress)) {
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - lastSentAtRef.current;
    const minIntervalMs = 750; // throttle network calls

    if (timeSinceLast < minIntervalMs) {
      // mark pending so we still extend the timeout below
      setPendingTyping(true);
    } else {
      try {
        await setTyping({
          chatId: chatId as Id<'chats'>,
          walletAddress,
          isTyping: true,
        });
        lastSentAtRef.current = now;
      } catch (_error) {}
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      void stopTyping();
      lastSentAtRef.current = 0;
      setPendingTyping(false);
    }, 3000);
  }, [chatId, walletAddress, setTyping, stopTyping]);

  // Flush pending typing when throttle window passes
  useEffect(() => {
    if (!pendingTyping) return;

    const id = setInterval(async () => {
      const now = Date.now();
      if (now - lastSentAtRef.current >= 750 && chatId && walletAddress) {
        try {
          await setTyping({
            chatId: chatId as Id<'chats'>,
            walletAddress,
            isTyping: true,
          });
          lastSentAtRef.current = now;
          setPendingTyping(false);
        } catch (_e) {}
      }
    }, 200);

    return () => clearInterval(id);
  }, [pendingTyping, chatId, walletAddress, setTyping]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when component unmounts
      void stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers: typingUsers || [],
    startTyping,
    stopTyping,
    isAnyoneTyping: (typingUsers?.length || 0) > 0,
  };
}
