import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar = ({
    selected,
    onSelect,
    className = "",
    showOutsideDays = true,
    mode = "single"
}) => {
    const [currentDate, setCurrentDate] = useState(selected || new Date());

    // Update currentDate when selected changes
    useEffect(() => {
        if (selected) {
            setCurrentDate(new Date(selected));
        }
    }, [selected]);

    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Get previous month's last days if showing outside days
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(year, month + direction, 1));
    };

    const goToToday = () => {
        const todayDate = new Date();
        setCurrentDate(todayDate);
        if (onSelect) {
            onSelect(todayDate);
        }
    };

    const handleDateClick = (day, isCurrentMonth = true, isPrevMonth = false) => {
        let clickedDate;
        if (isPrevMonth) {
            clickedDate = new Date(year, month - 1, day);
        } else if (!isCurrentMonth) {
            clickedDate = new Date(year, month + 1, day);
        } else {
            clickedDate = new Date(year, month, day);
        }

        if (onSelect) {
            onSelect(clickedDate);
        }
    };

    const isSelected = (day, isCurrentMonth = true, isPrevMonth = false) => {
        if (!selected) return false;

        let dateToCheck;
        if (isPrevMonth) {
            dateToCheck = new Date(year, month - 1, day);
        } else if (!isCurrentMonth) {
            dateToCheck = new Date(year, month + 1, day);
        } else {
            dateToCheck = new Date(year, month, day);
        }

        return selected.toDateString() === dateToCheck.toDateString();
    };

    const isToday = (day, isCurrentMonth = true, isPrevMonth = false) => {
        let dateToCheck;
        if (isPrevMonth) {
            dateToCheck = new Date(year, month - 1, day);
        } else if (!isCurrentMonth) {
            dateToCheck = new Date(year, month + 1, day);
        } else {
            dateToCheck = new Date(year, month, day);
        }

        return today.toDateString() === dateToCheck.toDateString();
    };

    // Build calendar grid
    const calendarDays = [];

    // Previous month's days
    if (showOutsideDays) {
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            calendarDays.push({
                day,
                isCurrentMonth: false,
                isPrevMonth: true,
                key: `prev-${day}`
            });
        }
    } else {
        for (let i = 0; i < firstDayWeekday; i++) {
            calendarDays.push({ day: null, key: `empty-${i}` });
        }
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({
            day,
            isCurrentMonth: true,
            isPrevMonth: false,
            key: `current-${day}`
        });
    }

    // Next month's days
    const remainingCells = 42 - calendarDays.length; // 6 rows * 7 days
    if (showOutsideDays) {
        for (let day = 1; day <= remainingCells; day++) {
            calendarDays.push({
                day,
                isCurrentMonth: false,
                isPrevMonth: false,
                key: `next-${day}`
            });
        }
    }

    return (
        <div className={`p-3 ${className}`}>
            {/* Header */}
            <div className="flex justify-between pt-1 relative items-center mb-4">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="text-sm font-medium">
                    {monthNames[month]} {year}
                </div>

                <div className="flex space-x-1">
                    <button
                        onClick={goToToday}
                        className="text-xs h-7 px-2 bg-transparent opacity-80 hover:opacity-100 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((dayName) => (
                    <div
                        key={dayName}
                        className="text-gray-500 text-center text-xs font-normal h-9 flex items-center justify-center"
                    >
                        {dayName}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ day, isCurrentMonth, isPrevMonth, key }) => {
                    if (day === null) {
                        return <div key={key} className="h-9 w-9" />;
                    }

                    const selected = isSelected(day, isCurrentMonth, isPrevMonth);
                    const todayClass = isToday(day, isCurrentMonth, isPrevMonth);
                    const outsideMonth = !isCurrentMonth;

                    return (
                        <button
                            key={key}
                            onClick={() => handleDateClick(day, isCurrentMonth, isPrevMonth)}
                            className={`
                h-9 w-9 text-sm p-0 font-normal flex items-center justify-center rounded-md
                ${selected
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : todayClass
                                        ? 'bg-gray-100 text-gray-900'
                                        : outsideMonth
                                            ? 'text-gray-400 hover:bg-gray-50'
                                            : 'text-gray-900 hover:bg-gray-100'
                                }
                transition-colors duration-200
              `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export { Calendar };