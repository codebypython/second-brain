import { useState, useEffect } from 'react';
import { getDashboardStats } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';

export default function Sidebar({ activePage, onNavigate }) {
  const { profile, t, timezone } = useAppContext();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = () => getDashboardStats(getTodayStr(timezone)).then(setStats);
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
      { id: 'calendar', icon: '📅', label: t('nav.calendar'), badge: stats.todayEvents },
      { id: 'study', icon: '🎓', label: t('nav.study'), badge: stats.dueCards },
      { id: 'journal', icon: '📔', label: t('nav.journal') },
    ]},
    { section: 'System', items: [
      { id: 'settings', icon: '⚙️', label: t('nav.settings') },
    ]},
  ];

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
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={() => onNavigate('settings')}>💾 {t('nav.backup')}</button>
      </div>
    </aside>
  );
}
