import { useState, useEffect } from 'react';
import { 
  getCourses, 
  getSkillRatings, 
  saveSkillRating, 
  getPortfolios, 
  createPortfolio, 
  updatePortfolio, 
  deletePortfolio,
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate
} from '../store/db';
import { useAppContext } from '../AppContext';
import logger from '../store/logger';

const MODULE = 'CareerHub';

// Target skill standards for standard IT Career paths
const CAREER_PATHS = {
  frontend: {
    title: 'Frontend Developer 🎨',
    skills: [
      { name: 'HTML/CSS/JS', target: 5, courses: ['1020103', '1022113'] }, // Tin học đại cương, Lập trình Web
      { name: 'React/Vue/Angular Frameworks', target: 4, courses: ['1022113'] }, // Lập trình Web
      { name: 'UI/UX Design principles', target: 4, courses: ['1022243'] }, // Thiết kế UI/UX
      { name: 'Git & Code Versioning', target: 4, courses: ['1022123'] }, // Công nghệ phần mềm
      { name: 'Responsive Web Design', target: 5, courses: ['1022113'] }
    ]
  },
  backend: {
    title: 'Backend Developer ⚙️',
    skills: [
      { name: 'Algorithms & Data Structures', target: 5, courses: ['1022013', '1022043'] }, // Kỹ thuật lập trình, Cấu trúc DL&GT
      { name: 'Relational Databases (SQL/NoSQL)', target: 5, courses: ['1022053'] }, // Cơ sở dữ liệu
      { name: 'OOP (Java/C++/C#)', target: 5, courses: ['1022063'] }, // Lập trình hướng đối tượng
      { name: 'API Design (REST/GraphQL)', target: 4, courses: ['1022113', '1022222'] }, // Lập trình Web, PBL 4
      { name: 'System Security & Cryptography', target: 4, courses: ['1022153'] } // An toàn và bảo mật HT
    ]
  },
  fullstack: {
    title: 'Fullstack Developer 🔥',
    skills: [
      { name: 'Frontend Tech (HTML/CSS/JS/React)', target: 4, courses: ['1022113'] },
      { name: 'Backend Frameworks & Server', target: 4, courses: ['1022063', '1022113'] },
      { name: 'Databases & System Architecture', target: 4, courses: ['1022053', '1022103'] }, // Cơ sở dữ liệu, Phân tích thiết kế HT
      { name: 'Software Engineering & Agile', target: 4, courses: ['1022123', '1022193'] }, // Công nghệ phần mềm, Quản trị DA phần mềm
      { name: 'Docker / CI-CD basics', target: 3, courses: ['1022253'] } // DevOps
    ]
  },
  data: {
    title: 'Data Analyst / Data Scientist 📊',
    skills: [
      { name: 'Linear Algebra & Analysis', target: 4, courses: ['1020013', '1020023'] }, // Giải tích, Đại số tuyến tính
      { name: 'Database Queries (SQL/NoSQL)', target: 5, courses: ['1022053', '1022132'] }, // Cơ sở dữ liệu, PBL 2
      { name: 'Python/R Programming', target: 4, courses: ['1022013', '1022043'] },
      { name: 'Artificial Intelligence & ML', target: 4, courses: ['1022143'] }, // Trí tuệ nhân tạo
      { name: 'Big Data Processing', target: 3, courses: ['1022203'] } // Xử lý dữ liệu lớn
    ]
  },
  devops: {
    title: 'DevOps / Cloud Engineer 🏗️',
    skills: [
      { name: 'Operating Systems (Linux/Unix)', target: 5, courses: ['1022023', '1022093'] }, // Kiến trúc máy tính, Hệ điều hành
      { name: 'Computer Networking', target: 4, courses: ['1022073'] }, // Mạng máy tính
      { name: 'Cloud Computing (AWS/GCP)', target: 4, courses: ['1022213'] }, // Điện toán đám mây
      { name: 'CI/CD Pipelines & DevOps tools', target: 4, courses: ['1022253'] }, // DevOps và CI/CD
      { name: 'System Security & Hardening', target: 4, courses: ['1022153'] }
    ]
  },
  ba_pm: {
    title: 'IT Project Manager / Business Analyst 📋',
    skills: [
      { name: 'Requirements Analysis & Modeling', target: 5, courses: ['1022103'] }, // Phân tích thiết kế HT
      { name: 'Software Engineering Methodologies', target: 5, courses: ['1022123'] }, // Công nghệ phần mềm
      { name: 'Project Management & Agile/Scrum', target: 5, courses: ['1022193'] }, // Quản trị dự án phần mềm
      { name: 'Quality Assurance & Testing', target: 4, courses: ['1022163'] }, // Kiểm thử phần mềm
      { name: 'UI/UX & Wireframing', target: 4, courses: ['1022243'] }
    ]
  }
};

