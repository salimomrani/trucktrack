/**
 * Message Detail Screen
 * View full message content
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '@navigation/types';
import { useMessagesStore } from '@store/messagesStore';
import { Card } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { Message } from '@types/entities';

type Props = RootStackScreenProps<'MessageDetail'>;

export const MessageDetailScreen: React.FC<Props> = ({ route }) => {
  const { messageId } = route.params;
  const { messages, markAsRead } = useMessagesStore();
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const found = messages.find((m) => m.id === messageId);
    if (found) {
      setMessage(found);
      if (!found.isRead && found.direction === 'INCOMING') {
        markAsRead(messageId);
      }
    }
  }, [messageId, messages]);

  if (!message) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="message-off" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Message not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIncoming = message.direction === 'INCOMING';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Icon
                name={isIncoming ? 'headset' : 'account'}
                size={24}
                color={Colors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.senderName}>
                {isIncoming ? 'Dispatch' : 'You'}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(message.createdAt).toLocaleString()}
              </Text>
            </View>
            {isIncoming && message.isRead && (
              <View style={styles.readBadge}>
                <Icon name="check" size={14} color={Colors.success} />
                <Text style={styles.readText}>Read</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Message Content */}
        <Card style={styles.contentCard}>
          <Text style={styles.messageContent}>{message.content}</Text>
        </Card>

        {/* Trip Reference */}
        {message.tripId && (
          <Card style={styles.tripCard}>
            <View style={styles.tripRow}>
              <Icon name="truck" size={20} color={Colors.primary} />
              <Text style={styles.tripLabel}>Related Trip</Text>
              <Text style={styles.tripId}>{message.tripId}</Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  senderName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  readText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    marginLeft: 4,
  },
  contentCard: {
    marginBottom: Spacing.md,
  },
  messageContent: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  tripCard: {
    marginBottom: Spacing.md,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripLabel: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  tripId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium as any,
  },
});

export default MessageDetailScreen;
