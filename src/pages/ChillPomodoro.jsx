import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import MediaLibrary from '../components/MediaLibrary';
import {
  getChillAnimations,
  createChillAnimation,
  deleteChillAnimation,
  getChillSounds,
  createChillSound,
  deleteChillSound,
  getChillPresets,
  createChillPreset,
  deleteChillPreset,
  getCourses,
  getTasks,
} from '../store/db';

export default function ChillPomodoro() {
  const { pomoMode, setPomoMode, pomoIsRunning, setPomoIsRunning, pomoTimeLeft, setPomoTimeLeft, pomoTotalTime, pomoCompleted } = useAppContext();

  const [activeTab, setActiveTab] = useState('timer');
  const [animations, setAnimations] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [presets, setPresets] = useState([]);
  const [activeAnim, setActiveAnim] = useState(null);

  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => {
    loadMedia();
    loadTasks();
  }, []);

  const loadMedia = async () => {
    const a = await getChillAnimations();
    const s = await getChillSounds();
    const p = await getChillPresets();
    setAnimations(a);
    setSounds(s);
    setPresets(p);
  };

  const loadTasks = async () => {
    const c = await getCourses();
    const t = await getTasks({ status: 'todo' });
    setCourses(c);
    setTasks(t);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleQuickTime = (mins) => {
    setPomoIsRunning(false);
    const secs = mins * 60;
    setPomoTimeLeft(secs);
  };

  const progressPercent = pomoTotalTime > 0 ? ((pomoTotalTime - pomoTimeLeft) / pomoTotalTime) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub Navigation */}
      <div className="tabs" style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button className={`tab ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
          ⏱️ Timer Focus
        </button>
        <button className={`tab ${activeTab === 'animations' ? 'active' : ''}`} onClick={() => setActiveTab('animations')}>
          🎬 Animations ({animations.length})
        </button>
        <button className={`tab ${activeTab === 'sounds' ? 'active' : ''}`} onClick={() => setActiveTab('sounds')}>
          🎵 Sounds ({sounds.length})
        </button>
        <button className={`tab ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}>
          💾 Presets ({presets.length})
        </button>
      </div>

      {/* Tab: Timer */}
      {activeTab === 'timer' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-glass)', padding: '6px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setPomoMode('work')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: pomoMode === 'work' ? 'var(--accent)' : 'transparent',
                color: pomoMode === 'work' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🍅 Làm việc (25m)
            </button>
            <button
              onClick={() => setPomoMode('shortBreak')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: pomoMode === 'shortBreak' ? 'var(--green)' : 'transparent',
                color: pomoMode === 'shortBreak' ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ☕ Nghỉ ngắn (5m)
            </button>
            <button
              onClick={() => setPomoMode('longBreak')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: pomoMode === 'longBreak' ? 'var(--blue)' : 'transparent',
                color: pomoMode === 'longBreak' ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌴 Nghỉ dài (15m)
            </button>
          </div>

          {/* SVG Progress Circle */}
          <div style={{ position: 'relative', width: '280px', height: '280px' }}>
            <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="140" cy="140" r="120" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="transparent" />
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke={pomoMode === 'work' ? 'var(--accent)' : pomoMode === 'shortBreak' ? 'var(--green)' : 'var(--blue)'}
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{formatTime(pomoTimeLeft)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                {pomoIsRunning ? '⚡ Đang chạy...' : '⏸️ Tạm dừng'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setPomoIsRunning(!pomoIsRunning)}
              style={{
                padding: '14px 36px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: pomoIsRunning ? 'var(--amber)' : 'var(--accent)',
                color: pomoIsRunning ? '#000' : '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: pomoIsRunning ? '0 0 20px var(--amber-glow)' : '0 0 20px var(--accent-glow)',
              }}
            >
              {pomoIsRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu'}
            </button>
          </div>

          {/* Quick Times */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[5, 15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleQuickTime(mins)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-glass)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {mins} phút
              </button>
            ))}
          </div>

          {/* Smart Focus Task Selector */}
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              🎯 Smart Focus: Gắn với Task / Học phần
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">-- Chọn công việc cần tập trung --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tab: Animations */}
      {activeTab === 'animations' && (
        <MediaLibrary
          title="Kho Animation & Background"
          description="Quản lý video và hình ảnh background động cho phiên Pomodoro"
          items={animations}
          type="animation"
          onUpload={async (data) => {
            await createChillAnimation(data);
            await loadMedia();
          }}
          onDelete={async (id) => {
            await deleteChillAnimation(id);
            await loadMedia();
          }}
          onSelect={(item) => setActiveAnim(item)}
          activeId={activeAnim?.id}
        />
      )}

      {/* Tab: Sounds */}
      {activeTab === 'sounds' && (
        <MediaLibrary
          title="Kho Sound & Nhạc Nền"
          description="Quản lý nhạc tập trung LoFi, tiếng mưa, thiên nhiên"
          items={sounds}
          type="sound"
          onUpload={async (data) => {
            await createChillSound(data);
            await loadMedia();
          }}
          onDelete={async (id) => {
            await deleteChillSound(id);
            await loadMedia();
          }}
        />
      )}

      {/* Tab: Presets */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>💾 Preset Manager</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {presets.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.createdAt?.slice(0, 10)}</div>
                </div>
                <button
                  onClick={async () => {
                    await deleteChillPreset(p.id);
                    await loadMedia();
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
    </div>
  );
}
