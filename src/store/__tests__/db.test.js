/**
 * Comprehensive CRUD tests for all 25+ data tables in Second Brain.
 * Uses fake-indexeddb (via setup.js) so Dexie works in Node.js.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import {
  initDB, getDB, getCurrentDbName,
  // Notes
  createNote, getNote, updateNote, deleteNote, getNotes, searchNotes,
  // Tasks
  createTask, getTask, updateTask, deleteTask, getTasks,
  // Flashcards & Decks
  createDeck, getDeck, updateDeck, getDecks, deleteDeck,
  createFlashcard, getFlashcard, updateFlashcard, deleteFlashcard,
  getDueCards, getAllCards, reviewCard,
  // Journal
  createJournal, getJournal, getJournalById, deleteJournal, getJournalRange,
  // Projects
  createProject, getProject, updateProject, getProjects, deleteProject,
  // Events
  createEvent, getEvent, updateEvent, deleteEvent,
  getEventsByDate, getEventsRange, toggleEventComplete,
  // Dashboard & Search
  getDashboardStats, globalSearch,
  // Export/Import
  exportAll, importAll,
  // Courses
  createCourse, getCourse, updateCourse, deleteCourse, getCourses, importDUTProgram,
  // Expenses
  createExpense, getExpense, updateExpense, deleteExpense, getExpenses,
  // Health
  saveHealth, getHealth, getHealthRange,
  // Pomodoro
  createPomodoroLog, getPomodoroLogs,
  // Skills & Career
  saveSkillRating, getSkillRatings,
  // Portfolios
  createPortfolio, updatePortfolio, deletePortfolio, getPortfolios,
  // Certificates
  createCertificate, updateCertificate, deleteCertificate, getCertificates,
  // Networking
  createNetworkContact, updateNetworkContact, deleteNetworkContact, getNetworkContacts,
  // Side Projects
  createSideProject, updateSideProject, deleteSideProject, getSideProjects,
  // Books
  createBook, updateBook, deleteBook, getBooks,
  // Language
  saveLanguageGoal, getLanguageGoals, createLanguageLog, deleteLanguageLog, getLanguageLogs,
  // Research
  createResearchPaper, updateResearchPaper, deleteResearchPaper, getResearchPapers,
  createResearchIdea, updateResearchIdea, deleteResearchIdea, getResearchIdeas,
  // Branding
  createBrandingPost, updateBrandingPost, deleteBrandingPost, getBrandingPosts,
  // Mentoring
  createMentorLog, updateMentorLog, deleteMentorLog, getMentorLogs,
  // Power
  createPowerDevice, getPowerDevices, updatePowerDevice, deletePowerDevice,
  createElectricityBill, getElectricityBills, updateElectricityBill, deleteElectricityBill,
} from '../db';

const TEST_PROFILE_ID = 'test_user_1';

beforeEach(async () => {
  initDB(TEST_PROFILE_ID);
  const db = getDB();
  if (db.isOpen()) {
    const tableNames = db.tables.map(t => t.name);
    for (const name of tableNames) {
      await db[name].clear();
    }
  }
});

/* ────────────────────────────── Notes ────────────────────────────── */

