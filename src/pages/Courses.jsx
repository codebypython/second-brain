import { useState, useEffect } from 'react';
import { 
  getCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  importDUTProgram, 
  getNotes, 
  getTasks 
} from '../store/db';
import { useAppContext } from '../AppContext';
import logger from '../store/logger';
import { convertScore10ToLetter, convertLetterToScore4, calculateCumulativeGpa } from '../store/gpaUtils';

const MODULE = 'CoursesPage';

// Mapping of DUT IT prerequisite courses
const PREREQUISITES = {
  '1022043': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // Cấu trúc dữ liệu & giải thuật <- Kỹ thuật lập trình
  '1022093': { reqCode: '1022023', reqName: 'Kiến trúc máy tính' }, // Hệ điều hành <- Kiến trúc máy tính
  '1022053': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // Cơ sở dữ liệu <- Kỹ thuật lập trình
  '1022063': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // Lập trình hướng đối tượng <- Kỹ thuật lập trình
  '1022073': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // Mạng máy tính <- Kỹ thuật lập trình
  '1022082': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // PBL 1 <- Kỹ thuật lập trình
  
  '1022103': { reqCode: '1022053', reqName: 'Cơ sở dữ liệu' }, // Phân tích thiết kế HT <- Cơ sở dữ liệu
  '1022113': { reqCode: '1022063', reqName: 'Lập trình hướng đối tượng' }, // Lập trình Web <- Lập trình hướng đối tượng
  '1022123': { reqCode: '1022013', reqName: 'Kỹ thuật lập trình' }, // Công nghệ phần mềm <- Kỹ thuật lập trình
  '1022132': { reqCode: '1022053', reqName: 'Cơ sở dữ liệu' }, // PBL 2 <- Cơ sở dữ liệu
  
  '1022143': { reqCode: '1022033', reqName: 'Toán rời rạc' }, // Trí tuệ nhân tạo <- Toán rời rạc
  '1022153': { reqCode: '1022073', reqName: 'Mạng máy tính' }, // An toàn bảo mật HT <- Mạng máy tính
  '1022163': { reqCode: '1022123', reqName: 'Công nghệ phần mềm' }, // Kiểm thử phần mềm <- Công nghệ phần mềm
  '1022182': { reqCode: '1022123', reqName: 'Công nghệ phần mềm' }, // PBL 3 <- Công nghệ phần mềm
  
  '1022222': { reqCode: '1022103', reqName: 'Phân tích thiết kế HT' }, // PBL 4 <- Phân tích thiết kế HT
  '1022273': { reqCode: '1022182', reqName: 'PBL 3: Dự án CNPM' } // PBL 5 <- PBL 3
};

