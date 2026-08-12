import { useState, useEffect } from 'react';
import { getDashboardStats } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Sidebar';

export default function Sidebar({ activePage, onNavigate }) {
  const { profile, t, timezone, pomoTimeLeft, pomoIsRunning, pomoMode } = useAppContext();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        logger.info(MODULE, 'Fetching dashboard stats');
        const result = await getDashboardStats(getTodayStr(timezone));
        setStats(result);
        logger.success(MODULE, 'Dashboard stats loaded', result);
      } catch (err) {
        logger.error(MODULE, 'Failed to fetch dashboard stats', err);
        // Silently catch — keep previous stats, don't break the sidebar
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [activePage, timezone]);

  const navItems = [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: '⚡', label: t('nav.dashboard') },
      { id: 'search', icon: '🔍', label: t('nav.search') },
    ]},
    { section: 'Workspace', items: [
      { id: 'notes', icon: '📝', label: t('nav.notes'), badge: stats.notes },
      { id: 'tasks', icon: '✅', label: t('nav.tasks'), badge: stats.todoPending },
      { id: 'pomodoro', icon: '⏱️', label: t('nav.pomodoro') },
      { id: 'calendar', icon: '📅', label: t('nav.calendar'), badge: stats.todayEvents },
      { id: 'courses', icon: '🎓', label: t('nav.courses') },
      { id: 'career', icon: '🏆', label: t('nav.career') },
      { id: 'network', icon: '👥', label: t('nav.network') },
      { id: 'selfActualization', icon: '🌟', label: t('nav.selfActualization') },
      { id: 'expenses', icon: '💸', label: t('nav.expenses') },
      { id: 'power', icon: '⚡', label: t('nav.power') },
      { id: 'health', icon: '💪', label: t('nav.health') },
      { id: 'study', icon: '📚', label: t('nav.study'), badge: stats.dueCards },
      { id: 'journal', icon: '📔', label: t('nav.journal') },
    ]},
    { section: 'System', items: [
      { id: 'settings', icon: '⚙️', label: t('nav.settings') },
    ]},
  ];

  const formatWidgetTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">{profile?.avatar || '🧠'}</div>
        <h1>{t('app.title')}</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div className="nav-section" key={section.section}>
            {/* We could translate sections, but for now they are purely structural or we can hide the text */}
            {section.items.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon-wrapper">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Global Pomodoro Widget */}
      {pomoTimeLeft !== undefined && (
        <div className={`sidebar-pomo-widget ${pomoIsRunning ? 'active' : ''}`} onClick={() => onNavigate('pomodoro')}>
          <div className="widget-header">
            <span>{pomoMode === 'focus' ? '🎯 Focus' : '☕ Break'}</span>
            <span className="pomo-dot" />
          </div>
          <div className="widget-time">{formatWidgetTime(pomoTimeLeft)}</div>
        </div>
      )}

      <div className="sidebar-footer">
        <button onClick={() => onNavigate('settings')}>💾 {t('nav.backup')}</button>
      </div>
    </aside>
  );
}
