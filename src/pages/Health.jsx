import { useState, useEffect, useRef } from 'react';
import { getHealth, saveHealth, getHealthRange, getDB } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'HealthPage';

const STRETCHES = [
  { name: 'Giãn cơ cổ 🧘', desc: 'Nghiêng đầu sang trái/phải nhẹ nhàng, giữ mỗi bên 15 giây.', nameEn: 'Neck Stretch 🧘', descEn: 'Gently tilt head left/right, hold for 15s each side.', duration: 30 },
  { name: 'Xoay khớp vai 🔄', desc: 'Xoay tròn bả vai ngược chiều kim đồng hồ rồi xoay ngược lại.', nameEn: 'Shoulder Rolls 🔄', descEn: 'Roll shoulders back and down in circles.', duration: 30 },
  { name: 'Vặn mình trên ghế 🪑', desc: 'Giữ hông thẳng, xoay vặn mình sang bên trái và bên phải.', nameEn: 'Seated Twist 🪑', descEn: 'Keep hips square, twist upper body left and right.', duration: 30 },
  { name: 'Duỗi cổ tay 🖐️', desc: 'Duỗi thẳng tay, kéo ngón tay ngược về sau để giảm mỏi cổ tay.', nameEn: 'Wrist Flex 🖐️', descEn: 'Extend arm, pull fingers back gently to stretch wrists.', duration: 30 }
];