export default function Courses({ navigate }) {
  const { t, lang, profile } = useAppContext();
  const [activeTab, setActiveTab] = useState('list');
  const [courses, setCourses] = useState([]);
  const [filterSem, setFilterSem] = useState(0); // 0 = All, 1-8 = Semester
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & Forms
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailTab, setDetailTab] = useState('info'); // 'info', 'pbl', 'linked'
  const [editingCourse, setEditingCourse] = useState(null); // 'new' or course object
  const [courseForm, setCourseForm] = useState({
    name: '', code: '', credits: 3, type: 'specialty', semester: 1, status: 'not_started',
    lecturer: '', room: '', schedule: '', notes: '',
    attendanceScore: '', attendanceWeight: 0.1,
    homeworkScore: '', homeworkWeight: 0.2,
    midtermScore: '', midtermWeight: 0.2,
    finalScore: '', finalWeight: 0.5,
    gradeLetter: '', score10: '', score4: ''
  });

  // PBL Form States
  const [memberForm, setMemberForm] = useState({ name: '', role: '', phone: '' });
  const [meetingForm, setMeetingForm] = useState({ date: getTodayStr(), content: '', absent: '' });
  const [pblTaskForm, setPblTaskForm] = useState({ title: '', assignee: '', status: 'todo' });

  // What-if simulator states
  const [simulatedGrades, setSimulatedGrades] = useState({}); // courseId -> gradeLetter

  // Linked items
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [linkedTasks, setLinkedTasks] = useState([]);

  useEffect(() => {
    loadCourses();
  }, [profile?.id]);

  async function loadCourses() {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      logger.info(MODULE, 'Fetching courses list');
      const data = await getCourses();
      setCourses(data);
      
      // Initialize simulation state
      const sim = {};
      let persistedSim = {};
      const key = `secondbrain_simulated_grades_${profile.id}`;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          persistedSim = JSON.parse(stored);
        }
      } catch (e) {
        logger.error(MODULE, 'Failed to parse simulated grades from localStorage', e);
      }
      data.forEach(c => {
        sim[c.id] = persistedSim[c.id] !== undefined ? persistedSim[c.id] : (c.gradeLetter || '');
      });
      setSimulatedGrades(sim);
      logger.success(MODULE, `Loaded ${data.length} courses`);
    } catch (err) {
      logger.error(MODULE, 'Failed to load courses', err);
      setError(err.message || 'Failed to load courses data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.id && Object.keys(simulatedGrades).length > 0) {
      const key = `secondbrain_simulated_grades_${profile.id}`;
      localStorage.setItem(key, JSON.stringify(simulatedGrades));
    }
  }, [simulatedGrades, profile?.id]);

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  async function handleImportFramework() {
    try {
      logger.info(MODULE, 'Importing DUT IT framework');
      const count = await importDUTProgram();
      if (count > 0) {
        alert(`Đã nhập thành công ${count} học phần khung của DUT!`);
      } else {
        alert('Khung chương trình đã tồn tại hoặc đã được nhập trước đó.');
      }
      loadCourses();
    } catch (err) {
      logger.error(MODULE, 'Framework import failed', err);
      alert('Lỗi nhập khung: ' + err.message);
    }
  }

  // Calculate overall score10 from weights and components
  function computeOverall10(formState) {
    const att = parseFloat(formState.attendanceScore);
    const hw = parseFloat(formState.homeworkScore);
    const mid = parseFloat(formState.midtermScore);
    const fin = parseFloat(formState.finalScore);

    const attW = parseFloat(formState.attendanceWeight) || 0;
    const hwW = parseFloat(formState.homeworkWeight) || 0;
    const midW = parseFloat(formState.midtermWeight) || 0;
    const finW = parseFloat(formState.finalWeight) || 0;

    if (Math.abs((attW + hwW + midW + finW) - 1.0) > 0.01) {
      return null;
    }

    let weightedSum = 0;
    let weightAccounted = 0;

    if (!isNaN(att)) { weightedSum += att * attW; weightAccounted += attW; }
    if (!isNaN(hw)) { weightedSum += hw * hwW; weightAccounted += hwW; }
    if (!isNaN(mid)) { weightedSum += mid * midW; weightAccounted += midW; }
    if (!isNaN(fin)) { weightedSum += fin * finW; weightAccounted += finW; }

    if (weightAccounted === 0) return null;
    
    return Math.round((weightedSum / weightAccounted) * 10) / 10;
  }

  // Convert score10 to letter and 4-scale based on DUT rules
  function mapDUTScore(score10) {
    const letter = convertScore10ToLetter(score10);
    const score4 = convertLetterToScore4(letter);
    return { gradeLetter: letter, score4 };
  }

  function handleFormChange(field, val) {
    const updated = { ...courseForm, [field]: val };

    if (['attendanceScore', 'homeworkScore', 'midtermScore', 'finalScore',
         'attendanceWeight', 'homeworkWeight', 'midtermWeight', 'finalWeight'].includes(field)) {
      const computed10 = computeOverall10(updated);
      if (computed10 !== null) {
        updated.score10 = computed10;
        const mapping = mapDUTScore(computed10);
        updated.gradeLetter = mapping.gradeLetter;
        updated.score4 = mapping.score4;
        
        if (mapping.gradeLetter === 'F') {
          updated.status = 'failed';
        } else if (['A', 'B', 'C', 'D'].includes(mapping.gradeLetter)) {
          updated.status = 'passed';
        }
      }
    } else if (field === 'gradeLetter') {
      const letter = val.toUpperCase();
      updated.gradeLetter = letter;
      if (letter === 'A') updated.score4 = 4.0;
      else if (letter === 'B') updated.score4 = 3.0;
      else if (letter === 'C') updated.score4 = 2.0;
      else if (letter === 'D') updated.score4 = 1.0;
      else if (letter === 'F') updated.score4 = 0.0;
      else updated.score4 = null;
      
      if (['A', 'B', 'C', 'D', 'R'].includes(letter)) {
        updated.status = 'passed';
      } else if (letter === 'F') {
        updated.status = 'failed';
      } else if (['I', 'X'].includes(letter)) {
        updated.status = 'studying';
      }
    } else if (field === 'score10') {
      const sc10 = parseFloat(val);
      if (!isNaN(sc10)) {
        const mapping = mapDUTScore(sc10);
        updated.score10 = sc10;
        updated.gradeLetter = mapping.gradeLetter;
        updated.score4 = mapping.score4;
        if (mapping.gradeLetter === 'F') updated.status = 'failed';
        else updated.status = 'passed';
      } else {
        updated.score10 = '';
        updated.gradeLetter = '';
        updated.score4 = '';
      }
    }

    setCourseForm(updated);
  }

  function openNew() {
    setCourseForm({
      name: '', code: '', credits: 3, type: 'specialty', semester: filterSem || 1, status: 'not_started',
      lecturer: '', room: '', schedule: '', notes: '',
      attendanceScore: '', attendanceWeight: 0.1,
      homeworkScore: '', homeworkWeight: 0.2,
      midtermScore: '', midtermWeight: 0.2,
      finalScore: '', finalWeight: 0.5,
      gradeLetter: '', score10: '', score4: ''
    });
    setEditingCourse('new');
  }

  function openEdit(course) {
    setCourseForm({
      ...course,
      attendanceScore: course.attendanceScore ?? '',
      attendanceWeight: course.attendanceWeight ?? 0.1,
      homeworkScore: course.homeworkScore ?? '',
      homeworkWeight: course.homeworkWeight ?? 0.2,
      midtermScore: course.midtermScore ?? '',
      midtermWeight: course.midtermWeight ?? 0.2,
      finalScore: course.finalScore ?? '',
      finalWeight: course.finalWeight ?? 0.5,
      gradeLetter: course.gradeLetter ?? '',
      score10: course.score10 ?? '',
      score4: course.score4 ?? ''
    });
    setEditingCourse(course);
  }

  async function handleSaveCourse() {
    try {
      const dataToSave = {
        ...courseForm,
        credits: parseInt(courseForm.credits) || 0,
        semester: parseInt(courseForm.semester) || 1,
        score10: courseForm.score10 !== '' ? parseFloat(courseForm.score10) : null,
        score4: courseForm.score4 !== '' ? parseFloat(courseForm.score4) : null,
        attendanceScore: courseForm.attendanceScore !== '' ? parseFloat(courseForm.attendanceScore) : null,
        homeworkScore: courseForm.homeworkScore !== '' ? parseFloat(courseForm.homeworkScore) : null,
        midtermScore: courseForm.midtermScore !== '' ? parseFloat(courseForm.midtermScore) : null,
        finalScore: courseForm.finalScore !== '' ? parseFloat(courseForm.finalScore) : null,
        attendanceWeight: parseFloat(courseForm.attendanceWeight) || 0,
        homeworkWeight: parseFloat(courseForm.homeworkWeight) || 0,
        midtermWeight: parseFloat(courseForm.midtermWeight) || 0,
        finalWeight: parseFloat(courseForm.finalWeight) || 0,
      };

      if (editingCourse === 'new') {
        await createCourse(dataToSave);
      } else {
        await updateCourse(editingCourse.id, dataToSave);
      }

      setEditingCourse(null);
      loadCourses();
    } catch (err) {
      logger.error(MODULE, 'Failed to save course', err);
      alert('Không thể lưu học phần: ' + err.message);
    }
  }

  async function handleDeleteCourse(id) {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteCourse(id);
        setEditingCourse(null);
        setSelectedCourse(null);
        loadCourses();
      } catch (err) {
        logger.error(MODULE, 'Failed to delete course', err);
        alert('Lỗi khi xóa học phần: ' + err.message);
      }
    }
  }

  async function showCourseDetails(course) {
    setSelectedCourse(course);
    setDetailTab('info');
    setLinkedNotes([]);
    setLinkedTasks([]);
    try {
      const [allNotes, allTasks] = await Promise.all([getNotes(), getTasks()]);
      
      const matchedNotes = allNotes.filter(n => 
        n.courseId === course.id || 
        (course.code && (n.tags || []).includes(course.code)) ||
        (n.title || '').toLowerCase().includes(course.name.toLowerCase())
      );
      
      const matchedTasks = allTasks.filter(task => 
        task.courseId === course.id ||
        (task.title || '').toLowerCase().includes(course.name.toLowerCase())
      );

      setLinkedNotes(matchedNotes);
      setLinkedTasks(matchedTasks);
    } catch (err) {
      logger.error(MODULE, 'Failed to fetch linked items', err);
    }
  }

  // PBL update handlers
  async function updatePblData(updatedCourse) {
    try {
      await updateCourse(updatedCourse.id, {
        pblMembers: updatedCourse.pblMembers || [],
        pblMeetings: updatedCourse.pblMeetings || [],
        pblTasks: updatedCourse.pblTasks || []
      });
      setSelectedCourse(updatedCourse);
      // Update locally in courses list
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      logger.success(MODULE, 'PBL data updated in DB');
    } catch (err) {
      logger.error(MODULE, 'Failed to save PBL details', err);
      alert('Không thể lưu thông tin PBL');
    }
  }

  function handleAddMember() {
    if (!memberForm.name.trim()) return;
    const current = selectedCourse.pblMembers || [];
    const updated = [...current, { ...memberForm, id: Date.now() }];
    const updatedCourse = { ...selectedCourse, pblMembers: updated };
    updatePblData(updatedCourse);
    setMemberForm({ name: '', role: '', phone: '' });
  }

  function handleRemoveMember(mid) {
    const current = selectedCourse.pblMembers || [];
    const updated = current.filter(m => m.id !== mid);
    const updatedCourse = { ...selectedCourse, pblMembers: updated };
    updatePblData(updatedCourse);
  }

  function handleAddMeeting() {
    if (!meetingForm.content.trim()) return;
    const current = selectedCourse.pblMeetings || [];
    const updated = [...current, { ...meetingForm, id: Date.now() }];
    const updatedCourse = { ...selectedCourse, pblMeetings: updated };
    updatePblData(updatedCourse);
    setMeetingForm({ date: getTodayStr(), content: '', absent: '' });
  }

  function handleRemoveMeeting(mtgId) {
    const current = selectedCourse.pblMeetings || [];
    const updated = current.filter(m => m.id !== mtgId);
    const updatedCourse = { ...selectedCourse, pblMeetings: updated };
    updatePblData(updatedCourse);
  }

  function handleAddPblTask() {
    if (!pblTaskForm.title.trim()) return;
    const current = selectedCourse.pblTasks || [];
    const updated = [...current, { ...pblTaskForm, id: Date.now() }];
    const updatedCourse = { ...selectedCourse, pblTasks: updated };
    updatePblData(updatedCourse);
    setPblTaskForm({ title: '', assignee: '', status: 'todo' });
  }

  function handleTogglePblTaskStatus(taskId) {
    const current = selectedCourse.pblTasks || [];
    const updated = current.map(task => {
      if (task.id === taskId) {
        const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
        return { ...task, status: nextStatus };
      }
      return task;
    });
    const updatedCourse = { ...selectedCourse, pblTasks: updated };
    updatePblData(updatedCourse);
  }

  function handleRemovePblTask(taskId) {
    const current = selectedCourse.pblTasks || [];
    const updated = current.filter(t => t.id !== taskId);
    const updatedCourse = { ...selectedCourse, pblTasks: updated };
    updatePblData(updatedCourse);
  }

  // Blackbox Blacklist & Prerequisite checking helper
  function checkPrerequisiteWarning(course, allCoursesList) {
    const prereq = PREREQUISITES[course.code];
    if (!prereq) return null; // No prerequisite

    // Find the prerequisite in current courses
    const reqCourse = allCoursesList.find(c => c.code === prereq.reqCode);
    if (!reqCourse || reqCourse.status !== 'passed') {
      return prereq.reqName; // Prerequisite not satisfied
    }
    return null;
  }

  // GPA & Credits Math helpers
  function calculateGPAStats(courseList) {
    const activeCourses = {};
    
    courseList.forEach(c => {
      if (c.status === 'passed' || c.status === 'failed') {
        if (c.gradeLetter && ['R', 'I', 'X'].includes(c.gradeLetter.toUpperCase())) {
          return;
        }

        const score4 = c.score4 !== null ? c.score4 : 0.0;
        const key = c.code || c.name;
        const existing = activeCourses[key];
        if (!existing || score4 > existing.score4) {
          activeCourses[key] = {
            credits: c.credits || 0,
            score4: score4,
            gradeLetter: c.gradeLetter || 'F',
            semester: c.semester
          };
        }
      }
    });

    const cumulativeGPA = calculateCumulativeGpa(courseList);
    
    const totalEarnedCredits = courseList
      .filter(c => c.status === 'passed')
      .reduce((acc, c) => {
        const key = c.code || c.name;
        if (!acc.find(item => (item.code || item.name) === key)) {
          acc.push(c);
        }
        return acc;
      }, [])
      .reduce((sum, c) => sum + (c.credits || 0), 0);

    const semGpa = {};
    const semCredits = {};
    for (let sem = 1; sem <= 8; sem++) {
      let semWeighted = 0;
      let semCred = 0;
      Object.values(activeCourses).forEach(item => {
        if (item.semester === sem) {
          semWeighted += item.score4 * item.credits;
          semCred += item.credits;
        }
      });
      semGpa[sem] = semCred > 0 ? Math.round((semWeighted / semCred) * 100) / 100 : null;
      semCredits[sem] = semCred;
    }

    return {
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      totalCreditsForGpa,
      totalEarnedCredits,
      semGpa,
      semCredits
    };
  }

  const gpaStats = calculateGPAStats(courses);

  // Simulated GPA logic for what-if
  function getSimulatedGPA() {
    const simCourses = courses.map(c => {
      const simGrade = simulatedGrades[c.id];
      if (simGrade !== c.gradeLetter) {
        const mapping = mapLetterToScore4(simGrade);
        return {
          ...c,
          status: ['A', 'B', 'C', 'D', 'R'].includes(simGrade) ? 'passed' : simGrade === 'F' ? 'failed' : c.status,
          gradeLetter: simGrade,
          score4: mapping.score4
        };
      }
      return c;
    });
    return calculateGPAStats(simCourses);
  }

  function mapLetterToScore4(letter) {
    return { score4: convertLetterToScore4(letter) };
  }

  const simulatedStats = getSimulatedGPA();

  function getClassification(gpa) {
    if (gpa >= 3.6) return 'Xuất sắc (Excellent)';
    if (gpa >= 3.2) return 'Giỏi (Very Good)';
    if (gpa >= 2.5) return 'Khá (Good)';
    if (gpa >= 2.0) return 'Trung bình (Average)';
    return 'Yếu/Cảnh báo học vụ (Weak/Academic Alert)';
  }

  const filteredCourses = courses.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (c.code || '').toLowerCase().includes(search.toLowerCase());
    const matchSem = filterSem === 0 ? true : c.semester === filterSem;
    const matchStatus = filterStatus === 'all' ? true : c.status === filterStatus;
    return matchSearch && matchSem && matchStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('courses.title')}</h2>
        <p>{t('courses.desc')}</p>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card accent">
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{gpaStats.cumulativeGPA.toFixed(2)}</div>
          <div className="stat-label">{t('courses.gpa.cumulative')}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
            {getClassification(gpaStats.cumulativeGPA)}
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{gpaStats.totalEarnedCredits} / 150</div>
          <div className="stat-label">{t('courses.gpa.progress')}</div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (gpaStats.totalEarnedCredits / 150) * 100)}%`, background: 'var(--green-light)', height: '100%' }} />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{courses.filter(c => c.status === 'failed').length}</div>
          <div className="stat-label">Học phần bị nợ (F)</div>
          {gpaStats.cumulativeGPA < 2.0 && gpaStats.totalCreditsForGpa > 0 && (
            <div style={{ color: 'var(--red-light)', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>
              ⚠️ Đang ở mức Cảnh báo Học vụ!
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="toolbar">
        <div className="tabs">
          <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            {t('courses.tab.list')}
          </button>
          <button className={`tab ${activeTab === 'gpa' ? 'active' : ''}`} onClick={() => setActiveTab('gpa')}>
            {t('courses.tab.gpa')}
          </button>
          <button className={`tab ${activeTab === 'whatif' ? 'active' : ''}`} onClick={() => setActiveTab('whatif')}>
            {t('courses.tab.whatif')}
          </button>
        </div>
        <div className="toolbar-spacer" />
        <div style={{ display: 'flex', gap: '8px' }}>
          {courses.length === 0 && (
            <button className="btn" onClick={handleImportFramework}>
              {t('courses.btn.import')}
            </button>
          )}
          <button className="btn btn-primary" onClick={openNew}>
            {t('courses.btn.new')}
          </button>
        </div>
      </div>

      {/* Tab 1: Course List */}
      {activeTab === 'list' && (
        <>
          <div className="search-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: 'transparent', padding: 0 }}>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
              <span className="icon">🔍</span>
              <input placeholder={t('common.search') + ' (Tên, mã môn học...)'} value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%', padding: '12px 8px', outline: 'none' }} />
            </div>

            <select className="select" value={filterSem} onChange={e => setFilterSem(Number(e.target.value))} style={{ width: '150px' }}>
              <option value={0}>Tất cả Học kỳ</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>{t('courses.semester.title', { sem: s })}</option>
              ))}
            </select>

            <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
              <option value="all">Tất cả Trạng thái</option>
              <option value="not_started">{t('courses.status.not_started')}</option>
              <option value="studying">{t('courses.status.studying')}</option>
              <option value="passed">{t('courses.status.passed')}</option>
              <option value="failed">{t('courses.status.failed')}</option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state"><p>Đang tải dữ liệu...</p></div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎓</div>
              <p>{t('courses.empty')}</p>
            </div>
          ) : (
            <div className="card" style={{ marginTop: '16px', overflowX: 'auto', padding: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', opacity: 0.8 }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Mã HP</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Tên Học phần</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Số TC</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Loại HP</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Kỳ</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Cảnh báo</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Điểm chữ</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(c => {
                    const prereqWarn = checkPrerequisiteWarning(c, courses);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.code || '--'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', color: 'var(--accent-light)' }} onClick={() => showCourseDetails(c)}>
                          {c.name} {c.type === 'pbl' ? ' 🏗️' : ''}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'center' }}>{c.credits}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                          <span className={`tag tag-${c.type === 'pbl' ? 'green' : c.type === 'specialty' ? 'accent' : 'blue'}`}>
                            {t(`courses.type.${c.type}`)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'center' }}>{c.semester}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'center' }}>
                          <span className={`tag status-${c.status}`}>
                            {t(`courses.status.${c.status}`)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', textAlign: 'center', color: 'var(--red)' }}>
                          {prereqWarn ? (
                            <span title={`Chưa hoàn thành môn tiên quyết: ${prereqWarn}`} style={{ cursor: 'help' }}>
                              ⚠️ Tiên quyết
                            </span>
                          ) : '--'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 500, textAlign: 'center', fontWeight: 'bold', color: c.gradeLetter === 'F' ? 'var(--red-light)' : 'var(--green-light)' }}>
                          {c.gradeLetter || '--'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {c.status !== 'passed' && c.status !== 'failed' && (
                              <button className="btn btn-sm" onClick={() => navigate('pomodoro', { params: { activeCourseId: c.id } })} title="Tập trung Pomodoro">⏱️</button>
                            )}
                            <button className="btn btn-sm" onClick={() => openEdit(c)}>✏️</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCourse(c.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: 8-Semester Interactive Roadmap */}
      {activeTab === 'gpa' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Simple GPA Trend Chart */}
          <div className="card">
            <div className="card-header">
              <h3>{t('courses.gpa.chart.title')}</h3>
            </div>
            <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 12px 12px 12px', borderBottom: '1px solid var(--border-card)' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
                const val = gpaStats.semGpa[s];
                const heightPct = val ? (val / 4.0) * 100 : 0;
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    {val !== null ? (
                      <>
                        <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-light)', marginBottom: '4px' }}>{val.toFixed(2)}</div>
                        <div style={{ width: '20px', background: 'linear-gradient(to top, var(--accent), var(--accent-light))', height: `${heightPct}%`, borderRadius: '3px 3px 0 0', minHeight: '4px' }} />
                      </>
                    ) : (
                      <div style={{ width: '20px', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px' }} />
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Kỳ {s}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Semester Grid (Roadmap 5 Years) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => {
              const semCourses = courses.filter(c => c.semester === semNum);
              const semGpaVal = gpaStats.semGpa[semNum];
              const totalCreditsInSem = semCourses.reduce((sum, c) => sum + c.credits, 0);

              return (
                <div key={semNum} className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '10px' }}>
                    <h4 style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Kỳ {semNum}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {totalCreditsInSem} TC {semGpaVal ? `| GPA: ${semGpaVal.toFixed(2)}` : ''}
                    </span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {semCourses.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có môn học</div>
                    ) : (
                      semCourses.map(c => {
                        const hasPrereqWarn = checkPrerequisiteWarning(c, courses);
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => showCourseDetails(c)}
                            style={{ 
                              padding: '8px 12px', 
                              background: 'rgba(255,255,255,0.02)', 
                              border: `1px solid ${hasPrereqWarn ? 'rgba(255,107,107,0.3)' : 'var(--border)'}`, 
                              borderRadius: 'var(--radius-sm)', 
                              fontSize: '0.8rem', 
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            className="table-row-hover"
                          >
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                              {c.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {hasPrereqWarn && <span title={`Chưa đạt môn tiên quyết: ${hasPrereqWarn}`} style={{ color: 'var(--red)', fontSize: '0.8rem' }}>⚠️</span>}
                              <span className={`tag tag-sm status-${c.status}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                {c.gradeLetter || t(`courses.status.${c.status}`).slice(0, 4)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: What-if Simulator */}
      {activeTab === 'whatif' && (
        <div className="card">
          <div className="card-header">
            <h3>{t('courses.whatif.title')}</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('courses.whatif.desc')}</p>
          </div>

          <div className="stats-grid" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>GPA Thực tế</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{gpaStats.cumulativeGPA.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--accent)' }}>➡️</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', fontWeight: 600 }}>GPA Mô phỏng</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--green-light)' }}>
                {simulatedStats.cumulativeGPA.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tích lũy mô phỏng</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                {simulatedStats.totalEarnedCredits} TC
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                  <th style={{ padding: '8px' }}>Mã HP</th>
                  <th style={{ padding: '8px' }}>Tên học phần</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>TC</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Kỳ</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Điểm hiện tại</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Điểm giả định (Mô phỏng)</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.code || '--'}</td>
                    <td style={{ padding: '8px', fontSize: '0.85rem' }}>{c.name}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>{c.credits}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>{c.semester}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {c.gradeLetter || '--'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <select 
                        className="select" 
                        value={simulatedGrades[c.id] || ''} 
                        onChange={e => setSimulatedGrades({ ...simulatedGrades, [c.id]: e.target.value })}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: '90px' }}
                      >
                        <option value="">Chưa học</option>
                        <option value="A">A (4.0)</option>
                        <option value="B">B (3.0)</option>
                        <option value="C">C (2.0)</option>
                        <option value="D">D (1.0)</option>
                        <option value="F">F (0.0)</option>
                        <option value="R">R (Miễn)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add/Edit Course */}
      {editingCourse && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingCourse(null)}>
          <div className="modal" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>{editingCourse === 'new' ? t('courses.btn.new') : 'Sửa học phần'}</h3>
              <button className="modal-close" onClick={() => setEditingCourse(null)}>✕</button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('courses.form.name')} *</label>
                  <input className="input" value={courseForm.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="VD: Lập trình di động" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.code')}</label>
                  <input className="input" value={courseForm.code} onChange={e => handleFormChange('code', e.target.value)} placeholder="VD: 1022230" />
                </div>
              </div>

              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.credits')}</label>
                  <input className="input" type="number" min="1" max="15" value={courseForm.credits} onChange={e => handleFormChange('credits', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.type')}</label>
                  <select className="select" value={courseForm.type} onChange={e => handleFormChange('type', e.target.value)}>
                    <option value="general">{t('courses.type.general')}</option>
                    <option value="foundation">{t('courses.type.foundation')}</option>
                    <option value="specialty">{t('courses.type.specialty')}</option>
                    <option value="elective">{t('courses.type.elective')}</option>
                    <option value="pbl">{t('courses.type.pbl')}</option>
                    <option value="internship">{t('courses.type.internship')}</option>
                    <option value="thesis">{t('courses.type.thesis')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.semester')}</label>
                  <input className="input" type="number" min="1" max="8" value={courseForm.semester} onChange={e => handleFormChange('semester', e.target.value)} />
                </div>
              </div>

              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.status')}</label>
                  <select className="select" value={courseForm.status} onChange={e => handleFormChange('status', e.target.value)}>
                    <option value="not_started">{t('courses.status.not_started')}</option>
                    <option value="studying">{t('courses.status.studying')}</option>
                    <option value="passed">{t('courses.status.passed')}</option>
                    <option value="failed">{t('courses.status.failed')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm chữ (Chỉ nhập nếu không có điểm số)</label>
                  <input className="input" value={courseForm.gradeLetter} onChange={e => handleFormChange('gradeLetter', e.target.value)} placeholder="VD: A, B, R, I" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm hệ 10 tổng kết</label>
                  <input className="input" type="number" min="0" max="10" step="0.1" value={courseForm.score10} onChange={e => handleFormChange('score10', e.target.value)} placeholder="VD: 8.5" />
                </div>
              </div>

              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.lecturer')}</label>
                  <input className="input" value={courseForm.lecturer} onChange={e => handleFormChange('lecturer', e.target.value)} placeholder="Tên giảng viên" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.room')}</label>
                  <input className="input" value={courseForm.room} onChange={e => handleFormChange('room', e.target.value)} placeholder="VD: C302" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('courses.form.schedule')}</label>
                  <input className="input" value={courseForm.schedule} onChange={e => handleFormChange('schedule', e.target.value)} placeholder="VD: Thứ 3 tiết 1-3" />
                </div>
              </div>

              {/* Advanced: Component grades calculation */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
                <h4>{t('courses.grades.title')}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hệ thống tự động tính điểm tổng kết dựa trên điểm bộ phận và trọng số.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', fontWeight: 500, fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>Thành phần</div>
                  <div style={{ textAlign: 'center' }}>Trọng số</div>
                  <div style={{ textAlign: 'center' }}>Điểm hệ 10</div>
                </div>

                {[
                  { key: 'attendance', label: t('courses.grades.attendance') },
                  { key: 'homework', label: t('courses.grades.homework') },
                  { key: 'midterm', label: t('courses.grades.midterm') },
                  { key: 'final', label: t('courses.grades.final') }
                ].map(item => (
                  <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', alignItems: 'center', padding: '6px 0' }}>
                    <div style={{ fontSize: '0.85rem' }}>{item.label}</div>
                    <div>
                      <input className="input" type="number" step="0.05" min="0" max="1" value={courseForm[`${item.key}Weight`]} onChange={e => handleFormChange(`${item.key}Weight`, e.target.value)} style={{ textAlign: 'center', padding: '6px' }} />
                    </div>
                    <div>
                      <input className="input" type="number" step="0.1" min="0" max="10" value={courseForm[`${item.key}Score`]} onChange={e => handleFormChange(`${item.key}Score`, e.target.value)} style={{ textAlign: 'center', padding: '6px' }} placeholder="--" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">{t('courses.form.notes')}</label>
                <textarea className="textarea" value={courseForm.notes} onChange={e => handleFormChange('notes', e.target.value)} placeholder="Tài liệu ôn thi, link ổ đĩa..." style={{ minHeight: '60px' }} />
              </div>
            </div>

            <div className="modal-actions">
              {editingCourse !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteCourse(editingCourse.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingCourse(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveCourse} disabled={!courseForm.name.trim()}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Course Details, PBL Tab and Linked Notes/Tasks */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedCourse(null)}>
          <div className="modal" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{selectedCourse.name}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }} className={`tag status-${selectedCourse.status}`}>
                  {t(`courses.status.${selectedCourse.status}`)}
                </span>
              </h3>
              <button className="modal-close" onClick={() => setSelectedCourse(null)}>✕</button>
            </div>

            {/* Warning prereq satisfaction in details modal */}
            {checkPrerequisiteWarning(selectedCourse, courses) && (
              <div style={{ background: 'rgba(255, 76, 76, 0.15)', border: '1px solid rgba(255, 76, 76, 0.3)', color: '#ff4c4c', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                ⚠️ Cảnh báo: Học phần này yêu cầu môn tiên quyết <strong style={{ textDecoration: 'underline' }}>{checkPrerequisiteWarning(selectedCourse, courses)}</strong> đạt điểm đậu (A/B/C/D) trước khi tham gia!
              </div>
            )}

            {/* Retake Suggestion alert (F2.6) */}
            {selectedCourse.status === 'failed' && (
              <div style={{ background: 'rgba(108, 92, 231, 0.15)', border: '1px solid var(--border-accent)', color: 'var(--accent-light)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.82rem' }}>
                💡 <strong>Đề xuất học lại (DUT Recommendation):</strong> Học phần này đã bị nợ (F). Đề xuất đăng ký học lại vào <strong>Học kỳ {selectedCourse.semester + 2}</strong> (học kỳ cùng tính chất lẻ/chẵn để khớp thời khóa biểu trường).
              </div>
            )}

            {/* Modal Detail Tabs */}
            <div className="tabs" style={{ marginBottom: '16px' }}>
              <button className={`tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>
                Thông tin chung & Điểm số
              </button>
              <button className={`tab ${detailTab === 'pbl' ? 'active' : ''}`} onClick={() => setDetailTab('pbl')}>
                🏗️ Quản lý Đồ án PBL
              </button>
              <button className={`tab ${detailTab === 'reality' ? 'active' : ''}`} onClick={() => setDetailTab('reality')}>
                📊 Đánh giá Thực tế
              </button>
              <button className={`tab ${detailTab === 'linked' ? 'active' : ''}`} onClick={() => setDetailTab('linked')}>
                📝 Ghi chú & Tasks ({linkedNotes.length + linkedTasks.length})
              </button>
            </div>

            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Detail Tab 1: Info & Grades */}
              {detailTab === 'info' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mã học phần</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedCourse.code || '--'}</div>
                      
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>Số tín chỉ & Phân loại</div>
                      <div style={{ fontSize: '0.9rem' }}>{selectedCourse.credits} TC ({t(`courses.type.${selectedCourse.type}`)})</div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>Giảng viên & Phòng học</div>
                      <div style={{ fontSize: '0.9rem' }}>{selectedCourse.lecturer || '--'} {selectedCourse.room ? `(Phòng ${selectedCourse.room})` : ''}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lịch học</div>
                      <div style={{ fontSize: '0.9rem' }}>{selectedCourse.schedule || '--'}</div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>Học kỳ đào tạo</div>
                      <div style={{ fontSize: '0.9rem' }}>Kỳ thứ {selectedCourse.semester}</div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>Kết quả điểm số</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>
                        {selectedCourse.score10 !== null ? `${selectedCourse.score10.toFixed(1)} (Hệ 10) ➜ Grade ${selectedCourse.gradeLetter || '?'}` : 'Chưa có điểm'}
                      </div>
                    </div>
                  </div>

                  {(selectedCourse.attendanceScore !== null || selectedCourse.finalScore !== null) && (
                    <div className="card" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ marginBottom: '8px' }}>Chi tiết điểm bộ phận</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chuyên cần</div>
                          <div style={{ fontWeight: 600 }}>{selectedCourse.attendanceScore ?? '--'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bài tập</div>
                          <div style={{ fontWeight: 600 }}>{selectedCourse.homeworkScore ?? '--'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giữa kỳ</div>
                          <div style={{ fontWeight: 600 }}>{selectedCourse.midtermScore ?? '--'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cuối kỳ</div>
                          <div style={{ fontWeight: 600 }}>{selectedCourse.finalScore ?? '--'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCourse.notes && (
                    <div>
                      <h4 style={{ marginBottom: '6px' }}>Ghi chú học tập</h4>
                      <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                        {selectedCourse.notes}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Detail Tab 2: PBL Project & Teamwork Management (F1.7) */}
              {detailTab === 'pbl' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {/* Part A: Team Members */}
                  <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '10px' }}>👥 {t('courses.pbl.members')}</h4>
                    
                    {/* Add Member Form */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <input className="input" placeholder="Tên thành viên..." value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} style={{ flex: 2, minWidth: '150px', padding: '6px 12px' }} />
                      <input className="input" placeholder={t('courses.pbl.role')} value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })} style={{ flex: 1, minWidth: '100px', padding: '6px 12px' }} />
                      <input className="input" placeholder="SĐT..." value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} style={{ flex: 1, minWidth: '100px', padding: '6px 12px' }} />
                      <button className="btn btn-primary btn-sm" onClick={handleAddMember}>{t('courses.pbl.addMember')}</button>
                    </div>

                    {/* Members List */}
                    {(!selectedCourse.pblMembers || selectedCourse.pblMembers.length === 0) ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('courses.pbl.noMembers')}</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {selectedCourse.pblMembers.map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                            <span><strong>{m.name}</strong> ({m.role || 'Thành viên'}) {m.phone ? ` - 📞 ${m.phone}` : ''}</span>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMember(m.id)} style={{ padding: '2px 6px' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Part B: Project Tasks List */}
                  <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '10px' }}>📋 {t('courses.pbl.tasks')}</h4>
                    
                    {/* Add Task Form */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <input className="input" placeholder="Tên đầu việc cần làm..." value={pblTaskForm.title} onChange={e => setPblTaskForm({ ...pblTaskForm, title: e.target.value })} style={{ flex: 2, minWidth: '180px', padding: '6px 12px' }} />
                      <select className="select" value={pblTaskForm.assignee} onChange={e => setPblTaskForm({ ...pblTaskForm, assignee: e.target.value })} style={{ flex: 1, minWidth: '120px', padding: '6px 12px' }}>
                        <option value="">Gán người...</option>
                        {(selectedCourse.pblMembers || []).map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={handleAddPblTask}>{t('courses.pbl.addTask')}</button>
                    </div>

                    {/* Tasks list */}
                    {(!selectedCourse.pblTasks || selectedCourse.pblTasks.length === 0) ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('courses.pbl.noTasks')}</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {selectedCourse.pblTasks.map(task => (
                          <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', borderLeft: `3px solid ${task.status === 'done' ? '#4caf50' : task.status === 'in_progress' ? '#ffb300' : 'rgba(255,255,255,0.1)'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                onClick={() => handleTogglePblTaskStatus(task.id)}
                                style={{ 
                                  cursor: 'pointer', 
                                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                  color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)'
                                }}
                              >
                                {task.status === 'done' ? '✅' : task.status === 'in_progress' ? '⏳' : '⬜'} {task.title}
                              </span>
                              {task.assignee && <span className="tag" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>👤 {task.assignee}</span>}
                            </div>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRemovePblTask(task.id)} style={{ padding: '2px 6px' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Part C: Meeting Logs */}
                  <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '10px' }}>📝 {t('courses.pbl.meetings')}</h4>
                    
                    {/* Add Meeting Form */}
                    <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="input" type="date" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} style={{ width: '130px', padding: '6px' }} />
                        <input className="input" placeholder="Thành viên vắng mặt..." value={meetingForm.absent} onChange={e => setMeetingForm({ ...meetingForm, absent: e.target.value })} style={{ flex: 1, padding: '6px 12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <textarea className="textarea" placeholder="Nội dung thảo luận chính..." value={meetingForm.content} onChange={e => setMeetingForm({ ...meetingForm, content: e.target.value })} style={{ flex: 1, minHeight: '40px', padding: '6px 12px' }} />
                        <button className="btn btn-primary btn-sm" onClick={handleAddMeeting} style={{ height: 'fit-content', alignSelf: 'flex-end' }}>{t('courses.pbl.addMeeting')}</button>
                      </div>
                    </div>

                    {/* Meetings List */}
                    {(!selectedCourse.pblMeetings || selectedCourse.pblMeetings.length === 0) ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('courses.pbl.noMeetings')}</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {selectedCourse.pblMeetings.map(m => (
                          <div key={m.id} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                              <strong>📅 {m.date}</strong>
                              <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMeeting(m.id)} style={{ padding: '0 4px', fontSize: '0.65rem' }}>✕</button>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{m.content}</div>
                            {m.absent && <div style={{ fontSize: '0.72rem', color: 'var(--red-light)', marginTop: '4px' }}>Vắng: {m.absent}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detail Tab Reality: Academic Utility Review */}
              {detailTab === 'reality' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '8px' }}>{t('courses.reality.title')}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('courses.reality.desc')}</p>
                    
                    {/* Stars selector */}
                    <div className="form-group">
                      <label className="form-label">{t('courses.reality.rating')}</label>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '1.8rem', cursor: 'pointer', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => {
                              const updatedCourse = { ...selectedCourse, realityRating: star };
                              setSelectedCourse(updatedCourse);
                            }}
                            style={{ 
                              color: star <= (selectedCourse.realityRating || 0) ? 'var(--amber)' : 'rgba(255,255,255,0.1)',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <div className="form-group">
                      <label className="form-label">{t('courses.reality.notes')}</label>
                      <textarea 
                        className="textarea" 
                        value={selectedCourse.realityNotes || ''} 
                        onChange={e => {
                          const updatedCourse = { ...selectedCourse, realityNotes: e.target.value };
                          setSelectedCourse(updatedCourse);
                        }}
                        placeholder="Nêu nhận xét về sự khác biệt giữa lý thuyết môn học và thực tế yêu cầu tuyển dụng..."
                        style={{ minHeight: '100px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={async () => {
                        try {
                          await updateCourse(selectedCourse.id, {
                            realityRating: selectedCourse.realityRating || 0,
                            realityNotes: selectedCourse.realityNotes || ''
                          });
                          // Sync local list
                          setCourses(courses.map(c => c.id === selectedCourse.id ? { ...c, realityRating: selectedCourse.realityRating, realityNotes: selectedCourse.realityNotes } : c));
                          alert(t('courses.reality.saved'));
                        } catch (err) {
                          alert('Lỗi: ' + err.message);
                        }
                      }}
                    >
                      Lưu đánh giá
                    </button>
                  </div>
                </div>
              )}

              {/* Detail Tab 3: Linked Notes & Tasks */}
              {detailTab === 'linked' && (
                <div className="grid-2">
                  <div>
                    <h4 style={{ marginBottom: '8px' }}>{t('courses.link.notes', { count: linkedNotes.length })}</h4>
                    {linkedNotes.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa có ghi chú liên kết.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {linkedNotes.map(n => (
                          <div key={n.id} style={{ padding: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', borderLeft: '3px solid var(--accent)' }}>
                            {n.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '8px' }}>{t('courses.link.tasks', { count: linkedTasks.length })}</h4>
                    {linkedTasks.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Không có deadline hay task bài tập mở.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {linkedTasks.map(task => (
                          <div key={task.id} style={{ padding: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', borderLeft: `3px solid ${task.priority === 'high' ? 'red' : 'yellow'}` }}>
                            <span>{task.title}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.dueDate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              {selectedCourse.status !== 'passed' && selectedCourse.status !== 'failed' && (
                <button className="btn btn-primary" onClick={() => { setSelectedCourse(null); navigate('pomodoro', { params: { activeCourseId: selectedCourse.id } }); }}>
                  ⏱️ Tập trung Pomodoro
                </button>
              )}
              <button className="btn" onClick={() => { setSelectedCourse(null); openEdit(selectedCourse); }}>✏️ Sửa học phần</button>
              <div className="toolbar-spacer" />
              <button className="btn btn-primary" onClick={() => setSelectedCourse(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
