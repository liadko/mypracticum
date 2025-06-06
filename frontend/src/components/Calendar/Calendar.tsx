import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

import Day from './Day';
import type { BaseEntry } from '../../types';


interface CalendarProps<T extends BaseEntry> {
    selectedDates: T[];
    onSelectedDatesChange: (dates: T[]) => void;
}


// T is the type of Entry of the currently active page.

export default function Calendar<T extends BaseEntry>({ selectedDates, onSelectedDatesChange: setSelectedDates }: CalendarProps<T>) {
    // Toggle a single day in/out of selectedDates
    const handleDayToggle = (day: Date) => {
        const iso = format(day, 'yyyy-MM-dd');
        const exists = selectedDates.find((e) => e.date === iso);

        if (exists) {
            // Remove it
            setSelectedDates(
                selectedDates.filter((entry) => entry.date !== iso)
            );
        } else {
            const newEntry: BaseEntry = {
                id: `${iso}-${Date.now()}`,
                date: iso,
            };
            setSelectedDates([...selectedDates, newEntry as T]);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* === YOUR CUSTOM HEADER === */}
                <h2 style={{ textAlign: 'right' }}>
                    בחר תאריכים
                </h2>
                <DateCalendar
                    views={['day']} // no year/month dropdown

                    // Tell MUI to use *our* Day component for each day cell:
                    slots={{ day: Day }}
                    // Pass our selectedDates + toggle function INTO each Day:
                    slotProps={{
                        day: {
                            selectedDates,
                            onDayToggle: handleDayToggle,
                        } as any,
                    }}
                    sx={{
                        width: 400,


                        // Make each day (number cell) bigger:
                        '& .MuiPickersDay-root': {
                            width: 48,
                            height: 48,
                            fontSize: '1.2rem',
                            margin: 0, // IMPORTANT: prevent unwanted spacing
                        },

                        '& .Mui-selected': {
                            backgroundColor: '#00A495',
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

                        '& .MuiPickersDay-root.Mui-selected': {
                            backgroundColor: '#00A495', // green background
                            color: '#fff',              // white text
                            '&:hover': {
                                backgroundColor: '#009185', // darker green on hover
                            },
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