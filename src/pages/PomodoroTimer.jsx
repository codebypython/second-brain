import { useState, useEffect, useRef } from 'react';
import { getCourses, getTasks, createPomodoroLog, getPomodoroLogs } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'PomodoroTimer';

export default function PomodoroTimer({ pageParams }) {
  const {
    t, lang, timezone,
    pomoMode,
    pomoTimeLeft, pomoTotalTime,
    pomoIsRunning, setPomoIsRunning,
    pomoCourseId, setPomoCourseId,
    pomoTaskId, setPomoTaskId,
    pomoCompleted, setPomoCompleted,
    switchPomoMode
  } = useAppContext();
  
  // Database entities
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Save completion modal / panel
  const showCompletionForm = pomoCompleted;
  const [completedDuration, setCompletedDuration] = useState(0); // in minutes
  const [sessionNotes, setSessionNotes] = useState('');

  // Handle quick launch pageParams passed from other modules (Courses / Tasks)
  useEffect(() => {
    if (pageParams?.activeCourseId) {
      setPomoCourseId(String(pageParams.activeCourseId));
      setPomoTaskId('');
    } else if (pageParams?.activeTaskId) {
      setPomoTaskId(String(pageParams.activeTaskId));
      setPomoCourseId('');
    }
  }, [pageParams]);

  // Load courses, tasks, and recent pomodoro logs on mount
  useEffect(() => {
    loadDBData();
  }, []);

  useEffect(() => {
    if (pomoCompleted) {
      const minutesFocused = Math.round(pomoTotalTime / 60);
      setCompletedDuration(minutesFocused);
    }
  }, [pomoCompleted, pomoTotalTime]);

  async function loadDBData() {
    try {
      logger.info(MODULE, 'Loading courses, tasks, and logs');
      const [allCourses, allTasks, allLogs] = await Promise.all([
        getCourses(),
        getTasks(),
        getPomodoroLogs()
      ]);
      setCourses(allCourses);
      // Only keep unfinished tasks for linking
      setTasks(allTasks.filter(t => t.status !== 'done'));
      setLogs(allLogs);
      logger.success(MODULE, 'Successfully loaded DB dependencies');
    } catch (err) {
      logger.error(MODULE, 'Failed to load Pomodoro details', err);
    }
  }

  // Save the logged session
  const handleSaveLog = async () => {
    try {
      const today = getTodayStr(timezone);
      const logData = {
        courseId: pomoCourseId ? Number(pomoCourseId) : null,
        taskId: pomoTaskId ? Number(pomoTaskId) : null,
        duration: completedDuration,
        date: today,
        notes: sessionNotes.trim()
      };
      
      logger.info(MODULE, 'Saving pomodoro focus log to Dexie', logData);
      await createPomodoroLog(logData);
      
      // Reset forms and modal
      setPomoCompleted(false);
      setSessionNotes('');
      // Reload logs to update list and charts
      const updatedLogs = await getPomodoroLogs();
      setLogs(updatedLogs);
      
      // Auto-switch to short break as a reward!
      switchPomoMode('shortBreak');
    } catch (err) {
      logger.error(MODULE, 'Failed to save focus session', err);
      alert('Không thể lưu phiên tập trung: ' + err.message);
    }
  };

  const handleSkipSave = () => {
    setPomoCompleted(false);
    setSessionNotes('');
    switchPomoMode('shortBreak');
  };

  // Helper formatting MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Circular progress math
  const progressRatio = pomoTotalTime > 0 ? pomoTimeLeft / pomoTotalTime : 1;
  const strokeDashoffsetValue = 565.48 * (1 - progressRatio);

  // Statistics & History Math
  const todayStr = getTodayStr(timezone);
  const todayLogs = logs.filter(l => l.date === todayStr);
  const totalFocusMinutesToday = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalSessionsToday = todayLogs.length;

  // Most focused course stats
  const getMostFocusedCourseName = () => {
    const courseFocusMap = {};
    logs.forEach(log => {
      if (log.courseId) {
        courseFocusMap[log.courseId] = (courseFocusMap[log.courseId] || 0) + (log.duration || 0);
      }
    });
    let maxDuration = 0;
    let favCourseId = null;
    Object.keys(courseFocusMap).forEach(cid => {
      if (courseFocusMap[cid] > maxDuration) {
        maxDuration = courseFocusMap[cid];
        favCourseId = cid;
      }
    });
    if (!favCourseId) return '--';
    const found = courses.find(c => String(c.id) === String(favCourseId));
    return found ? `${found.name} (${maxDuration}m)` : '--';
  };

  // Calculate stats for the last 7 days chart
  const getPast7DaysDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  const getDayOfWeekLabel = (dateStr) => {
    // Avoid TZ offsets parsing YYYY-MM-DD
    const [y, m, d] = dateStr.split('-');
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const day = utcDate.getDay();
    if (lang === 'vi') {
      const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return labels[day];
    } else {
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return labels[day];
    }
  };

  const past7Days = getPast7DaysDates();
  const dailyFocusStats = past7Days.map(date => {
    const dayLogs = logs.filter(l => l.date === date);
    const minutes = dayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
    return {
      date,
      label: getDayOfWeekLabel(date),
      minutes
    };
  });

  const maxMinutesInPast7Days = Math.max(...dailyFocusStats.map(d => d.minutes), 60); // min scale is 60m

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('pomo.title')}</h2>
        <p>{t('pomo.desc')}</p>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVE TIMER */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: '20px' }}>
          
          {/* Mode Tabs */}
          <div className="tabs" style={{ background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              className={`tab ${pomoMode === 'focus' ? 'active' : ''}`} 
              onClick={() => switchPomoMode('focus')}
            >
              🎯 {t('pomo.mode.focus')}
            </button>
            <button 
              className={`tab ${pomoMode === 'shortBreak' ? 'active' : ''}`} 
              onClick={() => switchPomoMode('shortBreak')}
            >
              ☕ {t('pomo.mode.shortBreak')}
            </button>
            <button 
              className={`tab ${pomoMode === 'longBreak' ? 'active' : ''}`} 
              onClick={() => switchPomoMode('longBreak')}
            >
              🌴 {t('pomo.mode.longBreak')}
            </button>
          </div>

          {/* Interactive Progress Ring & Clock */}
          <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Progress Circle */}
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="110"
                cy="110"
                r="90"
                stroke={pomoMode === 'focus' ? 'var(--accent)' : 'var(--green)'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={565.48}
                strokeDashoffset={strokeDashoffsetValue}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.25s linear' }}
              />
            </svg>

            {/* Glowing Digital Time */}
            <div style={{ zIndex: 1, textAlign: 'center' }}>
              <div style={{ 
                fontFamily: 'Courier, monospace', 
                fontSize: '2.8rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)',
                textShadow: pomoMode === 'focus' ? '0 0 16px var(--accent-glow)' : '0 0 16px var(--green-glow)',
                letterSpacing: '1px'
              }}>
                {formatTime(pomoTimeLeft)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {pomoMode === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            <button 
              className={`btn ${pomoIsRunning ? 'btn-ghost' : 'btn-primary'}`} 
              onClick={() => setPomoIsRunning(!pomoIsRunning)}
              style={{ flex: 1, maxWidth: '140px', padding: '10px 0', justifyContent: 'center', border: pomoIsRunning ? '1px solid var(--border-hover)' : 'none' }}
            >
              {pomoIsRunning ? t('pomo.btn.pause') : t('pomo.btn.start')}
            </button>
            
            <button 
              className="btn" 
              onClick={() => switchPomoMode(pomoMode)}
              style={{ padding: '10px 16px' }}
              title="Làm mới đồng hồ"
            >
              {t('pomo.btn.reset')}
            </button>
          </div>

          {/* Link Project Entities */}
          {!pomoIsRunning && !showCompletionForm && (
            <div style={{ width: '100%', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>🔗 {t('pomo.link.course')}</label>
                <select 
                  className="select" 
                  value={pomoCourseId} 
                  onChange={e => {
                    setPomoCourseId(e.target.value);
                    if (e.target.value) setPomoTaskId(''); // Mutually exclusive for clarity
                  }}
                  style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  <option value="">-- Chọn môn học để tính giờ --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>🔗 {t('pomo.link.task')}</label>
                <select 
                  className="select" 
                  value={pomoTaskId} 
                  onChange={e => {
                    setPomoTaskId(e.target.value);
                    if (e.target.value) setPomoCourseId(''); // Mutually exclusive
                  }}
                  style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  <option value="">-- Chọn công việc đang làm --</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Session Complete Saved Form */}
          {showCompletionForm && (
            <div className="card" style={{ width: '100%', background: 'rgba(108, 92, 231, 0.08)', border: '1px solid var(--border-accent)', padding: '16px', borderRadius: 'var(--radius-md)', animation: 'fadeIn 0.3s ease' }}>
              <h4 style={{ color: 'var(--accent-light)', marginBottom: '8px', fontSize: '0.88rem' }}>
                {t('pomo.session.complete')}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Thời gian ghi nhận: <strong>{completedDuration} phút</strong>
              </p>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem' }}>{t('pomo.form.notes')}</label>
                <textarea 
                  className="textarea" 
                  value={sessionNotes} 
                  onChange={e => setSessionNotes(e.target.value)} 
                  placeholder="Ghi nhanh nội dung vừa hoàn thành (VD: code xong UI đăng nhập, đọc xong chương 3 lý thuyết...)" 
                  style={{ minHeight: '60px', padding: '8px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button className="btn btn-sm" onClick={handleSkipSave}>
                  Bỏ qua
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleSaveLog}>
                  {t('common.save')} log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STATS AND HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STATS OVERVIEW & CHART */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📊 Thống kê tập trung</span>
            </h3>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Hôm nay</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>{totalFocusMinutesToday} <span style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>phút</span></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Số phiên ngày</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--green)' }}>{totalSessionsToday} <span style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>phiên</span></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tập trung nhiều nhất</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '6px' }} title={getMostFocusedCourseName()}>
                  {getMostFocusedCourseName()}
                </div>
              </div>
            </div>

            {/* 7-Days Chart */}
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Số phút tập trung 7 ngày qua</h4>
            <div style={{ 
              height: '110px', 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              padding: '12px 10px 4px 10px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)'
            }}>
              {dailyFocusStats.map((day, idx) => {
                const pct = Math.min(100, (day.minutes / maxMinutesInPast7Days) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.62rem', color: day.minutes > 0 ? 'var(--accent-light)' : 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>
                      {day.minutes > 0 ? `${day.minutes}p` : ''}
                    </div>
                    <div 
                      style={{ 
                        width: '18px', 
                        background: day.minutes > 0 ? 'linear-gradient(to top, var(--accent), var(--accent-light))' : 'rgba(255, 255, 255, 0.03)', 
                        height: day.minutes > 0 ? `${pct}%` : '4px', 
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.5s ease-out'
                      }} 
                    />
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT LOGS LIST */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '380px' }}>
            <h3 style={{ marginBottom: '12px' }}>⏱️ {t('pomo.history.title')}</h3>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {t('pomo.history.empty')}
                </div>
              ) : (
                logs.map(log => {
                  // Find course and task metadata
                  const matchedCourse = log.courseId ? courses.find(c => Number(c.id) === Number(log.courseId)) : null;
                  const matchedTask = log.taskId ? tasks.find(t => Number(t.id) === Number(log.taskId)) : null;
                  
                  // Format time
                  let displayTime = '';
                  if (log.timestamp) {
                    try {
                      const timePart = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dateParts = log.date.split('-');
                      displayTime = `${timePart} - ${dateParts[2]}/${dateParts[1]}`;
                    } catch (e) {
                      displayTime = log.date;
                    }
                  } else {
                    displayTime = log.date;
                  }

                  return (
                    <div 
                      key={log.id} 
                      style={{ 
                        padding: '10px 12px', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-light)' }}>
                          ⏱️ {log.duration} phút tập trung
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {displayTime}
                        </span>
                      </div>

                      {/* Course / Task tags */}
                      {(matchedCourse || matchedTask) && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {matchedCourse && (
                            <span className="tag tag-accent" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              🎓 {matchedCourse.name}
                            </span>
                          )}
                          {matchedTask && (
                            <span className="tag tag-green" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              ✅ {matchedTask.title}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Session notes */}
                      {log.notes && (
                        <div style={{ 
                          marginTop: '4px', 
                          padding: '6px 8px', 
                          background: 'var(--bg-input)', 
                          borderRadius: '4px', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.76rem',
                          fontStyle: 'italic'
                        }}>
                          {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