export default function CareerHub() {
  const { t, profile, lang } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState('skills'); // 'skills', 'portfolio', 'cv'
  const [selectedPath, setSelectedPath] = useState('backend');
  
  // Database State
  const [courses, setCourses] = useState([]);
  const [skillRatings, setSkillRatings] = useState({}); // skillName -> rating
  const [portfolios, setPortfolios] = useState([]);
  const [certificates, setCertificates] = useState([]);
  
  // Modals Forms
  const [editingProj, setEditingProj] = useState(null); // 'new' or project object
  const [projForm, setProjForm] = useState({ name: '', techStack: '', description: '', githubUrl: '', demoUrl: '' });
  
  const [editingCert, setEditingCert] = useState(null); // 'new' or cert object
  const [certForm, setCertForm] = useState({ name: '', issuer: '', issueDate: '', credentialId: '', type: 'certificate' });

  useEffect(() => {
    loadData();
  }, [selectedPath]);

  async function loadData() {
    try {
      logger.info(MODULE, 'Loading CareerHub database dependencies');
      const [allCourses, ratings, allProjects, allCerts] = await Promise.all([
        getCourses(),
        getSkillRatings(selectedPath),
        getPortfolios(),
        getCertificates()
      ]);
      setCourses(allCourses);
      setPortfolios(allProjects);
      setCertificates(allCerts);
      
      // Map ratings to dictionary
      const rMap = {};
      ratings.forEach(r => {
        rMap[r.skillName] = r.rating;
      });
      setSkillRatings(rMap);
      logger.success(MODULE, 'CareerHub dependencies loaded');
    } catch (err) {
      logger.error(MODULE, 'Failed to load data', err);
    }
  }

  // Handle rating edit
  const handleRateSkill = async (skillName, val) => {
    try {
      const updatedRatings = { ...skillRatings, [skillName]: val };
      setSkillRatings(updatedRatings);
      await saveSkillRating({
        careerPath: selectedPath,
        skillName,
        rating: val
      });
      logger.success(MODULE, `Saved rating for skill: ${skillName} -> ${val}`);
    } catch (err) {
      logger.error(MODULE, 'Failed to save skill rating', err);
    }
  };

  // Portfolio actions
  const handleOpenProjNew = () => {
    setProjForm({ name: '', techStack: '', description: '', githubUrl: '', demoUrl: '' });
    setEditingProj('new');
  };
  const handleOpenProjEdit = (p) => {
    setProjForm({ ...p });
    setEditingProj(p);
  };
  const handleSaveProj = async () => {
    if (!projForm.name.trim()) return;
    try {
      if (editingProj === 'new') {
        await createPortfolio(projForm);
      } else {
        await updatePortfolio(editingProj.id, projForm);
      }
      setEditingProj(null);
      const updated = await getPortfolios();
      setPortfolios(updated);
    } catch (err) {
      alert('Không thể lưu dự án: ' + err.message);
    }
  };
  const handleDeleteProj = async (id) => {
    if (confirm(t('common.confirmDelete'))) {
      await deletePortfolio(id);
      setEditingProj(null);
      const updated = await getPortfolios();
      setPortfolios(updated);
    }
  };

  // Certificate actions
  const handleOpenCertNew = () => {
    setCertForm({ name: '', issuer: '', issueDate: '', credentialId: '', type: 'certificate' });
    setEditingCert('new');
  };
  const handleOpenCertEdit = (c) => {
    setCertForm({ ...c });
    setEditingCert(c);
  };
  const handleSaveCert = async () => {
    if (!certForm.name.trim()) return;
    try {
      if (editingCert === 'new') {
        await createCertificate(certForm);
      } else {
        await updateCertificate(editingCert.id, certForm);
      }
      setEditingCert(null);
      const updated = await getCertificates();
      setCertificates(updated);
    } catch (err) {
      alert('Không thể lưu chứng chỉ: ' + err.message);
    }
  };
  const handleDeleteCert = async (id) => {
    if (confirm(t('common.confirmDelete'))) {
      await deleteCertificate(id);
      setEditingCert(null);
      const updated = await getCertificates();
      setCertificates(updated);
    }
  };

  // Helper mapping course code to course details
  const getMappedCoursesDetails = (codesList) => {
    return courses.filter(c => c.code && codesList.includes(c.code));
  };

  // Compute GPA and credits for CV
  const calculateAcademicStats = () => {
    const activeCourses = {};
    courses.forEach(c => {
      if (c.status === 'passed' || c.status === 'failed') {
        if (c.gradeLetter && ['R', 'I', 'X'].includes(c.gradeLetter.toUpperCase())) return;
        const score4 = c.score4 !== null ? c.score4 : 0.0;
        const key = c.code || c.name;
        const existing = activeCourses[key];
        if (!existing || score4 > existing.score4) {
          activeCourses[key] = { credits: c.credits || 0, score4 };
        }
      }
    });

    let totalWeightedScore = 0;
    let totalCreditsForGpa = 0;
    Object.values(activeCourses).forEach(item => {
      totalWeightedScore += item.score4 * item.credits;
      totalCreditsForGpa += item.credits;
    });

    const cumulativeGPA = totalCreditsForGpa > 0 ? totalWeightedScore / totalCreditsForGpa : 0.00;
    const earnedCredits = courses.filter(c => c.status === 'passed').reduce((sum, c) => sum + (c.credits || 0), 0);

    return {
      gpa: Math.round(cumulativeGPA * 100) / 100,
      credits: earnedCredits
    };
  };

  const academicStats = calculateAcademicStats();

  return (
    <div className="page">
      {/* Printable Style tag to hide UI components when printing CV */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .sidebar, .page-header, .toolbar, .tabs, .modal-overlay, .btn, select, label {
            display: none !important;
          }
          .main-content { padding: 0 !important; background: white !important; }
          .page { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .card { border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; }
          .cv-print-area { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; color: black !important; }
          .cv-header h2 { color: black !important; font-size: 2rem !important; }
          .cv-section-title { border-bottom: 2px solid #333 !important; color: black !important; }
          .cv-grid { grid-template-columns: 1fr !important; }
          .cv-project-card, .cv-cert-card { border-bottom: 1px dashed #ccc !important; padding-bottom: 10px !important; margin-bottom: 10px !important; }
        }
      `}</style>

      <div className="page-header">
        <h2>{t('career.title')}</h2>
        <p>{t('career.desc')}</p>
      </div>

      {/* Tabs */}
      <div className="toolbar">
        <div className="tabs">
          <button className={`tab ${activeSubTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveSubTab('skills')}>
            {t('career.tab.skills')}
          </button>
          <button className={`tab ${activeSubTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveSubTab('portfolio')}>
            {t('career.tab.portfolio')}
          </button>
          <button className={`tab ${activeSubTab === 'cv' ? 'active' : ''}`} onClick={() => setActiveSubTab('cv')}>
            {t('career.tab.cv')}
          </button>
        </div>

        <div className="toolbar-spacer" />

        {activeSubTab === 'skills' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t('career.path.select')}:</span>
            <select className="select" value={selectedPath} onChange={e => setSelectedPath(e.target.value)} style={{ width: '220px', padding: '6px 12px' }}>
              {Object.keys(CAREER_PATHS).map(key => (
                <option key={key} value={key}>{CAREER_PATHS[key].title}</option>
              ))}
            </select>
          </div>
        )}

        {activeSubTab === 'portfolio' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" onClick={handleOpenCertNew}>{t('career.certs.add')}</button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenProjNew}>{t('career.portfolio.add')}</button>
          </div>
        )}

        {activeSubTab === 'cv' && (
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            {t('career.cv.print')}
          </button>
        )}
      </div>

      {/* Tab 1: Skill Trees & Target Path */}
      {activeSubTab === 'skills' && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Skill assessment block */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', color: 'var(--accent-light)' }}>
              🏆 {CAREER_PATHS[selectedPath].title} - Skill Map
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {CAREER_PATHS[selectedPath].skills.map((skill, index) => {
                const userRating = skillRatings[skill.name] || 0;
                const gapVal = skill.target - userRating;
                const isUnderTarget = gapVal > 0;
                const mappedCourses = getMappedCoursesDetails(skill.courses);

                return (
                  <div key={index} style={{ paddingBottom: '16px', borderBottom: index < CAREER_PATHS[selectedPath].skills.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{skill.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target: {skill.target}/5</span>
                    </div>

                    {/* Star Rating Selectors */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px', fontSize: '1.3rem', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => handleRateSkill(skill.name, star)}
                            style={{ 
                              color: star <= userRating ? 'var(--accent-light)' : 'rgba(255,255,255,0.08)',
                              transition: 'color 0.1s ease'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: userRating > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {userRating > 0 ? `${userRating}/5` : 'Chưa đánh giá'}
                      </span>
                    </div>

                    {/* Gap analysis and mapping courses */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {userRating > 0 && (
                        <span className={`tag ${isUnderTarget ? 'tag-amber' : 'tag-green'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {isUnderTarget ? `Cần tăng ${gapVal} cấp` : 'Đạt yêu cầu JD'}
                        </span>
                      )}
                      
                      {mappedCourses.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bổ trợ:</span>
                          {mappedCourses.map(c => (
                            <span 
                              key={c.id} 
                              className={`tag tag-sm status-${c.status}`} 
                              style={{ fontSize: '0.62rem', padding: '0px 5px' }}
                              title={`Trạng thái học phần: ${c.status}`}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gap analysis summary and guidance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ background: 'rgba(108, 92, 231, 0.04)', border: '1px solid var(--border-accent)' }}>
              <h3 style={{ marginBottom: '12px' }}>📊 {t('career.skills.gap')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {CAREER_PATHS[selectedPath].skills.map((skill, index) => {
                  const ratingVal = skillRatings[skill.name] || 0;
                  const ratio = Math.min(100, (ratingVal / skill.target) * 100);
                  const isAchieved = ratingVal >= skill.target;

                  return (
                    <div key={index} style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{skill.name}</span>
                        <span style={{ fontWeight: 'bold', color: isAchieved ? 'var(--green)' : 'var(--amber)' }}>
                          {ratingVal} / {skill.target}
                        </span>
                      </div>
                      
                      {/* Flex progress bar */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${ratio}%`, 
                            background: isAchieved ? 'var(--green)' : 'var(--amber)', 
                            height: '100%',
                            transition: 'width 0.4s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3>💡 Đề xuất hành động (Guidance)</h3>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <li>🚀 **Kế hoạch học tập:** Tập trung đạt điểm cao các học phần bổ trợ được ánh xạ.</li>
                <li>📜 **Tự học bổ sung:** Tự ôn luyện và hoàn thành các chứng chỉ quốc tế liên quan đến kỹ năng thiếu hụt.</li>
                <li>📂 **Xây dựng Project:** Thực hiện từ 1-2 đồ án PBL hoặc side-project sử dụng đúng tech stack của kỹ năng đó để tạo Portfolio.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Certifications and Showcase Portfolio Projects */}
      {activeSubTab === 'portfolio' && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Projects Portfolio list */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              📂 {t('career.portfolio.title')}
            </h3>

            {portfolios.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Chưa có dự án nào trong Portfolio. Thêm dự án để hoàn thiện CV.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portfolios.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      padding: '12px', 
                      background: 'var(--bg-input)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-md)', 
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-light)' }}>{p.name}</h4>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenProjEdit(p)} style={{ padding: '2px 6px' }}>✏️</button>
                        <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteProj(p.id)} style={{ padding: '2px 6px' }}>✕</button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                      {p.description}
                    </p>

                    {p.techStack && (
                      <div style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tech stack: </span>
                        <code style={{ color: 'var(--green)', background: 'rgba(0,210,160,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{p.techStack}</code>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>🔗 Github</a>}
                      {p.demoUrl && <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', textDecoration: 'none' }}>🔗 Live Demo</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications and Awards List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              📜 {t('career.certs.title')}
            </h3>

            {certificates.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Chưa lưu chứng chỉ nào. Thêm chứng chỉ ngoại ngữ, AWS, Coursera của bạn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {certificates.map(c => (
                  <div 
                    key={c.id} 
                    style={{ 
                      padding: '10px 12px', 
                      background: 'var(--bg-input)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--green)' }}>{c.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {c.issuer} - {c.issueDate} {c.credentialId ? ` | ID: ${c.credentialId}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenCertEdit(c)} style={{ padding: '2px 6px' }}>✏️</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteCert(c.id)} style={{ padding: '2px 6px' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Dynamic CV Builder (Print Preview) */}
      {activeSubTab === 'cv' && (
        <div className="card cv-print-area" style={{ background: '#12121a', border: '1px solid var(--border)', color: '#e8e8f0', padding: '40px', maxWidth: '820px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Georgia, serif' }}>
          
          {/* CV Header */}
          <div className="cv-header" style={{ textAlign: 'center', borderBottom: '2px solid var(--accent)', paddingBottom: '20px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', color: 'var(--accent-light)' }}>
              {profile?.name || 'Họ và tên Sinh viên'}
            </h2>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
              Sinh viên ngành Công nghệ Thông tin - Đại học Bách Khoa Đà Nẵng (DUT)
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'sans-serif' }}>
              <span>✉️ {profile?.email || 'email@example.com'}</span>
              <span>🕒 Timezone: {profile?.timezone}</span>
              <span>🎓 DUT IT Candidate</span>
            </div>
          </div>

          <div className="cv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', fontFamily: 'sans-serif' }}>
            
            {/* Section: Academic Info */}
            <div>
              <h3 className="cv-section-title" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '10px', color: 'var(--accent-light)' }}>
                🎓 {t('career.cv.academic')}
              </h3>
              <div style={{ display: 'flex', gap: '30px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <div>GPA Tích lũy: <strong style={{ color: 'var(--accent-light)' }}>{academicStats.gpa.toFixed(2)} / 4.00</strong></div>
                <div>Tín chỉ đã tích lũy: <strong style={{ color: 'var(--green)' }}>{academicStats.credits} TC</strong></div>
                <div>Trường đào tạo: <strong>Đại học Bách Khoa - Đại học Đà Nẵng</strong></div>
              </div>
            </div>

            {/* Section: Core Skills */}
            <div>
              <h3 className="cv-section-title" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '10px', color: 'var(--accent-light)' }}>
                🏆 {t('career.cv.skills')} (Proficiency &gt;= 3)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(skillRatings).filter(key => skillRatings[key] >= 3).map((key, i) => (
                  <span 
                    key={i} 
                    className="tag tag-accent" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    {key} (Level {skillRatings[key]}/5)
                  </span>
                ))}
                {Object.keys(skillRatings).filter(key => skillRatings[key] >= 3).length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật kỹ năng nổi bật nào.</span>
                )}
              </div>
            </div>

            {/* Section: Portfolio Projects */}
            <div>
              <h3 className="cv-section-title" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '10px', color: 'var(--accent-light)' }}>
                📂 {t('career.cv.projects')}
              </h3>
              {portfolios.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa thêm dự án nào vào Portfolio.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {portfolios.map(p => (
                    <div key={p.id} className="cv-project-card" style={{ fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                        {p.techStack && <span style={{ color: 'var(--green)', fontSize: '0.8rem' }}>{p.techStack}</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                        {p.description}
                      </p>
                      {p.githubUrl && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Link code: {p.githubUrl}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Certificates */}
            <div>
              <h3 className="cv-section-title" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '10px', color: 'var(--accent-light)' }}>
                📜 {t('career.cv.certs')}
              </h3>
              {certificates.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa thêm chứng chỉ hoặc giải thưởng nào.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                  {certificates.map(c => (
                    <div key={c.id} className="cv-cert-card" style={{ fontSize: '0.85rem', borderLeft: '2px solid var(--green)', paddingLeft: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{c.issuer} - {c.issueDate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: Add/Edit Project */}
      {editingProj && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingProj(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProj === 'new' ? t('career.portfolio.add') : 'Sửa dự án Portfolio'}</h3>
              <button className="modal-close" onClick={() => setEditingProj(null)}>✕</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tên dự án *</label>
              <input className="input" value={projForm.name} onChange={e => setProjForm({ ...projForm, name: e.target.value })} placeholder="VD: Website Đăng ký Tín chỉ DUT" />
            </div>

            <div className="form-group">
              <label className="form-label">{t('career.portfolio.tech')}</label>
              <input className="input" value={projForm.techStack} onChange={e => setProjForm({ ...projForm, techStack: e.target.value })} placeholder="VD: React, Node.js, PostgreSQL" />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.form.desc')}</label>
              <textarea className="textarea" value={projForm.description} onChange={e => setProjForm({ ...projForm, description: e.target.value })} placeholder="Mô tả tóm tắt tính năng chính của đồ án..." style={{ minHeight: '80px' }} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('career.portfolio.github')}</label>
                <input className="input" value={projForm.githubUrl} onChange={e => setProjForm({ ...projForm, githubUrl: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">{t('career.portfolio.demo')}</label>
                <input className="input" value={projForm.demoUrl} onChange={e => setProjForm({ ...projForm, demoUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div className="modal-actions">
              {editingProj !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteProj(editingProj.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingProj(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveProj} disabled={!projForm.name.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Certificate */}
      {editingCert && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingCert(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCert === 'new' ? t('career.certs.add') : 'Sửa chứng chỉ'}</h3>
              <button className="modal-close" onClick={() => setEditingCert(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Tên chứng chỉ / Giải thưởng *</label>
              <input className="input" value={certForm.name} onChange={e => setCertForm({ ...certForm, name: e.target.value })} placeholder="VD: AWS Certified Cloud Practitioner / IELTS 7.5" />
            </div>

            <div className="form-group">
              <label className="form-label">{t('career.certs.issuer')} *</label>
              <input className="input" value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} placeholder="VD: Amazon Web Services / IDP" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('career.certs.date')}</label>
                <input className="input" value={certForm.issueDate} onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })} placeholder="VD: 06/2026 hoặc June 2026" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('career.certs.credId')}</label>
                <input className="input" value={certForm.credentialId} onChange={e => setCertForm({ ...certForm, credentialId: e.target.value })} placeholder="VD: AWS-12345 (Nếu có)" />
              </div>
            </div>

            <div className="modal-actions">
              {editingCert !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteCert(editingCert.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingCert(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveCert} disabled={!certForm.name.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
