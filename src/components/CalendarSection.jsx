import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getCalendarMonthData, getLocalDateString } from '../utils/dateUtils';
import { HistoryDayModal } from './HistoryDayModal';

export function CalendarSection({ history = {}, todayRecord = null }) {
  const todayStr = getLocalDateString();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  // Find earliest date tracked
  const allHistoryKeys = Object.keys(history).sort();
  const earliestDateStr = allHistoryKeys.length > 0 ? allHistoryKeys[0] : (todayRecord ? todayStr : null);

  const daysData = getCalendarMonthData(currentYear, currentMonth);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDayStatus = (dateStr) => {
    if (!dateStr) return { status: 'empty' };

    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    // Check if before user ever started tracking
    if (earliestDateStr && dateStr < earliestDateStr) {
      return { status: 'before-start', isPast: true };
    }

    if (isToday) {
      if (todayRecord) {
        const isCompleted = Boolean(
          todayRecord.isCompleted ||
          (todayRecord.targetDurationMinutes > 0 &&
           todayRecord.completedDurationMinutes >= todayRecord.targetDurationMinutes)
        );
        if (isCompleted) {
          return { status: 'completed', isToday: true, isCompleted: true, record: todayRecord };
        }
        return { status: 'in-progress', isToday: true, record: todayRecord };
      }
      return { status: 'in-progress', isToday: true, record: null };
    }

    if (isPast) {
      const record = history[dateStr];
      if (record) {
        const isCompleted = Boolean(record.isCompleted);
        return {
          status: isCompleted ? 'completed' : 'incomplete',
          isPast: true,
          isCompleted,
          record
        };
      }
      // If past date after tracking started but no record was made
      if (earliestDateStr && dateStr >= earliestDateStr) {
        return {
          status: 'incomplete',
          isPast: true,
          isCompleted: false,
          record: null
        };
      }
      return { status: 'untracked', isPast: true };
    }

    return { status: 'future', isFuture: true };
  };

  const handleDayClick = (item) => {
    if (!item) return;
    const { dateStr } = item;
    const dayStatus = getDayStatus(dateStr);

    let info = {
      dateStr,
      isToday: dateStr === todayStr,
      isCompleted: dayStatus.isCompleted || false,
      hasRecord: false,
      targetHours: 0,
      completedDurationMinutes: 0,
      targetDurationMinutes: 0,
      mode: 'hourly',
      sessions: []
    };

    if (dateStr === todayStr && todayRecord) {
      info = {
        dateStr,
        isToday: true,
        isCompleted: Boolean(
          todayRecord.isCompleted ||
          (todayRecord.targetDurationMinutes > 0 &&
           todayRecord.completedDurationMinutes >= todayRecord.targetDurationMinutes)
        ),
        hasRecord: true,
        targetHours: todayRecord.targetHours,
        completedDurationMinutes: todayRecord.completedDurationMinutes,
        targetDurationMinutes: todayRecord.targetDurationMinutes,
        mode: todayRecord.mode,
        sessions: todayRecord.sessions || []
      };
    } else if (history[dateStr]) {
      const rec = history[dateStr];
      info = {
        dateStr,
        isToday: false,
        isCompleted: Boolean(rec.isCompleted),
        hasRecord: true,
        targetHours: rec.targetHours,
        completedDurationMinutes: rec.completedDurationMinutes,
        targetDurationMinutes: rec.targetDurationMinutes,
        mode: rec.mode,
        sessions: rec.sessions || []
      };
    }

    setSelectedDayInfo(info);
  };

  return (
    <div className="calendar-section card">
      {/* Calendar Header with Navigation */}
      <div className="calendar-header">
        <div className="calendar-title-group">
          <h3 className="calendar-month-title">
            {monthNames[currentMonth - 1]} {currentYear}
          </h3>
        </div>

        <div className="calendar-controls">
          <button
            type="button"
            className="btn-calendar-nav"
            onClick={handleJumpToToday}
            title="Jump to current month"
          >
            Today
          </button>
          <div className="nav-arrows">
            <button
              type="button"
              className="btn-calendar-arrow"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="icon-sm" />
            </button>
            <button
              type="button"
              className="btn-calendar-arrow"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="calendar-weekdays">
        {weekdayLabels.map((lbl, idx) => (
          <div key={idx} className="calendar-weekday-cell">
            {lbl}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="calendar-grid">
        {daysData.map((item, idx) => {
          if (!item) {
            return <div key={`empty-${idx}`} className="calendar-day-cell empty" />;
          }

          const { day, dateStr } = item;
          const { status } = getDayStatus(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              className={`calendar-day-cell ${isToday ? 'current-day' : ''} ${status}`}
              onClick={() => handleDayClick(item)}
              aria-label={`${dateStr}: ${status}`}
            >
              <span className="day-number">{day}</span>
              <div className="day-indicator">
                {status === 'completed' && (
                  <span className="indicator-tick" title="Target Completed">
                    <Check className="indicator-icon" />
                  </span>
                )}
                {status === 'incomplete' && (
                  <span className="indicator-cross" title="Target Not Completed">
                    <X className="indicator-icon" />
                  </span>
                )}
                {status === 'in-progress' && (
                  <span className="indicator-neutral" title="In Progress" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Historical details modal on click */}
      {selectedDayInfo && (
        <HistoryDayModal
          dayInfo={selectedDayInfo}
          onClose={() => setSelectedDayInfo(null)}
        />
      )}
    </div>
  );
}
