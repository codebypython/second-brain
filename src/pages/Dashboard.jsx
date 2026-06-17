import { useState, useEffect } from 'react';
import { getDashboardStats, getTasks, getJournal, getEventsByDate } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr, getGreetingKey, formatFullDate } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Dashboard';

export default function Dashboard({ navigate }) {
  const { t, timezone, lang } = useAppContext();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayJournal, setTodayJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compute today inside the component body for rendering, but the
  // authoritative value used for data fetching is computed inside useEffect
  // so it picks up date changes after midnight.
  const today = getTodayStr(timezone);
  const greeting = t(getGreetingKey(timezone));

  useEffect(() => { loadData(); }, [timezone]);

  async function loadData() {
    logger.info(MODULE, 'loadData');
    setLoading(true);
    setError(null);
    try {
      // Recompute today inside the effect so it stays accurate after midnight
      const currentToday = getTodayStr(timezone);
      const [s, tasks, journal, events] = await Promise.all([
        getDashboardStats(currentToday),
        getTasks({}),
        getJournal(currentToday),
        getEventsByDate(currentToday),
      ]);
      setStats(s);
      // Renamed `t` → `task` to avoid shadowing the translation function
      setRecentTasks(tasks.filter(task => task.status !== 'done').slice(0, 5));
      setTodayEvents(events.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setTodayJournal(journal);
      logger.success(MODULE, 'loadData', { notes: s.notes, tasks: tasks.length, events: events.length });
    } catch (err) {
      logger.error(MODULE, 'loadData', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;

  if (error) return (
    <div className="page">
      <div className="empty-state">
        <div className="icon">⚠️</div>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>{t('common.retry') || 'Retry'}</button>
      </div>
    </div>
  );

  if (!stats) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>{greeting}</h2>
        <p>{formatFullDate(today, lang, timezone)}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent" onClick={() => navigate('notes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.notes}</div>
          <div className="stat-label">{t('dash.stat.notes')}</div>
        </div>
        <div className="stat-card amber" onClick={() => navigate('tasks')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.todoPending}</div>
          <div className="stat-label">{t('dash.stat.pendingTasks')}</div>
        </div>
        <div className="stat-card green" onClick={() => navigate('calendar')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.todayEvents}</div>
          <div className="stat-label">{t('dash.stat.todayEvents')}</div>
        </div>
        <div className="stat-card blue" onClick={() => navigate('study')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.dueCards}</div>
          <div className="stat-label">{t('dash.stat.dueCards')}</div>
        </div>
        {/* GPA & Finance Cards for Student App */}
        <div className="stat-card pink" onClick={() => navigate('courses')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{stats.gpa !== undefined ? stats.gpa.toFixed(2) : '0.00'}</div>
          <div className="stat-label">GPA Tích lũy (DUT)</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã đạt {stats.credits || 0} tín chỉ</div>
        </div>
        <div className="stat-card red" onClick={() => navigate('expenses')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">💸</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '6px', marginBottom: '4px' }}>
            {stats.thisMonthExpenses !== undefined ? stats.thisMonthExpenses.toLocaleString() : '0'}đ
          </div>
          <div className="stat-label">Chi tiêu tháng này</div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((stats.thisMonthExpenses || 0) / (stats.budget || 3000000)) * 100)}%`, background: 'var(--red)', height: '100%' }} />
          </div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card red" onClick={() => navigate('tasks')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">{t('dash.stat.overdueTasks')}</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3>{t('dash.schedule')}</h3>
              <button className="btn btn-sm" onClick={() => navigate('calendar')}>{t('nav.calendar')}</button>
            </div>
            {todayEvents.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('dash.noEvents')} <span style={{ cursor: 'pointer', color: 'var(--accent-light)' }} onClick={() => navigate('calendar')}>+</span>
              </div>
            ) : (
              todayEvents.slice(0, 5).map(event => (
                <div key={event.id} className="list-item" onClick={() => navigate('calendar')}
                  style={{ borderLeft: `3px solid ${event.color}`, opacity: event.completed ? 0.5 : 1, textDecoration: event.completed ? 'line-through' : 'none' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '50px', flexShrink: 0 }}>
                    {event.startTime}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.88rem' }}>{event.title}</span>
                  <span style={{ fontSize: '0.7rem', color: event.color }}>{event.endTime}</span>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>{t('dash.upcomingTasks')}</h3>
              <button className="btn btn-sm" onClick={() => navigate('tasks')}>{t('common.all')}</button>
            </div>
            {recentTasks.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('dash.noTasks')}</div>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="list-item" onClick={() => navigate('tasks')}>
                  <span className={`priority-${task.priority}`}>
                    {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                  <span style={{ flex: 1 }}>{task.title}</span>
                  {task.dueDate && <span className="tag tag-amber">{task.dueDate}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><h3>{t('dash.quickActions')}</h3></div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button className="btn" onClick={() => navigate('notes')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.note')}</button>
              <button className="btn" onClick={() => navigate('tasks')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.task')}</button>
              <button className="btn" onClick={() => navigate('calendar')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.event')}</button>
              <button className="btn" onClick={() => navigate('study')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.study')}</button>
              <button className="btn" onClick={() => navigate('journal')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.journal')}</button>
              <button className="btn" onClick={() => navigate('search')} style={{ justifyContent: 'flex-start' }}>{t('dash.action.search')}</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>{t('dash.journalStatus')}</h3></div>
            <div style={{ padding: '8px 0' }}>
              {todayJournal ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getMoodEmoji(todayJournal.mood)}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t('dash.journal.written')}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      {todayJournal.content.slice(0, 100)}{todayJournal.content.length > 100 ? '...' : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('dash.journal.unwritten')}</span>
                  <span style={{ cursor: 'pointer', color: 'var(--accent-light)' }} onClick={() => navigate('journal')}>{t('dash.journal.start')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMoodEmoji(mood) {
  const map = { great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😢' };
  return map[mood] || '😐';
}
