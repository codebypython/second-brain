import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getProjects, createProject, updateProject, deleteProject } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'Tasks';

export default function Tasks({ navigate }) {
  const { t, timezone, profile } = useAppContext();
  const lang = profile?.language || 'vi';
  const today = getTodayStr(timezone);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'
  const [editing, setEditing] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ title: '', project: '', priority: 'medium', dueDate: '', description: '' });
  const [projForm, setProjForm] = useState({ name: '', color: '#6c5ce7' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Local translations for Eisenhower Matrix
  const localT = (key) => {
    const dict = {
      vi: {
        'tasks.view.list': '📋 Danh sách',
        'tasks.view.matrix': '🗂️ Ma trận Eisenhower',
        'tasks.matrix.q1.title': '1. Làm ngay (Do First) 🔴',
        'tasks.matrix.q1.desc': 'Khẩn cấp & Quan trọng (Giải quyết ngay)',
        'tasks.matrix.q2.title': '2. Lên lịch (Schedule) 🔵',
        'tasks.matrix.q2.desc': 'Quan trọng, Không khẩn cấp (Lên kế hoạch)',
        'tasks.matrix.q3.title': '3. Ủy quyền (Delegate) 🟡',
        'tasks.matrix.q3.desc': 'Khẩn cấp, Không quan trọng (Cắt giảm/Bàn giao)',
        'tasks.matrix.q4.title': '4. Loại bỏ (Eliminate) ⚪',
        'tasks.matrix.q4.desc': 'Không khẩn cấp & Không quan trọng (Cân nhắc bỏ)'
      },
      en: {
        'tasks.view.list': '📋 List View',
        'tasks.view.matrix': '🗂️ Eisenhower Matrix',
        'tasks.matrix.q1.title': '1. Do First 🔴',
        'tasks.matrix.q1.desc': 'Urgent & Important (Do it now)',
        'tasks.matrix.q2.title': '2. Schedule 🔵',
        'tasks.matrix.q2.desc': 'Important but Not Urgent (Plan it)',
        'tasks.matrix.q3.title': '3. Delegate 🟡',
        'tasks.matrix.q3.desc': 'Urgent but Not Important (Who can do it?)',
        'tasks.matrix.q4.title': '4. Eliminate ⚪',
        'tasks.matrix.q4.desc': 'Not Urgent & Not Important (Drop it)'
      }
    };
    return dict[lang]?.[key] || dict['vi']?.[key] || key;
  };

  useEffect(() => { load(); }, [filter, projFilter]);

  async function load() {
    logger.info(MODULE, 'Loading tasks and projects', { filter, projFilter });
    setLoading(true);
    setError(null);
    try {
      const [tArr, p] = await Promise.all([getTasks({}), getProjects()]);
      let filtered = tArr;
      if (filter !== 'all') filtered = filtered.filter(x => x.status === filter);
      if (projFilter) filtered = filtered.filter(x => x.project === projFilter);
      setTasks(filtered);
      setProjects(p);
      logger.success(MODULE, 'Loaded tasks and projects', { tasks: filtered.length, projects: p.length });
    } catch (err) {
      logger.error(MODULE, 'Failed to load tasks/projects', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
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
    logger.info(MODULE, editing === 'new' ? 'Creating task' : 'Updating task', { title: form.title });
    try {
      if (editing === 'new') {
        await createTask(form);
        logger.success(MODULE, 'Task created', { title: form.title });
      } else {
        await updateTask(editing.id, form);
        logger.success(MODULE, 'Task updated', { id: editing.id, title: form.title });
      }
      setEditing(null);
      load();
    } catch (err) {
      logger.error(MODULE, 'Failed to save task', err);
      alert('Failed to save task. Please try again.');
    }
  }

  async function toggleDone(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    logger.info(MODULE, 'Toggling task status', { id: task.id, from: task.status, to: newStatus });
    try {
      await updateTask(task.id, { status: newStatus });
      logger.success(MODULE, 'Task status toggled', { id: task.id, status: newStatus });
      load();
    } catch (err) {
      logger.error(MODULE, 'Failed to toggle task status', err);
      alert('Failed to update task status.');
    }
  }

  async function cycleStatus(task) {
    const cycle = { todo: 'doing', doing: 'done', done: 'todo' };
    const newStatus = cycle[task.status] || 'todo';
    logger.info(MODULE, 'Cycling task status', { id: task.id, from: task.status, to: newStatus });
    try {
      await updateTask(task.id, { status: newStatus });
      logger.success(MODULE, 'Task status cycled', { id: task.id, status: newStatus });
      load();
    } catch (err) {
      logger.error(MODULE, 'Failed to cycle task status', err);
      alert('Failed to update task status.');
    }
  }

  async function handleDelete(id) {
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'Deleting task', { id });
      try {
        await deleteTask(id);
        logger.success(MODULE, 'Task deleted', { id });
        setEditing(null);
        load();
      } catch (err) {
        logger.error(MODULE, 'Failed to delete task', err);
        alert('Failed to delete task. Please try again.');
      }
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
    logger.info(MODULE, editProject === 'new' ? 'Creating project' : 'Updating project', { name: projForm.name });
    try {
      if (editProject === 'new') {
        await createProject(projForm);
        logger.success(MODULE, 'Project created', { name: projForm.name });
      } else {
        if (editProject.name !== projForm.name) {
          const allTasks = await getTasks({});
          for (const taskItem of allTasks.filter(taskItem => taskItem.project === editProject.name)) {
            await updateTask(taskItem.id, { project: projForm.name });
          }
          logger.info(MODULE, 'Renamed project in tasks', { from: editProject.name, to: projForm.name });
        }
        await updateProject(editProject.id, projForm);
        logger.success(MODULE, 'Project updated', { id: editProject.id, name: projForm.name });
      }
      setEditProject(null);
      load();
    } catch (err) {
      logger.error(MODULE, 'Failed to save project', err);
      alert('Failed to save project. Please try again.');
    }
  }
  async function handleDeleteProject(p) {
    if (confirm(t('common.confirmDelete'))) {
      logger.info(MODULE, 'Deleting project', { id: p.id, name: p.name });
      try {
        await deleteProject(p.id);
        logger.success(MODULE, 'Project deleted', { id: p.id, name: p.name });
        if (projFilter === p.name) setProjFilter('');
        load();
      } catch (err) {
        logger.error(MODULE, 'Failed to delete project', err);
        alert('Failed to delete project. Please try again.');
      }
    }
  }

  const statusColors = { todo: 'amber', doing: 'blue', done: 'green' };
  const statusLabels = { todo: t('tasks.tab.todo'), doing: t('tasks.tab.doing'), done: t('tasks.tab.done') };

  // Calculate 2-day threshold for Urgent tasks
  const getTodayPlus2Str = () => {
    const tObj = new Date(today);
    const tPlus2 = new Date(tObj.getTime() + 2 * 24 * 60 * 60 * 1000);
    return tPlus2.toISOString().slice(0, 10);
  };
  const todayPlus2 = getTodayPlus2Str();

  // Filter outstanding tasks for Eisenhower Matrix
  const activeTasks = tasks.filter(t => t.status !== 'done');

  // Distribute tasks into 4 Quadrants
  const q1Tasks = activeTasks.filter(t => (t.priority === 'high' || t.priority === 'medium') && (t.dueDate && t.dueDate <= todayPlus2));
  const q2Tasks = activeTasks.filter(t => (t.priority === 'high' || t.priority === 'medium') && !(t.dueDate && t.dueDate <= todayPlus2));
  const q3Tasks = activeTasks.filter(t => t.priority === 'low' && (t.dueDate && t.dueDate <= todayPlus2));
  const q4Tasks = activeTasks.filter(t => t.priority === 'low' && !(t.dueDate && t.dueDate <= todayPlus2));

  const renderTaskItem = (task) => (
    <div key={task.id} className="list-item" style={{ padding: '8px 12px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)' }}>
      <div className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
        onClick={() => toggleDone(task)} />
      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEdit(task)}>
        <div className={`${task.status === 'done' ? 'task-title done' : ''}`}
          style={{ fontSize: '0.85rem', fontWeight: 500 }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          {task.project && <span className="tag tag-accent" style={{ fontSize: '0.7rem', padding: '1px 4px' }}>{task.project}</span>}
          <span className={`tag tag-${statusColors[task.status]}`} style={{ fontSize: '0.7rem', padding: '1px 4px' }}>{statusLabels[task.status]}</span>
          {task.dueDate && (
            <span className={`tag ${task.dueDate < today ? 'tag-red' : 'tag-amber'}`} style={{ fontSize: '0.7rem', padding: '1px 4px' }}>
              📅 {task.dueDate}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => cycleStatus(task)} style={{ padding: '4px' }}>🔄</button>
        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)} style={{ padding: '4px' }}>✏️</button>
        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)} style={{ padding: '4px' }}>🗑️</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('tasks.title')}</h2>
        <p>{t('tasks.desc')}</p>
      </div>

      {/* Main View Mode Toolbar */}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs">
          <button className={`tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            {localT('tasks.view.list')}
          </button>
          <button className={`tab ${viewMode === 'matrix' ? 'active' : ''}`} onClick={() => setViewMode('matrix')}>
            {localT('tasks.view.matrix')}
          </button>
        </div>

        <div className="toolbar-spacer" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={openNewProject}>{t('tasks.btn.project')}</button>
          <button className="btn btn-primary" onClick={openNew}>{t('tasks.btn.task')}</button>
        </div>
      </div>

      {/* Project Filters (Active in both views) */}
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

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--red-bg, #ff6b6b22)', color: 'var(--red, #ff6b6b)', borderRadius: '8px', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="icon">⏳</div>
          <p>{t('common.loading') || 'Loading...'}</p>
        </div>
      ) : viewMode === 'list' ? (
        // ── LIST VIEW ──
        <>
          <div className="toolbar" style={{ marginTop: '0', background: 'transparent', padding: '0 0 12px 0' }}>
            <div className="tabs" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['all', 'todo', 'doing', 'done'].map(s => (
                <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                  {s === 'all' ? t('common.all') : statusLabels[s]}
                </button>
              ))}
            </div>
          </div>

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
                {task.status !== 'done' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('pomodoro', { params: { activeTaskId: task.id } })} title="Tập trung Pomodoro">⏱️</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => cycleStatus(task)}>🔄</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)}>🗑️</button>
              </div>
            ))
          )}
        </>
      ) : (
        // ── EISENHOWER MATRIX VIEW ──
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginTop: '12px'
        }}>
          
          {/* Quadrant 1 */}
          <div className="card" style={{ borderLeft: '4px solid var(--red)', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--red)' }}>
                {localT('tasks.matrix.q1.title')}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{localT('tasks.matrix.q1.desc')}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
              {q1Tasks.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Không có việc cần làm.</div>
              ) : (
                q1Tasks.map(renderTaskItem)
              )}
            </div>
          </div>

          {/* Quadrant 2 */}
          <div className="card" style={{ borderLeft: '4px solid var(--blue)', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--blue)' }}>
                {localT('tasks.matrix.q2.title')}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{localT('tasks.matrix.q2.desc')}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
              {q2Tasks.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Không có việc cần làm.</div>
              ) : (
                q2Tasks.map(renderTaskItem)
              )}
            </div>
          </div>

          {/* Quadrant 3 */}
          <div className="card" style={{ borderLeft: '4px solid var(--amber)', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--amber)' }}>
                {localT('tasks.matrix.q3.title')}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{localT('tasks.matrix.q3.desc')}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
              {q3Tasks.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Không có việc cần làm.</div>
              ) : (
                q3Tasks.map(renderTaskItem)
              )}
            </div>
          </div>

          {/* Quadrant 4 */}
          <div className="card" style={{ borderLeft: '4px solid var(--text-muted)', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>
                {localT('tasks.matrix.q4.title')}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{localT('tasks.matrix.q4.desc')}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
              {q4Tasks.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Không có việc cần làm.</div>
              ) : (
                q4Tasks.map(renderTaskItem)
              )}
            </div>
          </div>

        </div>
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
