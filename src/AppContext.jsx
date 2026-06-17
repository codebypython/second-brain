import { createContext, useContext, useState, useEffect } from 'react';
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

  return (
    <AppContext.Provider value={{
      profile, 
      setProfile: handleSelectProfile,
      t,
      timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: profile?.language || 'vi',
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
