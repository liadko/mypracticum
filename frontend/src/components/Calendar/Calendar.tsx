import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';

import type { BaseEntry } from '../../types';
import Day from './Day';


interface CalendarProps<T extends BaseEntry> {
    entries: T[];
    handleDayToggle: (date: Date) => void;
    highlightedDate: string | undefined;
}


// T is the type of Entry of the currently active page.
export default function Calendar<T extends BaseEntry>({ entries, handleDayToggle, highlightedDate }: CalendarProps<T>) {

    const daySize = 60
    const dayIconMargin = 8


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
                //key={highlightedDate ? format(highlightedDate, 'yyyy-MM') : undefined}
                views={['day']} // no year/month dropdown
                //referenceDate={highlightedDate ? parseISO(highlightedDate) : undefined}
                value={highlightedDate ? parseISO(highlightedDate) : null}
                slots={{ day: Day as any }}
                slotProps={{
                    day: (ownerState) => {
                        // ownerState.day is the Date for this cell
                        const thisDateStr = format(ownerState.day, 'yyyy-MM-dd');
                        const isSelected = entries.some((e) => e.date === thisDateStr);

                        return {
                            // Your overrides:
                            isSelected: isSelected,
                            isFocused: highlightedDate == thisDateStr,
                            onClick: () => handleDayToggle(ownerState.day),
                        };
                    },
                }}
                sx={{
                    width: 500,
                    height: 473,
                    maxHeight: "none",
                    margin: 0,



                    // Make each day (number cell) bigger:
                    '& .MuiPickersDay-root': {
                        width: daySize - 2 * dayIconMargin,
                        height: daySize - 2 * dayIconMargin,
                        fontSize: '1.4rem',
                        margin: `${dayIconMargin}px`,
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


                    '& .Mui-selected.MuiButtonBase-root.Mui-focusVisible': {
                        backgroundColor: '#00A495',
                    },

                    // June 2025 Header
                    "& .MuiPickersCalendarHeader-labelContainer": {
                        fontSize: "1.35rem",   // adjust as you like
                    },

                    // weekday labels:
                    '& .MuiDayCalendar-weekDayLabel': {
                        width: 56,
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
                        height: 400, // tweak this number based day size
                    },


                }
                }
            />
        </LocalizationProvider>
    );
}