import { useState, useEffect } from 'react';
import { getHealth, saveHealth, getHealthRange } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'HealthPage';

export default function Health() {
  const { t, timezone } = useAppContext();
  const [date, setDate] = useState(getTodayStr(timezone));
  const [record, setRecord] = useState({
    sleepHours: '',
    sleepQuality: 'good',
    weight: '',
    height: 170, // Default height in cm
    bmi: '',
    steps: '',
    waterIntake: 0,
    workoutType: '',
    workoutDuration: '',
    workoutIntensity: 'medium',
    notes: ''
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reminders triggers
  const [postureCount, setPostureCount] = useState(0);
  const [eyeCount, setEyeCount] = useState(0);

  useEffect(() => {
    loadHealthData();
  }, [date]);

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
          waterIntake: data.waterIntake ?? 0
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
        workoutDuration: record.workoutDuration !== '' ? parseInt(record.workoutDuration) : null
      };

      await saveHealth(dataToSave);
      alert('Đã lưu nhật ký sức khỏe!');
      loadHealthData();
    } catch (err) {
      logger.error(MODULE, 'Failed to save health record', err);
      alert('Không thể lưu dữ liệu sức khỏe: ' + err.message);
    }
  }

  // Warning check: Sleep alert (consecutive 3 days sleep < 6h)
  function checkSleepAlert() {
    // Sort recent records by date ascending
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

  // Warning check: Workout alert (0 active minutes or 0 workouts logged in last 3 days)
  function checkWorkoutAlert() {
    // Check if we have at least 3 days of records
    const sorted = [...recentRecords].sort((a, b) => a.date.localeCompare(b.date));
    // Filter to last 3 days relative to current date
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('health.title')}</h2>
        <p>{t('health.desc')}</p>
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

      <div className="grid-2">
        <div>
          {/* Sleep Log Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>{t('health.sleep.title')}</h3>
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
              {/* Progress bar */}
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

        <div>
          {/* Workouts Log Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>{t('health.workout.title')}</h3>
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
