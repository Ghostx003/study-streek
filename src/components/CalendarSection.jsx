import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { getCalendarMonthData, getLocalDateString } from '../utils/dateUtils';
import { HistoryDayModal } from './HistoryDayModal';

export function CalendarSection({ history = {}, todayRecord = null, onToggleHistoricalDay }) {
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

  // 2-Letter Weekday Labels matching the exact reference image
  const weekdayLabels = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

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
    <div className="attendance-calendar-card">
      {/* Calendar Header with Icon, Title, and Subtitle */}
      <div className="attendance-header">
        <div className="attendance-title-row">
          <CalendarIcon className="attendance-icon" />
          <h2 className="attendance-title">ATTENDANCE CALENDAR</h2>
        </div>
        <p className="attendance-subtitle">
          Tap any past or today's date to toggle workout attendance
        </p>
      </div>

      {/* Navigation Controls Row */}
      <div className="attendance-controls">
        <button
          type="button"
          className="btn-attendance-today"
          onClick={handleJumpToToday}
        >
          Today
        </button>

        <div className="attendance-month-pill">
          <button
            type="button"
            className="btn-month-chevron"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="chevron-icon" />
          </button>
          <span className="attendance-month-text">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            type="button"
            className="btn-month-chevron"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="chevron-icon" />
          </button>
        </div>
      </div>

      {/* Weekday 2-Letter Headers */}
      <div className="attendance-weekdays">
        {weekdayLabels.map((lbl, idx) => (
          <div key={idx} className="attendance-weekday-col">
            {lbl}
          </div>
        ))}
      </div>

      {/* Calendar Grid with exact Rounded Squircle Cells */}
      <div className="attendance-grid">
        {daysData.map((item, idx) => {
          if (!item) {
            return <div key={`empty-${idx}`} className="attendance-day-cell empty" />;
          }

          const { day, dateStr } = item;
          const { status, isCompleted } = getDayStatus(dateStr);
          const isToday = dateStr === todayStr;

          // Determine visual styling class based on exact status
          let cellStateClass = 'cell-future';
          if (status === 'completed') {
            cellStateClass = 'cell-completed';
          } else if (status === 'incomplete') {
            cellStateClass = 'cell-incomplete';
          } else if (status === 'in-progress') {
            cellStateClass = 'cell-inprogress';
          }

          return (
            <button
              key={dateStr}
              type="button"
              className={`attendance-day-cell ${cellStateClass} ${isToday ? 'cell-today' : ''}`}
              onClick={() => handleDayClick(item)}
              aria-label={`${dateStr}: ${status}`}
            >
              <span className="attendance-day-num">{day}</span>
              <div className="attendance-day-icon-wrap">
                {status === 'completed' && (
                  <Check className="cell-check-icon" />
                )}
                {status === 'incomplete' && (
                  <X className="cell-cross-icon" />
                )}
                {status === 'in-progress' && (
                  <span className="cell-neutral-indicator" />
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
          onToggleAttendance={() => {
            if (onToggleHistoricalDay) {
              onToggleHistoricalDay(selectedDayInfo.dateStr);
            }
          }}
        />
      )}
    </div>
  );
}
