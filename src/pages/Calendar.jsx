import { useState, useEffect, useRef } from 'react';
import { getEventsRange, createEvent, updateEvent, deleteEvent, getTasks, toggleEventComplete } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Calendar';

/**
 * Formats a Date object as YYYY-MM-DD using local timezone (avoids UTC shift from toISOString).
 */
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Calendar() {
  const { t, timezone, lang } = useAppContext();
  const todayStr = getTodayStr(timezone);

  const [view, setView] = useState('day'); // day, week, month
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [events, setEvents] = useState([]);
  const [dueTasks, setDueTasks] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | event object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    title: '', date: currentDate, startTime: '09:00', endTime: '10:00', 
    category: 'general', color: '#6c5ce7', description: '', repeat: 'none'
  });

  const scrollRef = useRef(null);

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => { load(); }, [currentDate, view]);
  useEffect(() => {
    if (view === 'day' && scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 60; // scroll to 8 AM
    }
  }, [view]);

  async function load() {
    let from, to;
    const d = new Date(currentDate + 'T00:00:00');
    
    if (view === 'day') {
      from = currentDate; to = currentDate;
    } else if (view === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const start = new Date(d.getFullYear(), d.getMonth(), diff);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      from = formatLocalDate(start);
      to = formatLocalDate(end);
    } else {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      from = formatLocalDate(start);
      to = formatLocalDate(end);
    }

    logger.info(MODULE, 'Loading events', { view, from, to });
    setLoading(true);
    setError(null);
    try {
      const [e, tasks] = await Promise.all([getEventsRange(from, to), getTasks()]);
      setEvents(e);
      setDueTasks(tasks.filter(taskItem => taskItem.dueDate >= from && taskItem.dueDate <= to && taskItem.status !== 'done'));
      logger.success(MODULE, 'Loaded events and tasks', { events: e.length, dueTasks: tasks.length });
    } catch (err) {
      logger.error(MODULE, 'Failed to load events', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function openNew(date = currentDate, time = '09:00') {
    setForm({ title: '', date, startTime: time, endTime: addHour(time), category: 'general', color: '#6c5ce7', description: '', repeat: 'none' });
    setEditing('new');
  }

  function openEdit(evt) {
    setForm({ ...evt });
    setEditing(evt);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    logger.info(MODULE, editing === 'new' ? 'Creating event' : 'Updating event', { title: form.title });
    try {
      if (editing === 'new') {
        await createEvent(form);
        logger.success(MODULE, 'Event created', { title: form.title });
      } else {
        await updateEvent(editing.id, form);
        logger.success(MODULE, 'Event updated', { id: editing.id, title: form.title });
      }
      setEditing(null);
      load();
    } catch (err) {
      logger.error(MODULE, 'Failed to save event', err);
      alert('Failed to save event. Please try again.');
    }
  }

  async function handleDelete(id) {
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'Deleting event', { id });
      try {
        await deleteEvent(id);
        logger.success(MODULE, 'Event deleted', { id });
        setEditing(null);
        load();
      } catch (err) {
        logger.error(MODULE, 'Failed to delete event', err);
        alert('Failed to delete event. Please try again.');
      }
    }
  }

  function navDate(dir) {
    const d = new Date(currentDate + 'T00:00:00');
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(formatLocalDate(d));
  }

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
  const COLORS = ['#6c5ce7', '#0984e3', '#fdcb6e', '#00b894', '#ff7675', '#fd79a8'];
  const CATEGORIES = [
    { id: 'general', label: t('cal.cat.general') },
    { id: 'study', label: t('cal.cat.study') },
    { id: 'work', label: t('cal.cat.work') },
    { id: 'personal', label: t('cal.cat.personal') },
    { id: 'health', label: t('cal.cat.health') },
    { id: 'social', label: t('cal.cat.social') }
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px 32px' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h2>{t('cal.title')}</h2>
        <p>{t('cal.desc')}</p>
      </div>

      <div className="toolbar" style={{ marginBottom: '16px' }}>
        <div className="tabs">
          <button className={`tab ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>{t('cal.tab.day')}</button>
          <button className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>{t('cal.tab.week')}</button>
          <button className={`tab ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>{t('cal.tab.month')}</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '24px' }}>
          <button className="btn btn-ghost" onClick={() => navDate(-1)}>◀</button>
          <button className="btn btn-ghost" onClick={() => setCurrentDate(todayStr)}>{t('common.today')}</button>
          <button className="btn btn-ghost" onClick={() => navDate(1)}>▶</button>
          <span style={{ fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
            {new Date(currentDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={() => openNew(currentDate)}>{t('cal.new')}</button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--red-bg, #ff6b6b22)', color: 'var(--red, #ff6b6b)', borderRadius: '8px', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
        {/* Main Calendar Area */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              ⏳ {t('common.loading') || 'Loading...'}
            </div>
          )}

          {view === 'day' && (
            <div className="timeline-container" ref={scrollRef} style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
              {hours.map(h => {
                const timeStr = `${h.toString().padStart(2, '0')}:00`;
                const evts = events.filter(e => e.date === currentDate && parseInt(e.startTime) === h);
                return (
                  <div key={h} className="timeline-row" style={{ display: 'flex', borderBottom: '1px solid var(--border)', minHeight: '60px' }}>
                    <div style={{ width: '60px', padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', borderRight: '1px solid var(--border)' }}>
                      {timeStr}
                    </div>
                    <div style={{ flex: 1, position: 'relative', padding: '4px' }} onClick={(e) => e.target === e.currentTarget && openNew(currentDate, timeStr)}>
                      {evts.map(e => (
                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                          style={{
                            background: `${e.color}22`, borderLeft: `4px solid ${e.color}`, borderRadius: '4px', padding: '4px 8px',
                            marginBottom: '4px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                          }}>
                          <input type="checkbox" checked={e.completed} onChange={async (ev) => {
                            ev.stopPropagation();
                            try {
                              await toggleEventComplete(e.id);
                              load();
                            } catch (err) {
                              logger.error(MODULE, 'Failed to toggle event complete', err);
                            }
                          }}
                            style={{ cursor: 'pointer' }} />
                          <span style={{ textDecoration: e.completed ? 'line-through' : 'none', opacity: e.completed ? 0.6 : 1, flex: 1 }}>
                            <strong>{e.title}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{e.startTime} - {e.endTime}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Current Time Indicator */}
              {currentDate === todayStr && (
                <div style={{
                  position: 'absolute', left: '60px', right: 0, height: '2px', background: 'var(--red)', zIndex: 10, pointerEvents: 'none',
                  top: `${(new Date().getHours() - 6 + new Date().getMinutes() / 60) * 60}px`
                }}>
                  <div style={{ position: 'absolute', left: '-6px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red)' }} />
                </div>
              )}
            </div>
          )}

          {view === 'week' && (
            <div style={{ display: 'flex', flex: 1, gap: '12px', overflowX: 'auto', padding: '12px 8px', minHeight: 0 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const base = new Date(currentDate + 'T00:00:00');
                const baseDay = base.getDay();
                const mondayOffset = baseDay === 0 ? -6 : 1 - baseDay;
                const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + mondayOffset + i);
                const dateStr = formatLocalDate(date);
                const isTodayStr = dateStr === todayStr;

                const dayEvents = events.filter(e => e.date === dateStr)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={i} style={{
                    flex: 1, minWidth: '150px', background: isTodayStr ? 'rgba(108, 92, 231, 0.04)' : 'var(--bg-glass)',
                    border: isTodayStr ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', padding: '12px',
                    boxShadow: isTodayStr ? 'var(--shadow-glow)' : 'none', transition: 'var(--transition)',
                    minHeight: 0
                  }}>
                    {/* Day Column Header */}
                    <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', userSelect: 'none' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {date.toLocaleDateString(locale, { weekday: 'short' })}
                      </div>
                      <div style={{
                        fontSize: '1.25rem', fontWeight: 700, margin: '2px 0',
                        color: isTodayStr ? 'var(--accent-light)' : 'var(--text-primary)'
                      }}>
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Events Container */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', minHeight: '180px' }}
                         onClick={(e) => e.target === e.currentTarget && openNew(dateStr)}>
                      {dayEvents.map(e => (
                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                          style={{
                            background: 'var(--bg-card)', borderLeft: `4px solid ${e.color}`, borderRadius: 'var(--radius-md)',
                            padding: '10px 8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px',
                            boxShadow: 'var(--shadow-sm)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', transition: 'var(--transition)'
                          }}
                          onMouseEnter={(el) => { el.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                          onMouseLeave={(el) => { el.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <input type="checkbox" checked={e.completed} onChange={async (ev) => {
                              ev.stopPropagation();
                              try {
                                await toggleEventComplete(e.id);
                                load();
                              } catch (err) {
                                logger.error(MODULE, 'Failed to toggle event complete', err);
                              }
                            }} style={{ cursor: 'pointer', marginTop: '2px' }} />
                            <span style={{
                              fontWeight: 600, textDecoration: e.completed ? 'line-through' : 'none',
                              opacity: e.completed ? 0.6 : 1, wordBreak: 'break-word', color: 'var(--text-primary)',
                              fontSize: '0.82rem', lineHeight: 1.3
                            }}>
                              {e.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <span>{e.startTime}</span>
                            <span className={`tag tag-${e.category === 'study' ? 'green' : e.category === 'work' ? 'blue' : 'accent'}`} style={{ padding: '2px 6px', fontSize: '0.62rem', fontWeight: 500 }}>
                              {t(`cal.cat.${e.category}`)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}
                             onClick={() => openNew(dateStr)}>
                          <button className="btn btn-ghost btn-sm" style={{ width: '100%', height: '100%', fontSize: '1.2rem', padding: '16px' }}>➕</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'month' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '12px 16px' }}>
              {/* Day Labels Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const base = new Date(2026, 0, 5 + i); // Jan 5, 2026 is a Monday
                  return (
                    <div key={i} style={{ flex: 1, padding: '10px 4px', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                      {base.toLocaleDateString(locale, { weekday: 'short' })}
                    </div>
                  );
                })}
              </div>

              {/* Month Day Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1,
                borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                overflow: 'hidden', background: 'var(--border)'
              }}>
                {(() => {
                  const base = new Date(currentDate + 'T00:00:00');
                  const year = base.getFullYear();
                  const month = base.getMonth();
                  
                  const firstDay = new Date(year, month, 1);
                  const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday
                  const mondayOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
                  
                  const cells = [];
                  for (let i = 0; i < 42; i++) {
                    const date = new Date(year, month, 1 + mondayOffset + i);
                    cells.push(date);
                  }

                  return cells.map((date, idx) => {
                    const dateStr = formatLocalDate(date);
                    const isCurrentMonth = date.getMonth() === month;
                    const isTodayStr = dateStr === todayStr;
                    const dayEvents = events.filter(e => e.date === dateStr)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                      <div key={idx} 
                        onClick={(ev) => ev.target === ev.currentTarget && openNew(dateStr)}
                        style={{
                          background: isTodayStr ? 'rgba(108, 92, 231, 0.05)' : (isCurrentMonth ? 'var(--bg-card)' : 'rgba(10, 10, 15, 0.4)'),
                          borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)',
                          padding: '6px 8px', display: 'flex', flexDirection: 'column', minHeight: 0,
                          position: 'relative', cursor: 'pointer', transition: 'var(--transition)'
                        }}
                        onMouseEnter={(el) => { if (isCurrentMonth) el.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                        onMouseLeave={(el) => { if (isCurrentMonth) el.currentTarget.style.background = isTodayStr ? 'rgba(108, 92, 231, 0.05)' : 'var(--bg-card)'; }}
                      >
                        {/* Day Cell Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', userSelect: 'none' }}>
                          <span style={{
                            fontSize: '0.78rem', fontWeight: isTodayStr ? 700 : 500,
                            color: isTodayStr ? 'white' : (isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                            background: isTodayStr ? 'var(--accent)' : 'transparent',
                            width: isTodayStr ? '20px' : 'auto', height: isTodayStr ? '20px' : 'auto',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isTodayStr ? 'var(--shadow-glow)' : 'none'
                          }}>
                            {date.getDate()}
                          </span>
                          {dayEvents.length > 0 && isCurrentMonth && (
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {dayEvents.length} {t('cal.events') || 'ev'}
                            </span>
                          )}
                        </div>

                        {/* Miniature Event List */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                          {dayEvents.slice(0, 3).map(e => (
                            <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                              style={{
                                background: e.color, color: 'white', fontSize: '0.62rem', padding: '2px 4px',
                                borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                fontWeight: 600, opacity: e.completed ? 0.5 : 0.9, textDecoration: e.completed ? 'line-through' : 'none',
                                transition: 'var(--transition)'
                              }}
                              onMouseEnter={(el) => { el.currentTarget.style.opacity = '1'; }}
                              onMouseLeave={(el) => { el.currentTarget.style.opacity = e.completed ? '0.5' : '0.9'; }}
                            >
                              {e.startTime} {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700, marginTop: '2px' }}>
                              + {dayEvents.length - 3} {t('common.more') || 'more'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Due Tasks */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="card-header">
              <h3>{t('cal.dueTasks')}</h3>
            </div>
            {dueTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('tasks.empty')}</p>
            ) : (
              dueTasks.map(tObj => (
                <div key={tObj.id} className="list-item" style={{ padding: '8px' }}>
                  <span className={`priority-${tObj.priority}`}>
                    {tObj.priority === 'high' ? '🔴' : tObj.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{tObj.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>{editing === 'new' ? t('cal.new') : t('cal.edit')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes.form.title')}</label>
              <input className="input" placeholder="..." value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('cal.form.date')}</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('cal.form.category')}</label>
                <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('cal.form.startTime')}</label>
                <input className="input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('cal.form.endTime')}</label>
                <input className="input" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('cal.form.repeat')}</label>
                <select className="select" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
                  <option value="none">{t('cal.rep.none')}</option>
                  <option value="daily">{t('cal.rep.daily')}</option>
                  <option value="weekday">{t('cal.rep.weekday')}</option>
                  <option value="weekly">{t('cal.rep.weekly')}</option>
                  <option value="monthly">{t('cal.rep.monthly')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('tasks.proj.color')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, color: c })}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : 'none', boxShadow: form.color === c ? '0 0 0 2px var(--accent)' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('tasks.form.desc')}</label>
              <textarea className="textarea" style={{ minHeight: '60px' }} placeholder="..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="modal-actions">
              {editing !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDelete(editing.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function addHour(timeStr) {
  const [h, m] = timeStr.split(':');
  const nextHour = (parseInt(h) + 1) % 24;
  return `${nextHour.toString().padStart(2, '0')}:${m}`;
}
