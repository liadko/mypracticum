import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addMonths, format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import './Calendar.css';




import type { Entry } from '../../types';
import Day from './Day';


interface CalendarProps {
    entries: Entry[];
    handleDayToggle: (date: string) => void;
    highlightedDate: string | undefined;
}


// holds a list of the selected dates, an which date (if any) is highlighted.
// upon toggle it calls the callback handleDayToggle
export default function Calendar({ entries, handleDayToggle, highlightedDate }: CalendarProps) {

    const daySize = 56
    const dayIconMargin = 8


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <DateCalendar
                //key={highlightedDate ? format(highlightedDate, 'yyyy-MM') : undefined}
                views={['day']} // no year/month dropdown
                //referenceDate={highlightedDate ? parseISO(highlightedDate) : undefined}
                value={highlightedDate ? parseISO(highlightedDate) : null}
                slots={{
                    day: Day as any,
                    calendarHeader: ({ currentMonth, onMonthChange }) => (
                        <div className="calendar-header">
                            <svg
                                className="calendar-header__button flipped"
                                onClick={() => onMonthChange(addMonths(currentMonth, -1))}
                                aria-label="Previous month"
        
                            >
                                <use href='/left-arrow.svg' fill='currentColor'/>
                                </svg>                      
                            <div className="calendar-header__title">
                                {format(currentMonth, 'LLLL yyyy', { locale: he })}
                            </div>
                            <svg
                                className="calendar-header__button"
                                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                                aria-label="Next month"
        
                            >
                                <use href='/left-arrow.svg' fill='currentColor'/>
                                </svg>      
                        </div>
                    )

                }}
                slotProps={{
                    day: (ownerState) => {
                        // ownerState.day is the Date for this cell
                        const thisDateStr = format(ownerState.day, 'yyyy-MM-dd');
                        const isSelected = entries.some((e) => e.date === thisDateStr);

                        return {
                            // Your overrides:
                            isSelected: isSelected,
                            isFocused: highlightedDate == thisDateStr,
                            onClick: () => handleDayToggle(thisDateStr),
                        };
                    },
                }}
                reduceAnimations={true}
                sx={{
                    width: 500,
                    height: 473,
                    maxHeight: "none",
                    margin: 0,



                    // Make each day (number cell) bigger:
                    '& .MuiPickersDay-root': {
                        width: daySize - 2 * dayIconMargin,
                        height: daySize - 2 * dayIconMargin,
                        fontSize: '1.25rem',
                        margin: `${dayIconMargin}px`,
                        fontFamily: 'inherit'
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


                    // '& .Mui-selected.MuiButtonBase-root.Mui-focusVisible': {
                    //     backgroundColor: '#00A495',
                    // },



                    // weekday labels:
                    '& .MuiDayCalendar-weekDayLabel': {
                        width: 51.5,
                        textAlign: 'center',
                        fontFamily: 'inherit',
                        fontSize: '1.35em',
                        fontWeight: '700',
                        userSelect: 'none',
                    },

                    // center the weekday row nicely
                    '& .MuiDayCalendar-header-root': {
                        marginRight: "0px",
                    },


                    '& .MuiDayCalendar-header': {
                        marginTop: "5px",
                        marginBottom: "5px",

                    },

                    // overflow fix
                    '& .MuiPickersSlideTransition-root.MuiDayCalendar-slideTransition': {
                        height: 400, // tweak this number based day size

                        direction: 'rtl'
                    },


                }
                }
            />
        </LocalizationProvider>
    );
}