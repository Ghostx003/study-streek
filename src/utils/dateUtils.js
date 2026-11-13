// Utility functions for dates and time formatting

export function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

export function formatTimestamp(dateOrIso = new Date()) {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '0 Hours';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs > 0 && mins === 0) {
    return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'}`;
  }
  if (hrs === 0 && mins > 0) {
    return `${mins} Minutes`;
  }
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  return '0 Hours';
}

export function formatDurationInHours(minutes) {
  const hours = (minutes / 60).toFixed(1);
  return hours.endsWith('.0') ? `${Math.round(minutes / 60)}h` : `${hours}h`;
}

// Generate calendar days for a given year & month (1-indexed month)
export function getCalendarMonthData(year, month) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  // Standardize starting on Monday (0 = Mon, 6 = Sun)
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const days = [];
  // Pad previous month days
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    days.push({
      day: d,
      dateStr: `${year}-${monthStr}-${dayStr}`
    });
  }

  return days;
}

// Check if dateStr is in the past compared to todayStr
export function isPastDate(dateStr, todayStr) {
  return dateStr < todayStr;
}

export function isFutureDate(dateStr, todayStr) {
  return dateStr > todayStr;
}