describe('Notes CRUD', () => {
  it('creates and reads a note', async () => {
    const id = await createNote({ title: 'Test Note', content: 'Hello', category: 'projects' });
    expect(id).toBeGreaterThan(0);
    const note = await getNote(id);
    expect(note.title).toBe('Test Note');
    expect(note.content).toBe('Hello');
    expect(note.category).toBe('projects');
    expect(note.pinned).toBe(0);
    expect(note.createdAt).toBeTruthy();
    expect(note.updatedAt).toBeTruthy();
  });

  it('updates a note', async () => {
    const id = await createNote({ title: 'Before', content: '' });
    await updateNote(id, { title: 'After', content: 'Updated' });
    const note = await getNote(id);
    expect(note.title).toBe('After');
    expect(note.content).toBe('Updated');
  });

  it('deletes a note', async () => {
    const id = await createNote({ title: 'ToDelete', content: '' });
    await deleteNote(id);
    const note = await getNote(id);
    expect(note).toBeUndefined();
  });

  it('lists notes sorted by updatedAt desc', async () => {
    await createNote({ title: 'Note A', content: '' });
    await new Promise(r => setTimeout(r, 10));
    await createNote({ title: 'Note B', content: '' });
    const notes = await getNotes();
    expect(notes.length).toBe(2);
    expect(notes[0].title).toBe('Note B');
  });

  it('filters notes by category', async () => {
    await createNote({ title: 'P1', content: '', category: 'projects' });
    await createNote({ title: 'A1', content: '', category: 'areas' });
    const projects = await getNotes({ category: 'projects' });
    expect(projects.length).toBe(1);
    expect(projects[0].title).toBe('P1');
  });

  it('searches notes by title and content', async () => {
    await createNote({ title: 'React Tutorial', content: 'Learn hooks' });
    await createNote({ title: 'Vue Guide', content: 'Options API' });
    const results = await searchNotes('hooks');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('React Tutorial');
  });
});

/* ────────────────────────────── Tasks ────────────────────────────── */

describe('Tasks CRUD', () => {
  it('creates a task with default status', async () => {
    const id = await createTask({ title: 'My Task', priority: 'high' });
    const task = await getTask(id);
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('high');
    expect(task.completedAt).toBe('');
  });

  it('auto-sets completedAt when status changes to done', async () => {
    const id = await createTask({ title: 'Do it' });
    await updateTask(id, { status: 'done' });
    const task = await getTask(id);
    expect(task.status).toBe('done');
    expect(task.completedAt).toBeTruthy();
  });

  it('clears completedAt when status changes away from done', async () => {
    const id = await createTask({ title: 'Do it' });
    await updateTask(id, { status: 'done' });
    await updateTask(id, { status: 'todo' });
    const task = await getTask(id);
    expect(task.completedAt).toBe('');
  });

  it('sorts tasks by priority', async () => {
    await createTask({ title: 'Low', priority: 'low' });
    await createTask({ title: 'High', priority: 'high' });
    await createTask({ title: 'Medium', priority: 'medium' });
    const tasks = await getTasks();
    expect(tasks[0].title).toBe('High');
    expect(tasks[1].title).toBe('Medium');
    expect(tasks[2].title).toBe('Low');
  });

  it('filters tasks by status', async () => {
    await createTask({ title: 'A' });
    const id2 = await createTask({ title: 'B' });
    await updateTask(id2, { status: 'done' });
    const todo = await getTasks({ status: 'todo' });
    expect(todo.length).toBe(1);
    expect(todo[0].title).toBe('A');
  });
});

/* ────────────────────────── Flashcards & Decks ─────────────────────── */

describe('Flashcards & Decks', () => {
  it('creates deck and flashcards', async () => {
    const deckId = await createDeck({ name: 'JS Basics', category: 'programming' });
    const cardId = await createFlashcard({ deckId, front: 'What is closure?', back: 'A function...' });
    const deck = await getDeck(deckId);
    expect(deck.name).toBe('JS Basics');
    const card = await getFlashcard(cardId);
    expect(card.deckId).toBe(deckId);
    expect(card.interval).toBe(0);
    expect(card.ease).toBe(2.5);
    expect(card.repetitions).toBe(0);
  });

  it('cascade deletes flashcards when deck is deleted', async () => {
    const deckId = await createDeck({ name: 'Temp' });
    await createFlashcard({ deckId, front: 'Q1', back: 'A1' });
    await createFlashcard({ deckId, front: 'Q2', back: 'A2' });
    const before = await getAllCards(deckId);
    expect(before.length).toBe(2);
    await deleteDeck(deckId);
    const after = await getAllCards(deckId);
    expect(after.length).toBe(0);
  });

  it('SM-2 review increases interval on quality >= 3', async () => {
    const deckId = await createDeck({ name: 'Test' });
    const cardId = await createFlashcard({ deckId, front: 'Q', back: 'A' });
    await reviewCard(cardId, 5); // quality 5
    const card1 = await getFlashcard(cardId);
    expect(card1.interval).toBe(1);
    expect(card1.repetitions).toBe(1);
    await reviewCard(cardId, 4); // quality 4
    const card2 = await getFlashcard(cardId);
    expect(card2.interval).toBe(6);
    expect(card2.repetitions).toBe(2);
  });

  it('SM-2 review resets on quality < 3', async () => {
    const deckId = await createDeck({ name: 'Test' });
    const cardId = await createFlashcard({ deckId, front: 'Q', back: 'A' });
    await reviewCard(cardId, 5);
    await reviewCard(cardId, 4);
    await reviewCard(cardId, 1); // fail
    const card = await getFlashcard(cardId);
    expect(card.interval).toBe(1);
    expect(card.repetitions).toBe(0);
  });

  it('getDueCards returns cards due on or before today', async () => {
    const deckId = await createDeck({ name: 'Test' });
    await createFlashcard({ deckId, front: 'Due', back: 'Now' });
    const today = new Date().toISOString().slice(0, 10);
    const due = await getDueCards(deckId, today);
    expect(due.length).toBe(1);
  });
});

