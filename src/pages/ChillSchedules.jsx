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
} from '../store/db';

export default function ChillSchedules() {
  const [activeTab, setActiveTab] = useState('class');
  const [classSchedules, setClassSchedules] = useState([]);
  const [dailySchedules, setDailySchedules] = useState([]);

  // Daily Schedule Form State
  const [dailyName, setDailyName] = useState('');
  const [dailyWeekday, setDailyWeekday] = useState('1');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const cs = await getChillClassSchedules();
    const ds = await getChillDailySchedules();
    setClassSchedules(cs);
    setDailySchedules(ds);
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
        const data = XLSX.utils.sheet_to_json(ws);

        await createChillClassSchedule({
          name: file.name.replace(/\.[^/.]+$/, ''),
          semester: '1',
          data,
        });

        await loadSchedules();
      } catch (err) {
        console.error('Excel parse failed:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddDailySchedule = async () => {
    if (!dailyName.trim()) return;
    await createChillDailySchedule({
      name: dailyName,
      weekday: Number(dailyWeekday),
      activities: [],
    });
    setDailyName('');
    await loadSchedules();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button className={`tab ${activeTab === 'class' ? 'active' : ''}`} onClick={() => setActiveTab('class')}>
          📚 Lịch Học (Excel)
        </button>
        <button className={`tab ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>
          🏠 Lịch Sinh Hoạt
        </button>
        <button className={`tab ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')}>
          💪 Lịch Tập Luyện
        </button>
      </div>

      {/* Tab: Class Schedule (Excel Import) */}
      {activeTab === 'class' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📤 Nạp Lịch Học Từ File Excel (.xlsx)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Hỗ trợ file xuất thời khóa biểu tiêu chuẩn với các cột: Mã lớp, Tên lớp, Giảng viên, Thời khóa biểu, Tuần học.
            </p>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ color: 'var(--text-primary)' }} />
          </div>

          {/* Schedule List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Danh Sách Thời Khóa Biểu</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {classSchedules.map((cs) => (
                <div
                  key={cs.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{cs.name}</div>
                    <button
                      onClick={async () => {
                        await deleteChillClassSchedule(cs.id);
                        await loadSchedules();
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cs.data?.length || 0} môn học</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Daily Schedule */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Tên lịch sinh hoạt (ví dụ: Buổi sáng hiệu quả)..."
              value={dailyName}
              onChange={(e) => setDailyName(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleAddDailySchedule}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ➕ Thêm
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {dailySchedules.map((ds) => (
              <div
                key={ds.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{ds.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thứ {ds.weekday + 1}</div>
                </div>
                <button
                  onClick={async () => {
                    await deleteChillDailySchedule(ds.id);
                    await loadSchedules();
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Workout Schedule */}
      {activeTab === 'workout' && <WorkoutBuilder />}
    </div>
  );
}
