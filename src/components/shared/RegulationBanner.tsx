/**
 * Dismissible banner shown when a new regulation is detected on launch.
 * Renders nothing when there is no pending update.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRegulationStore } from '../../store/regulationStore';

export function RegulationBanner() {
  const {
    pendingRegulationUpdate,
    staleTeamNotices,
    dismissBanner,
  } = useRegulationStore();

  if (!pendingRegulationUpdate) return null;

  const staleCount = staleTeamNotices.length;

  return (
    <View className="bg-brand-surface border-b border-brand-border px-4 py-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-sm">
            New format detected: {pendingRegulationUpdate.displayName}
          </Text>

          {staleCount > 0 ? (
            <Text className="text-zinc-400 text-xs mt-1">
              {staleCount} saved {staleCount === 1 ? 'team has' : 'teams have'} illegal members — tap to review.
            </Text>
          ) : (
            <Text className="text-zinc-400 text-xs mt-1">
              All your saved teams are valid under the new rules.
            </Text>
          )}
        </View>

        <Pressable
          onPress={dismissBanner}
          hitSlop={12}
          accessibilityLabel="Dismiss regulation update banner"
          accessibilityRole="button"
        >
          <Text className="text-zinc-400 text-base leading-none">✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
