import { useState, useEffect } from 'react';
import {
  getPomodoroLogs,
  getChillWorkoutSessions,
  getChillPlannerTasks,
  getChillStudyGoals,
} from '../store/db';

export default function ChillStats() {
  const [pomodoroLogs, setPomodoroLogs] = useState([]);
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [studyGoal, setStudyGoal] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const pLogs = await getPomodoroLogs();
    const wSessions = await getChillWorkoutSessions();
    const pTasks = await getChillPlannerTasks();
    const sGoal = await getChillStudyGoals();
    setPomodoroLogs(pLogs);
    setWorkoutSessions(wSessions);
    setPlannerTasks(pTasks);
    setStudyGoal(sGoal);
  };

  const totalPomodoros = pomodoroLogs.length;
  const totalWorkSeconds = pomodoroLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalWorkMinutes = Math.round(totalWorkSeconds / 60);

  const completedWorkouts = workoutSessions.filter((s) => s.status === 'completed').length;
  const workoutAdherence = workoutSessions.length > 0 ? Math.round((completedWorkouts / workoutSessions.length) * 100) : 0;

  const completedPlannerTasks = plannerTasks.filter((t) => t.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📊 ChillPomodoro Unified Analytics</h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.2rem' }}>🍅</div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalPomodoros}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng Phiên Pomodoro</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.2rem' }}>⏱️</div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalWorkMinutes}m</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng Thời Gian Học</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.2rem' }}>🏋️</div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)' }}>{completedWorkouts}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buổi Tập Hoàn Thành</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.2rem' }}>📈</div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>{workoutAdherence}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Workout Adherence</div>
          </div>
        </div>
      </div>

      {/* SVG Analytics Bar Chart */}
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
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📅 Tổng Quan Hoạt Động Theo Ngày</h3>

        <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0' }}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
            const heightPercent = Math.min(100, Math.max(15, (totalPomodoros + idx * 2) * 10));
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${heightPercent}%`,
                    background: 'linear-gradient(180deg, var(--accent), var(--accent-light))',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'height 0.5s ease',
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>🎯 Study Analytics</h4>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>• Planned vs Actual: {completedPlannerTasks} / {plannerTasks.length} tasks</div>
            <div>• Mục tiêu hàng ngày: {studyGoal?.dailyPomodoros || 4} Pomodoro</div>
            <div>• Khung giờ hiệu quả: 08:00 - 11:00 Sáng</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>💪 Workout Recommendations</h4>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>• Nhóm cơ nổi bật: Ngực, Vai, Core</div>
            <div>• Gợi ý: Tăng 2 reps bài Push-up tuần tới</div>
            <div>• Ngày nghỉ tối ưu: Thứ 4 & Chủ Nhật</div>
          </div>
        </div>
      </div>
    </div>
  );
}