export default function Health() {
  const { t, timezone, profile } = useAppContext();
  const lang = profile?.language || 'vi';

  // Local translations
  const localT = (key) => {
    const dict = {
      vi: {
        'health.gamification.title': '🏆 Cấp độ Sức khỏe (Wellness Level)',
        'health.gamification.points': 'Điểm tích lũy hôm nay',
        'health.gamification.streak': 'Ngày liên tiếp',
        'health.gamification.xp': 'Kinh nghiệm (XP)',
        'health.stretch.title': '🧘 Giãn cơ tại bàn (Desk Stretching)',
        'health.stretch.desc': 'Giảm đau mỏi vai gáy cho dân lập trình. Hoàn thành nhận +10 XP!',
        'health.stretch.start': 'Bắt đầu giãn cơ ▶️',
        'health.stretch.pause': 'Tạm dừng ⏸️',
        'health.stretch.reset': 'Làm lại 🔄',
        'health.stretch.complete': 'Hoàn thành bài tập! 🎉',
        'health.stretch.award': 'Ghi nhận +10 XP 🏆',
        'health.stretch.step': 'Động tác {step} / 4',
        'health.water.target': 'Mục tiêu: 2000 ml',
        'health.water.current': 'Đã uống'
      },
      en: {
        'health.gamification.title': '🏆 Wellness Level',
        'health.gamification.points': 'Points earned today',
        'health.gamification.streak': 'Day Streak',
        'health.gamification.xp': 'Experience (XP)',
        'health.stretch.title': '🧘 Desk Stretching',
        'health.stretch.desc': 'Relieve neck and back strain. Complete for +10 XP!',
        'health.stretch.start': 'Start Stretching ▶️',
        'health.stretch.pause': 'Pause ⏸️',
        'health.stretch.reset': 'Reset 🔄',
        'health.stretch.complete': 'Workout Finished! 🎉',
        'health.stretch.award': 'Claim +10 XP 🏆',
        'health.stretch.step': 'Stretch {step} / 4',
        'health.water.target': 'Goal: 2000 ml',
        'health.water.current': 'Hydrated'
      }
    };
    return dict[lang]?.[key] || dict['vi']?.[key] || key;
  };

  const [date, setDate] = useState(getTodayStr(timezone));
  const [record, setRecord] = useState({
    sleepHours: '',
    sleepQuality: 'good',
    weight: '',
    height: 170,
    bmi: '',
    steps: '',
    waterIntake: 0,
    workoutType: '',
    workoutDuration: '',
    workoutIntensity: 'medium',
    deskStretchesCompleted: 0,
    notes: ''
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gamification & Streak States
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);

  // Reminders triggers
  const [postureCount, setPostureCount] = useState(0);
  const [eyeCount, setEyeCount] = useState(0);

  // Desk Stretch Timer States
  const [stretchTimeLeft, setStretchTimeLeft] = useState(120); // 2 minutes total
  const [stretchIsRunning, setStretchIsRunning] = useState(false);
  const [stretchFinished, setStretchFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    loadHealthData();
    calculateGlobalStats();
  }, [date, profile?.id]);

  // Handle stretch countdown timer
  useEffect(() => {
    if (stretchIsRunning && stretchTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setStretchTimeLeft(prev => {
          if (prev <= 1) {
            setStretchIsRunning(false);
            setStretchFinished(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stretchIsRunning, stretchTimeLeft]);

  // Points calculation helper
  function calculateDailyPoints(log) {
    let pts = 0;
    if (log.sleepHours !== null && log.sleepHours !== undefined && Number(log.sleepHours) >= 7) {
      pts += 20;
    }
    if (log.waterIntake !== null && log.waterIntake !== undefined && Number(log.waterIntake) >= 2000) {
      pts += 20;
    }
    if (log.steps !== null && log.steps !== undefined && Number(log.steps) >= 8000) {
      pts += 30;
    }
    if (log.workoutDuration !== null && log.workoutDuration !== undefined && Number(log.workoutDuration) > 0) {
      pts += 30;
    }
    if (log.deskStretchesCompleted !== null && log.deskStretchesCompleted !== undefined) {
      pts += Number(log.deskStretchesCompleted) * 10;
    }
    return pts;
  }

  async function calculateGlobalStats() {
    try {
      const db = getDB();
      const logs = await db.health.toArray();
      
      // Calculate total XP across all days
      let xpSum = 0;
      logs.forEach(log => {
        xpSum += calculateDailyPoints(log);
      });
      setTotalXP(xpSum);

      // Calculate streak
      const loggedDates = logs
        .filter(log => log.sleepHours || log.waterIntake || log.steps || log.workoutDuration)
        .map(log => log.date)
        .sort();

      if (loggedDates.length === 0) {
        setStreak(0);
        return;
      }

      let currentStreak = 0;
      const todayStr = getTodayStr(timezone);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      // Check if logged today or yesterday
      const hasToday = loggedDates.includes(todayStr);
      const hasYesterday = loggedDates.includes(yesterdayStr);

      if (hasToday || hasYesterday) {
        currentStreak = 1;
        let lastDate = new Date(hasToday ? todayStr : yesterdayStr);
        
        // Loop backwards to verify consecutive dates
        for (let i = loggedDates.length - 2; i >= 0; i--) {
          const checkDate = new Date(loggedDates[i]);
          const diffTime = Math.abs(lastDate - checkDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            lastDate = checkDate;
          } else if (diffDays > 1) {
            break;
          }
        }
      }
      setStreak(currentStreak);
    } catch (err) {
      logger.error(MODULE, 'Failed to calculate health stats', err);
    }
  }

  async function loadHealthData() {
    setLoading(true);
    try {
      logger.info(MODULE, 'Loading health data', { date });
      const data = await getHealth(date);
      if (data) {
        setRecord({
          ...data,
          height: data.height || 170,
          sleepHours: data.sleepHours ?? '',
          weight: data.weight ?? '',
          steps: data.steps ?? '',
          workoutDuration: data.workoutDuration ?? '',
          waterIntake: data.waterIntake ?? 0,
          deskStretchesCompleted: data.deskStretchesCompleted ?? 0
        });
      } else {
        setRecord({
          sleepHours: '',
          sleepQuality: 'good',
          weight: '',
          height: 170,
          bmi: '',
          steps: '',
          waterIntake: 0,
          workoutType: '',
          workoutDuration: '',
          workoutIntensity: 'medium',
          deskStretchesCompleted: 0,
          notes: ''
        });
      }

      // Load past 7 days to run warning algorithms
      const today = new Date(date);
      const pastDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      const fromStr = pastDate.toISOString().slice(0, 10);
      const rangeData = await getHealthRange(fromStr, date);
      setRecentRecords(rangeData);
      
      logger.success(MODULE, 'Health data loaded successfully');
    } catch (err) {
      logger.error(MODULE, 'Failed to load health data', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateBmi(w, h) {
    const wNum = parseFloat(w);
    const hNum = parseFloat(h);
    if (isNaN(wNum) || isNaN(hNum) || hNum <= 0) return '';
    const bmiVal = wNum / ((hNum / 100) * (hNum / 100));
    return Math.round(bmiVal * 10) / 10;
  }

  function handleFieldChange(field, val) {
    const updated = { ...record, [field]: val };
    if (field === 'weight' || field === 'height') {
      updated.bmi = calculateBmi(updated.weight, updated.height);
    }
    setRecord(updated);
  }

  async function handleSave() {
    try {
      const dataToSave = {
        ...record,
        date,
        sleepHours: record.sleepHours !== '' ? parseFloat(record.sleepHours) : null,
        weight: record.weight !== '' ? parseFloat(record.weight) : null,
        height: parseFloat(record.height) || 170,
        bmi: record.bmi !== '' ? parseFloat(record.bmi) : null,
        steps: record.steps !== '' ? parseInt(record.steps) : null,
        waterIntake: parseInt(record.waterIntake) || 0,
        workoutDuration: record.workoutDuration !== '' ? parseInt(record.workoutDuration) : null,
        deskStretchesCompleted: parseInt(record.deskStretchesCompleted) || 0
      };

      await saveHealth(dataToSave);
      alert('Đã lưu nhật ký sức khỏe!');
      loadHealthData();
      calculateGlobalStats();
    } catch (err) {
      logger.error(MODULE, 'Failed to save health record', err);
      alert('Không thể lưu dữ liệu sức khỏe: ' + err.message);
    }
  }

  // Award Stretch Points
  const handleAwardStretch = async () => {
    try {
      const updatedStretches = record.deskStretchesCompleted + 1;
      const dataToSave = {
        ...record,
        date,
        sleepHours: record.sleepHours !== '' ? parseFloat(record.sleepHours) : null,
        weight: record.weight !== '' ? parseFloat(record.weight) : null,
        height: parseFloat(record.height) || 170,
        bmi: record.bmi !== '' ? parseFloat(record.bmi) : null,
        steps: record.steps !== '' ? parseInt(record.steps) : null,
        waterIntake: parseInt(record.waterIntake) || 0,
        workoutDuration: record.workoutDuration !== '' ? parseInt(record.workoutDuration) : null,
        deskStretchesCompleted: updatedStretches
      };

      await saveHealth(dataToSave);
      setRecord(prev => ({ ...prev, deskStretchesCompleted: updatedStretches }));
      setStretchFinished(false);
      setStretchTimeLeft(120);
      alert('Tuyệt vời! Bạn nhận được +10 XP điểm Wellness.');
      calculateGlobalStats();
    } catch (err) {
      logger.error(MODULE, 'Award stretch failed', err);
    }
  };

  // Warning check: Sleep alert (consecutive 3 days sleep < 6h)
  function checkSleepAlert() {
    const sorted = [...recentRecords].sort((a, b) => a.date.localeCompare(b.date));
    let consecutiveDays = 0;
    
    for (let i = 0; i < sorted.length; i++) {
      const hrs = sorted[i].sleepHours;
      if (hrs !== null && hrs !== undefined && hrs < 6) {
        consecutiveDays++;
        if (consecutiveDays >= 3) return true;
      } else {
        consecutiveDays = 0;
      }
    }
    return false;
  }

  // Warning check: Workout alert
  function checkWorkoutAlert() {
    const sorted = [...recentRecords].sort((a, b) => a.date.localeCompare(b.date));
    const last3Days = sorted.slice(-3);
    if (last3Days.length < 3) return false;

    const activeDays = last3Days.filter(rec => 
      (rec.workoutDuration && rec.workoutDuration > 0) || 
      (rec.steps && rec.steps >= 3000)
    );

    return activeDays.length === 0;
  }

  const isSleepAlert = checkSleepAlert();
  const isWorkoutAlert = checkWorkoutAlert();

  // Gamification Level calculations
  const wellnessLevel = Math.floor(totalXP / 100) + 1;
  const currentLevelXP = totalXP % 100;
  const todayXP = calculateDailyPoints(record);

  // Stretch active index calculation based on remaining time
  const getActiveStretchIndex = () => {
    if (stretchTimeLeft === 0) return 3;
    const elapsed = 120 - stretchTimeLeft;
    if (elapsed < 30) return 0;
    if (elapsed < 60) return 1;
    if (elapsed < 90) return 2;
    return 3;
  };
  const activeStretchIdx = getActiveStretchIndex();

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('health.title')}</h2>
        <p>{t('health.desc')}</p>
      </div>

      {/* ── Wellness Gamified Level Dashboard ── */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(72, 219, 251, 0.15))', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          
          {/* Level Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, var(--accent), var(--teal))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-glow)',
              color: 'white'
            }}>
              {wellnessLevel}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {localT('health.gamification.title')}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {localT('health.gamification.xp')}: <strong>{totalXP} XP</strong>
              </div>
            </div>
          </div>

          {/* Level Progress bar */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Level {wellnessLevel}</span>
              <span>{currentLevelXP} / 100 XP</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${currentLevelXP}%`, background: 'linear-gradient(to right, var(--accent), var(--teal))', height: '100%' }} />
            </div>
          </div>

          {/* Stats Badges */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{localT('health.gamification.points')}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>+{todayXP} XP</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🔥 {localT('health.gamification.streak')}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--amber)' }}>{streak}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Warnings & Alerts */}
      {(isSleepAlert || isWorkoutAlert) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {isSleepAlert && (
            <div style={{ background: 'rgba(255, 76, 76, 0.15)', border: '1px solid rgba(255, 76, 76, 0.3)', color: '#ff4c4c', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
              {t('health.sleep.alert')}
            </div>
          )}
          {isWorkoutAlert && (
            <div style={{ background: 'rgba(255, 179, 0, 0.15)', border: '1px solid rgba(255, 179, 0, 0.3)', color: '#ffb300', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
              {t('health.workout.alert')}
            </div>
          )}
        </div>
      )}

      {/* Date Select & Save bar */}
      <div className="toolbar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Chọn ngày xem:</span>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.85rem', width: '150px' }} />
        </div>
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={handleSave}>💾 Lưu nhật ký sức khỏe</button>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        <div>
          {/* Sleep Log Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>{t('health.sleep.title')}</h3>
              {record.sleepHours >= 7 && <span className="tag tag-green">+20 XP Đạt chuẩn</span>}
            </div>
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('health.sleep.hours')}</label>
                <input className="input" type="number" step="0.5" placeholder="Ví dụ: 7.5" value={record.sleepHours} onChange={e => handleFieldChange('sleepHours', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">{t('health.sleep.quality')}</label>
                <select className="select" value={record.sleepQuality} onChange={e => handleFieldChange('sleepQuality', e.target.value)}>
                  <option value="great">{t('health.sleep.quality.great')}</option>
                  <option value="good">{t('health.sleep.quality.good')}</option>
                  <option value="neutral">{t('health.sleep.quality.neutral')}</option>
                  <option value="bad">{t('health.sleep.quality.bad')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hydration Log Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>{t('health.water.title')}</h3>
              <strong style={{ color: 'var(--accent-light)' }}>{record.waterIntake} / 2000 ml</strong>
            </div>
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>{localT('health.water.current')}</span>
                <span>{localT('health.water.target')}</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${Math.min(100, (record.waterIntake / 2000) * 100)}%`, background: 'var(--blue-light)', height: '100%', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn" onClick={() => handleFieldChange('waterIntake', record.waterIntake + 250)}>🥤 +250 ml</button>
                <button className="btn" onClick={() => handleFieldChange('waterIntake', record.waterIntake + 500)}>🥛 +500 ml</button>
                <button className="btn" onClick={() => handleFieldChange('waterIntake', Math.max(0, record.waterIntake - 250))}>✕ Bớt</button>
              </div>
            </div>
          </div>

          {/* Ergonomics & Micro-reminders */}
          <div className="card">
            <div className="card-header">
              <h3>{t('health.reminders.title')}</h3>
            </div>
            <div style={{ display: 'grid', gap: '12px', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{t('health.reminders.posture')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Đã nhắc nhở {postureCount} lần hôm nay</div>
                </div>
                <button className="btn btn-sm" onClick={() => setPostureCount(postureCount + 1)}>Đã thẳng lưng! ✅</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{t('health.reminders.eyes')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Nghỉ mắt {eyeCount} lần hôm nay</div>
                </div>
                <button className="btn btn-sm" onClick={() => setEyeCount(eyeCount + 1)}>Đã chớp mắt & nhìn xa ✅</button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div>
          {/* ── Desk Stretching Widget ── */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
            <div className="card-header">
              <h3>{localT('health.stretch.title')}</h3>
              {record.deskStretchesCompleted > 0 && (
                <span className="tag tag-green">+{record.deskStretchesCompleted * 10} XP Hôm nay</span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {localT('health.stretch.desc')}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', textAlign: 'center' }}>
              {!stretchFinished ? (
                <>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {localT('health.stretch.step', { step: activeStretchIdx + 1 })}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', margin: '6px 0', color: 'var(--text-primary)' }}>
                    {lang === 'en' ? STRETCHES[activeStretchIdx].nameEn : STRETCHES[activeStretchIdx].name}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lang === 'en' ? STRETCHES[activeStretchIdx].descEn : STRETCHES[activeStretchIdx].desc}
                  </p>

                  {/* Countdown display */}
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-primary)', margin: '16px 0' }}>
                    {Math.floor(stretchTimeLeft / 60)}:{(stretchTimeLeft % 60).toString().padStart(2, '0')}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {!stretchIsRunning ? (
                      <button className="btn btn-primary btn-sm" onClick={() => setStretchIsRunning(true)}>{localT('health.stretch.start')}</button>
                    ) : (
                      <button className="btn btn-sm" onClick={() => setStretchIsRunning(false)}>{localT('health.stretch.pause')}</button>
                    )}
                    <button className="btn btn-sm btn-ghost" onClick={() => { setStretchIsRunning(false); setStretchTimeLeft(120); }}>{localT('health.stretch.reset')}</button>
                  </div>
                </>
              ) : (
                <div style={{ padding: '12px 0' }}>
                  <h4 style={{ color: 'var(--green)', fontSize: '1.2rem', marginBottom: '8px' }}>
                    {localT('health.stretch.complete')}
                  </h4>
                  <button className="btn btn-primary" style={{ margin: '10px auto 0 auto', display: 'block' }} onClick={handleAwardStretch}>
                    {localT('health.stretch.award')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Workouts Log Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>{t('health.workout.title')}</h3>
              {record.workoutDuration > 0 && <span className="tag tag-green">+30 XP Hoạt động</span>}
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('health.workout.type')}</label>
                <input className="input" placeholder="VD: Chạy bộ, Gym, Cầu lông..." value={record.workoutType} onChange={e => handleFieldChange('workoutType', e.target.value)} />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('health.workout.duration')}</label>
                  <input className="input" type="number" placeholder="Số phút" value={record.workoutDuration} onChange={e => handleFieldChange('workoutDuration', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('health.workout.intensity')}</label>
                  <select className="select" value={record.workoutIntensity} onChange={e => handleFieldChange('workoutIntensity', e.target.value)}>
                    <option value="high">{t('health.workout.intensity.high')}</option>
                    <option value="medium">{t('health.workout.intensity.medium')}</option>
                    <option value="low">{t('health.workout.intensity.low')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số bước chân hôm nay</label>
                <input className="input" type="number" placeholder="Ví dụ: 8000" value={record.steps} onChange={e => handleFieldChange('steps', e.target.value)} />
                {record.steps >= 8000 && <span style={{ fontSize: '0.78rem', color: 'var(--green-light)', marginTop: '4px', display: 'block' }}>🎉 Đạt mục tiêu đi bộ (+30 XP)</span>}
              </div>
            </div>
          </div>

          {/* Body Metrics Card */}
          <div className="card">
            <div className="card-header">
              <h3>{t('health.metric.title')}</h3>
            </div>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label className="form-label">Chiều cao (cm)</label>
                <input className="input" type="number" value={record.height} onChange={e => handleFieldChange('height', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('health.metric.weight')}</label>
                <input className="input" type="number" value={record.weight} onChange={e => handleFieldChange('weight', e.target.value)} placeholder="kg" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('health.metric.bmi')}</label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', background: 'rgba(255,255,255,0.03)', height: '40px' }}>
                  {record.bmi || '--'}
                </div>
              </div>
            </div>
            {record.bmi && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'right' }}>
                Phân loại thể trạng: <strong>
                  {record.bmi < 18.5 ? 'Thiếu cân (Underweight)' : record.bmi < 25.0 ? 'Bình thường (Healthy)' : record.bmi < 30.0 ? 'Thừa cân (Overweight)' : 'Béo phì (Obese)'}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
