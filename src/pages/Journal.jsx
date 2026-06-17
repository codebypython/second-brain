import { useState, useEffect } from 'react';
import { createJournal, getJournal, deleteJournal, getJournalRange } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr, formatFullDate } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Journal';

const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'bad', emoji: '😔', label: 'Bad' },
  { id: 'terrible', emoji: '😢', label: 'Terrible' },
];

export default function Journal() {
  const { t, timezone, lang } = useAppContext();
  const todayStr = getTodayStr(timezone);

  const [date, setDate] = useState(todayStr);
  const [mood, setMood] = useState('neutral');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { loadEntry(date); loadHistory(); }, [date, timezone]);

  async function loadEntry(d) {
    logger.info(MODULE, 'loadEntry', d);
    try {
      const entry = await getJournal(d);
      if (entry) {
        setMood(entry.mood);
        setContent(entry.content);
        setCurrentEntryId(entry.id);
      } else {
        setMood('neutral');
        setContent('');
        setCurrentEntryId(null);
      }
      setSaved(false);
      logger.success(MODULE, 'loadEntry', entry ? 'entry found' : 'no entry');
    } catch (err) {
      logger.error(MODULE, 'loadEntry', err);
      setError(t('common.error') || 'Failed to load journal entry.');
    }
  }

  async function loadHistory() {
    logger.info(MODULE, 'loadHistory');
    try {
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const entries = await getJournalRange(from, todayStr);
      setHistory(entries.sort((a, b) => b.date.localeCompare(a.date)));
      logger.success(MODULE, 'loadHistory', `${entries.length} entries`);
    } catch (err) {
      logger.error(MODULE, 'loadHistory', err);
      setError(t('common.error') || 'Failed to load journal history.');
    }
  }

  async function handleSave() {
    logger.info(MODULE, 'handleSave', date);
    try {
      await createJournal({ date, mood, content });
      const entry = await getJournal(date);
      if (entry) setCurrentEntryId(entry.id);
      setSaved(true);
      loadHistory();
      setTimeout(() => setSaved(false), 2000);
      logger.success(MODULE, 'handleSave', date);
    } catch (err) {
      logger.error(MODULE, 'handleSave', err);
      alert(t('common.error') || 'Failed to save journal entry. Please try again.');
    }
  }

  async function handleDelete() {
    if (!currentEntryId) return;
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'handleDelete', currentEntryId);
      try {
        await deleteJournal(currentEntryId);
        setMood('neutral');
        setContent('');
        setCurrentEntryId(null);
        loadHistory();
        logger.success(MODULE, 'handleDelete', currentEntryId);
      } catch (err) {
        logger.error(MODULE, 'handleDelete', err);
        alert(t('common.error') || 'Failed to delete journal entry. Please try again.');
      }
    }
  }

  const isToday = date === todayStr;

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('journal.title')}</h2>
        <p>{t('journal.desc')}</p>
      </div>

      {error && (
        <div className="empty-state" style={{ color: 'var(--red, #ff6b6b)' }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-sm" onClick={() => { setError(null); loadEntry(date); loadHistory(); }} style={{ marginTop: '8px' }}>
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      )}

      <div className="grid-2" style={{ gap: '24px' }}>
        <div>
          <div className="card">
            <div className="card-header">
              <h3>{isToday ? t('journal.today') : `📅 ${formatFullDate(date, lang, timezone)}`}</h3>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="input" style={{ width: 'auto', padding: '6px 10px' }} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('journal.mood')}</label>
              <div className="mood-selector">
                {MOODS.map(m => (
                  <button key={m.id} className={`mood-btn ${mood === m.id ? 'selected' : ''}`}
                    onClick={() => setMood(m.id)} title={m.label}>
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <textarea className="textarea" style={{ minHeight: '200px' }}
                placeholder={t('journal.placeholder')}
                value={content} onChange={e => setContent(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={!content.trim()}>
                💾 {currentEntryId ? t('journal.update') : t('journal.save')}
              </button>
              {currentEntryId && (
                <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
              )}
              {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem' }}>{t('journal.saved')}</span>}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3>{t('journal.recent')} ({history.length})</h3>
            </div>

            {history.length === 0 ? (
              <div className="empty-state"><div className="icon">📔</div><p>{t('journal.empty')}</p></div>
            ) : (
              history.map(entry => (
                <div key={entry.id} className="list-item" onClick={() => setDate(entry.date)}
                  style={{ cursor: 'pointer', borderColor: entry.date === date ? 'var(--accent)' : undefined }}>
                  <span style={{ fontSize: '1.3rem' }}>
                    {MOODS.find(m => m.id === entry.mood)?.emoji || '😐'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{formatFullDate(entry.date, lang, timezone)}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
                      {entry.content.slice(0, 80)}{entry.content.length > 80 ? '...' : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {history.length >= 3 && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-header">
                <h3>{t('journal.stats')}</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {MOODS.map(m => {
                  const count = history.filter(e => e.mood === m.id).length;
                  return (
                    <div key={m.id} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem' }}>{m.emoji}</div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
