import { useState, useEffect } from 'react';
import {
  createChillWorkoutProgram,
  getChillWorkoutPrograms,
  createChillWorkoutSession,
  getChillWorkoutSessions,
  updateChillWorkoutSession,
  seedChillExercises,
  getChillExercises,
} from '../store/db';

const DEFAULT_EXERCISES = [
  { name: 'Push-up', muscleGroup: 'Chest', equipment: 'None', difficulty: 'beginner', reps: '12-15' },
  { name: 'Diamond Push-up', muscleGroup: 'Triceps', equipment: 'None', difficulty: 'intermediate', reps: '8-12' },
  { name: 'Pike Push-up', muscleGroup: 'Shoulders', equipment: 'None', difficulty: 'intermediate', reps: '8-10' },
  { name: 'Bodyweight Squat', muscleGroup: 'Quads', equipment: 'None', difficulty: 'beginner', reps: '15-20' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads/Glutes', equipment: 'None', difficulty: 'intermediate', reps: '10-12/leg' },
  { name: 'Pull-up / Door Row', muscleGroup: 'Back', equipment: 'Bar/Door', difficulty: 'intermediate', reps: '6-10' },
  { name: 'Plank', muscleGroup: 'Core', equipment: 'None', difficulty: 'beginner', reps: '45-60s' },
  { name: 'Leg Raise', muscleGroup: 'Abs', equipment: 'None', difficulty: 'beginner', reps: '12-15' },
];

const TEMPLATES = [
  {
    id: 'UpperLower4Day',
    name: 'Upper/Lower Split (4 ngày/tuần)',
    days: ['Upper A (Thứ 2)', 'Lower A (Thứ 3)', 'Nghỉ (Thứ 4)', 'Upper B (Thứ 5)', 'Lower B (Thứ 6)', 'Nghỉ (CN)'],
  },
  {
    id: 'PushLegsCore3Day',
    name: 'Push/Legs/Core Split (3 ngày/tuần)',
    days: ['Push & Chest (Thứ 2)', 'Legs & Quads (Thứ 4)', 'Core & Back (Thứ 6)'],
  },
  {
    id: 'FullBodyDensity3Day',
    name: 'Full Body Density (3 ngày/tuần)',
    days: ['Full Body A (Thứ 2)', 'Full Body B (Thứ 4)', 'Full Body C (Thứ 6)'],
  },
];

export default function WorkoutBuilder() {
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('UpperLower4Day');
  const [programName, setProgramName] = useState('Chương trình tập luyện cá nhân');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await seedChillExercises(DEFAULT_EXERCISES);
    const p = await getChillWorkoutPrograms();
    const s = await getChillWorkoutSessions();
    const e = await getChillExercises();
    setPrograms(p);
    setSessions(s);
    setExercises(e);
  };

  const handleCreateProgram = async () => {
    const templateObj = TEMPLATES.find((t) => t.id === selectedTemplate);
    const programId = await createChillWorkoutProgram({
      name: programName,
      template: selectedTemplate,
      days: templateObj ? templateObj.days : [],
    });

    // Generate initial sessions for this week
    const today = new Date();
    for (let i = 0; i < (templateObj?.days.length || 3); i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      await createChillWorkoutSession({
        programId,
        dayName: templateObj?.days[i] || `Buổi ${i + 1}`,
        date: d.toISOString().slice(0, 10),
        status: 'pending',
        exercises: DEFAULT_EXERCISES.slice(0, 4),
      });
    }

    await loadData();
  };

  const handleToggleSession = async (session) => {
    const newStatus = session.status === 'completed' ? 'pending' : 'completed';
    await updateChillWorkoutSession(session.id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    await loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Create Program Card */}
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
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🏋️ Tạo Lịch Tập Luyện Mới</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Tên chương trình
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Chọn Template mẫu
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateProgram}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
        >
          ➕ Khởi tạo chương trình tập
        </button>
      </div>

      {/* Sessions View */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>📅 Danh Sách Buổi Tập Gần Đây</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sessions.length > 0 ? (
            sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${s.status === 'completed' ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.dayName || 'Buổi tập'}</div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: s.status === 'completed' ? 'var(--green-glow)' : 'var(--bg-glass)',
                      color: s.status === 'completed' ? 'var(--green)' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {s.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ngày: {s.date}</div>

                {s.exercises && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {s.exercises.map((ex, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        • {ex.name} ({ex.reps})
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleToggleSession(s)}
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: s.status === 'completed' ? 'var(--bg-glass)' : 'var(--green)',
                    color: s.status === 'completed' ? 'var(--text-primary)' : '#000',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {s.status === 'completed' ? 'Đánh dấu chưa hoàn thành' : '✓ Hoàn thành buổi tập'}
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có buổi tập nào được tạo.</div>
          )}
        </div>
      </div>
    </div>
  );
}
