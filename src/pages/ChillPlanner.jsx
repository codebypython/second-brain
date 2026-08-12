import { useState, useEffect } from 'react';
import {
  createChillPlannerTask,
  getChillPlannerTasks,
  updateChillPlannerTask,
  deleteChillPlannerTask,
  saveChillStudyGoal,
  getChillStudyGoals,
} from '../store/db';

export default function ChillPlanner() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState({ dailyPomodoros: 4, weeklyMinutes: 600 });

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(45);
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    loadPlanner();
  }, []);

  const loadPlanner = async () => {
    const t = await getChillPlannerTasks();
    const g = await getChillStudyGoals();
    setTasks(t);
    if (g) setGoals(g);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createChillPlannerTask({
      title,
      subject,
      duration: Number(duration),
      priority,
      deadline,
    });

    setTitle('');
    setSubject('');
    await loadPlanner();
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateChillPlannerTask(task.id, { status: newStatus });
    await loadPlanner();
  };

  const handleSaveGoals = async () => {
    await saveChillStudyGoal(goals);
    await loadPlanner();
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Goal Summary */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(0, 210, 160, 0.1))',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng Task</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{tasks.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đã hoàn thành</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)' }}>{completedCount}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mục tiêu hàng ngày</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>
            {goals.dailyPomodoros} 🍅 / ngày
          </div>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Create Task Form */}
        <form
          onSubmit={handleAddTask}
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📝 Thêm Task Học Tập Mới</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tên Task</label>
            <input
              type="text"
              placeholder="Ví dụ: Ôn chương 3 Giải tích, làm đề cương..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Môn Học</label>
            <input
              type="text"
              placeholder="Ví dụ: OOP, Giải tích, IELTS..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mức Ưu Tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="high">🔴 Cao</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="low">🟢 Thấp</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 12px var(--accent-glow)',
            }}
          >
            ➕ Thêm Task
          </button>
        </form>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📚 Danh Sách Task</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.length > 0 ? (
              tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${t.status === 'completed' ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      onChange={() => handleToggleTask(t)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                          color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t.subject && `${t.subject} • `} {t.duration}m • {t.priority} priority
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await deleteChillPlannerTask(t.id);
                      await loadPlanner();
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có task học tập nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
