/**
 * BottomSheet — a simple modal bottom sheet with a drag handle and backdrop.
 *
 * Built on React Native Modal (no Reanimated dependency for now).
 * Supports any content via children.
 *
 * Usage:
 *   <BottomSheet visible={open} onClose={() => setOpen(false)} title="Pick a Pokémon">
 *     <PokemonPicker ... />
 *   </BottomSheet>
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';

interface BottomSheetProps {
  visible:   boolean;
  onClose:   () => void;
  title?:    string;
  /** Maximum height of the sheet as a fraction of screen height (default 0.75). */
  maxHeight?: number;
  children:  React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  maxHeight = 0.75,
  children,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { maxHeight: `${maxHeight * 100}%` }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: '#16213E',
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    paddingBottom:   Platform.OS === 'ios' ? 34 : 16,  // safe area
    elevation:       24,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -4 },
    shadowOpacity:   0.4,
    shadowRadius:    12,
  },
  handle: {
    width:           40,
    height:          4,
    backgroundColor: '#2A3F5F',
    borderRadius:    2,
    alignSelf:       'center',
    marginTop:       10,
    marginBottom:    8,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F3460',
  },
  title: {
    color:      '#F0F0F0',
    fontSize:   17,
    fontWeight: '700',
    flex:       1,
  },
  closeBtn: {
    color:    '#7B9CB5',
    fontSize: 18,
    padding:  4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
});
