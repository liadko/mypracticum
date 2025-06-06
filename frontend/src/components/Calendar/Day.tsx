import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { isSameDay, parseISO, format } from 'date-fns';
import type { BaseEntry } from '../../types';

type OwnProps = {
  /** All currently “selected” dates from the parent */
  selectedDates?: BaseEntry[];
  /** Callback to toggle a date on/off the selectedDates array */
  onDayToggle?: (day: Date) => void;
};

/**
 * By including PickersDayProps<Date>, we get all the default MUI props 
 * (like `day: Date`, `outsideCurrentMonth: boolean`, etc.).  
 * Then we add our own two props (`selectedDates` & `onDayToggle`).
 */
export default function Day(
  props: PickersDayProps & OwnProps
) {
  const { day, selectedDates, onDayToggle, ...pickerDayProps } = props;

  // Check if this day is already in the selectedDates list
  const isSelected = selectedDates!.some((entry) =>
    isSameDay(parseISO(entry.date), day)
  );

  return (
    <PickersDay
      {...pickerDayProps}
      day={day}
      selected={isSelected}
      onClick={() => onDayToggle!(day)}
    />
  );
}