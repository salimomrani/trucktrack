/**
 * Messages Store
 * Manages dispatch messages and conversations
 */

import { create } from 'zustand';
import type { Message } from '@types/entities';
import { api } from '@services/api/client';

export interface MessagesState {
  // State
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;

  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (content: string, tripId?: string) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addMessage: (message: Message) => void;
  refreshMessages: () => Promise<void>;
  clearError: () => void;
}

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  // Initial state
  messages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // Fetch all messages
  fetchMessages: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ content: Message[] }>('/drivers/me/messages');
      const messages = response.content || [];

      // Count unread
      const unreadCount = messages.filter((m) => !m.isRead && m.direction === 'INCOMING').length;

      set({
        messages,
        unreadCount,
        isLoading: false,
        lastSyncTime: Date.now(),
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'Failed to fetch messages';
      set({
        isLoading: false,
        error: message,
      });
    }
  },

  // Send a message to dispatch
  sendMessage: async (content: string, tripId?: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const newMessage = await api.post<Message>('/drivers/me/messages', {
        content,
        tripId,
      });

      set((state) => ({
        messages: [newMessage, ...state.messages],
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to send message';
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  // Mark single message as read
  markAsRead: async (messageId: string): Promise<void> => {
    try {
      await api.put(`/messages/${messageId}/read`);

      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  },

  // Mark all messages as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/drivers/me/messages/read-all');

      set((state) => ({
        messages: state.messages.map((m) => ({ ...m, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  },

  // Add message from push notification
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [message, ...state.messages],
      unreadCount: message.direction === 'INCOMING' ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  // Refresh messages (pull to refresh)
  refreshMessages: async (): Promise<void> => {
    await get().fetchMessages();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
