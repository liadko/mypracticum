import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addMonths, format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import './Calendar.css';

import type { Entry } from '../../types';
import Day from './Day';

const ARROW_ICON_CONTENT = (
    <g transform="translate(14 20) rotate(180)">
        <g transform="translate(0)">
            <path
                d="M13.62,9.22,3.015.32A1.43,1.43,0,0,0,2.093,0a1.43,1.43,0,0,0-.922.32L.391.975a.976.976,0,0,0,0,1.547L9.3,10,.381,17.478a.977.977,0,0,0,0,1.547l.781.655a1.43,1.43,0,0,0,.922.32,1.43,1.43,0,0,0,.922-.32L13.62,10.772a.983.983,0,0,0,0-1.553Z"
                fill="currentColor"
            />
        </g>
    </g>
);


interface CalendarProps {
    entries: Entry[];
    handleDayToggle: (date: string) => void;
    highlightedDate: string | undefined;
    onHighlightedDateChange: (date: string | undefined) => void;
}


// holds a list of the selected dates, an which date (if any) is highlighted.
// upon toggle it calls the callback handleDayToggle
export default function Calendar({ entries, handleDayToggle, highlightedDate, onHighlightedDateChange }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [titleAnimation, setTitleAnimation] = useState('');
    const [displayedMonth, setDisplayedMonth] = useState(currentMonth);

    const daySize = 56
    const dayIconMargin = 8

    // Update displayed month when highlighted date changes
    useEffect(() => {
        if (highlightedDate) {
            const highlightedMonth = parseISO(highlightedDate);
            if (!isSameMonth(highlightedMonth, currentMonth)) {
                setCurrentMonth(highlightedMonth);
                const direction = highlightedMonth > currentMonth ? 'next' : 'prev';
                handleMonthChange(highlightedMonth, direction);
            }
        }
    }, [highlightedDate]);

    const handleMonthChange = (newMonth: Date, direction: 'next' | 'prev') => {

        // Start the slide out animation for current month
        setTitleAnimation(direction === 'next' ? 'slide-out-right' : 'slide-out-left');

        // After slide out completes, update the month and slide in
        setTimeout(() => {
            setDisplayedMonth(newMonth);
            setCurrentMonth(newMonth);
            setTitleAnimation(direction === 'next' ? 'slide-in-right' : 'slide-in-left');

            // Clear animation after slide in completes
            setTimeout(() => {
                setTitleAnimation('');
            }, 150);
        }, 150);
    };

    function isSameMonth(d1: Date, d2: Date) {
        return format(d1, 'yyyy-MM') === format(d2, 'yyyy-MM');
    }


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
                                viewBox="0 0 14 20"
                                onClick={() => {
                                    const newMonth = addMonths(currentMonth, -1);
                                    onHighlightedDateChange(undefined);
                                    handleMonthChange(newMonth, 'prev');
                                    onMonthChange(newMonth);
                                }}
                                aria-label="Previous month"

                            >
                                {ARROW_ICON_CONTENT}
                            </svg>
                            <div className="calendar-header__title">
                                <div className={`calendar-header__title-content ${titleAnimation}`}>
                                    {format(displayedMonth, 'LLLL yyyy', { locale: he })}
                                </div>
                            </div>
                            <svg
                                className="calendar-header__button"
                                viewBox="0 0 14 20"
                                onClick={() => {
                                    const newMonth = addMonths(currentMonth, 1);
                                    onHighlightedDateChange(undefined);
                                    handleMonthChange(newMonth, 'next');
                                    onMonthChange(newMonth);
                                }}
                                aria-label="Next month"

                            >
                                {ARROW_ICON_CONTENT}
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