import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import WorkoutBuilder from '../components/WorkoutBuilder';
import {
  createChillClassSchedule,
  getChillClassSchedules,
  deleteChillClassSchedule,
  createChillDailySchedule,
  getChillDailySchedules,
  deleteChillDailySchedule,
  updateChillDailySchedule,
} from '../store/db';

const COLOR_PALETTE = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
  '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867',
  '#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'
];

const PERIOD_TIMES = [
  { period: 1, start: '07:00', end: '07:45' },
  { period: 2, start: '07:45', end: '08:30' },
  { period: 3, start: '08:45', end: '09:30' },
  { period: 4, start: '09:30', end: '10:15' },
  { period: 5, start: '10:15', end: '11:00' },
  { period: 6, start: '13:00', end: '13:45' },
  { period: 7, start: '13:45', end: '14:30' },
  { period: 8, start: '14:45', end: '15:30' },
  { period: 9, start: '15:30', end: '16:15' },
  { period: 10, start: '16:15', end: '17:00' },
];

export default function ChillSchedules() {
  const [activeTab, setActiveTab] = useState('class');
  const [classSchedules, setClassSchedules] = useState([]);
  const [dailySchedules, setDailySchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedCourseModal, setSelectedCourseModal] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Daily Activity Form State
  const [dailyName, setDailyName] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeDailySchedule, setActiveDailySchedule] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: '', startTime: '08:00', endTime: '09:00', category: 'study' });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const cs = await getChillClassSchedules();
    const ds = await getChillDailySchedules();
    setClassSchedules(cs);
    setDailySchedules(ds);
    if (cs.length > 0 && !selectedSchedule) {
      setSelectedSchedule(cs[0]);
    }
  };

  // Parse Schedule String like "Thứ 4,1-3,E2.403; Thứ 6,6-8,A101"
  const parseScheduleString = (str) => {
    if (!str || typeof str !== 'string') return [];
    const parts = str.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
    const results = [];

    parts.forEach(part => {
      const dayMatch = part.match(/Thứ\s*(\d+)/i);
      let day = null;
      if (dayMatch) {
        const d = parseInt(dayMatch[1], 10);
        if (d >= 2 && d <= 7) day = d;
      }

      let periodStr = part;
      const commaIdx = part.indexOf(',');
      if (commaIdx !== -1) periodStr = part.substring(commaIdx + 1);

      const periodMatch = periodStr.match(/(\d+)\s*[-–]\s*(\d+)/);
      const periods = [];
      if (periodMatch) {
        const start = parseInt(periodMatch[1], 10);
        const end = parseInt(periodMatch[2], 10);
        if (start >= 1 && start <= 10 && end >= 1 && end <= 10 && start <= end) {
          for (let p = start; p <= end; p++) periods.push(p);
        }
      }

      const roomMatch = part.match(/([A-Z]\d+\.?\d*|[A-Z]\d+)(?:\s|$)/);
      const room = roomMatch ? roomMatch[1].trim() : '';

      if (day && periods.length > 0) {
        results.push({ day, periods, room });
      }
    });

    return results;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rawJson.length < 2) {
          alert('File Excel không có dữ liệu phù hợp!');
          return;
        }

        const headers = rawJson[0];
        const findCol = (names) => {
          for (let i = 0; i < headers.length; i++) {
            const h = String(headers[i] || '').toLowerCase();
            if (names.some(n => h.includes(n.toLowerCase()))) return i;
          }
          return -1;
        };

        const colIndices = {
          code: findCol(['Mã lớp', 'Mã HP', 'Code']),
          name: findCol(['Tên lớp', 'Tên môn', 'Name']),
          credits: findCol(['Số TC', 'TC', 'Credits']),
          instructor: findCol(['Giảng viên', 'GV', 'Instructor']),
          schedule: findCol(['Thời khóa biểu', 'Lịch học', 'Schedule']),
          weeks: findCol(['Tuần học', 'Weeks', 'Tuần'])
        };

        const courses = [];
        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.every(cell => !cell)) continue;

          const name = colIndices.name !== -1 ? String(row[colIndices.name] || '').trim() : '';
          const code = colIndices.code !== -1 ? String(row[colIndices.code] || '').trim() : '';
          const scheduleStr = colIndices.schedule !== -1 ? String(row[colIndices.schedule] || '').trim() : '';

          if (name || code) {
            courses.push({
              code: code || `HP-${i}`,
              name: name || 'Học phần chưa tên',
              credits: colIndices.credits !== -1 ? Number(row[colIndices.credits]) || 3 : 3,
              instructor: colIndices.instructor !== -1 ? String(row[colIndices.instructor] || '').trim() : 'Chưa phân công',
              scheduleStr,
              scheduleInfo: parseScheduleString(scheduleStr),
              weeks: colIndices.weeks !== -1 ? String(row[colIndices.weeks] || '').trim() : '1-15',
              color: COLOR_PALETTE[(courses.length) % COLOR_PALETTE.length]
            });
          }
        }

        const newSchedule = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          semester: 'Học kỳ 1',
          courses,
          createdAt: new Date().toISOString()
        };

        await createChillClassSchedule(newSchedule);
        await loadSchedules();
        setSelectedSchedule(newSchedule);
      } catch (err) {
        console.error('Excel parse failed:', err);
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng file!');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Build 10-period timetable map (period -> day -> courses)
  const buildTimetableMap = (courses = []) => {
    const map = {};
    for (let p = 1; p <= 10; p++) {
      map[p] = {};
      for (let d = 2; d <= 7; d++) {
        map[p][d] = [];
      }
    }

    courses.forEach(course => {
      (course.scheduleInfo || []).forEach(entry => {
        const day = entry.day;
        (entry.periods || []).forEach(p => {
          if (p >= 1 && p <= 10 && day >= 2 && day <= 7) {
            map[p][day].push({
              ...course,
              room: entry.room || 'Chưa xếp'
            });
          }
        });
      });
    });

    return map;
  };

  // Handle Daily Schedule Operations
  const handleAddDailySchedule = async () => {
    if (!dailyName.trim()) return;
    const scheduleObj = {
      name: dailyName,
      date: dailyDate,
      weekday: new Date(dailyDate).getDay(),
      activities: [
        { id: 1, title: 'Thức dậy & Vệ sinh cá nhân', startTime: '06:30', endTime: '07:00', category: 'routine', status: 'completed' },
        { id: 2, title: 'Học tập & Ôn bài', startTime: '08:00', endTime: '10:30', category: 'study', status: 'pending' },
        { id: 3, title: 'Ăn trưa & Nghỉ ngơi', startTime: '12:00', endTime: '13:00', category: 'routine', status: 'pending' },
      ]
    };
    await createChillDailySchedule(scheduleObj);
    setDailyName('');
    await loadSchedules();
    setActiveDailySchedule(scheduleObj);
  };

  const handleToggleActivity = async (schedule, activityId, newStatus) => {
    const updatedActivities = schedule.activities.map(act => 
      act.id === activityId ? { ...act, status: newStatus } : act
    );
    const updatedSchedule = { ...schedule, activities: updatedActivities };
    await updateChillDailySchedule(schedule.id, updatedSchedule);
    await loadSchedules();
    setActiveDailySchedule(updatedSchedule);
  };

  const handleAddActivityToDaily = async () => {
    if (!activeDailySchedule || !newActivity.title.trim()) return;
    const activityObj = {
      id: Date.now(),
      ...newActivity,
      status: 'pending'
    };
    const updatedActivities = [...(activeDailySchedule.activities || []), activityObj];
    const updatedSchedule = { ...activeDailySchedule, activities: updatedActivities };
    await updateChillDailySchedule(activeDailySchedule.id, updatedSchedule);
    await loadSchedules();
    setActiveDailySchedule(updatedSchedule);
    setNewActivity({ title: '', startTime: '08:00', endTime: '09:00', category: 'study' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button className={`tab ${activeTab === 'class' ? 'active' : ''}`} onClick={() => setActiveTab('class')}>
          📚 Thời Khóa Biểu Học Phần
        </button>
        <button className={`tab ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>
          🏠 Lịch Sinh Hoạt Hàng Ngày
        </button>
        <button className={`tab ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')}>
          💪 Lịch Tập Luyện (Workout)
        </button>
      </div>

      {/* Tab 1: Class Timetable (Weekly Grid) */}
      {activeTab === 'class' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📅 Quản Lý Thời Khóa Biểu Tuần</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Nạp file Excel xuất từ cổng đào tạo để hiển thị ma trận lịch học 10 tiết.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                📤 Nạp File Excel (.xlsx)
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border)' }}>
                <button 
                  className={`btn ${viewMode === 'grid' ? 'primary' : ''}`} 
                  onClick={() => setViewMode('grid')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  📊 Ma Trận Lịch
                </button>
                <button 
                  className={`btn ${viewMode === 'list' ? 'primary' : ''}`} 
                  onClick={() => setViewMode('list')}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  📋 Danh Sách
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Selectors */}
          {classSchedules.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {classSchedules.map(cs => (
                <div 
                  key={cs.id}
                  onClick={() => setSelectedSchedule(cs)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedSchedule?.id === cs.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedSchedule?.id === cs.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '220px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cs.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cs.courses?.length || 0} môn học</div>
                  </div>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Xóa thời khóa biểu này?')) {
                        await deleteChillClassSchedule(cs.id);
                        await loadSchedules();
                        if (selectedSchedule?.id === cs.id) setSelectedSchedule(null);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Timetable Weekly Grid View (Tiết 1-10 across Thứ 2 -> Thứ 7) */}
          {selectedSchedule && viewMode === 'grid' && (
            <div className="schedule-table-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedSchedule.name}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  💡 Bấm vào từng môn học để xem thông tin chi tiết
                </div>
              </div>

              {(() => {
                const timetableMap = buildTimetableMap(selectedSchedule.courses);
                const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

                return (
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th className="period-header">Tiết</th>
                        <th className="time-header">Thời gian</th>
                        {days.map(d => <th key={d} className="day-header">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(period => (
                        <tr key={period}>
                          <td className="period-cell">{period}</td>
                          <td className="time-cell">
                            {PERIOD_TIMES[period - 1].start}<br />
                            {PERIOD_TIMES[period - 1].end}
                          </td>
                          {[2, 3, 4, 5, 6, 7].map(day => {
                            const coursesInSlot = timetableMap[period][day] || [];
                            return (
                              <td key={day} style={{ position: 'relative' }}>
                                {coursesInSlot.map((c, idx) => (
                                  <div 
                                    key={idx} 
                                    className="course-block"
                                    onClick={() => setSelectedCourseModal(c)}
                                    style={{ background: c.color || 'var(--accent)' }}
                                  >
                                    <div className="course-block-name">{c.name}</div>
                                    <div className="course-block-info">📍 Phòng: {c.room}</div>
                                    <div className="course-block-info">👨‍🏫 GV: {c.instructor}</div>
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {/* List View Fallback */}
          {selectedSchedule && viewMode === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {(selectedSchedule.courses || []).map((c, idx) => (
                <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: c.color }}>{c.name}</div>
                    <span className="tag tag-accent">{c.credits} TC</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mã HP: {c.code}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giảng viên: {c.instructor}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Lịch học: {c.scheduleStr || 'Chưa cập nhật'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daily Activity Schedule */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Create New Daily Schedule */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Tên lịch sinh hoạt (ví dụ: Ngày làm việc hiệu quả)..."
              value={dailyName}
              onChange={(e) => setDailyName(e.target.value)}
              style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <input 
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            <button onClick={handleAddDailySchedule} className="btn primary" style={{ padding: '10px 20px' }}>
              ➕ Tạo Lịch Mới
            </button>
          </div>

          {/* Daily Schedule Cards List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {dailySchedules.map(ds => {
              const totalActs = ds.activities?.length || 0;
              const completedActs = (ds.activities || []).filter(a => a.status === 'completed').length;
              const pct = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;

              return (
                <div 
                  key={ds.id} 
                  style={{
                    background: 'var(--bg-card)',
                    border: activeDailySchedule?.id === ds.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{ds.name}</div>
                    <button 
                      onClick={async () => {
                        await deleteChillDailySchedule(ds.id);
                        await loadSchedules();
                        if (activeDailySchedule?.id === ds.id) setActiveDailySchedule(null);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 Ngày: {ds.date}</div>
                  
                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span>Tiến độ</span>
                      <span>{completedActs}/{totalActs} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', background: 'var(--bg-tertiary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: 'var(--green)', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveDailySchedule(ds)}
                    className="btn secondary"
                    style={{ width: '100%', padding: '8px' }}
                  >
                    👁️ Quản Lý Hoạt Động
                  </button>
                </div>
              );
            })}
          </div>

          {/* Interactive Timeline of Active Daily Schedule */}
          {activeDailySchedule && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📋 Lịch Chi Tiết: {activeDailySchedule.name}</h4>
                <button className="btn text" onClick={() => setActiveDailySchedule(null)}>✕ Đóng</button>
              </div>

              {/* Add Activity Input */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <input 
                  type="text" 
                  placeholder="Tên hoạt động (vd: Đọc sách 30 phút)..." 
                  value={newActivity.title}
                  onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                  style={{ flex: 2, minWidth: '200px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <input 
                  type="time" 
                  value={newActivity.startTime}
                  onChange={e => setNewActivity({ ...newActivity, startTime: e.target.value })}
                  style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <input 
                  type="time" 
                  value={newActivity.endTime}
                  onChange={e => setNewActivity({ ...newActivity, endTime: e.target.value })}
                  style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <button onClick={handleAddActivityToDaily} className="btn primary" style={{ padding: '8px 16px' }}>
                  ➕ Thêm Hoạt Động
                </button>
              </div>

              {/* Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(activeDailySchedule.activities || []).map((act) => (
                  <div 
                    key={act.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 18px',
                      background: act.status === 'completed' ? 'rgba(0,210,160,0.08)' : 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <button 
                      onClick={() => handleToggleActivity(activeDailySchedule, act.id, act.status === 'completed' ? 'pending' : 'completed')}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid var(--green)',
                        background: act.status === 'completed' ? 'var(--green)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {act.status === 'completed' ? '✓' : ''}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, textDecoration: act.status === 'completed' ? 'line-through' : 'none', opacity: act.status === 'completed' ? 0.7 : 1 }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ⏰ {act.startTime} - {act.endTime}
                      </div>
                    </div>

                    <span className={`tag ${act.status === 'completed' ? 'tag-green' : 'tag-amber'}`}>
                      {act.status === 'completed' ? 'Hoàn thành' : 'Đang chờ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Workout Schedule */}
      {activeTab === 'workout' && <WorkoutBuilder />}

      {/* Course Detail Modal */}
      {selectedCourseModal && (
        <div className="modal-overlay" onClick={() => setSelectedCourseModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: selectedCourseModal.color }}>{selectedCourseModal.name}</h3>
              <button className="modal-close" onClick={() => setSelectedCourseModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div><strong>Mã lớp HP:</strong> {selectedCourseModal.code}</div>
              <div><strong>Số tín chỉ:</strong> {selectedCourseModal.credits} TC</div>
              <div><strong>Giảng viên:</strong> {selectedCourseModal.instructor}</div>
              <div><strong>Phòng học:</strong> {selectedCourseModal.room}</div>
              <div><strong>Lịch học gốc:</strong> {selectedCourseModal.scheduleStr || 'Chưa xếp'}</div>
              <div><strong>Tuần học:</strong> {selectedCourseModal.weeks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
