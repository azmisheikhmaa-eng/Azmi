import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { formatDualArabicDate } from "@/lib/date-utils";
import { getHijriDate, gregorianDateFromHijri, HIJRI_MONTHS, hijriFirstDayOffset, hijriMonthDays } from "@/lib/hijri-calendar";
import { CalendarKind } from "@/shared/personal-data";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const WEEKDAYS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
type CalendarMode = CalendarKind;

function parseDate(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return undefined;
  return date;
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function firstDayOffset(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 1) % 7;
}

function localDateFromUtc(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  defaultCalendar?: CalendarMode;
}

export function DateField({ label, value, onChange, required = false, defaultCalendar = "gregorian" }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = parseDate(value);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.74} onPress={() => setIsOpen(true)} style={styles.fieldButton}>
        <MaterialIcons color="#0E7490" name="calendar-month" size={21} />
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>{selected ? formatDualArabicDate(value, defaultCalendar) : "اختيار من التقويم"}</Text>
        <MaterialIcons color="#829AB1" name="chevron-left" size={21} />
      </TouchableOpacity>
      <CalendarModal allowClear={!required} defaultCalendar={defaultCalendar} onChange={onChange} onClose={() => setIsOpen(false)} value={value} visible={isOpen} />
    </View>
  );
}

