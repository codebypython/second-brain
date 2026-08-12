import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getProfiles, updateLastActive } from './store/masterDb';
import { initDB } from './store/db';
import { getTranslation } from './store/i18n';
import logger from './store/logger';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load last active profile on startup
  useEffect(() => {
    async function load() {
      logger.info('AppContext', 'Loading last active profile...');
      try {
        const profiles = await getProfiles();
        if (profiles.length > 0) {
          // Last active is first due to ordering
          logger.info('AppContext', `Found ${profiles.length} profiles, selecting: ${profiles[0].name}`);
          await handleSelectProfile(profiles[0]);
        } else {
          logger.info('AppContext', 'No profiles found, showing profile selection');
          setIsLoading(false);
        }
      } catch (err) {
        logger.error('AppContext', 'Failed to load profiles on startup', err);
        setError(err.message || 'Failed to load profiles');
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSelectProfile(p) {
    if (!p) {
      logger.info('AppContext', 'Profile cleared (switching/logging out)');
      setProfile(null);
      return;
    }
    try {
      logger.info('AppContext', `Selecting profile: ${p.name} (id: ${p.id})`);
      await updateLastActive(p.id);
      initDB(p.id);
      setProfile(p);
      setError(null);
      logger.success('AppContext', `Profile ready: ${p.name}`);
    } catch (err) {
      logger.error('AppContext', `Failed to select profile: ${p.name}`, err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  // Translation helper
  const t = (key, params) => getTranslation(profile?.language || 'vi', key, params);

  // Show error UI if critical error occurred during startup
  if (error && !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Không thể khởi động ứng dụng</h2>
          <p style={{ color: '#8888a0', marginBottom: '24px', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} 
            style={{ padding: '10px 24px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Global Pomodoro Timer State
  const [pomoMode, setPomoMode] = useState('focus');
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoTotalTime, setPomoTotalTime] = useState(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState(false);
  const [pomoCourseId, setPomoCourseId] = useState('');
  const [pomoTaskId, setPomoTaskId] = useState('');
  const [pomoCompleted, setPomoCompleted] = useState(false);

  const audioCtxRef = useRef(null);

  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const playTone = (freq, startTime, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.02);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(659.25, now, 0.5);
      playTone(880.00, now + 0.15, 0.7);
    } catch (e) {
      logger.error('AppContext', 'Audio chime play failed', e);
    }
  };

  const endTimeRef = useRef(null);

  useEffect(() => {
    let timer = null;
    if (pomoIsRunning) {
      endTimeRef.current = Date.now() + pomoTimeLeft * 1000;
      
      const tick = () => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        if (remaining <= 0) {
          if (timer) clearInterval(timer);
          setPomoIsRunning(false);
          playChime();
          setPomoCompleted(true);
          setPomoTimeLeft(0);
        } else {
          setPomoTimeLeft(remaining);
        }
      };

      timer = setInterval(tick, 250);

      const handleVisibilityChange = () => {
        if (!document.hidden && pomoIsRunning && endTimeRef.current) {
          tick();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        if (timer) clearInterval(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [pomoIsRunning]);

  const switchPomoMode = (newMode) => {
    setPomoIsRunning(false);
    setPomoCompleted(false);
    setPomoMode(newMode);
    let duration = 25 * 60;
    if (newMode === 'shortBreak') duration = 5 * 60;
    else if (newMode === 'longBreak') duration = 15 * 60;
    setPomoTimeLeft(duration);
    setPomoTotalTime(duration);
  };

  return (
    <AppContext.Provider value={{
      profile, 
      setProfile: handleSelectProfile,
      t,
      timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: profile?.language || 'vi',
      isLoading,
      pomoMode,
      setPomoMode,
      pomoTimeLeft,
      setPomoTimeLeft,
      pomoTotalTime,
      setPomoTotalTime,
      pomoIsRunning,
      setPomoIsRunning,
      pomoCourseId,
      setPomoCourseId,
      pomoTaskId,
      setPomoTaskId,
      pomoCompleted,
      setPomoCompleted,
      switchPomoMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