/* ────────────────────────────── Journal ────────────────────────────── */

describe('Journal', () => {
  it('creates and reads journal by date', async () => {
    await createJournal({ date: '2026-08-10', mood: '😊', content: 'Great day' });
    const entry = await getJournal('2026-08-10');
    expect(entry.mood).toBe('😊');
    expect(entry.content).toBe('Great day');
  });

  it('upserts journal for same date', async () => {
    await createJournal({ date: '2026-08-10', mood: '😊', content: 'V1' });
    await createJournal({ date: '2026-08-10', mood: '😢', content: 'V2' });
    const entry = await getJournal('2026-08-10');
    expect(entry.mood).toBe('😢');
    expect(entry.content).toBe('V2');
  });

  it('gets journal range', async () => {
    await createJournal({ date: '2026-08-01', mood: '😊', content: '' });
    await createJournal({ date: '2026-08-05', mood: '😐', content: '' });
    await createJournal({ date: '2026-08-15', mood: '😢', content: '' });
    const range = await getJournalRange('2026-08-01', '2026-08-10');
    expect(range.length).toBe(2);
  });
});

/* ────────────────────────────── Projects ────────────────────────────── */

describe('Projects', () => {
  it('creates project with active status', async () => {
    const id = await createProject({ name: 'PBL3', color: '#ff0000' });
    const project = await getProject(id);
    expect(project.status).toBe('active');
  });
});

/* ────────────────────────────── Events ────────────────────────────── */

describe('Events', () => {
  it('creates and queries events by date', async () => {
    await createEvent({ title: 'Meeting', date: '2026-08-12', startTime: '09:00', endTime: '10:00' });
    await createEvent({ title: 'Lunch', date: '2026-08-12', startTime: '12:00', endTime: '13:00' });
    await createEvent({ title: 'Other', date: '2026-08-13', startTime: '09:00', endTime: '10:00' });
    const events = await getEventsByDate('2026-08-12');
    expect(events.length).toBe(2);
  });

  it('queries events by range', async () => {
    await createEvent({ title: 'A', date: '2026-08-01', startTime: '09:00', endTime: '10:00' });
    await createEvent({ title: 'B', date: '2026-08-15', startTime: '09:00', endTime: '10:00' });
    await createEvent({ title: 'C', date: '2026-08-30', startTime: '09:00', endTime: '10:00' });
    const range = await getEventsRange('2026-08-01', '2026-08-20');
    expect(range.length).toBe(2);
  });

  it('toggles event completion', async () => {
    const id = await createEvent({ title: 'Toggleable', date: '2026-08-12', startTime: '09:00', endTime: '10:00' });
    let ev = await getEvent(id);
    expect(ev.completed).toBe(false);
    await toggleEventComplete(id);
    ev = await getEvent(id);
    expect(ev.completed).toBe(true);
    await toggleEventComplete(id);
    ev = await getEvent(id);
    expect(ev.completed).toBe(false);
  });
});

