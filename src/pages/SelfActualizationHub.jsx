import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import {
  getBooks, createBook, updateBook, deleteBook,
  getLanguageGoals, saveLanguageGoal,
  getLanguageLogs, createLanguageLog, deleteLanguageLog,
  getResearchPapers, createResearchPaper, updateResearchPaper, deleteResearchPaper,
  getResearchIdeas, createResearchIdea, updateResearchIdea, deleteResearchIdea,
  getBrandingPosts, createBrandingPost, updateBrandingPost, deleteBrandingPost,
  getMentorLogs, createMentorLog, updateMentorLog, deleteMentorLog,
  getCourses, getHealthRange, getExpenses, getDB, createDeck, createFlashcard
} from '../store/db';
import logger from '../store/logger';

const MODULE = 'SelfActualizationHub';

export default function SelfActualizationHub() {
  const { t, profile } = useAppContext();
  const [activeTab, setActiveTab] = useState('reading');

  // Reading & Finance States
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', author: '', category: 'Economics', status: 'unread', rating: 5, progress: 0, notes: '', review: '' });
  const [financeInput, setFinanceInput] = useState({ monthly: '', rate: '', years: '' });
  const [financeResult, setFinanceResult] = useState(0);
  const [financeSchedule, setFinanceSchedule] = useState([]);

  // Language States
  const [langGoals, setLangGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ language: 'English', currentScore: '', targetScore: '', examDate: '', planNotes: '' });
  const [langLogs, setLangLogs] = useState([]);
  const [newLog, setNewLog] = useState({ type: 'listening', duration: 30, title: '', date: new Date().toISOString().slice(0, 10), notes: '' });

  // Academia States
  const [papers, setPapers] = useState([]);
  const [newPaper, setNewPaper] = useState({ title: '', authors: '', journal: '', year: new Date().getFullYear(), link: '', category: '', status: 'to_read', notes: '' });
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', category: 'Thesis', status: 'draft', pblLinked: '' });
  const [courses, setCourses] = useState([]);
  const [selectedMapPath, setSelectedMapPath] = useState('backend');

  // AI Advisor States
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { sender: 'ai', text: 'Xin chào! Tôi là AI Cố vấn của bạn. Hãy chọn một câu hỏi gợi ý nhanh hoặc hỏi tôi bất cứ điều gì về lộ trình học tập, tài chính và thói quen cá nhân của bạn.', timestamp: new Date() }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Personal Branding & Activity Grid States
  const [githubGoal, setGithubGoal] = useState({ target: 0, current: 0 });
  const [activityGrid, setActivityGrid] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', platform: 'Medium', status: 'published', views: 0, date: new Date().toISOString().slice(0, 10), url: '' });
  const [mentorLogs, setMentorLogs] = useState([]);
  const [newMentor, setNewMentor] = useState({ menteeName: '', topic: '', duration: 2, date: new Date().toISOString().slice(0, 10), notes: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    calculateFinance();
  }, [financeInput]);

  const isChatLoadedRef = useRef(false);

  useEffect(() => {
    if (profile?.id) {
      const key = `secondbrain_chat_logs_${profile.id}`;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const formatted = parsed.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          setChatLogs(formatted);
        } else {
          setChatLogs([
            { sender: 'ai', text: 'Xin chào! Tôi là AI Cố vấn của bạn. Hãy chọn một câu hỏi gợi ý nhanh hoặc hỏi tôi bất cứ điều gì về lộ trình học tập, tài chính và thói quen cá nhân của bạn.', timestamp: new Date() }
          ]);
        }
      } catch (e) {
        logger.error(MODULE, 'Failed to load chat logs from localStorage', e);
      } finally {
        isChatLoadedRef.current = true;
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id && isChatLoadedRef.current) {
      const key = `secondbrain_chat_logs_${profile.id}`;
      localStorage.setItem(key, JSON.stringify(chatLogs));
    }
  }, [chatLogs, profile?.id]);

  async function loadAllData() {
    logger.info(MODULE, 'Loading Self Actualization Data');
    try {
      const [b, lg, ll, p, id, c, bp, ml] = await Promise.all([
        getBooks(), getLanguageGoals(), getLanguageLogs(),
        getResearchPapers(), getResearchIdeas(), getCourses(),
        getBrandingPosts(), getMentorLogs()
      ]);
      setBooks(b);
      setLangGoals(lg);
      setLangLogs(ll);
      setPapers(p);
      setIdeas(id);
      setCourses(c);
      setPosts(bp);
      setMentorLogs(ml);

      // Load Github stats if saved in profile
      if (profile?.githubTarget) {
        setGithubGoal({ target: Number(profile.githubTarget), current: Number(profile.githubCurrent || 0) });
      }

      // Generate 100% real local activity logs for the past 48 days (Tasks completed, pomodoros, notes, journals)
      const grid = [];
      const dbInstance = getDB();
      const [allTasks, allPomos, allNotes, allJournals] = await Promise.all([
        dbInstance.tasks.toArray(),
        dbInstance.pomodoro_logs ? dbInstance.pomodoro_logs.toArray() : Promise.resolve([]),
        dbInstance.notes.toArray(),
        dbInstance.journal.toArray()
      ]);

      for (let i = 47; i >= 0; i--) {
        const dateObj = new Date(Date.now() - i * 86400000);
        const dateStr = dateObj.toISOString().slice(0, 10);

        const tasksCount = allTasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === dateStr).length;
        const pomosCount = allPomos.filter(p => p.date && p.date.slice(0, 10) === dateStr).length;
        const notesCount = allNotes.filter(n => n.createdAt && n.createdAt.slice(0, 10) === dateStr).length;
        const journalsCount = allJournals.filter(j => j.date === dateStr).length;

        const totalActivity = tasksCount + pomosCount + notesCount + journalsCount;
        grid.push({ date: dateStr, count: totalActivity });
      }
      setActivityGrid(grid);

    } catch (err) {
      logger.error(MODULE, 'Failed to load self actualization details', err);
    }
  }

  // --- Reading & Finance Actions ---
  async function handleAddBook(e) {
    e.preventDefault();
    if (!newBook.title.trim()) return;
    try {
      await createBook(newBook);
      setNewBook({ title: '', author: '', category: 'Economics', status: 'unread', rating: 5, progress: 0, notes: '', review: '' });
      const b = await getBooks();
      setBooks(b);
    } catch (err) {
      logger.error(MODULE, 'Add book failed', err);
    }
  }

  async function handleUpdateBookProgress(id, progress) {
    try {
      const p = Math.max(0, Math.min(100, Number(progress)));
      const status = p === 100 ? 'completed' : p > 0 ? 'reading' : 'unread';
      await updateBook(id, { progress: p, status });
      const b = await getBooks();
      setBooks(b);
    } catch (err) {
      logger.error(MODULE, 'Update book progress failed', err);
    }
  }

  async function handleDeleteBook(id) {
    if (!confirm('Xóa cuốn sách này?')) return;
    try {
      await deleteBook(id);
      const b = await getBooks();
      setBooks(b);
    } catch (err) {
      logger.error(MODULE, 'Delete book failed', err);
    }
  }

  function calculateFinance() {
    const P = Number(financeInput.monthly);
    const r = Number(financeInput.rate) / 100 / 12;
    const n = Number(financeInput.years) * 12;
    if (isNaN(P) || isNaN(r) || isNaN(n) || P <= 0 || r <= 0 || n <= 0) {
      setFinanceResult(0);
      setFinanceSchedule([]);
      return;
    }

    let total = 0;
    const schedule = [];
    for (let month = 1; month <= n; month++) {
      total = (total + P) * (1 + r);
      if (month % 12 === 0) {
        schedule.push({ year: month / 12, total: Math.round(total) });
      }
    }
    setFinanceResult(Math.round(total));
    setFinanceSchedule(schedule);
  }

  // --- Language Actions ---
  async function handleSaveGoal(e) {
    e.preventDefault();
    try {
      await saveLanguageGoal(newGoal);
      const lg = await getLanguageGoals();
      setLangGoals(lg);
      setNewGoal({ language: 'English', currentScore: '', targetScore: '', examDate: '', planNotes: '' });
    } catch (err) {
      logger.error(MODULE, 'Save goal failed', err);
    }
  }

  async function handleAddLangLog(e) {
    e.preventDefault();
    if (!newLog.title.trim()) return;
    try {
      await createLanguageLog(newLog);
      const ll = await getLanguageLogs();
      setLangLogs(ll);
      setNewLog({ type: 'listening', duration: 30, title: '', date: new Date().toISOString().slice(0, 10), notes: '' });
    } catch (err) {
      logger.error(MODULE, 'Add language log failed', err);
    }
  }

  async function handleDeleteLangLog(id) {
    if (!confirm('Xóa nhật ký này?')) return;
    try {
      await deleteLanguageLog(id);
      const ll = await getLanguageLogs();
      setLangLogs(ll);
    } catch (err) {
      logger.error(MODULE, 'Delete log failed', err);
    }
  }

  async function handleSeedITVocabulary() {
    try {
      const dbInstance = getDB();
      let deck = await dbInstance.decks.where('name').equals('Từ vựng chuyên ngành IT').first();
      let deckId;
      if (!deck) {
        deckId = await createDeck({ name: 'Từ vựng chuyên ngành IT', category: 'English' });
      } else {
        deckId = deck.id;
      }

      const defaultITVocab = [
        { front: 'API (Application Programming Interface)', back: 'Giao diện lập trình ứng dụng: Phương thức cho phép các chương trình phần mềm giao tiếp với nhau.' },
        { front: 'Database Index', back: 'Chỉ mục Cơ sở dữ liệu: Cấu trúc dữ liệu giúp tăng tốc độ tìm kiếm và truy vấn thông tin.' },
        { front: 'Concurrency', back: 'Tính đồng thời: Xử lý nhiều tiến trình/tác vụ cùng lúc trong một chu kỳ thời gian.' },
        { front: 'CI/CD (Continuous Integration / Continuous Deployment)', back: 'Tích hợp & Triển khai liên tục: Tự động hóa khâu kiểm thử và phát hành mã nguồn.' },
        { front: 'Dependency Injection (DI)', back: 'Tiêm phụ thuộc: Design pattern giúp giảm phụ thuộc cứng nhắc giữa các đối tượng lập trình.' },
        { front: 'Docker Container', back: 'Thùng chứa Docker: Một gói phần mềm nhẹ chứa toàn bộ code và thư viện cấu hình chạy ứng dụng cô lập.' },
        { front: 'Refactoring', back: 'Tái cấu trúc mã nguồn: Cải tiến cấu trúc bên trong của code để tăng khả năng đọc hiểu mà không đổi tính năng.' },
        { front: 'Asynchronous Programming', back: 'Lập trình bất đồng bộ: Cách lập trình không chặn luồng chính, tác vụ chạy nền sẽ trả về sau.' },
        { front: 'Inheritance & Polymorphism', back: 'Kế thừa & Đa hình: Hai tính chất cơ bản trong lập trình hướng đối tượng (OOP).' },
        { front: 'Algorithm Complexity (Big O)', back: 'Độ phức tạp thuật toán: Cách biểu diễn hiệu năng (thời gian & không gian bộ nhớ) của thuật toán.' }
      ];

      for (const card of defaultITVocab) {
        const existing = await dbInstance.flashcards.where('deckId').equals(deckId).filter(c => c.front === card.front).first();
        if (!existing) {
          await createFlashcard({ deckId, front: card.front, back: card.back });
        }
      }

      alert(t('self.lang.vocab.success', { defaultValue: 'Successfully seeded IT technical vocabulary terms to Study Hub!' }));
    } catch (err) {
      logger.error(MODULE, 'Seeding vocabulary failed', err);
    }
  }

  // --- Research Actions ---
  async function handleAddPaper(e) {
    e.preventDefault();
    if (!newPaper.title.trim()) return;
    try {
      await createResearchPaper(newPaper);
      const p = await getResearchPapers();
      setPapers(p);
      setNewPaper({ title: '', authors: '', journal: '', year: new Date().getFullYear(), link: '', category: '', status: 'to_read', notes: '' });
    } catch (err) {
      logger.error(MODULE, 'Add paper failed', err);
    }
  }

  async function handleDeletePaper(id) {
    if (!confirm('Xóa bài báo này?')) return;
    try {
      await deleteResearchPaper(id);
      const p = await getResearchPapers();
      setPapers(p);
    } catch (err) {
      logger.error(MODULE, 'Delete paper failed', err);
    }
  }

  async function handleAddIdea(e) {
    e.preventDefault();
    if (!newIdea.title.trim()) return;
    try {
      await createResearchIdea(newIdea);
      const id = await getResearchIdeas();
      setIdeas(id);
      setNewIdea({ title: '', description: '', category: 'Thesis', status: 'draft', pblLinked: '' });
    } catch (err) {
      logger.error(MODULE, 'Add idea failed', err);
    }
  }

  async function handleDeleteIdea(id) {
    if (!confirm('Xóa ý tưởng này?')) return;
    try {
      await deleteResearchIdea(id);
      const idList = await getResearchIdeas();
      setIdeas(idList);
    } catch (err) {
      logger.error(MODULE, 'Delete idea failed', err);
    }
  }

  // --- Brand Actions ---
  async function handleSaveGithub() {
    try {
      // Save directly to the masterDB profile configuration 
      profile.githubTarget = githubGoal.target;
      profile.githubCurrent = githubGoal.current;
      alert('Đã lưu chỉ số đóng góp GitHub!');
    } catch (err) {
      logger.error(MODULE, 'Save github details failed', err);
    }
  }

  async function handleAddPost(e) {
    e.preventDefault();
    if (!newPost.title.trim()) return;
    try {
      await createBrandingPost(newPost);
      const bp = await getBrandingPosts();
      setPosts(bp);
      setNewPost({ title: '', platform: 'Medium', status: 'published', views: 0, date: new Date().toISOString().slice(0, 10), url: '' });
    } catch (err) {
      logger.error(MODULE, 'Add post failed', err);
    }
  }

  async function handleDeletePost(id) {
    if (!confirm('Xóa bài đăng này?')) return;
    try {
      await deleteBrandingPost(id);
      const bp = await getBrandingPosts();
      setPosts(bp);
    } catch (err) {
      logger.error(MODULE, 'Delete post failed', err);
    }
  }

  async function handleAddMentor(e) {
    e.preventDefault();
    if (!newMentor.menteeName.trim()) return;
    try {
      await createMentorLog(newMentor);
      const ml = await getMentorLogs();
      setMentorLogs(ml);
      setNewMentor({ menteeName: '', topic: '', duration: 2, date: new Date().toISOString().slice(0, 10), notes: '' });
    } catch (err) {
      logger.error(MODULE, 'Add mentor log failed', err);
    }
  }

  async function handleDeleteMentor(id) {
    if (!confirm('Xóa nhật ký mentoring này?')) return;
    try {
      await deleteMentorLog(id);
      const ml = await getMentorLogs();
      setMentorLogs(ml);
    } catch (err) {
      logger.error(MODULE, 'Delete mentor log failed', err);
    }
  }

  // --- AI Advisor Actions ---
  async function handleChatSubmit(e) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatLogs(prev => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const reply = await generateAIResponse(userMessage);
      setChatLogs(prev => [...prev, { sender: 'ai', text: reply, timestamp: new Date() }]);
    } catch (err) {
      setChatLogs(prev => [...prev, { sender: 'ai', text: `Đã xảy ra lỗi: ${err.message}. Vui lòng thử lại.`, timestamp: new Date() }]);
    } finally {
      setAiLoading(false);
    }
  }

  const handleClearChat = () => {
    if (confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện với AI?')) {
      const defaultGreeting = [
        { sender: 'ai', text: 'Xin chào! Tôi là AI Cố vấn của bạn. Hãy chọn một câu hỏi gợi ý nhanh hoặc hỏi tôi bất cứ điều gì về lộ trình học tập, tài chính và thói quen cá nhân của bạn.', timestamp: new Date() }
      ];
      setChatLogs(defaultGreeting);
      if (profile?.id) {
        const key = `secondbrain_chat_logs_${profile.id}`;
        localStorage.setItem(key, JSON.stringify(defaultGreeting));
      }
    }
  };

  async function triggerAIPrompt(type) {
    setAiLoading(true);
    let promptText = '';
    if (type === 'roadmap') promptText = 'Hãy gợi ý lộ trình học tập kỳ tiếp theo dựa trên bảng điểm GPA, tín chỉ tích lũy và hướng phát triển sự nghiệp của tôi.';
    if (type === 'habits') promptText = 'Hãy phân tích các thói quen sinh hoạt (giấc ngủ, tập luyện, Pomodoro) và đề xuất cải thiện năng suất học tập.';
    if (type === 'weekly') promptText = 'Hãy lập báo cáo tiến độ tuần vừa qua về học tập, sức khỏe và chi tiêu tài chính của tôi.';

    setChatLogs(prev => [...prev, { sender: 'user', text: promptText, timestamp: new Date() }]);

    try {
      const reply = await generateAIResponse(promptText, type);
      setChatLogs(prev => [...prev, { sender: 'ai', text: reply, timestamp: new Date() }]);
    } catch (err) {
      setChatLogs(prev => [...prev, { sender: 'ai', text: `Không thể tạo phản hồi: ${err.message}`, timestamp: new Date() }]);
    } finally {
      setAiLoading(false);
    }
  }

  async function generateAIResponse(message, typeHint = null) {
    // Check if database is empty to trigger onboarding flow (No dummy values allowed)
    const totalCredits = courses.filter(c => c.status === 'passed').reduce((sum, c) => sum + (c.credits || 0), 0);
    const hasCourses = courses.length > 0;
    
    let averageSleep = 0;
    let sleepLogsCount = 0;
    try {
      const healthLogs = await getHealthRange(
        new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10)
      );
      sleepLogsCount = healthLogs.length;
      if (sleepLogsCount > 0) {
        const totalSleep = healthLogs.reduce((sum, log) => sum + (Number(log.sleepHours) || 0), 0);
        averageSleep = (totalSleep / sleepLogsCount).toFixed(1);
      }
    } catch (_) {}

    let spendingThisMonth = 0;
    let expensesCount = 0;
    try {
      const expenses = await getExpenses({ month: new Date().toISOString().slice(0, 7) });
      expensesCount = expenses.length;
      spendingThisMonth = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch (_) {}

    // Onboarding guide if there is absolutely no student data logged
    if (!hasCourses && sleepLogsCount === 0 && expensesCount === 0) {
      return `### 📚 HƯỚNG DẪN KHỞI ĐỘNG HỆ THỐNG SECOND BRAIN

Chào mừng bạn đến với AI Cố vấn! Do hiện tại cơ sở dữ liệu của bạn hoàn toàn trống, AI không có dữ liệu thực tế nào để phân tích thói quen hay lộ trình.

Hãy làm theo các chỉ dẫn sau để bắt đầu cung cấp dữ liệu thật:
1. **🎓 Nhập học phần & GPA:** Vào mục **Học phần & GPA** trên Sidebar, bấm **Nhập khung chương trình DUT** để tải sẵn khung chương trình CNTT, sau đó cập nhật trạng thái/điểm số của các môn bạn đang hoặc đã học.
2. **🏆 Thiết lập Career Path:** Vào mục **Lộ trình & Hồ sơ** (Career & Portfolio), chọn hướng đi (VD: Backend, Frontend) và tự đánh giá năng lực các kỹ năng.
3. **💸 Nhập chi tiêu thực tế:** Vào mục **Chi tiêu** (Expenses) để thiết lập hạn mức và ghi nhận các khoản ăn uống, sinh hoạt thực tế của bạn.
4. **💪 Cập nhật chỉ số sức khỏe:** Vào mục **Sức khỏe** (Health) để ghi nhận số giờ ngủ và hoạt động tập luyện thể chất hàng ngày.

*Hãy thử lại các câu hỏi gợi ý nhanh sau khi bạn đã nhập những dữ liệu đầu tiên!*`;
    }

    // Heuristics or Gemini API
    const activeCourses = {};
    courses.forEach(c => {
      if (c.status === 'passed' || c.status === 'failed') {
        const grade4 = c.score4 !== null ? c.score4 : 0.0;
        const existing = activeCourses[c.code || c.name];
        if (!existing || grade4 > existing.score4) {
          activeCourses[c.code || c.name] = { credits: c.credits || 0, score4: grade4 };
        }
      }
    });
    let totalWeighted = 0;
    let totalCreditsForGpa = 0;
    Object.values(activeCourses).forEach(item => {
      totalWeighted += item.score4 * item.credits;
      totalCreditsForGpa += item.credits;
    });
    const gpa = totalCreditsForGpa > 0 ? (totalWeighted / totalCreditsForGpa).toFixed(2) : '0.00';
    const failedCourses = courses.filter(c => c.status === 'failed').map(c => c.name);
    const inProgressCourses = courses.filter(c => c.status === 'in_progress').map(c => c.name);

    const contextStr = `
- Học viên: ${profile?.name || 'Sinh viên'}
- GPA tích lũy hiện tại (DUT): ${gpa}
- Tín chỉ đã tích lũy: ${totalCredits} TC
- Môn học đang học: ${inProgressCourses.join(', ') || 'Chưa ghi nhận'}
- Môn học chưa đạt (bị điểm F): ${failedCourses.join(', ') || 'Không có'}
- Thời gian ngủ trung bình tuần qua: ${sleepLogsCount > 0 ? `${averageSleep} giờ/ngày` : 'Chưa ghi nhận'}
- Chi tiêu tháng này: ${expensesCount > 0 ? `${spendingThisMonth.toLocaleString('vi-VN')} VND` : 'Chưa ghi nhận'}
- Định hướng sự nghiệp hiện tại: ${selectedMapPath.toUpperCase()}
    `;

    const apiKey = profile?.geminiApiKey;
    if (apiKey && apiKey.trim().startsWith('AIzaSy')) {
      const prompt = `Bạn là trợ lý AI cố vấn học tập & thói quen (Smart Advisor) thuộc ứng dụng Second Brain dành riêng cho sinh viên CNTT Đại học Bách Khoa Đà Nẵng (DUT).
Dựa trên dữ liệu thực tế của sinh viên này (không dùng dữ liệu ảo hay giả thuyết ngoài những gì đã được cung cấp):
${contextStr}

Yêu cầu của sinh viên: "${message}"

Hãy đưa ra phản hồi bằng Tiếng Việt thân thiện, rõ ràng với Markdown. Chỉ ra chính xác các chỉ số từ dữ liệu thật và đưa ra lời khuyên thiết thực. Nếu thiếu thông tin nào (ví dụ giấc ngủ hay chi tiêu chưa ghi nhận), hãy hướng dẫn sinh viên cách cập nhật dữ liệu.`;

      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (!res.ok) throw new Error(`Google API returned status ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được phản hồi từ AI.';
      } catch (err) {
        return `[Cloud AI Error] Lỗi kết nối Gemini API. Chuyển sang kết quả phân tích Offline:\n\n` + getLocalHeuristicResponse(typeHint, message, contextStr, hasCourses, sleepLogsCount, expensesCount, averageSleep, spendingThisMonth, failedCourses);
      }
    } else {
      return getLocalHeuristicResponse(typeHint, message, contextStr, hasCourses, sleepLogsCount, expensesCount, averageSleep, spendingThisMonth, failedCourses);
    }
  }

  function getLocalHeuristicResponse(typeHint, message, contextStr, hasCourses, sleepLogsCount, expensesCount, averageSleep, spendingThisMonth, failedCourses) {
    const query = message.toLowerCase();

    if (typeHint === 'roadmap' || query.includes('lộ trình') || query.includes('kỳ tới')) {
      let advice = `### 🎯 LỘ TRÌNH ĐỀ XUẤT HỌC KỲ TỚI (DỮ LIỆU THẬT)

`;
      if (!hasCourses) {
        advice += `⚠️ **Chỉ dẫn:** Bạn chưa nhập môn học nào trong cơ sở dữ liệu học phần. Hãy truy cập mục **Học phần & GPA** ➜ bấm nút **Nhập khung chương trình DUT** và cập nhật điểm số để AI có thể gợi ý lộ trình dựa trên GPA của bạn.\n`;
        return advice;
      }

      if (failedCourses.length > 0) {
        advice += `⚠️ **Đề xuất đăng ký học lại:** Bạn hiện có **${failedCourses.length} môn chưa đạt (F)**: *${failedCourses.join(', ')}*. Hãy ưu tiên đăng ký học lại các môn này ở học kỳ chẵn/lẻ kế tiếp của DUT để phục hồi GPA tích lũy.\n\n`;
      }
      
      advice += `**Môn học trọng tâm theo vai trò ${selectedMapPath.toUpperCase()}:**\n`;
      if (selectedMapPath === 'backend') {
        advice += `   - Tập trung củng cố kiến thức các môn *Cấu trúc dữ liệu và giải thuật*, *Cơ sở dữ liệu*.\n   - Lên kế hoạch tự học SQL và API Design.\n`;
      } else if (selectedMapPath === 'frontend') {
        advice += `   - Thực hành lập trình sản phẩm thực tế với môn *Lập trình Web*.\n   - Đăng ký môn tự chọn *Thiết kế UI/UX*.\n`;
      } else if (selectedMapPath === 'devops') {
        advice += `   - Chú ý học tốt môn *Mạng máy tính* và đăng ký học phần *DevOps và CI/CD*.\n`;
      } else {
        advice += `   - Rèn luyện kỹ năng mô hình hóa với môn *Trí tuệ nhân tạo* và *Xử lý dữ liệu lớn*.\n`;
      }
      return advice;
    }

    if (typeHint === 'habits' || query.includes('thói quen') || query.includes('giấc ngủ')) {
      let advice = `### ⚡ PHÂN TÍCH THÓI QUEN & NĂNG SUẤT (DỮ LIỆU THẬT)

`;
      if (sleepLogsCount === 0) {
        advice += `⚠️ **Chỉ dẫn:** Hệ thống chưa ghi nhận bất kỳ nhật ký giấc ngủ nào của bạn tuần qua. Hãy cập nhật chỉ số ngủ (ít nhất 3 ngày gần đây) tại mục **Sức khỏe** để AI đưa ra phân tích chính xác thói quen sinh học của bạn.\n`;
      } else {
        if (averageSleep < 6.5) {
          advice += `❌ **Giấc ngủ suy giảm (Trung bình ${averageSleep}h/ngày):** Thời lượng ngủ trung bình của bạn đang dưới mức khuyến nghị (6.5 giờ). Code muộn thường xuyên sẽ làm giảm đáng kể khả năng tập trung. Hãy thiết lập thói quen đi ngủ trước 23:30.\n`;
        } else {
          advice += `✅ **Thời lượng ngủ tốt (Trung bình ${averageSleep}h/ngày):** Nhịp sinh học của bạn rất ổn định, giúp duy trì đầu óc tỉnh táo khi học tập.\n`;
        }
      }
      advice += `\n*Mẹo:* Bạn có thể sử dụng đồng hồ **Tập trung (Pomodoro)** và liên kết với các đồ án môn học PBL để đo lường chính xác số giờ làm việc thực tế của mình.`;
      return advice;
    }

    if (typeHint === 'weekly' || query.includes('tiến độ') || query.includes('tuần')) {
      let advice = `### 📊 BÁO CÁO TIẾN ĐỘ & CHI TIÊU HÀNG TUẦN (DỮ LIỆU THẬT)

`;
      if (expensesCount === 0) {
        advice += `- **Quản lý Chi tiêu:** Bạn chưa nhập bất kỳ giao dịch chi tiêu nào trong tháng này. Hãy cập nhật các khoản ăn uống, sinh hoạt tại mục **Chi tiêu** để AI giúp bạn kiểm soát ngân sách.\n`;
      } else {
        advice += `- **Chi tiêu tháng này:** Bạn đã chi tiêu tổng cộng **${spendingThisMonth.toLocaleString('vi-VN')} VND** thực tế. Hãy chú ý đối chiếu với hạn mức tháng để tránh lạm phát chi tiêu.\n`;
      }

      if (!hasCourses) {
        advice += `- **Học tập:** Hãy nhập khung chương trình học tại mục **Học phần & GPA** để hệ thống theo dõi tiến độ số tín chỉ đã tích lũy của bạn.`;
      } else {
        const passedCredits = courses.filter(c => c.status === 'passed').reduce((sum, c) => sum + (c.credits || 0), 0);
        advice += `- **Tín chỉ tích lũy:** Bạn đã hoàn thành **${passedCredits} TC** trên tổng số yêu cầu của chương trình đào tạo DUT.`;
      }
      return advice;
    }

    return `### 💡 AI Smart Coach (Offline Mode)

Tôi đã ghi nhận câu hỏi của bạn. Do hiện tại bạn đang ở chế độ Offline (chưa cấu hình Gemini API Key), các câu hỏi tự do sẽ được trả lời dựa trên thông tin hồ sơ của bạn:

- Định hướng nghề nghiệp: **${selectedMapPath.toUpperCase()}**
- Hãy thử bấm các nút gợi ý nhanh ở trên (Lộ trình kỳ tới, Phân tích thói quen, Báo cáo tuần) để nhận báo cáo trích xuất trực tiếp từ dữ liệu học tập và sức khỏe thực tế của bạn.
- Bạn có thể cung cấp **Google Gemini API Key** ở phần **Cài đặt** để kích hoạt chatbot AI đàm thoại đầy đủ!`;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('self.title', { defaultValue: '🌟 Tự Phát Triển Bản Thân' })}</h2>
        <p>{t('self.desc', { defaultValue: 'Phát triển năng lực toàn diện: Sách & Tài chính, Ngoại ngữ, Học thuật & Bản đồ tri thức, AI cố vấn và Thương hiệu cá nhân.' })}</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button className={`tab-btn btn ${activeTab === 'reading' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('reading')}>
          {t('self.tab.reading', { defaultValue: '📚 Sách & Tài chính' })}
        </button>
        <button className={`tab-btn btn ${activeTab === 'language' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('language')}>
          {t('self.tab.language', { defaultValue: '🗣️ Ngoại ngữ' })}
        </button>
        <button className={`tab-btn btn ${activeTab === 'academia' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('academia')}>
          {t('self.tab.academia', { defaultValue: '🔬 Học thuật & Bản đồ' })}
        </button>
        <button className={`tab-btn btn ${activeTab === 'ai' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('ai')}>
          {t('self.tab.ai', { defaultValue: '🤖 AI Cố vấn' })}
        </button>
        <button className={`tab-btn btn ${activeTab === 'branding' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('branding')}>
          {t('self.tab.branding', { defaultValue: '📢 Thương hiệu' })}
        </button>
      </div>

      {/* Tab contents */}
      <div className="tab-content">
        
        {/* TAB 1: READING & FINANCE */}
        {activeTab === 'reading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-2" style={{ gap: '24px' }}>
              
              {/* Book Tracker */}
              <div className="card">
                <div className="card-header">
                  <h3>📚 Book Tracker & Reading List</h3>
                </div>
                
                <form onSubmit={handleAddBook} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <input className="input" placeholder="Tên sách..." value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <input className="input" placeholder="Tác giả..." value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <select className="select" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})}>
                        <option value="Economics">Kinh tế học</option>
                        <option value="Finance">Tài chính cá nhân</option>
                        <option value="Social">Xã hội & Pháp luật</option>
                        <option value="Technology">Công nghệ</option>
                        <option value="Novel">Văn học / Khác</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>+ Thêm sách</button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                  {books.length === 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      💡 **Chỉ dẫn:** Bạn chưa lưu cuốn sách nào. Hãy nhập tên sách và tác giả ở biểu mẫu phía trên để bắt đầu lập danh sách và theo dõi tiến trình đọc sách cá nhân của bạn.
                    </div>
                  ) : (
                    books.map(b => (
                      <div key={b.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{b.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.author} | {b.category}</span>
                          </div>
                          <button onClick={() => handleDeleteBook(b.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${b.progress || 0}%`, height: '100%', background: 'var(--accent)' }}></div>
                          </div>
                          <input type="number" className="input" style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'center' }} 
                            value={b.progress || 0} onChange={e => handleUpdateBookProgress(b.id, e.target.value)} />
                          <span style={{ fontSize: '0.8rem' }}>%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Student Finance Tool */}
              <div className="card">
                <div className="card-header">
                  <h3>{t('self.finance.calc.title', { defaultValue: '📈 Máy tính Lãi kép & Tiết kiệm' })}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('self.finance.calc.monthly', { defaultValue: 'Tiền gửi hàng tháng (VND)' })}</label>
                    <input type="number" className="input" placeholder="VD: 1000000" value={financeInput.monthly} onChange={e => setFinanceInput({...financeInput, monthly: e.target.value})} />
                  </div>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('self.finance.calc.rate', { defaultValue: 'Lãi suất năm (%)' })}</label>
                      <input type="number" step="0.1" className="input" placeholder="VD: 6.5" value={financeInput.rate} onChange={e => setFinanceInput({...financeInput, rate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('self.finance.calc.years', { defaultValue: 'Số năm tích lũy' })}</label>
                      <input type="number" className="input" placeholder="VD: 4" value={financeInput.years} onChange={e => setFinanceInput({...financeInput, years: e.target.value})} />
                    </div>
                  </div>

                  {financeResult > 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(108, 92, 231, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent)', textAlign: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('self.finance.calc.result', { defaultValue: 'Tổng tiền dự kiến nhận được:' })}</span>
                      <h2 style={{ color: 'var(--accent)', margin: '8px 0 0 0', fontSize: '1.6rem' }}>{financeResult.toLocaleString('vi-VN')} VND</h2>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center' }}>
                      💡 **Chỉ dẫn:** Nhập số tiền bạn muốn tiết kiệm hàng tháng, lãi suất và số năm tích lũy ở trên để mô phỏng tích lũy tài chính.
                    </div>
                  )}

                  {/* Year schedule bar */}
                  {financeSchedule.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {financeSchedule.map((s, idx) => {
                        const maxVal = financeSchedule[financeSchedule.length - 1]?.total || 1;
                        const heightPercent = (s.total / maxVal) * 100;
                        return (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(s.total / 1000000).toFixed(1)}M</div>
                            <div style={{ width: '100%', height: `${heightPercent}px`, background: 'linear-gradient(to top, var(--accent), var(--cyan))', borderRadius: '4px 4px 0 0' }}></div>
                            <div style={{ fontSize: '0.75rem' }}>Năm {s.year}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extracurricular Summaries */}
            <div className="card">
              <div className="card-header">
                <h3>💡 Thư viện Kiến thức Mở rộng cho Sinh viên CNTT</h3>
              </div>
              <div className="grid-2" style={{ gap: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>📈 Kinh tế vĩ mô & Thị trường lao động IT</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Hiểu về cơ chế <strong>Cung - Cầu</strong> giúp bạn chọn đúng kỹ năng tuyển dụng đang thiếu hụt.
                    Thị trường IT hiện nay đang dịch chuyển mạnh mẽ từ Outsourcing sang Product và tích hợp AI.
                    Tập trung tích lũy kiến thức hệ thống lớn (System Design, Cloud, DevOps) thay vì chỉ học cú pháp ngôn ngữ sẽ giúp bạn tạo được lợi thế cạnh tranh vượt bậc.
                  </p>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--cyan)' }}>⚖️ Luật lao động & Hợp đồng Freelance</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Khi nhận dự án freelance hoặc ký hợp đồng thử việc:
                    Luôn chú ý đến điều khoản <strong>Sở hữu trí tuệ (IP)</strong> — mặc định code bạn viết ra khi được trả lương sẽ thuộc về doanh nghiệp.
                    Tìm hiểu kỹ về <strong>Thuế thu nhập cá nhân (PIT)</strong> để tránh các khoản nợ thuế khi nhận tiền từ nước ngoài và học cách bảo vệ quyền lợi bảo hiểm xã hội cá nhân.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LANGUAGE LAB */}
        {activeTab === 'language' && (
          <div className="grid-2" style={{ gap: '24px' }}>
            
            {/* Target Settings */}
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-header">
                <h3>🎯 {t('self.lang.goal.title', { defaultValue: 'Mục tiêu Chứng chỉ Ngoại ngữ' })}</h3>
              </div>
              
              <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">{t('self.lang.select', { defaultValue: 'Chọn chứng chỉ' })}</label>
                  <select className="select" value={newGoal.language} onChange={e => setNewGoal({...newGoal, language: e.target.value})}>
                    <option value="English (IELTS)">English (IELTS)</option>
                    <option value="English (TOEIC)">English (TOEIC)</option>
                    <option value="Japanese (JLPT)">Japanese (JLPT)</option>
                    <option value="Chinese (HSK)">Chinese (HSK)</option>
                  </select>
                </div>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('self.lang.current', { defaultValue: 'Điểm hiện tại' })}</label>
                    <input className="input" placeholder="VD: 6.0" value={newGoal.currentScore} onChange={e => setNewGoal({...newGoal, currentScore: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('self.lang.target', { defaultValue: 'Điểm mục tiêu' })}</label>
                    <input className="input" placeholder="VD: 7.5" value={newGoal.targetScore} onChange={e => setNewGoal({...newGoal, targetScore: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('self.lang.date', { defaultValue: 'Ngày thi dự kiến' })}</label>
                  <input type="date" className="input" value={newGoal.examDate} onChange={e => setNewGoal({...newGoal, examDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('self.lang.plan', { defaultValue: 'Kế hoạch học tập' })}</label>
                  <textarea className="input" style={{ minHeight: '60px' }} placeholder="VD: Luyện đề Cam 18 hàng tuần..." value={newGoal.planNotes} onChange={e => setNewGoal({...newGoal, planNotes: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Lưu mục tiêu</button>
              </form>

              {/* Seeding guide */}
              <div style={{ padding: '16px', background: 'rgba(230, 126, 34, 0.08)', borderRadius: '8px', border: '1px dashed #e67e22', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e67e22' }}>📚 Nạp từ vựng chuyên ngành</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Bạn có thể tạo bộ thẻ từ vựng của riêng bạn tại **Góc học tập**. Hoặc bấm nút dưới đây để nạp nhanh 10 từ vựng IT chuyên ngành làm mẫu thực tế để bắt đầu học ngay.
                </p>
                <button onClick={handleSeedITVocabulary} className="btn" style={{ background: '#e67e22', color: 'white', border: 'none', width: '100%', justifyContent: 'center' }}>
                  {t('self.lang.vocab.seed', { defaultValue: '⚡ Nạp từ vựng chuyên ngành IT' })}
                </button>
              </div>
            </div>

            {/* Practice Logs */}
            <div className="card">
              <div className="card-header">
                <h3>{t('self.lang.log.title', { defaultValue: '📝 Nhật ký luyện tập ngoại ngữ' })}</h3>
              </div>
              
              <form onSubmit={handleAddLangLog} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <select className="select" value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})}>
                      <option value="listening">Listening (Nghe podcast/video)</option>
                      <option value="reading">Reading (Đọc tài liệu tech)</option>
                      <option value="writing">Writing (Viết blog/status)</option>
                      <option value="speaking">Speaking (Giao tiếp/Nói chuyện)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <input type="number" className="input" placeholder="Số phút học..." value={newLog.duration} onChange={e => setNewLog({...newLog, duration: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <input className="input" placeholder="Nội dung chi tiết..." value={newLog.title} onChange={e => setNewLog({...newLog, title: e.target.value})} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>{t('self.lang.log.add', { defaultValue: '+ Ghi nhận luyện tập' })}</button>
              </form>

              {/* Goal List Display */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Mục tiêu hiện tại:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {langGoals.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      💡 **Chỉ dẫn:** Bạn chưa thiết lập mục tiêu chứng chỉ ngoại ngữ nào. Chọn chứng chỉ ở biểu mẫu bên trái và điền điểm mục tiêu của bạn để bắt đầu.
                    </div>
                  ) : (
                    langGoals.map(g => (
                      <div key={g.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>
                          <span>{g.language}</span>
                          <span style={{ color: 'var(--accent)' }}>Mục tiêu: {g.targetScore} (Hiện tại: {g.currentScore || 'N/A'})</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kế hoạch: {g.planNotes}</p>
                        {g.examDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Lịch thi dự kiến: {g.examDate}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logs display */}
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Nhật ký luyện tập gần đây:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {langLogs.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      💡 **Chỉ dẫn:** Chưa có nhật ký luyện tập. Nhập các hoạt động tự học ngoại ngữ của bạn ở biểu mẫu trên để tích lũy giờ rèn luyện.
                    </div>
                  ) : (
                    langLogs.map(l => (
                      <div key={l.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(108, 92, 231, 0.15)', color: 'var(--accent)', borderRadius: '4px', marginRight: '8px' }}>{l.type}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '550' }}>{l.title} ({l.duration} phút)</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l.date}</div>
                        </div>
                        <button onClick={() => handleDeleteLangLog(l.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACADEMIA & KNOWLEDGE MAP */}
        {activeTab === 'academia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Interactive SVG Knowledge Map */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{t('self.acad.map.title', { defaultValue: '🗺️ Bản đồ Tri thức DUT & Sự nghiệp' })}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {t('self.acad.map.desc', { defaultValue: 'Đồ thị kết nối hướng đi nghề nghiệp với kỹ năng và các học phần tương ứng tại DUT.' })}
                  </p>
                </div>
                <div>
                  <select className="select" value={selectedMapPath} onChange={e => setSelectedMapPath(e.target.value)} style={{ width: '180px' }}>
                    <option value="backend">Backend Developer</option>
                    <option value="frontend">Frontend Developer</option>
                    <option value="devops">DevOps Engineer</option>
                    <option value="data">Data Analyst</option>
                    <option value="pm">Project Manager / BA</option>
                  </select>
                </div>
              </div>

              {/* Mapped SVG rendering */}
              <div style={{ background: '#0a0a0f', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'center', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <svg width="760" height="340" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {/* Define marker arrow */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4a5f" />
                    </marker>
                    <filter id="glow-passed" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Render Connections */}
                  {selectedMapPath === 'backend' && (
                    <>
                      <line x1="180" y1="50" x2="380" y2="90" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="110" x2="380" y2="90" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="170" x2="380" y2="150" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="230" x2="380" y2="210" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="290" x2="380" y2="270" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      <line x1="530" y1="90" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="150" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="210" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="270" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    </>
                  )}

                  {selectedMapPath === 'frontend' && (
                    <>
                      <line x1="180" y1="80" x2="380" y2="110" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="160" x2="380" y2="170" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="240" x2="380" y2="230" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      <line x1="530" y1="110" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="170" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="230" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    </>
                  )}

                  {selectedMapPath === 'devops' && (
                    <>
                      <line x1="180" y1="60" x2="380" y2="90" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="130" x2="380" y2="150" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="200" x2="380" y2="210" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="270" x2="380" y2="270" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      <line x1="530" y1="90" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="150" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="210" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="270" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    </>
                  )}

                  {selectedMapPath === 'data' && (
                    <>
                      <line x1="180" y1="60" x2="380" y2="90" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="130" x2="380" y2="150" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="200" x2="380" y2="210" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="270" x2="380" y2="270" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      <line x1="530" y1="90" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="150" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="210" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="270" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    </>
                  )}

                  {selectedMapPath === 'pm' && (
                    <>
                      <line x1="180" y1="80" x2="380" y2="110" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="160" x2="380" y2="170" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      <line x1="180" y1="240" x2="380" y2="230" stroke="#4a4a5f" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                      
                      <line x1="530" y1="110" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="170" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      <line x1="530" y1="230" x2="620" y2="170" stroke="#4a4a5f" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    </>
                  )}

                  {/* Left Column Nodes (Courses) */}
                  {selectedMapPath === 'backend' && (
                    <>
                      {renderCourseNode('Kỹ thuật lập trình', 20, 30, 'Kỹ thuật lập trình')}
                      {renderCourseNode('Cấu trúc dữ liệu và giải thuật', 20, 90, 'Cấu trúc DL & GT')}
                      {renderCourseNode('Cơ sở dữ liệu', 20, 150, 'Cơ sở dữ liệu')}
                      {renderCourseNode('Công nghệ phần mềm', 20, 210, 'Công nghệ phần mềm')}
                      {renderCourseNode('DevOps và CI/CD (Tự chọn)', 20, 270, 'DevOps & CI/CD')}
                    </>
                  )}

                  {selectedMapPath === 'frontend' && (
                    <>
                      {renderCourseNode('Tin học đại cương', 20, 60, 'Tin học đại cương')}
                      {renderCourseNode('Lập trình Web', 20, 140, 'Lập trình Web')}
                      {renderCourseNode('Thiết kế UI/UX (Tự chọn)', 20, 220, 'Thiết kế UI/UX')}
                    </>
                  )}

                  {selectedMapPath === 'devops' && (
                    <>
                      {renderCourseNode('Mạng máy tính', 20, 40, 'Mạng máy tính')}
                      {renderCourseNode('An toàn và bảo mật hệ thống', 20, 110, 'An toàn bảo mật')}
                      {renderCourseNode('DevOps và CI/CD (Tự chọn)', 20, 180, 'DevOps & CI/CD')}
                      {renderCourseNode('Điện toán đám mây (Tự chọn)', 20, 250, 'Điện toán đám mây')}
                    </>
                  )}

                  {selectedMapPath === 'data' && (
                    <>
                      {renderCourseNode('Đại số tuyến tính', 20, 40, 'Đại số tuyến tính')}
                      {renderCourseNode('Cơ sở dữ liệu', 20, 110, 'Cơ sở dữ liệu')}
                      {renderCourseNode('Trí tuệ nhân tạo', 20, 180, 'Trí tuệ nhân tạo')}
                      {renderCourseNode('Xử lý dữ liệu lớn (Tự chọn)', 20, 250, 'Xử lý dữ liệu lớn')}
                    </>
                  )}

                  {selectedMapPath === 'pm' && (
                    <>
                      {renderCourseNode('Quản trị dự án phần mềm', 20, 60, 'Quản trị dự án PM')}
                      {renderCourseNode('Phân tích và thiết kế hệ thống', 20, 140, 'Phân tích & TKHT')}
                      {renderCourseNode('Thực tập tốt nghiệp', 20, 220, 'Thực tập tốt nghiệp')}
                    </>
                  )}

                  {/* Middle Column Nodes (Skills) */}
                  {selectedMapPath === 'backend' && (
                    <>
                      {renderSkillNode('Algorithms & SQL', 380, 70)}
                      {renderSkillNode('API Architecture', 380, 130)}
                      {renderSkillNode('System & Security', 380, 190)}
                      {renderSkillNode('CI/CD & Cloud Deployment', 380, 250)}
                    </>
                  )}

                  {selectedMapPath === 'frontend' && (
                    <>
                      {renderSkillNode('HTML/CSS/Javascript', 380, 90)}
                      {renderSkillNode('React Framework & Web', 380, 150)}
                      {renderSkillNode('UI/UX Usability Design', 380, 210)}
                    </>
                  )}

                  {selectedMapPath === 'devops' && (
                    <>
                      {renderSkillNode('Networking & Protocols', 380, 70)}
                      {renderSkillNode('Security Standards', 380, 130)}
                      {renderSkillNode('Docker & CI/CD Pipelines', 380, 190)}
                      {renderSkillNode('AWS/GCP Cloud Architecture', 380, 250)}
                    </>
                  )}

                  {selectedMapPath === 'data' && (
                    <>
                      {renderSkillNode('Linear Algebra & Stats', 380, 70)}
                      {renderSkillNode('SQL Database Architecture', 380, 130)}
                      {renderSkillNode('AI / ML / Data Modeling', 380, 190)}
                      {renderSkillNode('Big Data Analytics Tools', 380, 250)}
                    </>
                  )}

                  {selectedMapPath === 'pm' && (
                    <>
                      {renderSkillNode('Agile / Scrum Framework', 380, 90)}
                      {renderSkillNode('Requirements Elicitation', 380, 150)}
                      {renderSkillNode('Industry Communication', 380, 210)}
                    </>
                  )}

                  {/* Right Column Node (Selected Career Path Target) */}
                  <g transform="translate(620, 145)">
                    <rect width="130" height="50" rx="8" fill="var(--accent)" stroke="#8e8ef7" strokeWidth="2" style={{ filter: 'url(#glow-passed)' }} />
                    <text x="65" y="28" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {selectedMapPath === 'backend' && 'Backend Goal'}
                      {selectedMapPath === 'frontend' && 'Frontend Goal'}
                      {selectedMapPath === 'devops' && 'DevOps Goal'}
                      {selectedMapPath === 'data' && 'Data Analyst Goal'}
                      {selectedMapPath === 'pm' && 'Project Mgr Goal'}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Academia Records (Papers & Ideas) */}
            <div className="grid-2" style={{ gap: '24px' }}>
              
              {/* Paper Manager */}
              <div className="card">
                <div className="card-header">
                  <h3>🔬 {t('self.acad.papers.title', { defaultValue: 'Quản lý Bài báo Khoa học' })}</h3>
                </div>
                
                <form onSubmit={handleAddPaper} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input className="input" placeholder="Tiêu đề bài báo..." value={newPaper.title} onChange={e => setNewPaper({...newPaper, title: e.target.value})} required />
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <input className="input" placeholder="Tác giả..." value={newPaper.authors} onChange={e => setNewPaper({...newPaper, authors: e.target.value})} />
                    <input className="input" placeholder="Lĩnh vực..." value={newPaper.category} onChange={e => setNewPaper({...newPaper, category: e.target.value})} />
                  </div>
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <input className="input" placeholder="Đường dẫn link..." value={newPaper.link} onChange={e => setNewPaper({...newPaper, link: e.target.value})} />
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Lưu bài báo</button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {papers.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      💡 **Chỉ dẫn:** Bạn chưa lưu bài báo nghiên cứu nào. Nhập tiêu đề và liên kết bài viết khoa học ở biểu mẫu trên để theo dõi tài liệu nghiên cứu của mình.
                    </div>
                  ) : (
                    papers.map(p => (
                      <div key={p.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.85rem' }}>{p.title}</h5>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.authors} ({p.year}) | {p.category}</div>
                          </div>
                          <button onClick={() => handleDeletePaper(p.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                        </div>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px', display: 'inline-block' }}>🔗 Link bài viết</a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Research Idea Logger */}
              <div className="card">
                <div className="card-header">
                  <h3>💡 {t('self.acad.ideas.title', { defaultValue: 'Ý tưởng Nghiên cứu & PBL' })}</h3>
                </div>
                
                <form onSubmit={handleAddIdea} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input className="input" placeholder="Tiêu đề ý tưởng..." value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} required />
                  <textarea className="input" style={{ minHeight: '60px' }} placeholder="Mô tả tóm tắt ý tưởng..." value={newIdea.description} onChange={e => setNewIdea({...newIdea, description: e.target.value})} />
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <select className="select" value={newIdea.category} onChange={e => setNewIdea({...newIdea, category: e.target.value})}>
                      <option value="Thesis">Khóa luận tốt nghiệp</option>
                      <option value="PBL">Đồ án môn học PBL</option>
                      <option value="Startup">Ý tưởng khởi nghiệp</option>
                      <option value="Research">Nghiên cứu khoa học SV</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Ghi nhận ý tưởng</button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {ideas.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      💡 **Chỉ dẫn:** Bạn chưa ghi nhận ý tưởng nghiên cứu nào. Sử dụng biểu mẫu trên để phác thảo các ý tưởng tự phát triển dự án hoặc đề tài tốt nghiệp.
                    </div>
                  ) : (
                    ideas.map(id => (
                      <div key={id.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '3px solid var(--cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(0,188,212,0.15)', color: 'var(--cyan)', borderRadius: '4px', marginRight: '6px' }}>{id.category}</span>
                            <h5 style={{ margin: 0, fontSize: '0.85rem', display: 'inline' }}>{id.title}</h5>
                          </div>
                          <button onClick={() => handleDeleteIdea(id.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{id.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: AI SMART ADVISOR */}
        {activeTab === 'ai' && (
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '520px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div>
                <h3>{t('self.ai.title', { defaultValue: '🤖 AI Cố vấn Học tập & Thói quen' })}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Gemini LLM Engine (Client-direct)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-sm btn-danger" onClick={handleClearChat} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  🗑️ Xóa Chat
                </button>
                {!profile?.geminiApiKey && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--amber)', background: 'rgba(230,126,34,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                    Offline Mode
                  </span>
                )}
              </div>
            </div>

            {/* Chat screen */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
              {chatLogs.map((log, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: log.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '85%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    background: log.sender === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                    color: 'white',
                    lineHeight: '1.45',
                    fontSize: '0.88rem',
                    border: log.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {log.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    🤖 AI đang suy nghĩ...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions & Input Form */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button className="btn" onClick={() => triggerAIPrompt('roadmap')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  🎯 Lộ trình kỳ tới
                </button>
                <button className="btn" onClick={() => triggerAIPrompt('habits')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  ⚡ Phân tích thói quen
                </button>
                <button className="btn" onClick={() => triggerAIPrompt('weekly')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  📊 Báo cáo tuần
                </button>
              </div>

              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input className="input" 
                  placeholder={t('self.ai.placeholder', { defaultValue: 'Hỏi AI cố vấn (ví dụ: Hãy gợi ý lộ trình học kỳ tới...)' })}
                  value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={aiLoading} />
                <button type="submit" className="btn btn-primary" disabled={aiLoading} style={{ padding: '10px 20px' }}>Gửi</button>
              </form>
              {!profile?.geminiApiKey && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  {t('self.ai.offline.notice', { defaultValue: '⚠️ Đang chạy ở chế độ Offline. Điền Gemini API Key trong Cài đặt để kích hoạt phân tích LLM đầy đủ.' })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PERSONAL BRANDING */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="grid-2" style={{ gap: '24px' }}>
              {/* GitHub contribution grid mock */}
              <div className="card">
                <div className="card-header">
                  <h3>🐙 {t('self.brand.github', { defaultValue: 'Chỉ số đóng góp GitHub' })}</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('self.brand.github.commits', { defaultValue: 'Contributions mục tiêu năm' })}</label>
                      <input type="number" className="input" placeholder="VD: 500" value={githubGoal.target || ''} onChange={e => setGithubGoal({...githubGoal, target: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('self.brand.github.current', { defaultValue: 'Số đã đạt thực tế' })}</label>
                      <input type="number" className="input" placeholder="VD: 300" value={githubGoal.current || ''} onChange={e => setGithubGoal({...githubGoal, current: Number(e.target.value)})} />
                    </div>
                  </div>
                  <button onClick={handleSaveGithub} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Lưu chỉ số</button>
                </div>

                {/* Progress rendering */}
                {githubGoal.target > 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Tiến độ mục tiêu GitHub:</span>
                      <strong>{githubGoal.current} / {githubGoal.target} ({Math.round((githubGoal.current / (githubGoal.target || 1)) * 100)}%)</strong>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (githubGoal.current / (githubGoal.target || 1)) * 100)}%`, height: '100%', background: '#2ecc71' }}></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
                    💡 **Chỉ dẫn:** Nhập mục tiêu contributions GitHub trong năm và số lượng thực tế đã đạt ở trên để theo dõi tiến độ.
                  </div>
                )}

                {/* Grid representation (Maps to real local database activity counts of past 48 days) */}
                <div style={{ padding: '10px', background: '#0a0a0f', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {activityGrid.map((day, idx) => {
                      let fillBg = 'rgba(255,255,255,0.05)';
                      if (day.count > 3) fillBg = '#39d353';
                      else if (day.count === 3) fillBg = '#26a641';
                      else if (day.count === 2) fillBg = '#006d32';
                      else if (day.count === 1) fillBg = '#0e4429';
                      return (
                        <div key={idx} style={{ width: '10px', height: '10px', background: fillBg, borderRadius: '2px' }} title={`${day.date}: ${day.count} hoạt động`}></div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Bản đồ hoạt động thực tế 48 ngày gần đây (Ghi chú, Task, Pomodoro, Nhật ký)
                  </div>
                </div>
              </div>

              {/* Mentoring logger */}
              <div className="card">
                <div className="card-header">
                  <h3>🤝 {t('self.brand.mentor.title', { defaultValue: 'Nhật ký Mentoring khóa dưới' })}</h3>
                </div>
                
                <form onSubmit={handleAddMentor} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <input className="input" placeholder="Tên sinh viên khóa dưới..." value={newMentor.menteeName} onChange={e => setNewMentor({...newMentor, menteeName: e.target.value})} required />
                    <input type="number" className="input" placeholder="Số giờ log..." value={newMentor.duration} onChange={e => setNewMentor({...newMentor, duration: e.target.value})} required />
                  </div>
                  <input className="input" placeholder="Chủ đề tư vấn (VD: Hướng dẫn cơ bản thiết kế ERD)..." value={newMentor.topic} onChange={e => setNewMentor({...newMentor, topic: e.target.value})} required />
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>+ Lưu giờ mentoring</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {mentorLogs.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      💡 **Chỉ dẫn:** Chưa ghi nhận giờ mentoring nào. Hãy nhập thông tin hỗ trợ sinh viên khóa dưới ở biểu mẫu trên để theo dõi hoạt động kỹ năng mềm của bạn.
                    </div>
                  ) : (
                    mentorLogs.map(l => (
                      <div key={l.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{l.menteeName}</strong> | <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.topic} ({l.duration}h)</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.date}</div>
                        </div>
                        <button onClick={() => handleDeleteMentor(l.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Tech Blog Post Logger */}
            <div className="card">
              <div className="card-header">
                <h3>✍️ {t('self.brand.posts.title', { defaultValue: 'Tech Blog & Bài viết chia sẻ chuyên môn' })}</h3>
              </div>
              
              <form onSubmit={handleAddPost} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <input className="input" placeholder="Tiêu đề bài viết..." value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} required />
                  <select className="select" value={newPost.platform} onChange={e => setNewPost({...newPost, platform: e.target.value})}>
                    <option value="Viblo">Viblo</option>
                    <option value="Medium">Medium</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Dev.to">Dev.to</option>
                    <option value="Facebook">Facebook / Khác</option>
                  </select>
                </div>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <input className="input" placeholder="Đường dẫn URL bài viết..." value={newPost.url} onChange={e => setNewPost({...newPost, url: e.target.value})} />
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>+ Ghi nhận bài đăng</button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {posts.length === 0 ? (
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    💡 **Chỉ dẫn:** Chưa lưu bài đăng chia sẻ nào. Nhập tiêu đề và đường dẫn URL bài viết chuyên môn của bạn ở trên để tích lũy hồ sơ cá nhân.
                  </div>
                ) : (
                  posts.map(p => (
                    <div key={p.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(0,188,212,0.1)', color: 'var(--cyan)', borderRadius: '4px', marginRight: '8px' }}>{p.platform}</span>
                        <h4 style={{ margin: 0, display: 'inline', fontSize: '0.9rem' }}>{p.title}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ngày đăng: {p.date}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Xem 🔗</a>
                        )}
                        <button onClick={() => handleDeletePost(p.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );

  // Mapped Course Node renderer for Knowledge Map
  function renderCourseNode(courseName, cx, cy, labelText) {
    const matched = courses.find(c => c.name.trim() === courseName.trim());
    let strokeColor = '#7f8c8d'; // Unstarted
    let strokeDash = '4 4';
    let fillColor = 'rgba(255,255,255,0.02)';
    let textColor = 'var(--text-muted)';
    let isGlow = false;

    if (matched) {
      if (matched.status === 'passed') {
        strokeColor = '#2ecc71';
        strokeDash = '0';
        fillColor = 'rgba(46, 204, 113, 0.15)';
        textColor = '#2ecc71';
        isGlow = true;
      } else if (matched.status === 'failed' || matched.status === 'in_progress') {
        strokeColor = '#e67e22';
        strokeDash = '0';
        fillColor = 'rgba(230, 126, 34, 0.15)';
        textColor = '#e67e22';
      }
    }

    return (
      <g transform={`translate(${cx}, ${cy})`} style={{ cursor: 'help' }}>
        <title>{matched ? `${matched.name} (${matched.status.toUpperCase()}): ${matched.credits} TC` : `${courseName} (Chưa học/Chưa có trong DB)`}</title>
        <rect width="160" height="40" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeDasharray={strokeDash} style={isGlow ? { filter: 'url(#glow-passed)' } : {}} />
        <text x="80" y="24" fill={textColor} fontSize="10.5" fontWeight="500" textAnchor="middle">{labelText}</text>
      </g>
    );
  }

  // Mapped Skill Node renderer for Knowledge Map
  function renderSkillNode(skillName, cx, cy) {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <rect width="150" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#4a4a5f" strokeWidth="1.5" />
        <text x="75" y="24" fill="var(--text-secondary)" fontSize="10.5" fontWeight="bold" textAnchor="middle">{skillName}</text>
      </g>
    );
  }
}
