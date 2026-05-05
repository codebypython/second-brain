import { useState, useEffect } from 'react';
import { exportAll, importAll } from '../store/db';
import { updateProfile } from '../store/masterDb';
import { pushToCloud, pullFromCloud } from '../store/cloudSync';
import { useAppContext } from '../AppContext';
import { TIMEZONES } from '../store/dateUtils';

export default function Settings() {
  const { t, profile, setProfile } = useAppContext();
  const [form, setForm] = useState({ name: '', language: 'vi', timezone: '' });
  
  // Cloud sync state
  const [passcode, setPasscode] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ type: '', msg: '' }); // type: 'success' | 'error'

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, language: profile.language, timezone: profile.timezone });
    }
  }, [profile]);

  async function handleUpdateProfile() {
    if (!form.name.trim()) return;
    await updateProfile(profile.id, form);
    setProfile({ ...profile, ...form });
    alert(t('settings.saved', { defaultValue: 'Settings saved!' }));
  }

  /* ── Local Backup ── */
  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second-brain-backup-${profile.name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error('Invalid format');
        await importAll(data);
        alert(t('settings.importSuccess', { defaultValue: 'Data imported successfully! App will reload.' }));
        window.location.reload();
      } catch (err) {
        alert(t('settings.importFailed', { defaultValue: 'Failed to import data: ' }) + err.message);
      }
    };
    reader.readAsText(file);
  }

  /* ── Cloud Sync ── */
  async function handlePushCloud() {
    if (!passcode) {
      setSyncStatus({ type: 'error', msg: t('settings.cloud.noPasscode', { defaultValue: 'Please enter a passcode.' }) });
      return;
    }
    setSyncing(true);
    setSyncStatus({ type: '', msg: '' });
    try {
      await pushToCloud(passcode);
      setSyncStatus({ type: 'success', msg: t('settings.cloud.pushSuccess', { defaultValue: 'Successfully pushed to cloud!' }) });
    } catch (err) {
      setSyncStatus({ type: 'error', msg: err.message });
    }
    setSyncing(false);
  }

  async function handlePullCloud() {
    if (!passcode) {
      setSyncStatus({ type: 'error', msg: t('settings.cloud.noPasscode', { defaultValue: 'Please enter a passcode.' }) });
      return;
    }
    if (!confirm(t('settings.cloud.confirmPull', { defaultValue: 'This will overwrite your local data. Are you sure?' }))) return;
    
    setSyncing(true);
    setSyncStatus({ type: '', msg: '' });
    try {
      const updatedAt = await pullFromCloud(passcode);
      setSyncStatus({ type: 'success', msg: t('settings.cloud.pullSuccess', { defaultValue: 'Successfully pulled data from cloud! Reloading...' }) });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSyncStatus({ type: 'error', msg: err.message });
      setSyncing(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h2>{t('settings.title')}</h2>
        <p>{t('settings.desc')}</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>{t('settings.account')}</h3>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('settings.profile.name')}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.profile.lang')}</label>
            <select className="select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.profile.timezone')}</label>
            <select className="select" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleUpdateProfile}>{t('common.save')}</button>
            <button className="btn" onClick={() => setProfile(null)}>{t('settings.profile.switch')}</button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Cloud Sync Box */}
        <div className="card" style={{ borderColor: 'var(--accent)', boxShadow: '0 0 10px rgba(108, 92, 231, 0.1)' }}>
          <div className="card-header">
            <h3>☁️ {t('settings.cloud', { defaultValue: 'Cloud Sync' })}</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem' }}>
            {t('settings.cloud.desc', { defaultValue: 'Sync your entire system across devices using a secret passcode.' })}
          </p>
          
          <div className="form-group">
            <label className="form-label">{t('settings.cloud.passcode', { defaultValue: 'Secret Passcode' })}</label>
            <input className="input" type="password" placeholder="e.g. my-secret-123" 
              value={passcode} onChange={e => setPasscode(e.target.value)} />
          </div>

          {syncStatus.msg && (
            <div style={{ padding: '8px', marginBottom: '16px', borderRadius: '4px', fontSize: '0.85rem', background: syncStatus.type === 'error' ? 'rgba(255, 118, 117, 0.1)' : 'rgba(0, 184, 148, 0.1)', color: syncStatus.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
              {syncStatus.msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handlePushCloud} disabled={syncing}>
              {syncing ? '...' : t('settings.cloud.push', { defaultValue: '☁️ Push to Cloud' })}
            </button>
            <button className="btn" onClick={handlePullCloud} disabled={syncing}>
              {syncing ? '...' : t('settings.cloud.pull', { defaultValue: '⬇️ Pull from Cloud' })}
            </button>
          </div>
        </div>

        {/* Local Backup Box */}
        <div className="card">
          <div className="card-header">
            <h3>{t('settings.backup')}</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem' }}>{t('settings.backup.desc')}</p>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button className="btn" onClick={handleExport} style={{ justifyContent: 'center' }}>
              {t('settings.backup.export')}
            </button>
            <label className="btn" style={{ justifyContent: 'center' }}>
              {t('settings.backup.import')}
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
