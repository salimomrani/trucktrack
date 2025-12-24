/**
 * Messages Screen
 * Dispatch messages list
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabScreenProps } from '@navigation/types';
import { useMessagesStore } from '@store/messagesStore';
import { Card, EmptyState, Button } from '@components/common';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';
import type { Message } from '@types/entities';

type Props = MainTabScreenProps<'Messages'>;

export const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  const { messages, isLoading, unreadCount, fetchMessages, sendMessage, markAsRead } =
    useMessagesStore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    const success = await sendMessage(newMessage.trim());
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleMessagePress = (message: Message) => {
    if (!message.isRead && message.direction === 'INCOMING') {
      markAsRead(message.id);
    }
    navigation.getParent()?.navigate('MessageDetail', { messageId: message.id });
  };

  const renderMessageItem = useCallback(
    ({ item: message }: { item: Message }) => {
      const isIncoming = message.direction === 'INCOMING';
      const isUnread = !message.isRead && isIncoming;

      return (
        <TouchableOpacity
          style={[styles.messageRow, isIncoming ? styles.incomingRow : styles.outgoingRow]}
          onPress={() => handleMessagePress(message)}
        >
          <View
            style={[
              styles.messageBubble,
              isIncoming ? styles.incomingBubble : styles.outgoingBubble,
              isUnread && styles.unreadBubble,
            ]}
          >
            {isIncoming && (
              <Text style={styles.senderName}>Dispatch</Text>
            )}
            <Text
              style={[
                styles.messageContent,
                isIncoming ? styles.incomingText : styles.outgoingText,
              ]}
              numberOfLines={3}
            >
              {message.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isIncoming ? styles.incomingTime : styles.outgoingTime,
                ]}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {!isIncoming && (
                <Icon
                  name={message.isRead ? 'check-all' : 'check'}
                  size={14}
                  color={Colors.white}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </View>
          {isUnread && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      );
    },
    [markAsRead, navigation],
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="message-text-outline"
      title="No Messages"
      message="Start a conversation with dispatch"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
          </View>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        inverted
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchMessages} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <Icon name="loading" size={24} color={Colors.white} />
          ) : (
            <Icon name="send" size={24} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  incomingRow: {
    justifyContent: 'flex-start',
  },
  outgoingRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  incomingBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  outgoingBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  unreadBubble: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  senderName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  messageContent: {
    fontSize: Typography.fontSize.md,
    lineHeight: 20,
  },
  incomingText: {
    color: Colors.textPrimary,
  },
  outgoingText: {
    color: Colors.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
  },
  incomingTime: {
    color: Colors.textSecondary,
  },
  outgoingTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  checkIcon: {
    marginLeft: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginLeft: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
});

export default MessagesScreen;
