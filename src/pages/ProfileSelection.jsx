import { useState, useEffect } from 'react';
import { getProfiles, createProfile, deleteProfile } from '../store/masterDb';
import { TIMEZONES } from '../store/dateUtils';
import { getTranslation } from '../store/i18n';
import { pullFromCloud } from '../store/cloudSync';

const AVATARS = ['👨‍💻', '👩‍💻', '🚀', '🧠', '🎓', '🎨', '💼'];

export default function ProfileSelection({ onSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  
  const [form, setForm] = useState({ name: '', avatar: '👨‍💻', language: 'vi', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [lang, setLang] = useState('vi'); 

  useEffect(() => { load(); }, []);

  async function load() {
    const p = await getProfiles();
    setProfiles(p);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    const newProfile = await createProfile(form);
    const updated = await getProfiles();
    setProfiles(updated);
    setCreating(false);
    onSelect(updated.find(p => p.id === newProfile));
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirm('Delete this profile and ALL its data? This cannot be undone!')) {
      await deleteProfile(id);
      load();
    }
  }

  async function handleRestore() {
    if (!passcode) return;
    setSyncStatus('Downloading data...');
    try {
      await pullFromCloud(passcode);
      setSyncStatus('Success! Reloading...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSyncStatus('Error: ' + err.message);
    }
  }

  const t = (key) => getTranslation(lang, key);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '8px' }}>
        <button className={`btn btn-sm ${lang === 'vi' ? 'btn-primary' : ''}`} onClick={() => setLang('vi')}>VI</button>
        <button className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : ''}`} onClick={() => setLang('en')}>EN</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <span style={{ fontSize: '3rem' }}>🧠</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>Second Brain</h1>
      </div>

      {!creating && !restoring ? (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 500, marginBottom: '40px' }}>{t('profile.title')}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px' }}>
            {profiles.map(p => (
              <div key={p.id} onClick={() => onSelect(p)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                className="profile-card">
                
                <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', border: '2px solid transparent', transition: 'all 0.2s' }}>
                  {p.avatar}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{p.name}</div>
                
                <button className="btn-delete-profile" onClick={e => handleDelete(e, p.id)}
                  style={{ position: 'absolute', top: -10, right: -10, background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}

            <div onClick={() => setCreating(true)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-muted)' }}>
                +
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{t('profile.add')}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '60px' }}>
            <button className="btn btn-ghost" onClick={() => setRestoring(true)}>
              ☁️ Restore from Cloud
            </button>
          </div>
        </div>
      ) : restoring ? (
        <div className="card" style={{ width: '400px' }}>
          <div className="card-header">
            <h3>☁️ Restore from Cloud</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Enter your Cloud Passcode to download and restore your entire system to this device.
          </p>
          <div className="form-group">
            <input className="input" type="password" placeholder="Passcode..." autoFocus
              value={passcode} onChange={e => setPasscode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRestore()} />
          </div>
          {syncStatus && <p style={{ fontSize: '0.85rem', color: syncStatus.includes('Error') ? 'var(--red)' : 'var(--green)' }}>{syncStatus}</p>}
          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button className="btn" onClick={() => setRestoring(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={handleRestore} disabled={!passcode.trim()}>Download</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ width: '400px' }}>
          <div className="card-header">
            <h3>{t('profile.new')}</h3>
          </div>
          
          <div className="form-group">
            <label className="form-label">Avatar</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AVATARS.map(a => (
                <div key={a} onClick={() => setForm({ ...form, avatar: a })}
                  style={{ fontSize: '2rem', cursor: 'pointer', padding: '8px', background: form.avatar === a ? 'var(--bg-glass)' : 'transparent', borderRadius: 'var(--radius-md)', border: form.avatar === a ? '1px solid var(--accent)' : '1px solid transparent' }}>
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('profile.name')}</label>
            <input className="input" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
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

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button className="btn" onClick={() => setCreating(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name.trim()}>{t('profile.start')}</button>
          </div>
        </div>
      )}

      <style>{`
        .profile-card:hover .btn-delete-profile { display: flex !important; }
        .profile-card:hover div { border-color: var(--accent) !important; }
      `}</style>
    </div>
  );
}