function CalendarModal({ visible, value, onChange, onClose, allowClear, defaultCalendar }: { visible: boolean; value: string; onChange: (value: string) => void; onClose: () => void; allowClear: boolean; defaultCalendar: CalendarMode }) {
  const initialDate = useMemo(() => parseDate(value) ?? new Date(), [value]);
  const [cursor, setCursor] = useState(initialDate);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(defaultCalendar);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(initialDate.getFullYear()));
  const [yearPageStart, setYearPageStart] = useState(initialDate.getFullYear() - 9);

  useEffect(() => {
    if (visible) {
      setCursor(initialDate);
      setCalendarMode(defaultCalendar);
      setIsYearPickerOpen(false);
      setYearDraft(String(initialDate.getFullYear()));
      setYearPageStart(initialDate.getFullYear() - 9);
    }
  }, [initialDate, visible]);

  const selectedDate = parseDate(value);
  const selectedHijri = selectedDate ? getHijriDate(selectedDate) : undefined;
  const cursorHijri = getHijriDate(cursor);
  const year = calendarMode === "hijri" ? cursorHijri.year : cursor.getFullYear();
  const month = calendarMode === "hijri" ? cursorHijri.month : cursor.getMonth();
  const monthLabel = calendarMode === "hijri" ? HIJRI_MONTHS[month] : MONTHS[month];
  const daysInMonth = calendarMode === "hijri" ? hijriMonthDays(year, month) : new Date(year, month + 1, 0).getDate();
  const firstOffset = calendarMode === "hijri" ? hijriFirstDayOffset(year, month) : firstDayOffset(year, month);
  const cells = Array.from({ length: firstOffset + daysInMonth }, (_, index) => index < firstOffset ? undefined : index - firstOffset + 1);
  const yearChoices = Array.from({ length: 20 }, (_, index) => yearPageStart + index);
  const moveMonth = (change: number) => {
    if (calendarMode === "gregorian") {
      setCursor(new Date(year, month + change, 1, 12));
      return;
    }
    const nextMonth = month + change;
    const nextYear = year + Math.floor(nextMonth / 12);
    const normalizedMonth = (nextMonth + 12) % 12;
    const nextDate = gregorianDateFromHijri({ year: nextYear, month: normalizedMonth, day: 1 });
    if (nextDate) setCursor(localDateFromUtc(nextDate));
  };
  const selectYear = (selectedYear: number) => {
    if (!Number.isInteger(selectedYear) || selectedYear < 1 || selectedYear > 9999) return;
    const nextDate = calendarMode === "hijri" ? gregorianDateFromHijri({ year: selectedYear, month, day: 1 }) : new Date(selectedYear, month, 1, 12);
    if (!nextDate) return;
    setCursor(calendarMode === "hijri" ? localDateFromUtc(nextDate) : nextDate);
    setYearDraft(String(selectedYear));
    setIsYearPickerOpen(false);
  };
  const applyYearDraft = () => selectYear(Number(yearDraft));

  const selectDay = (day: number) => {
    const nextDate = calendarMode === "hijri" ? gregorianDateFromHijri({ year, month, day }) : new Date(year, month, day, 12);
    if (!nextDate) return;
    onChange(toDateValue(calendarMode === "hijri" ? localDateFromUtc(nextDate) : nextDate));
    onClose();
  };
  const changeCalendar = (mode: CalendarMode) => {
    setCalendarMode(mode);
    const displayYear = mode === "hijri" ? getHijriDate(cursor).year : cursor.getFullYear();
    setYearDraft(String(displayYear));
    setYearPageStart(displayYear - 9);
    setIsYearPickerOpen(false);
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onClose} style={styles.iconButton}><MaterialIcons color="#334E68" name="close" size={21} /></TouchableOpacity>
            <Text style={styles.sheetTitle}>اختيار التاريخ</Text>
            <View style={styles.iconButton} />
          </View>
          <View style={styles.calendarToggle}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => changeCalendar("hijri")} style={[styles.calendarModeButton, calendarMode === "hijri" && styles.calendarModeButtonActive]}><Text style={[styles.calendarModeText, calendarMode === "hijri" && styles.calendarModeTextActive]}>هجري</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => changeCalendar("gregorian")} style={[styles.calendarModeButton, calendarMode === "gregorian" && styles.calendarModeButtonActive]}><Text style={[styles.calendarModeText, calendarMode === "gregorian" && styles.calendarModeTextActive]}>ميلادي</Text></TouchableOpacity>
          </View>
          {isYearPickerOpen ? (
            <View style={styles.yearPicker}>
              <Text style={styles.yearPickerTitle}>اختر السنة</Text>
              <View style={styles.yearInputRow}>
                <TouchableOpacity accessibilityLabel="سنوات تالية" accessibilityRole="button" activeOpacity={0.7} onPress={() => setYearPageStart((current) => current + 20)} style={styles.yearPageButton}><MaterialIcons color="#0E7490" name="chevron-right" size={22} /></TouchableOpacity>
                <TextInput accessibilityLabel="إدخال السنة مباشرة" keyboardType="number-pad" maxLength={4} onChangeText={setYearDraft} onSubmitEditing={applyYearDraft} placeholder="السنة" placeholderTextColor="#9FB3C8" returnKeyType="done" style={styles.yearInput} textAlign="center" value={yearDraft} />
                <TouchableOpacity accessibilityLabel="انتقال إلى السنة المدخلة" accessibilityRole="button" activeOpacity={0.7} onPress={applyYearDraft} style={styles.yearApplyButton}><Text style={styles.yearApplyText}>انتقال</Text></TouchableOpacity>
                <TouchableOpacity accessibilityLabel="سنوات سابقة" accessibilityRole="button" activeOpacity={0.7} onPress={() => setYearPageStart((current) => Math.max(1, current - 20))} style={styles.yearPageButton}><MaterialIcons color="#0E7490" name="chevron-left" size={22} /></TouchableOpacity>
              </View>
              <Text style={styles.yearRange}>{yearPageStart} – {yearPageStart + 19}</Text>
              <View style={styles.yearGrid}>
                {yearChoices.map((choice) => <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} key={choice} onPress={() => selectYear(choice)} style={[styles.yearChoice, choice === year && styles.yearChoiceActive]}><Text style={[styles.yearChoiceText, choice === year && styles.yearChoiceTextActive]}>{choice}</Text></TouchableOpacity>)}
              </View>
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => setIsYearPickerOpen(false)} style={styles.backToCalendarButton}><MaterialIcons color="#0E7490" name="calendar-month" size={18} /><Text style={styles.backToCalendarText}>العودة إلى أيام الشهر</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.monthHeader}>
                <TouchableOpacity accessibilityLabel="الشهر التالي" accessibilityRole="button" activeOpacity={0.7} onPress={() => moveMonth(1)} style={styles.monthButton}><MaterialIcons color="#0E7490" name="chevron-right" size={24} /></TouchableOpacity>
                <TouchableOpacity accessibilityLabel="اختيار السنة" accessibilityRole="button" activeOpacity={0.72} onPress={() => { setYearDraft(String(year)); setYearPageStart(year - 9); setIsYearPickerOpen(true); }} style={styles.monthTitleButton}><Text style={styles.monthTitle}>{monthLabel} {year}</Text><MaterialIcons color="#0E7490" name="arrow-drop-down" size={21} /></TouchableOpacity>
                <TouchableOpacity accessibilityLabel="الشهر السابق" accessibilityRole="button" activeOpacity={0.7} onPress={() => moveMonth(-1)} style={styles.monthButton}><MaterialIcons color="#0E7490" name="chevron-left" size={24} /></TouchableOpacity>
              </View>
              <Text style={styles.yearHint}>اضغط على السنة للانتقال إليها بسرعة.</Text>
              <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
              <View style={styles.daysGrid}>
                {cells.map((day, index) => {
                  if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                  const dateValue = calendarMode === "hijri" ? `hijri-${year}-${month}-${day}` : toDateValue(new Date(year, month, day, 12));
                  const isSelected = calendarMode === "hijri" ? selectedHijri?.year === year && selectedHijri.month === month && selectedHijri.day === day : dateValue === value;
                  return <TouchableOpacity accessibilityLabel={`${day} ${monthLabel} ${year}`} accessibilityRole="button" activeOpacity={0.72} key={dateValue} onPress={() => selectDay(day)} style={styles.dayCell}><View style={[styles.day, isSelected && styles.daySelected]}><Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text></View></TouchableOpacity>;
                })}
              </View>
            </>
          )}
          {allowClear && value ? <TouchableOpacity accessibilityRole="button" activeOpacity={0.72} onPress={() => { onChange(""); onClose(); }} style={styles.clearButton}><MaterialIcons color="#627D98" name="backspace" size={18} /><Text style={styles.clearText}>إزالة التاريخ</Text></TouchableOpacity> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 19 },
  label: { color: "#334E68", fontSize: 14, fontWeight: "800", lineHeight: 21, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
  fieldButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 13, borderWidth: 1, flexDirection: "row-reverse", gap: 10, minHeight: 48, paddingHorizontal: 14, paddingVertical: 11 },
  fieldText: { color: "#102A43", flex: 1, fontSize: 15, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  placeholder: { color: "#9FB3C8" },
  overlay: { backgroundColor: "rgba(16, 42, 67, 0.42)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D9E2EC", borderRadius: 4, height: 4, width: 42 },
  sheetHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 10 },
  iconButton: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  sheetTitle: { color: "#102A43", fontSize: 17, fontWeight: "800", writingDirection: "rtl" },
  calendarToggle: { alignSelf: "center", backgroundColor: "#EFF5F8", borderRadius: 12, flexDirection: "row-reverse", marginTop: 12, padding: 3 },
  calendarModeButton: { borderRadius: 9, minWidth: 78, paddingHorizontal: 13, paddingVertical: 7 },
  calendarModeButtonActive: { backgroundColor: "#0E7490" },
  calendarModeText: { color: "#627D98", fontSize: 13, fontWeight: "800", textAlign: "center", writingDirection: "rtl" },
  calendarModeTextActive: { color: "#FFFFFF" },
  monthHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 15 },
  monthButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  monthTitleButton: { alignItems: "center", flexDirection: "row-reverse", gap: 1, paddingHorizontal: 8, paddingVertical: 6 },
  monthTitle: { color: "#243B53", fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
  yearHint: { color: "#829AB1", fontSize: 11, marginTop: 7, textAlign: "center", writingDirection: "rtl" },
  weekRow: { flexDirection: "row-reverse", marginTop: 17 },
  weekday: { color: "#829AB1", flex: 1, fontSize: 12, fontWeight: "800", textAlign: "center", writingDirection: "rtl" },
  daysGrid: { flexDirection: "row-reverse", flexWrap: "wrap", marginTop: 8 },
  dayCell: { alignItems: "center", height: 44, justifyContent: "center", width: "14.2857%" },
  day: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  daySelected: { backgroundColor: "#0E7490" },
  dayText: { color: "#334E68", fontSize: 14, fontWeight: "700" },
  dayTextSelected: { color: "#FFFFFF", fontWeight: "800" },
  yearPicker: { marginTop: 16 },
  yearPickerTitle: { color: "#243B53", fontSize: 16, fontWeight: "800", textAlign: "center", writingDirection: "rtl" },
  yearInputRow: { alignItems: "center", flexDirection: "row-reverse", gap: 7, marginTop: 13 },
  yearPageButton: { alignItems: "center", backgroundColor: "#EFF5F8", borderRadius: 16, height: 34, justifyContent: "center", width: 34 },
  yearInput: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 11, borderWidth: 1, color: "#102A43", flex: 1, fontSize: 15, fontWeight: "800", height: 38, paddingHorizontal: 8 },
  yearApplyButton: { alignItems: "center", backgroundColor: "#0E7490", borderRadius: 10, height: 38, justifyContent: "center", paddingHorizontal: 11 },
  yearApplyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  yearRange: { color: "#829AB1", fontSize: 12, marginTop: 11, textAlign: "center" },
  yearGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 11 },
  yearChoice: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 11, borderWidth: 1, justifyContent: "center", minHeight: 38, width: "18.25%" },
  yearChoiceActive: { backgroundColor: "#0E7490", borderColor: "#0E7490" },
  yearChoiceText: { color: "#486581", fontSize: 13, fontWeight: "800" },
  yearChoiceTextActive: { color: "#FFFFFF" },
  backToCalendarButton: { alignItems: "center", alignSelf: "center", flexDirection: "row-reverse", gap: 6, marginTop: 14, paddingHorizontal: 12, paddingVertical: 7 },
  backToCalendarText: { color: "#0E7490", fontSize: 13, fontWeight: "800", writingDirection: "rtl" },
  clearButton: { alignItems: "center", alignSelf: "center", flexDirection: "row-reverse", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { color: "#627D98", fontSize: 13, fontWeight: "700", writingDirection: "rtl" },
});