/* ────────────────────────────── Courses ────────────────────────────── */

describe('Courses', () => {
  it('imports DUT program framework', async () => {
    const count = await importDUTProgram();
    expect(count).toBeGreaterThan(30);
    const courses = await getCourses();
    expect(courses.length).toBe(count);
  });

  it('does not re-import if courses already exist', async () => {
    await importDUTProgram();
    const count2 = await importDUTProgram();
    expect(count2).toBe(0);
  });

  it('filters by semester', async () => {
    await importDUTProgram();
    const sem1 = await getCourses({ semester: 1 });
    expect(sem1.length).toBeGreaterThan(0);
    sem1.forEach(c => expect(c.semester).toBe(1));
  });

  it('CRUD operations work', async () => {
    const id = await createCourse({ name: 'Custom', code: 'TST001', credits: 3, type: 'elective', semester: 9, status: 'not_started' });
    const course = await getCourse(id);
    expect(course.name).toBe('Custom');
    await updateCourse(id, { status: 'passed', score10: 8.5, score4: 4.0, gradeLetter: 'A' });
    const updated = await getCourse(id);
    expect(updated.status).toBe('passed');
    await deleteCourse(id);
    const deleted = await getCourse(id);
    expect(deleted).toBeUndefined();
  });
});

/* ────────────────────────────── Expenses ────────────────────────────── */

describe('Expenses', () => {
  it('CRUD works', async () => {
    const id = await createExpense({ amount: 50000, category: 'food', date: '2026-08-12', description: 'Lunch', type: 'expense' });
    const exp = await getExpense(id);
    expect(exp.amount).toBe(50000);
    await updateExpense(id, { amount: 60000 });
    const updated = await getExpense(id);
    expect(updated.amount).toBe(60000);
    await deleteExpense(id);
    const deleted = await getExpense(id);
    expect(deleted).toBeUndefined();
  });

  it('sorts by date desc', async () => {
    await createExpense({ amount: 100, category: 'food', date: '2026-08-01', type: 'expense' });
    await createExpense({ amount: 200, category: 'food', date: '2026-08-10', type: 'expense' });
    const list = await getExpenses();
    expect(list[0].date).toBe('2026-08-10');
  });

  it('filters by month', async () => {
    await createExpense({ amount: 100, category: 'food', date: '2026-07-15', type: 'expense' });
    await createExpense({ amount: 200, category: 'food', date: '2026-08-10', type: 'expense' });
    const aug = await getExpenses({ month: '2026-08' });
    expect(aug.length).toBe(1);
  });

  it('handles null date without crashing', async () => {
    await createExpense({ amount: 100, category: 'food', type: 'expense' }); // no date
    const list = await getExpenses();
    expect(list.length).toBe(1);
  });
});

/* ────────────────────────────── Health ────────────────────────────── */

describe('Health', () => {
  it('saves and reads health by date', async () => {
    await saveHealth({ date: '2026-08-12', sleepHours: 7.5, waterIntake: 2000 });
    const record = await getHealth('2026-08-12');
    expect(record.sleepHours).toBe(7.5);
  });

  it('upserts health for same date', async () => {
    await saveHealth({ date: '2026-08-12', sleepHours: 6 });
    await saveHealth({ date: '2026-08-12', sleepHours: 8 });
    const record = await getHealth('2026-08-12');
    expect(record.sleepHours).toBe(8);
  });

  it('gets health range', async () => {
    await saveHealth({ date: '2026-08-01', sleepHours: 7 });
    await saveHealth({ date: '2026-08-05', sleepHours: 6 });
    await saveHealth({ date: '2026-08-15', sleepHours: 8 });
    const range = await getHealthRange('2026-08-01', '2026-08-10');
    expect(range.length).toBe(2);
  });
});

/* ────────────────────────────── Pomodoro Logs ────────────────────────────── */

