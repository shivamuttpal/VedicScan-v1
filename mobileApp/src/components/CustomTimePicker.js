import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../theme';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2);

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const parseValue = (value) => {
  if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
    const [hh, mm] = value.split(':').map(Number);
    const periodIndex = hh < 12 ? 0 : 1;
    let h12 = hh % 12;
    if (h12 === 0) h12 = 12;
    return { hourIndex: h12 - 1, minuteIndex: mm, periodIndex };
  }
  return { hourIndex: 11, minuteIndex: 0, periodIndex: 1 }; // default 12:00 PM
};

const WheelColumn = ({ data, selectedIndex, onChange, width }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Only run on mount — parent remounts this via `key` when the modal reopens.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    });
  }, []);

  const snapTo = (index) => {
    const clamped = Math.max(0, Math.min(data.length - 1, index));
    onChange(clamped);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ height: WHEEL_HEIGHT, width }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={{ paddingVertical: PADDING }}
      onMomentumScrollEnd={(e) => snapTo(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT))}
    >
      {data.map((label, i) => (
        <TouchableOpacity key={label} style={styles.wheelItem} onPress={() => snapTo(i)} activeOpacity={0.6}>
          <Text style={[styles.wheelItemText, i === selectedIndex && styles.wheelItemTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

/**
 * Custom-themed wheel time picker (burgundy-gold-cream) to replace the
 * native OS spinner. Stores/returns 24-hour 'HH:MM' strings.
 */
const CustomTimePicker = ({ visible, value, onClose, onConfirm, title = 'Select Time' }) => {
  const [hourIdx, setHourIdx] = useState(11);
  const [minuteIdx, setMinuteIdx] = useState(0);
  const [periodIdx, setPeriodIdx] = useState(1);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (visible) {
      const parsed = parseValue(value);
      setHourIdx(parsed.hourIndex);
      setMinuteIdx(parsed.minuteIndex);
      setPeriodIdx(parsed.periodIndex);
      setSessionKey((k) => k + 1);
    }
  }, [visible]);

  const handleConfirm = () => {
    const h12 = hourIdx + 1;
    const isPM = periodIdx === 1;
    const h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    const timeStr = `${String(h24).padStart(2, '0')}:${String(minuteIdx).padStart(2, '0')}`;
    onConfirm(timeStr);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.wheelRow}>
            <View pointerEvents="none" style={styles.highlightBand} />
            <WheelColumn key={`h-${sessionKey}`} data={HOURS} selectedIndex={hourIdx} onChange={setHourIdx} width={64} />
            <Text style={styles.colon}>:</Text>
            <WheelColumn key={`m-${sessionKey}`} data={MINUTES} selectedIndex={minuteIdx} onChange={setMinuteIdx} width={64} />
            <WheelColumn key={`p-${sessionKey}`} data={PERIODS} selectedIndex={periodIdx} onChange={setPeriodIdx} width={64} />
          </View>

          <View style={styles.selectedRow}>
            <Ionicons name="time-outline" size={16} color={C.saffron} />
            <Text style={styles.selectedText}>
              {HOURS[hourIdx]}:{MINUTES[minuteIdx]} {PERIODS[periodIdx]}
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={handleConfirm}>
              <LinearGradient colors={['#C9A45A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.okGradient}>
                <Text style={styles.okText}>Select</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: Math.min(width - 32, 360),
    backgroundColor: C.bgWarm,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: C.borderGold,
    ...shadow.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: C.maroon,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: WHEEL_HEIGHT,
  },
  highlightBand: {
    position: 'absolute',
    top: PADDING,
    left: spacing.sm,
    right: spacing.sm,
    height: ITEM_HEIGHT,
    backgroundColor: C.saffronPale,
    borderRadius: radius.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.borderGold,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 18,
    color: C.textDim,
    fontWeight: '500',
  },
  wheelItemTextActive: {
    color: C.maroon,
    fontWeight: '800',
    fontSize: 20,
  },
  colon: {
    fontSize: 20,
    fontWeight: '800',
    color: C.maroon,
    marginHorizontal: 2,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.saffronPale,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  selectedText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: C.saffron,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelText: {
    color: C.textMid,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  okBtn: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  okGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  okText: {
    color: C.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});

export default CustomTimePicker;
