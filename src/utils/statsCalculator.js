// Pure numerical consistency statistics calculation
// IMPORTANT: NO GRAPHS. All metrics are calculated dynamically from actual records.

import { getLocalDateString } from './dateUtils.js';

export function calculateStatistics(history = {}, todayRecord = null) {
  const todayStr = getLocalDateString();
  const allDateKeys = Object.keys(history).sort();

  // If today has a record, combine it into consideration
  const hasToday = todayRecord && (todayRecord.targetHours > 0 || (todayRecord.sessions && todayRecord.sessions.length > 0));

  // If completely empty (brand new user, zero records)
  if (allDateKeys.length === 0 && !hasToday) {
    return {
      totalDaysTracked: 0,
      totalSuccessfulDays: 0,
      totalUnsuccessfulDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      overallConsistencyPercent: 0,
      totalStudyHours: 0,
      averageDailyStudyDurationMinutes: 0,
      averageSuccessfulDailyStudyDurationMinutes: 0,
      totalCompletedSessions: 0,
      totalMissedSessions: 0,
      zeroStudyDaysCount: 0,
      partialCompletionDaysCount: 0,
      thisWeekSuccessfulDays: 0,
      thisMonthSuccessfulDays: 0,
      thisYearSuccessfulDays: 0,
      thisMonthConsistencyPercent: 0,
      totalHoursThisMonth: 0,
      totalHoursThisYear: 0
    };
  }

  // Determine earliest tracked date
  const earliestDateStr = allDateKeys.length > 0 ? allDateKeys[0] : todayStr;

  // Build a complete map of all calendar days from earliestDateStr up to todayStr
  const startDate = new Date(earliestDateStr);
  const endDate = new Date(todayStr);

  const dayMap = {}; // dateStr -> { isCompleted, completedMinutes, targetMinutes, completedSessions, missedSessions }

  // Populate from history
  for (const dateStr of allDateKeys) {
    const rec = history[dateStr];
    if (!rec) continue;
    const completedSessions = (rec.sessions || []).filter(s => s.completed).length;
    const totalSessions = (rec.sessions || []).length;
    const isSuccess = !!rec.isCompleted;

    dayMap[dateStr] = {
      isCompleted: isSuccess,
      completedMinutes: rec.completedDurationMinutes || 0,
      targetMinutes: rec.targetDurationMinutes || (rec.targetHours * 60) || 0,
      completedSessions,
      missedSessions: Math.max(0, totalSessions - completedSessions),
      hasExplicitRecord: true
    };
  }

  // Populate today if exists
  if (hasToday) {
    const completedSessions = (todayRecord.sessions || []).filter(s => s.completed).length;
    const totalSessions = (todayRecord.sessions || []).length;
    const isSuccess = !!todayRecord.isCompleted;

    dayMap[todayStr] = {
      isCompleted: isSuccess,
      completedMinutes: todayRecord.completedDurationMinutes || 0,
      targetMinutes: todayRecord.targetDurationMinutes || (todayRecord.targetHours * 60) || 0,
      completedSessions,
      missedSessions: Math.max(0, totalSessions - completedSessions),
      hasExplicitRecord: true,
      isToday: true
    };
  }

  // Iterate all calendar days between earliestDateStr and todayStr
  const calendarDays = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    if (dayMap[dStr]) {
      calendarDays.push({ dateStr: dStr, ...dayMap[dStr] });
    } else {
      // Day within tracking window but with zero target / study
      calendarDays.push({
        dateStr: dStr,
        isCompleted: false,
        completedMinutes: 0,
        targetMinutes: 0,
        completedSessions: 0,
        missedSessions: 0,
        hasExplicitRecord: false
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  // 1. Total days tracked (eligible tracked days)
  // For finalized consistency, consider past days + today if today is completed or has progress
  const eligibleDays = calendarDays.filter(day => {
    if (day.dateStr < todayStr) return true;
    if (day.dateStr === todayStr) return day.isCompleted || (day.completedMinutes > 0);
    return false;
  });

  const totalDaysTracked = eligibleDays.length;

  // 2. Total successful days
  let totalSuccessfulDays = 0;
  let totalStudyMinutes = 0;
  let successfulStudyMinutes = 0;
  let totalCompletedSessions = 0;
  let totalMissedSessions = 0;
  let zeroStudyDaysCount = 0;
  let partialCompletionDaysCount = 0;

  for (const day of eligibleDays) {
    totalStudyMinutes += day.completedMinutes;
    totalCompletedSessions += day.completedSessions;
    totalMissedSessions += day.missedSessions;

    if (day.isCompleted) {
      totalSuccessfulDays++;
      successfulStudyMinutes += day.completedMinutes;
    } else {
      if (day.completedMinutes === 0) {
        zeroStudyDaysCount++;
      } else {
        partialCompletionDaysCount++;
      }
    }
  }

  // 3. Total unsuccessful days
  const totalUnsuccessfulDays = Math.max(0, totalDaysTracked - totalSuccessfulDays);

  // 4 & 5. Streaks (Current streak & Longest streak)
  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of calendarDays) {
    if (day.isCompleted) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // If today is in progress and not finished yet, do not break runningStreak that reached yesterday
      if (day.dateStr === todayStr && !day.isCompleted) {
        // Today is still ongoing
      } else {
        runningStreak = 0;
      }
    }
  }

  // Current streak calculation:
  // Walk backwards from today:
  let currentStreak = 0;
  const isTodayCompleted = dayMap[todayStr] && dayMap[todayStr].isCompleted;

  let checkIdx = calendarDays.length - 1;
  if (!isTodayCompleted) {
    // If today is not completed yet, start checking from yesterday
    checkIdx = calendarDays.length - 2;
  }

  while (checkIdx >= 0) {
    if (calendarDays[checkIdx].isCompleted) {
      currentStreak++;
      checkIdx--;
    } else {
      break;
    }
  }

  // 6. Overall consistency percentage
  const overallConsistencyPercent = totalDaysTracked > 0
    ? Number(((totalSuccessfulDays / totalDaysTracked) * 100).toFixed(1))
    : 0;

  // 7. Total study hours
  const totalStudyHours = Number((totalStudyMinutes / 60).toFixed(1));

  // 8. Average daily study duration
  const averageDailyStudyDurationMinutes = totalDaysTracked > 0
    ? Math.round(totalStudyMinutes / totalDaysTracked)
    : 0;

  // 9. Average study duration on successful days
  const averageSuccessfulDailyStudyDurationMinutes = totalSuccessfulDays > 0
    ? Math.round(successfulStudyMinutes / totalSuccessfulDays)
    : 0;

  // Temporal filters: This week, This month, This year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Get current week's Monday
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - distanceToMonday);
  const mondayStr = getLocalDateString(mondayDate);

  let thisWeekSuccessfulDays = 0;
  let thisMonthSuccessfulDays = 0;
  let thisYearSuccessfulDays = 0;
  let thisMonthEligibleDays = 0;
  let thisMonthStudyMinutes = 0;
  let thisYearStudyMinutes = 0;

  for (const day of eligibleDays) {
    const [y, m] = day.dateStr.split('-').map(Number);

    if (day.dateStr >= mondayStr) {
      if (day.isCompleted) thisWeekSuccessfulDays++;
    }

    if (y === currentYear && m === currentMonth) {
      thisMonthEligibleDays++;
      thisMonthStudyMinutes += day.completedMinutes;
      if (day.isCompleted) thisMonthSuccessfulDays++;
    }

    if (y === currentYear) {
      thisYearStudyMinutes += day.completedMinutes;
      if (day.isCompleted) thisYearSuccessfulDays++;
    }
  }

  const thisMonthConsistencyPercent = thisMonthEligibleDays > 0
    ? Number(((thisMonthSuccessfulDays / thisMonthEligibleDays) * 100).toFixed(1))
    : 0;

  const totalHoursThisMonth = Number((thisMonthStudyMinutes / 60).toFixed(1));
  const totalHoursThisYear = Number((thisYearStudyMinutes / 60).toFixed(1));

  return {
    totalDaysTracked,
    totalSuccessfulDays,
    totalUnsuccessfulDays,
    currentStreak,
    longestStreak,
    overallConsistencyPercent,
    totalStudyHours,
    averageDailyStudyDurationMinutes,
    averageSuccessfulDailyStudyDurationMinutes,
    totalCompletedSessions,
    totalMissedSessions,
    zeroStudyDaysCount,
    partialCompletionDaysCount,
    thisWeekSuccessfulDays,
    thisMonthSuccessfulDays,
    thisYearSuccessfulDays,
    thisMonthConsistencyPercent,
    totalHoursThisMonth,
    totalHoursThisYear
  };
}