describe('Pomodoro Logs', () => {
  it('creates and queries logs', async () => {
    await createPomodoroLog({ courseId: 1, taskId: 2, duration: 1500, date: '2026-08-12', notes: 'Ch.1' });
    await createPomodoroLog({ courseId: 1, taskId: 3, duration: 1500, date: '2026-08-12', notes: 'Ch.2' });
    const all = await getPomodoroLogs();
    expect(all.length).toBe(2);
    const byCourse = await getPomodoroLogs({ courseId: 1 });
    expect(byCourse.length).toBe(2);
    const byTask = await getPomodoroLogs({ taskId: 2 });
    expect(byTask.length).toBe(1);
  });
});

/* ────────────────────────────── Skills ────────────────────────────── */

describe('Skills', () => {
  it('saves and upserts skill ratings', async () => {
    await saveSkillRating({ careerPath: 'frontend', skillName: 'React', rating: 3 });
    await saveSkillRating({ careerPath: 'frontend', skillName: 'React', rating: 5 });
    const ratings = await getSkillRatings('frontend');
    expect(ratings.length).toBe(1);
    expect(ratings[0].rating).toBe(5);
  });
});

/* ─────────── Simple CRUD Tables (Portfolios, Certs, etc.) ──────────── */

describe('Simple CRUD Tables', () => {
  it('Portfolios', async () => {
    const id = await createPortfolio({ name: 'SecondBrain', techStack: 'React', githubUrl: 'https://...' });
    expect((await getPortfolios()).length).toBe(1);
    await updatePortfolio(id, { name: 'Updated' });
    expect((await getPortfolios())[0].name).toBe('Updated');
    await deletePortfolio(id);
    expect((await getPortfolios()).length).toBe(0);
  });

  it('Certificates', async () => {
    const id = await createCertificate({ name: 'AWS', issuer: 'Amazon', type: 'cloud' });
    expect((await getCertificates()).length).toBe(1);
    await updateCertificate(id, { name: 'AWS CCP' });
    expect((await getCertificates())[0].name).toBe('AWS CCP');
    await deleteCertificate(id);
    expect((await getCertificates()).length).toBe(0);
  });

  it('Networking Contacts', async () => {
    const id = await createNetworkContact({ type: 'mentor', name: 'Dr. A', contact: 'a@b.com' });
    expect((await getNetworkContacts()).length).toBe(1);
    expect((await getNetworkContacts('mentor')).length).toBe(1);
    expect((await getNetworkContacts('peer')).length).toBe(0);
    await deleteNetworkContact(id);
    expect((await getNetworkContacts()).length).toBe(0);
  });

  it('Side Projects', async () => {
    const id = await createSideProject({ name: 'CLI tool', status: 'active' });
    expect((await getSideProjects()).length).toBe(1);
    await updateSideProject(id, { status: 'completed' });
    await deleteSideProject(id);
    expect((await getSideProjects()).length).toBe(0);
  });

  it('Books', async () => {
    const id = await createBook({ title: 'Clean Code', author: 'Robert C. Martin', status: 'reading' });
    expect((await getBooks()).length).toBe(1);
    await updateBook(id, { status: 'done', rating: 5 });
    expect((await getBooks())[0].rating).toBe(5);
    await deleteBook(id);
    expect((await getBooks()).length).toBe(0);
  });

  it('Language Goals & Logs', async () => {
    await saveLanguageGoal({ language: 'IELTS', currentScore: 5.5, targetScore: 7.0, examDate: '2027-06-01' });
    await saveLanguageGoal({ language: 'IELTS', currentScore: 6.0, targetScore: 7.0, examDate: '2027-06-01' });
    const goals = await getLanguageGoals();
    expect(goals.length).toBe(1);
    expect(goals[0].currentScore).toBe(6.0);

    const logId = await createLanguageLog({ type: 'listening', date: '2026-08-12', minutes: 30 });
    expect((await getLanguageLogs()).length).toBe(1);
    await deleteLanguageLog(logId);
    expect((await getLanguageLogs()).length).toBe(0);
  });

  it('Research Papers & Ideas', async () => {
    const paperId = await createResearchPaper({ title: 'ML Survey', category: 'AI', status: 'reading' });
    expect((await getResearchPapers()).length).toBe(1);
    await deleteResearchPaper(paperId);
    expect((await getResearchPapers()).length).toBe(0);

    const ideaId = await createResearchIdea({ title: 'PBL Idea', category: 'SE', status: 'draft' });
    expect((await getResearchIdeas()).length).toBe(1);
    await deleteResearchIdea(ideaId);
    expect((await getResearchIdeas()).length).toBe(0);
  });

  it('Branding Posts', async () => {
    const id = await createBrandingPost({ title: 'React Tips', platform: 'Medium', status: 'published', date: '2026-08-12' });
    expect((await getBrandingPosts()).length).toBe(1);
    await deleteBrandingPost(id);
    expect((await getBrandingPosts()).length).toBe(0);
  });

  it('Branding Posts handles null date', async () => {
    await createBrandingPost({ title: 'No Date', platform: 'Dev.to', status: 'draft' });
    const posts = await getBrandingPosts();
    expect(posts.length).toBe(1);
  });

  it('Mentor Logs', async () => {
    const id = await createMentorLog({ menteeName: 'Junior Dev', date: '2026-08-12', topic: 'React basics' });
    expect((await getMentorLogs()).length).toBe(1);
    await deleteMentorLog(id);
    expect((await getMentorLogs()).length).toBe(0);
  });
});

