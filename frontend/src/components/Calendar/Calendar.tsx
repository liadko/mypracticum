import { DateCalendar, PickersDay, type PickerDayOwnerState, type PickersDayProps } from '@mui/x-date-pickers';
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
    // Toggle a single day in/out of selectedDates

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* === YOUR CUSTOM HEADER === */}
                <h2 style={{ textAlign: 'right' }}>
                    בחר תאריכים
                </h2>

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
                        width: 400,

                        // Make each day (number cell) bigger:
                        '& .MuiPickersDay-root': {
                            width: 48,
                            height: 48,
                            fontSize: '1.2rem',
                            margin: 0,    
                        },

                        '& .Mui-selected': {
                            width: 40,
                            height: 40,
                            margin: "4px",
                        },

                        '& .MuiPickersDay-today': {
                            backgroundColor: 'transparent',
                            width: 40,
                            height: 40,
                            margin: "4px",
                        },



                        // Fix the weekday labels row:
                        '& .MuiDayCalendar-weekDayLabel': {
                            width: 44,
                            textAlign: 'center',
                        },

                        // Optional: center the weekday row nicely
                        '& .MuiDayCalendar-header': {
                            marginRight: "0px",
                            fontSize: "1.6rem",
                        },


                        // overflow fix
                        '& .MuiPickersSlideTransition-root.MuiDayCalendar-slideTransition': {
                            height: 280, // tweak this number based day size
                        },


                    }
                    }
                />
            </div>
        </LocalizationProvider>
    );
}