import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

import type { BaseEntry } from '../../types';
import Day from './Day';


interface CalendarProps<T extends BaseEntry> {
    selectedDates: T[];
    handleDayToggle: (date: Date) => void;
}


// T is the type of Entry of the currently active page.
export default function Calendar<T extends BaseEntry>({ selectedDates, handleDayToggle }: CalendarProps<T>) {

    const daySize = 70
    const dayIconMargin = 10


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                    views={['day']} // no year/month dropdown
                    slots={{ day: Day as any }}
                    slotProps={{
                        day: (ownerState) => {
                            // ownerState.day is the Date for this cell
                            const thisDateStr = format(ownerState.day, 'yyyy-MM-dd');
                            const isSelected = selectedDates.some((e) => e.date === thisDateStr);

                            return {
                                // Your overrides:
                                isSelected: isSelected,
                                onClick: () => handleDayToggle(ownerState.day),
                            };
                        },
                    }}
                    sx={{
                        width: 500,
                        height: 550,
                        maxHeight: "none",
                        margin: 0,


                        // Make each day (number cell) bigger:
                        '& .MuiPickersDay-root': {
                            width: daySize,
                            height: daySize,
                            fontSize: '1.4rem',
                            margin: "0",
                        },

                        '& .Mui-selected': {
                            width: daySize - 2 * dayIconMargin,
                            height: daySize - 2 * dayIconMargin,
                            margin: `${dayIconMargin}px`,
                        },

                        '& .MuiPickersDay-today': {
                            width: daySize - 2 * dayIconMargin,
                            height: daySize - 2 * dayIconMargin,
                            margin: `${dayIconMargin}px`,
                        },

                        // June 2025 Header
                        "& .MuiPickersCalendarHeader-labelContainer": {
                            fontSize: "1.35rem",   // adjust as you like
                        },

                        // weekday labels:
                        '& .MuiDayCalendar-weekDayLabel': {
                            width: 66,
                            textAlign: 'center',
                            fontSize: '1.15em',
                            marginTop: "5px",
                        },

                        // center the weekday row nicely
                        '& .MuiDayCalendar-header-root': {
                            marginRight: "0px",
                        },


                        // overflow fix
                        '& .MuiPickersSlideTransition-root.MuiDayCalendar-slideTransition': {
                            height: 450, // tweak this number based day size
                        },


                    }
                    }
                />
        </LocalizationProvider>
    );
}