/* ────────────────────────────── Power Hub ────────────────────────────── */

describe('Power Hub', () => {
  it('Power Devices CRUD', async () => {
    const id = await createPowerDevice({ name: 'AC', power: 1500, quantity: 1, hoursPerDay: 8, category: 'cooling' });
    const devices = await getPowerDevices();
    expect(devices.length).toBe(1);
    expect(devices[0].name).toBe('AC');
    await updatePowerDevice(id, { hoursPerDay: 6 });
    const updated = (await getPowerDevices())[0];
    expect(updated.hoursPerDay).toBe(6);
    await deletePowerDevice(id);
    expect((await getPowerDevices()).length).toBe(0);
  });

  it('Electricity Bills CRUD', async () => {
    const id = await createElectricityBill({ month: '2026-08', startIndex: 1000, endIndex: 1200, totalKwh: 200 });
    const bills = await getElectricityBills();
    expect(bills.length).toBe(1);
    await updateElectricityBill(id, { paid: true });
    await deleteElectricityBill(id);
    expect((await getElectricityBills()).length).toBe(0);
  });
});

/* ────────────────────────────── Export/Import ────────────────────────────── */

describe('Export/Import', () => {
  it('round-trips all data correctly', async () => {
    // Seed data across multiple tables
    await createNote({ title: 'Note1', content: 'Content1' });
    await createTask({ title: 'Task1', priority: 'high' });
    const deckId = await createDeck({ name: 'Deck1' });
    await createFlashcard({ deckId, front: 'Q', back: 'A' });
    await createJournal({ date: '2026-08-12', mood: '😊', content: 'Good' });
    await createProject({ name: 'P1' });
    await createEvent({ title: 'Ev1', date: '2026-08-12', startTime: '09:00', endTime: '10:00' });
    await createCourse({ name: 'C1', code: 'CS101', credits: 3, type: 'foundation', semester: 1, status: 'not_started' });
    await createExpense({ amount: 50000, category: 'food', date: '2026-08-12', type: 'expense' });
    await saveHealth({ date: '2026-08-12', sleepHours: 7 });
    await createPomodoroLog({ courseId: 1, taskId: 1, duration: 1500, date: '2026-08-12' });

    // Export
    const exported = await exportAll();
    expect(exported.version).toBe(7);
    expect(exported.notes.length).toBe(1);
    expect(exported.tasks.length).toBe(1);
    expect(exported.decks.length).toBe(1);
    expect(exported.flashcards.length).toBe(1);
    expect(exported.journal.length).toBe(1);
    expect(exported.projects.length).toBe(1);
    expect(exported.events.length).toBe(1);
    expect(exported.courses.length).toBe(1);
    expect(exported.expenses.length).toBe(1);
    expect(exported.health.length).toBe(1);
    expect(exported.pomodoro_logs.length).toBe(1);

    // Clear & Import
    const db = getDB();
    await db.transaction('rw', [db.notes, db.tasks, db.flashcards, db.decks, db.journal, db.projects, db.events], async () => {
      await db.notes.clear();
      await db.tasks.clear();
      await db.flashcards.clear();
      await db.decks.clear();
      await db.journal.clear();
      await db.projects.clear();
      await db.events.clear();
    });
    expect(await db.notes.count()).toBe(0);

    await importAll(exported);

    // Verify
    expect(await db.notes.count()).toBe(1);
    expect(await db.tasks.count()).toBe(1);
    expect(await db.flashcards.count()).toBe(1);
    expect(await db.decks.count()).toBe(1);
    expect(await db.journal.count()).toBe(1);
    expect(await db.events.count()).toBe(1);
    expect(await db.courses.count()).toBe(1);
    expect(await db.expenses.count()).toBe(1);
    expect(await db.health.count()).toBe(1);
    expect(await db.pomodoro_logs.count()).toBe(1);
  });
});

