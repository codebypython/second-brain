import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { getNotes, createNote, updateNote, deleteNote, searchNotes } from '../store/db';
import { useAppContext } from '../AppContext';

export default function Notes() {
  const { t } = useAppContext();
  const CATEGORIES = [
    { id: 'projects', label: t('notes.cat.projects'), color: 'accent' },
    { id: 'areas', label: t('notes.cat.areas'), color: 'green' },
    { id: 'resources', label: t('notes.cat.resources'), color: 'blue' },
    { id: 'archive', label: t('notes.cat.archive'), color: 'amber' },
  ];

  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'resources', tags: '' });

  useEffect(() => { load(); }, [filter]);

  async function load() {
    const data = filter === 'all' ? await getNotes() : await getNotes({ category: filter });
    setNotes(data);
  }

  async function handleSearch(q) {
    setSearch(q);
    if (q.length > 1) {
      const results = await searchNotes(q);
      setNotes(results);
    } else {
      load();
    }
  }

  function openNew() {
    setForm({ title: '', content: '', category: 'resources', tags: '' });
    setEditing('new');
  }

  function openEdit(note) {
    setForm({ title: note.title, content: note.content, category: note.category, tags: (note.tags || []).join(', ') });
    setEditing(note);
  }

  async function handleSave() {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editing === 'new') {
      await createNote({ ...form, tags });
    } else {
      await updateNote(editing.id, { ...form, tags });
    }
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (confirm(t('common.confirmDelete'))) {
      await deleteNote(id);
      setEditing(null);
      load();
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('notes.title')}</h2>
        <p>{t('notes.desc')}</p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            {t('common.all')}
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} className={`tab ${filter === c.id ? 'active' : ''}`} onClick={() => setFilter(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={openNew}>{t('notes.new')}</button>
      </div>

      <div className="search-bar">
        <span className="icon">🔍</span>
        <input placeholder={t('common.search')} value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <p>{t('notes.empty')}</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note.id} className="note-card" onClick={() => openEdit(note)}>
              <h4>{note.title || 'Untitled'}</h4>
              <div className="preview">{note.content.slice(0, 150)}</div>
              <div className="meta">
                <span className={`tag tag-${CATEGORIES.find(c => c.id === note.category)?.color || 'accent'}`}>
                  {CATEGORIES.find(c => c.id === note.category)?.label.split(' ')[1] || note.category}
                </span>
                <span>{timeAgo(note.updatedAt, t)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>{editing === 'new' ? t('notes.new') : t('notes.edit')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('notes.form.title')}</label>
              <input className="input" placeholder="..." value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('notes.form.category')}</label>
                <select className="select" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('notes.form.tags')}</label>
                <input className="input" placeholder="react, css..." value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('notes.form.content')}</label>
              <textarea className="textarea" style={{ minHeight: '240px' }} placeholder="..."
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>

            {form.content && (
              <div className="form-group">
                <label className="form-label">Preview</label>
                <div className="markdown-body" style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflow: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: marked(form.content) }} />
              </div>
            )}

            <div className="modal-actions">
              {editing !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDelete(editing.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}
