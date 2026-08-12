import { useState, useEffect } from 'react';
import { exportAll, importAll } from '../store/db';
import { updateProfile, deleteProfile } from '../store/masterDb';
import { pushToCloud, pullFromCloud } from '../store/cloudSync';
import { uploadMediaToCloud, downloadMediaFromCloud } from '../store/mediaSync';
import { exportZipBackup, importZipBackup } from '../store/offlineBackup';
import { useAppContext } from '../AppContext';
import { TIMEZONES } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Settings';

export default function Settings() {
  const { t, profile, setProfile } = useAppContext();
  const [form, setForm] = useState({ name: '', language: 'vi', timezone: '', geminiApiKey: '', universityName: '', budgetLimit: 3000000 });

  // Cloud sync state
  const [passcode, setPasscode] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        language: profile.language,
        timezone: profile.timezone,
        geminiApiKey: profile.geminiApiKey || '',
        universityName: profile.universityName || 'Đại học Bách Khoa - Đại học Đà Nẵng',
        budgetLimit: profile.budgetLimit !== undefined ? profile.budgetLimit : 3000000,
      });
    }
  }, [profile]);

  async function handleUpdateProfile() {
    if (!form.name.trim()) return;
    const dataToSave = {
      ...form,
      budgetLimit: Number(form.budgetLimit) || 3000000,
    };
    logger.info(MODULE, 'Updating profile', { profileId: profile.id, form: dataToSave });
    try {
      await updateProfile(profile.id, dataToSave);
      setProfile({ ...profile, ...dataToSave });
      logger.success(MODULE, 'Profile updated');
      alert(t('settings.saved', { defaultValue: 'Settings saved!' }));
    } catch (err) {
      logger.error(MODULE, 'Failed to update profile', err);
      alert(t('settings.saveFailed', { defaultValue: 'Failed to save settings: ' }) + err.message);
    }
  }

  const formatSyncError = (err) => {
    const msg = err?.message || String(err);
    if (msg.includes('Missing or insufficient permissions')) {
      return {
        type: 'error',
        isPermissionError: true,
        msg: '⚠️ Quyền truy cập Cloud bị khóa (Missing permissions). Vui lòng vào Firebase Console ➔ Firestore Rules ➔ đặt rules "allow read, write: if true;" hoặc sử dụng nút "Xuất File .ZIP (Offline)" dưới đây để sao lưu 100% dữ liệu ngay lập tức!'
      };
    }
    return { type: 'error', msg };
  };

  /* ── Quick Sync (Text Data via Firestore) ── */
  async function handleQuickSync() {
    if (!passcode) {
      setSyncStatus({ type: 'error', msg: 'Vui lòng nhập mật khẩu bí mật!' });
      return;
    }
    setSyncing(true);
    setSyncStatus({ type: '', msg: '' });
    try {
      await pushToCloud(passcode);
      setSyncStatus({ type: 'success', msg: '⚡ Quick Sync (Text Data) thành công trong 3 giây!' });
    } catch (err) {
      setSyncStatus(formatSyncError(err));
    } finally {
      setSyncing(false);
    }
  }

  /* ── Full Backup (Text + Firebase Storage Media) ── */
  async function handleFullBackup() {
    if (!passcode) {
      setSyncStatus({ type: 'error', msg: 'Vui lòng nhập mật khẩu bí mật!' });
      return;
    }
    setSyncing(true);
    setSyncStatus({ type: '', msg: '' });
    setProgressPercent(0);
    try {
      // 1. Text Data
      setProgressMessage('Đang đồng bộ Text Data...');
      await pushToCloud(passcode);

      // 2. Media Files
      setProgressMessage('Đang đồng bộ Media Files...');
      await uploadMediaToCloud(passcode, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMessage(msg);
      });

      setSyncStatus({ type: 'success', msg: '📦 Full Backup (Text + Media) thành công!' });
    } catch (err) {
      setSyncStatus(formatSyncError(err));
    } finally {
      setSyncing(false);
    }
  }

  /* ── Full Restore (Text + Media Download) ── */
  async function handleFullRestore() {
    if (!passcode) {
      setSyncStatus({ type: 'error', msg: 'Vui lòng nhập mật khẩu bí mật!' });
      return;
    }
    if (!confirm('Hành động này sẽ tải và khôi phục toàn bộ dữ liệu + media từ Cloud. Tiếp tục?')) return;

    setSyncing(true);
    setSyncStatus({ type: '', msg: '' });
    try {
      setProgressMessage('Đang tải Text Data...');
      await pullFromCloud(passcode);

      setProgressMessage('Đang tải Media Files...');
      await downloadMediaFromCloud(passcode, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMessage(msg);
      });

      setSyncStatus({ type: 'success', msg: '✓ Khôi phục thành công! Đang tải lại...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSyncStatus(formatSyncError(err));
      setSyncing(false);
    }
  }

  /* ── Offline ZIP Export & Import ── */
  async function handleExportZip() {
    try {
      await exportZipBackup();
    } catch (err) {
      alert('Xuất ZIP thất bại: ' + err.message);
    }
  }

  async function handleImportZip(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importZipBackup(file);
      alert('Import ZIP thành công! Đang tải lại...');
      window.location.reload();
    } catch (err) {
      alert('Import ZIP thất bại: ' + err.message);
    }
  }

  /* ── Account Deletion ── */
  async function handleDeleteAccount() {
    if (!confirm(t('common.confirmDelete', { defaultValue: 'Are you sure you want to delete?' }))) return;
    try {
      await deleteProfile(profile.id);
      setProfile(null);
    } catch (err) {
      alert('Xóa thất bại: ' + err.message);
    }
  }

  return (
    <div className="page" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <h2>{t('settings.title', { defaultValue: 'Cài Đặt Hệ Thống' })}</h2>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>👤 Hồ Sơ Cá Nhân</h3>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tên người dùng</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ngôn ngữ</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Múi giờ</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleUpdateProfile}
          style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          💾 Lưu Cài Đặt
        </button>
      </div>

      {/* Hybrid Backup Hub (Option C) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>☁️ Sao Lưu & Đồng Bộ Hybrid Pro</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Tự động phân tách: Text & Metadata → Firestore (Siêu nhanh), Media Video/Audio → Firebase Storage (Dung lượng cao).
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mật khẩu bí mật (Passcode)</label>
          <input
            type="password"
            placeholder="Nhập mã bí mật ít nhất 4 ký tự..."
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Sync Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={handleQuickSync}
            disabled={syncing}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--blue)', color: '#000', fontWeight: 600, cursor: 'pointer' }}
          >
            ⚡ Quick Sync (Text ~3s)
          </button>
          <button
            onClick={handleFullBackup}
            disabled={syncing}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            📦 Full Backup (Text + Media)
          </button>
          <button
            onClick={handleFullRestore}
            disabled={syncing}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            📥 Khôi Phục Từ Cloud
          </button>
        </div>

        {/* Progress & Status */}
        {syncing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{progressMessage}</div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-glass)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--green)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {syncStatus.msg && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: syncStatus.type === 'success' ? 'var(--green-glow)' : 'var(--red-glow)', color: syncStatus.type === 'success' ? 'var(--green)' : 'var(--red)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>{syncStatus.msg}</div>
            {syncStatus.isPermissionError && (
              <button
                onClick={handleExportZip}
                style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--green)', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                💾 Xuất File .ZIP Ngay (Offline Backup 100%)
              </button>
            )}
          </div>
        )}

        {/* Storage Bar */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Dung lượng Firebase Storage cá nhân</span>
            <span>~150MB / 5.0GB (Free Tier)</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-glass)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '3%', height: '100%', background: 'var(--accent)' }} />
          </div>
        </div>

        {/* Offline Backup (.zip) */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>💾 Sao Lưu Offline File (.zip)</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xuất toàn bộ hệ thống + media files thành file ZIP duy nhất để lưu trữ máy tính.</p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleExportZip} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--green)', color: '#000', fontWeight: 600, cursor: 'pointer' }}>
              💾 Xuất File .ZIP
            </button>
            <label style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
              📂 Nhập File .ZIP
              <input type="file" accept=".zip" onChange={handleImportZip} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid var(--red-glow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)' }}>⚠️ Danger Zone</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xóa hoàn toàn profile và cơ sở dữ liệu trên thiết bị này.</p>
        <button onClick={handleDeleteAccount} style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          🗑️ Xóa Profile Hiện Tại
        </button>
      </div>
    </div>
  );
}