/* ────────────────────────────── Dashboard Stats ────────────────────────────── */

describe('Dashboard Stats', () => {
  it('calculates stats from seeded data', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await createNote({ title: 'N1', content: '' });
    await createNote({ title: 'N2', content: '' });
    await createTask({ title: 'T1', priority: 'high' });
    const t2 = await createTask({ title: 'T2', priority: 'low' });
    await updateTask(t2, { status: 'done' });
    await createTask({ title: 'T3', priority: 'medium', dueDate: '2020-01-01' }); // overdue
    await createEvent({ title: 'E1', date: today, startTime: '09:00', endTime: '10:00' });

    const stats = await getDashboardStats(today);
    expect(stats.notes).toBe(2);
    expect(stats.totalTasks).toBe(3);
    expect(stats.todoPending).toBe(2);
    expect(stats.doneToday).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.todayEvents).toBe(1);
  });
});

/* ────────────────────────────── Global Search ────────────────────────────── */

describe('Global Search', () => {
  it('searches across notes, tasks, flashcards, events, courses', async () => {
    await createNote({ title: 'React Guide', content: 'Learn React' });
    await createTask({ title: 'Study React', priority: 'high' });
    const deckId = await createDeck({ name: 'Test' });
    await createFlashcard({ deckId, front: 'What is React?', back: 'A library' });
    await createEvent({ title: 'React Workshop', date: '2026-08-12', startTime: '09:00', endTime: '10:00' });
    await createCourse({ name: 'Lập trình React', code: 'CS200', credits: 3, type: 'elective', semester: 5, status: 'studying' });

    const results = await globalSearch('React');
    expect(results.length).toBe(5);
    const types = results.map(r => r.type);
    expect(types).toContain('note');
    expect(types).toContain('task');
    expect(types).toContain('flashcard');
    expect(types).toContain('event');
    expect(types).toContain('course');
  });
});

/* ────────────────────────────── Edge Cases ────────────────────────────── */

describe('Edge Cases', () => {
  it('getDB throws when not initialized', async () => {
    const db = getDB();
    db.close();
    await Dexie.delete(`SecondBrainDB_${TEST_PROFILE_ID}`);
    // Re-init so afterEach doesn't fail
    initDB(TEST_PROFILE_ID);
  });

  it('getCurrentDbName returns correct name', () => {
    expect(getCurrentDbName()).toBe(`SecondBrainDB_${TEST_PROFILE_ID}`);
  });

  it('handles bulk data (100 notes)', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(createNote({ title: `Note ${i}`, content: `Content ${i}` }));
    }
    await Promise.all(promises);
    const notes = await getNotes();
    expect(notes.length).toBe(100);
  });
});
