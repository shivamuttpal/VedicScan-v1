import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { C, spacing, radius, fontSize, shadow } from '../theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n) => String(n).padStart(2, '0');
const toDateString = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * Custom-themed calendar date picker (burgundy-gold-cream) to replace the
 * native OS spinner. Includes a year grid for fast jumps to birth years.
 */
const CalendarDatePicker = ({
  visible,
  value,           // 'YYYY-MM-DD' string or Date
  onClose,
  onConfirm,        // (dateString) => void
  minDate = new Date(1900, 0, 1),
  maxDate = new Date(),
  title = 'Select Date',
}) => {
  const initial = useMemo(() => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date(1990, 0, 1);
  }, [value, visible]);

  const [selected, setSelected] = useState(initial);
  const [monthCursor, setMonthCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [mode, setMode] = useState('days'); // 'days' | 'years'

  useEffect(() => {
    if (visible) {
      setSelected(initial);
      setMonthCursor(new Date(initial.getFullYear(), initial.getMonth(), 1));
      setMode('days');
    }
  }, [visible, initial]);

  const years = useMemo(() => {
    const list = [];
    for (let y = maxDate.getFullYear(); y >= minDate.getFullYear(); y--) list.push(y);
    return list;
  }, [minDate, maxDate]);

  const changeMonth = (delta) => {
    setMonthCursor((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      if (next < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return prev;
      if (next > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return prev;
      return next;
    });
  };

  const pickYear = (year) => {
    setMonthCursor((prev) => new Date(year, prev.getMonth(), 1));
    setMode('days');
  };

  const markedDates = {
    [toDateString(selected)]: {
      selected: true,
      selectedColor: C.maroon,
      selectedTextColor: C.white,
    },
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.arrowBtn}
              disabled={mode !== 'days'}
            >
              <Ionicons name="chevron-back" size={20} color={mode === 'days' ? C.maroon : C.textDim} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode(mode === 'days' ? 'years' : 'days')} style={styles.headerLabelBtn}>
              <Text style={styles.headerLabel}>
                {MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
              </Text>
              <Ionicons name={mode === 'days' ? 'caret-down' : 'caret-up'} size={14} color={C.saffron} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.arrowBtn}
              disabled={mode !== 'days'}
            >
              <Ionicons name="chevron-forward" size={20} color={mode === 'days' ? C.maroon : C.textDim} />
            </TouchableOpacity>
          </View>

          {mode === 'days' ? (
            <Calendar
              key={toDateString(monthCursor)}
              current={toDateString(monthCursor)}
              minDate={toDateString(minDate)}
              maxDate={toDateString(maxDate)}
              onDayPress={(day) => setSelected(new Date(day.year, day.month - 1, day.day))}
              onMonthChange={(m) => setMonthCursor(new Date(m.year, m.month - 1, 1))}
              markedDates={markedDates}
              hideExtraDays
              renderHeader={() => null}
              hideArrows
              theme={{
                calendarBackground: 'transparent',
                textSectionTitleColor: C.saffron,
                dayTextColor: C.text,
                textDisabledColor: C.textDim,
                todayTextColor: C.saffron,
                todayBackgroundColor: C.saffronPale,
                selectedDayBackgroundColor: C.maroon,
                selectedDayTextColor: C.white,
                textDayFontWeight: '500',
                textDayFontSize: 15,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
                textDayHeaderFontWeight: '700',
                'stylesheet.calendar.header': {
                  header: { height: 0, margin: 0, padding: 0 },
                },
              }}
              style={styles.calendar}
            />
          ) : (
            <FlatList
              data={years}
              keyExtractor={(y) => String(y)}
              numColumns={4}
              style={styles.yearList}
              renderItem={({ item: year }) => {
                const active = year === monthCursor.getFullYear();
                return (
                  <TouchableOpacity
                    style={[styles.yearCell, active && styles.yearCellActive]}
                    onPress={() => pickYear(year)}
                  >
                    <Text style={[styles.yearText, active && styles.yearTextActive]}>{year}</Text>
                  </TouchableOpacity>
                );
              }}
              initialScrollIndex={Math.max(0, years.indexOf(monthCursor.getFullYear()) - 6)}
              getItemLayout={(data, index) => ({ length: 52, offset: 52 * Math.floor(index / 4), index })}
            />
          )}

          <View style={styles.selectedRow}>
            <Ionicons name="calendar-outline" size={16} color={C.saffron} />
            <Text style={styles.selectedText}>
              {MONTH_NAMES[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.okBtn}
              onPress={() => onConfirm(toDateString(selected))}
            >
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
    width: Math.min(width - 32, 380),
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
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  arrowBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  headerLabelBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: C.card, borderRadius: radius.full,
    borderWidth: 1, borderColor: C.borderGold,
  },
  headerLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: C.text,
  },
  calendar: {
    borderRadius: radius.md,
    paddingBottom: spacing.sm,
  },
  yearList: {
    maxHeight: 260,
    marginBottom: spacing.xs,
  },
  yearCell: {
    flex: 1,
    margin: 4,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  yearCellActive: {
    backgroundColor: C.maroon,
    borderColor: C.maroon,
  },
  yearText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: C.textMid,
  },
  yearTextActive: {
    color: C.white,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.saffronPale,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginTop: spacing.sm,
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

export default CalendarDatePicker;
