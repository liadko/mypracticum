import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';

interface DayProps extends PickersDayProps {
  isSelected: boolean;
}

// When i tell DateCalender to use the default PickersDay, it overrides any selections i make.
// so i created my own Day that MUI can't touch.


export default function Day({isSelected, ...other}: DayProps) {
    return (
        <PickersDay
            {...other}
            selected={isSelected}
        />
    );
}