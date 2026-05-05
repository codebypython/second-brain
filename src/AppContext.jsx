import { createContext, useContext, useState, useEffect } from 'react';
import { getProfiles, updateLastActive } from './store/masterDb';
import { initDB } from './store/db';
import { getTranslation } from './store/i18n';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load last active profile on startup
  useEffect(() => {
    async function load() {
      const profiles = await getProfiles();
      if (profiles.length > 0) {
        // Last active is first due to ordering
        handleSelectProfile(profiles[0]);
      } else {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSelectProfile(p) {
    if (!p) {
      setProfile(null);
      return;
    }
    await updateLastActive(p.id);
    initDB(p.id);
    setProfile(p);
    setIsLoading(false);
  }

  // Translation helper
  const t = (key, params) => getTranslation(profile?.language || 'vi', key, params);

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
