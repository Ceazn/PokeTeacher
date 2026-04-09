/**
 * TeamSlot — one of the 6 archetype role slots on the team editor.
 *
 * Shows either:
 *   - An empty state with the slot's role label and description hint
 *   - A filled state with the placed Pokémon's name, types, and role fit status
 *
 * Usage:
 *   <TeamSlot
 *     slotIndex={0}
 *     roleSlot={slot}           // from getSlotTemplate()
 *     member={member}           // undefined if empty
 *     health={slotHealth}       // undefined if no synergy computed yet
 *     onPress={() => openPicker(0)}
 *   />
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { RoleSlot } from '../../engine/team/archetypes';
import type { TeamMember } from '../../types/team';
import type { SlotHealth } from '../../engine/team/health';
import { SynergyBadge } from './SynergyBadge';

interface TeamSlotProps {
  slotIndex: number;
  roleSlot:  RoleSlot;
  member?:   TeamMember;
  /** Display name resolved from species id — provided by caller. */
  memberName?: string;
  health?:   SlotHealth;
  onPress?:  () => void;
}

export function TeamSlot({
  slotIndex,
  roleSlot,
  member,
  memberName,
  health,
  onPress,
}: TeamSlotProps) {
  const isEmpty = !member;
  const roleFit = health?.roleFit ?? true;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor:   isEmpty ? '#0F1A2E' : '#16213E',
        borderRadius:      12,
        borderWidth:       2,
        borderColor:       isEmpty
          ? '#0F3460'
          : roleFit
            ? '#22C55E'
            : '#F59E0B',
        padding:           14,
        marginBottom:      8,
        opacity:           pressed ? 0.8 : 1,
        flexDirection:     'row',
        alignItems:        'center',
        gap:               12,
        minHeight:         72,
      })}
    >
      {/* Slot number */}
      <View
        style={{
          width:           32,
          height:          32,
          borderRadius:    16,
          backgroundColor: isEmpty ? '#1A2740' : '#E8243C',
          justifyContent:  'center',
          alignItems:      'center',
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>
          {slotIndex + 1}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {isEmpty ? (
          <>
            <Text style={{ color: '#7B9CB5', fontSize: 13, fontWeight: '600' }}>
              {roleSlot.label}
            </Text>
            <Text style={{ color: '#4A6A80', fontSize: 11, marginTop: 2 }} numberOfLines={2}>
              {roleSlot.description}
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#F0F0F0', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
              {memberName ?? `Species #${member.speciesId}`}
            </Text>
            {member.nickname ? (
              <Text style={{ color: '#A0B8C8', fontSize: 11, marginTop: 1 }}>
                "{member.nickname}"
              </Text>
            ) : null}
          </>
        )}
      </View>

      {/* Right side: required tag or synergy badge */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {isEmpty && roleSlot.required ? (
          <View
            style={{
              backgroundColor: '#7F1D1D',
              paddingHorizontal: 7,
              paddingVertical:   2,
              borderRadius:      4,
            }}
          >
            <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '700' }}>
              REQUIRED
            </Text>
          </View>
        ) : null}

        {!isEmpty && health ? (
          <SynergyBadge tier={health.tier} />
        ) : null}
      </View>
    </Pressable>
  );
}
