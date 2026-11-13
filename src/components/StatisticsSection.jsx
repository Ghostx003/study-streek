import { useMemo } from 'react';
import { calculateStatistics } from '../utils/statsCalculator';
import { formatDuration } from '../utils/dateUtils';

export function StatisticsSection({ history = {}, todayRecord = null }) {
  const stats = useMemo(() => {
    return calculateStatistics(history, todayRecord);
  }, [history, todayRecord]);

  return (
    <div className="statistics-section card">
      <div className="stats-header">
        <h3 className="stats-section-title">Consistency Statistics</h3>
      </div>

      {/* Main Highlights Row */}
      <div className="stats-grid-primary">
        <div className="stat-card highlight-card">
          <span className="stat-label">Current Streak</span>
          <div className="stat-value text-accent">
            {stats.currentStreak} <span className="stat-unit">{stats.currentStreak === 1 ? 'day' : 'days'}</span>
          </div>
          <span className="stat-sublabel">Consecutive successful days</span>
        </div>

        <div className="stat-card highlight-card">
          <span className="stat-label">Longest Streak</span>
          <div className="stat-value">
            {stats.longestStreak} <span className="stat-unit">{stats.longestStreak === 1 ? 'day' : 'days'}</span>
          </div>
          <span className="stat-sublabel">Best consistency run</span>
        </div>

        <div className="stat-card highlight-card">
          <span className="stat-label">Consistency</span>
          <div className="stat-value text-success">
            {stats.overallConsistencyPercent}<span className="stat-unit">%</span>
          </div>
          <span className="stat-sublabel">Successful / Tracked days</span>
        </div>

        <div className="stat-card highlight-card">
          <span className="stat-label">Total Study Time</span>
          <div className="stat-value">
            {stats.totalStudyHours} <span className="stat-unit">hrs</span>
          </div>
          <span className="stat-sublabel">Across all tracked days</span>
        </div>
      </div>

      {/* Detailed Numerical Cards Grid */}
      <div className="stats-subheading mt-4">Performance Breakdown</div>
      <div className="stats-grid-secondary">
        <div className="stat-card">
          <span className="stat-label">Total Days Tracked</span>
          <div className="stat-value-sm">{stats.totalDaysTracked}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Successful Days</span>
          <div className="stat-value-sm text-success">{stats.totalSuccessfulDays}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Unsuccessful Days</span>
          <div className="stat-value-sm text-danger">{stats.totalUnsuccessfulDays}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Avg Daily Duration</span>
          <div className="stat-value-sm">
            {formatDuration(stats.averageDailyStudyDurationMinutes)}
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Avg on Successful Days</span>
          <div className="stat-value-sm">
            {formatDuration(stats.averageSuccessfulDailyStudyDurationMinutes)}
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Completed Sessions</span>
          <div className="stat-value-sm text-success">{stats.totalCompletedSessions}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Missed Sessions</span>
          <div className="stat-value-sm text-muted">{stats.totalMissedSessions}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Days with Partial Study</span>
          <div className="stat-value-sm">{stats.partialCompletionDaysCount}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Days with Zero Study</span>
          <div className="stat-value-sm text-danger">{stats.zeroStudyDaysCount}</div>
        </div>
      </div>

      {/* Temporal Statistics: Week, Month, Year */}
      <div className="stats-subheading mt-4">Periodic Consistency</div>
      <div className="stats-grid-secondary">
        <div className="stat-card">
          <span className="stat-label">This Week's Successes</span>
          <div className="stat-value-sm text-success">{stats.thisWeekSuccessfulDays}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">This Month's Successes</span>
          <div className="stat-value-sm text-success">{stats.thisMonthSuccessfulDays}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">This Year's Successes</span>
          <div className="stat-value-sm text-success">{stats.thisYearSuccessfulDays}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">This Month's Consistency</span>
          <div className="stat-value-sm text-success">{stats.thisMonthConsistencyPercent}%</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Studied This Month</span>
          <div className="stat-value-sm">{stats.totalHoursThisMonth} hrs</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Studied This Year</span>
          <div className="stat-value-sm">{stats.totalHoursThisYear} hrs</div>
        </div>
      </div>
    </div>
  );
}
