import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useEffect, useRef } from 'react';

interface DayProps extends PickersDayProps {
    isSelected: boolean;
    isFocused: boolean;
}

// When i tell DateCalender to use the default PickersDay, it overrides any selections i make.
// so i created my own Day that MUI can't touch.


export default function Day({ isSelected, isFocused, ...other }: DayProps) {
    // 1. Create a ref to hold the component's actions

    return (
        <PickersDay
            {...other}
            selected={isSelected}
            sx={{
                '&:focus': {
                    backgroundColor: 'transparent',
                },

                outline: isFocused && isSelected
                    ? '2px solid rgb(0, 55, 15)'
                    : 'none',
                outlineOffset: '3px',

            }}

        />
    );
}