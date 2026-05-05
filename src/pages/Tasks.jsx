import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getProjects, createProject, updateProject, deleteProject } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';

export default function Tasks() {
  const { t, timezone } = useAppContext();
  const today = getTodayStr(timezone);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ title: '', project: '', priority: 'medium', dueDate: '', description: '' });
  const [projForm, setProjForm] = useState({ name: '', color: '#6c5ce7' });

  useEffect(() => { load(); }, [filter, projFilter]);

  async function load() {
    const [tArr, p] = await Promise.all([getTasks({}), getProjects()]);
    let filtered = tArr;
    if (filter !== 'all') filtered = filtered.filter(x => x.status === filter);
    if (projFilter) filtered = filtered.filter(x => x.project === projFilter);
    setTasks(filtered);
    setProjects(p);
  }

  function openNew() {
    setForm({ title: '', project: projFilter || '', priority: 'medium', dueDate: '', description: '' });
    setEditing('new');
  }

  function openEdit(task) {
    setForm({ title: task.title, project: task.project || '', priority: task.priority, dueDate: task.dueDate || '', description: task.description || '' });
    setEditing(task);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing === 'new') {
      await createTask(form);
    } else {
      await updateTask(editing.id, form);
    }
    setEditing(null);
    load();
  }

  async function toggleDone(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: newStatus });
    load();
  }

  async function cycleStatus(task) {
    const cycle = { todo: 'doing', doing: 'done', done: 'todo' };
    await updateTask(task.id, { status: cycle[task.status] || 'todo' });
    load();
  }

  async function handleDelete(id) {
    if (confirm(t('common.confirmDelete'))) {
      await deleteTask(id);
      setEditing(null);
      load();
    }
  }

  function openNewProject() {
    setProjForm({ name: '', color: '#6c5ce7' });
    setEditProject('new');
  }
  function openEditProject(p) {
    setProjForm({ name: p.name, color: p.color });
    setEditProject(p);
  }
  async function handleSaveProject() {
    if (!projForm.name.trim()) return;
    if (editProject === 'new') {
      await createProject(projForm);
    } else {
      if (editProject.name !== projForm.name) {
        const allTasks = await getTasks({});
        for (const t of allTasks.filter(t => t.project === editProject.name)) {
          await updateTask(t.id, { project: projForm.name });
        }
      }
      await updateProject(editProject.id, projForm);
    }
    setEditProject(null);
    load();
  }
  async function handleDeleteProject(p) {
    if (confirm(t('common.confirmDelete'))) {
      await deleteProject(p.id);
      if (projFilter === p.name) setProjFilter('');
      load();
    }
  }

  const statusColors = { todo: 'amber', doing: 'blue', done: 'green' };
  const statusLabels = { todo: t('tasks.tab.todo'), doing: t('tasks.tab.doing'), done: t('tasks.tab.done') };

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('tasks.title')}</h2>
        <p>{t('tasks.desc')}</p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {['all', 'todo', 'doing', 'done'].map(s => (
            <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? t('common.all') : statusLabels[s]}
            </button>
          ))}
        </div>
        <div className="toolbar-spacer" />
        <button className="btn btn-sm" onClick={openNewProject}>{t('tasks.btn.project')}</button>
        <button className="btn btn-primary" onClick={openNew}>{t('tasks.btn.task')}</button>
      </div>

      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`btn btn-sm ${!projFilter ? 'btn-primary' : ''}`} onClick={() => setProjFilter('')}>{t('tasks.proj.all')}</button>
          {projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button className={`btn btn-sm ${projFilter === p.name ? 'btn-primary' : ''}`}
                style={{ borderColor: p.color }}
                onClick={() => setProjFilter(projFilter === p.name ? '' : p.name)}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                {p.name}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEditProject(p)} style={{ padding: '4px 6px' }}>✏️</button>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>{t('tasks.empty')}</p>
        </div>
      ) : (
        tasks.map(task => (
          <div key={task.id} className="list-item">
            <div className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
              onClick={() => toggleDone(task)} />
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEdit(task)}>
              <div className={`${task.status === 'done' ? 'task-title done' : ''}`}
                style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {task.title}
              </div>
              {task.description && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                {task.project && <span className="tag tag-accent">{task.project}</span>}
                <span className={`tag tag-${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
                {task.dueDate && (
                  <span className={`tag ${task.dueDate < today && task.status !== 'done' ? 'tag-red' : 'tag-amber'}`}>
                    📅 {task.dueDate}
                  </span>
                )}
              </div>
            </div>
            <span className={`priority-${task.priority}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {task.priority === 'high' ? t('tasks.priority.high') : task.priority === 'medium' ? t('tasks.priority.medium') : t('tasks.priority.low')}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => cycleStatus(task)}>🔄</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)}>🗑️</button>
          </div>
        ))
      )}

      {/* Task Create/Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing === 'new' ? t('tasks.new') : t('tasks.edit')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes.form.title')}</label>
              <input className="input" placeholder="..." value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} autoFocus
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSave()} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('tasks.form.desc')}</label>
              <textarea className="textarea" style={{ minHeight: '80px' }} placeholder="..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('tasks.form.project')}</label>
                <select className="select" value={form.project}
                  onChange={e => setForm({ ...form, project: e.target.value })}>
                  <option value=""></option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('tasks.form.priority')}</label>
                <select className="select" value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="high">{t('tasks.priority.high')}</option>
                  <option value="medium">{t('tasks.priority.medium')}</option>
                  <option value="low">{t('tasks.priority.low')}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('tasks.form.dueDate')}</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
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

      {/* Project Create/Edit Modal */}
      {editProject && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditProject(null)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{editProject === 'new' ? t('tasks.proj.new') : t('tasks.proj.edit')}</h3>
              <button className="modal-close" onClick={() => setEditProject(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">{t('tasks.proj.name')}</label>
              <input className="input" placeholder="..." value={projForm.name}
                onChange={e => setProjForm({ ...projForm, name: e.target.value })} autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveProject()} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('tasks.proj.color')}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={projForm.color}
                  onChange={e => setProjForm({ ...projForm, color: e.target.value })}
                  style={{ width: '50px', height: '36px', border: 'none', cursor: 'pointer' }} />
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: projForm.color }} />
              </div>
            </div>
            <div className="modal-actions">
              {editProject !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteProject(editProject)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditProject(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveProject}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
