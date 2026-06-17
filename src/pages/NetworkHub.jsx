import { useState, useEffect } from 'react';
import { 
  getNetworkContacts, 
  createNetworkContact, 
  updateNetworkContact, 
  deleteNetworkContact,
  getSideProjects,
  createSideProject,
  updateSideProject,
  deleteSideProject
} from '../store/db';
import { useAppContext } from '../AppContext';
import logger from '../store/logger';

const MODULE = 'NetworkHub';

export default function NetworkHub() {
  const { t } = useAppContext();
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts', 'events'
  
  // Database States
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Modals Forms
  const [editingContact, setEditingContact] = useState(null); // 'new' or object
  const [contactForm, setContactForm] = useState({ name: '', type: 'mentor', contact: '', expertise: '', notes: '' });

  const [editingEvent, setEditingEvent] = useState(null); // 'new' or object
  const [eventForm, setEventForm] = useState({ name: '', status: 'active', description: '', githubUrl: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      logger.info(MODULE, 'Loading NetworkHub database dependencies');
      if (activeTab === 'contacts') {
        const list = await getNetworkContacts();
        setContacts(list);
      } else {
        const list = await getSideProjects();
        setEvents(list);
      }
      logger.success(MODULE, 'NetworkHub data loaded');
    } catch (err) {
      logger.error(MODULE, 'Failed to load NetworkHub data', err);
    }
  }

  // Contact CRUD
  const handleOpenContactNew = () => {
    setContactForm({ name: '', type: 'mentor', contact: '', expertise: '', notes: '' });
    setEditingContact('new');
  };
  const handleOpenContactEdit = (c) => {
    setContactForm({ ...c });
    setEditingContact(c);
  };
  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return;
    try {
      if (editingContact === 'new') {
        await createNetworkContact(contactForm);
      } else {
        await updateNetworkContact(editingContact.id, contactForm);
      }
      setEditingContact(null);
      const list = await getNetworkContacts();
      setContacts(list);
    } catch (err) {
      alert('Không thể lưu liên hệ: ' + err.message);
    }
  };
  const handleDeleteContact = async (id) => {
    if (confirm(t('common.confirmDelete'))) {
      await deleteNetworkContact(id);
      setEditingContact(null);
      const list = await getNetworkContacts();
      setContacts(list);
    }
  };

  // Side project / Event CRUD
  const handleOpenEventNew = () => {
    setEventForm({ name: '', status: 'active', description: '', githubUrl: '' });
    setEditingEvent('new');
  };
  const handleOpenEventEdit = (e) => {
    setEventForm({ ...e });
    setEditingEvent(e);
  };
  const handleSaveEvent = async () => {
    if (!eventForm.name.trim()) return;
    try {
      if (editingEvent === 'new') {
        await createSideProject(eventForm);
      } else {
        await updateSideProject(editingEvent.id, eventForm);
      }
      setEditingEvent(null);
      const list = await getSideProjects();
      setEvents(list);
    } catch (err) {
      alert('Không thể lưu sự kiện: ' + err.message);
    }
  };
  const handleDeleteEvent = async (id) => {
    if (confirm(t('common.confirmDelete'))) {
      await deleteSideProject(id);
      setEditingEvent(null);
      const list = await getSideProjects();
      setEvents(list);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('network.title')}</h2>
        <p>{t('network.desc')}</p>
      </div>

      {/* Tabs Toolbar */}
      <div className="toolbar">
        <div className="tabs">
          <button className={`tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
            {t('network.tab.contacts')}
          </button>
          <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            {t('network.tab.events')}
          </button>
        </div>

        <div className="toolbar-spacer" />

        {activeTab === 'contacts' ? (
          <button className="btn btn-primary btn-sm" onClick={handleOpenContactNew}>
            {t('network.contacts.add')}
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={handleOpenEventNew}>
            {t('network.events.add')}
          </button>
        )}
      </div>

      {/* Tab 1: Contacts - Mentors & HR */}
      {activeTab === 'contacts' && (
        <div className="card">
          {contacts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <p>{t('network.contacts.empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {contacts.map(c => (
                <div 
                  key={c.id} 
                  className="note-card"
                  onClick={() => handleOpenContactEdit(c)}
                  style={{ minHeight: '130px', position: 'relative' }}
                >
                  <span 
                    className={`tag tag-sm ${c.type === 'mentor' ? 'tag-accent' : c.type === 'hr' ? 'tag-green' : 'tag-blue'}`} 
                    style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.62rem' }}
                  >
                    {c.type === 'mentor' ? 'Cố vấn (Mentor)' : c.type === 'hr' ? 'Nhân sự (HR)' : 'Khác'}
                  </span>

                  <h4 style={{ color: 'var(--text-primary)', paddingRight: '90px' }}>{c.name}</h4>
                  
                  {c.expertise && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--green)', marginTop: '6px', fontWeight: 500 }}>
                      ⚡ {c.expertise}
                    </div>
                  )}

                  {c.contact && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      📞 {c.contact}
                    </div>
                  )}

                  {c.notes && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Events & Extracurriculars */}
      {activeTab === 'events' && (
        <div className="card">
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏆</div>
              <p>{t('network.events.empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(e => (
                <div 
                  key={e.id}
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-lg)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--accent-light)', fontSize: '0.95rem' }}>{e.name}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`tag ${e.status === 'active' ? 'tag-green' : 'tag-red'}`} style={{ fontSize: '0.65rem' }}>
                        {e.status === 'active' ? 'Đang diễn ra' : 'Đã kết thúc'}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEventEdit(e)} style={{ padding: '2px 6px' }}>✏️</button>
                    </div>
                  </div>

                  {e.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {e.description}
                    </p>
                  )}

                  {e.githubUrl && (
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Link liên quan: </span>
                      <a href={e.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                        {e.githubUrl}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add/Edit Contact */}
      {editingContact && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingContact(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingContact === 'new' ? t('network.contacts.add') : 'Sửa liên hệ'}</h3>
              <button className="modal-close" onClick={() => setEditingContact(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('network.contacts.name')} *</label>
              <input className="input" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="VD: Nguyễn Văn A" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('network.contacts.role')}</label>
                <select className="select" value={contactForm.type} onChange={e => setContactForm({ ...contactForm, type: e.target.value })}>
                  <option value="mentor">Cố vấn (Mentor)</option>
                  <option value="hr">Nhân sự (HR)</option>
                  <option value="club">Cơ quan / Câu lạc bộ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('network.contacts.expertise')}</label>
                <input className="input" value={contactForm.expertise} onChange={e => setContactForm({ ...contactForm, expertise: e.target.value })} placeholder="VD: Node.js Tech Lead / BA Recruiter" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('network.contacts.contact')}</label>
              <input className="input" value={contactForm.contact} onChange={e => setContactForm({ ...contactForm, contact: e.target.value })} placeholder="VD: annguyen@company.com / 0905123456" />
            </div>

            <div className="form-group">
              <label className="form-label">{t('courses.form.notes')}</label>
              <textarea className="textarea" value={contactForm.notes} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} placeholder="Lưu ý khi liên hệ, công ty đang công tác..." style={{ minHeight: '60px' }} />
            </div>

            <div className="modal-actions">
              {editingContact !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteContact(editingContact.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingContact(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveContact} disabled={!contactForm.name.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Event/CLB */}
      {editingEvent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingEvent(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingEvent === 'new' ? t('network.events.add') : 'Sửa sự kiện / Dự án ngoài'}</h3>
              <button className="modal-close" onClick={() => setEditingEvent(null)}>✕</button>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tên hoạt động *</label>
                <input className="input" value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} placeholder="VD: CLB Tin học / Hackathon BachKhoa" />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái tham gia</label>
                <select className="select" value={eventForm.status} onChange={e => setEventForm({ ...eventForm, status: e.target.value })}>
                  <option value="active">Đang tham gia / Chưa diễn ra</option>
                  <option value="completed">Đã kết thúc</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.form.desc')}</label>
              <textarea className="textarea" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Nội dung, mục tiêu hoặc giải thưởng đạt được..." style={{ minHeight: '80px' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Link liên kết (Website, Github...)</label>
              <input className="input" value={eventForm.githubUrl} onChange={e => setEventForm({ ...eventForm, githubUrl: e.target.value })} placeholder="https://..." />
            </div>

            <div className="modal-actions">
              {editingEvent !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteEvent(editingEvent.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingEvent(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveEvent} disabled={!eventForm.name.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
