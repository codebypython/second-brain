/**
 * End-to-end integration tests simulating real-world usage scenarios.
 * These tests verify that multiple modules work together correctly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import {
  initDB, getDB,
  createNote, searchNotes,
  createTask, updateTask, getTasks,
  createDeck, createFlashcard, reviewCard, getFlashcard, getDueCards,
  createJournal, getJournalRange,
  createEvent, getEventsByDate, getEventsRange,
  createCourse, updateCourse, getCourses, importDUTProgram,
  createExpense, getExpenses,
  saveHealth, getHealthRange,
  createPomodoroLog, getPomodoroLogs,
  getDashboardStats, globalSearch,
  exportAll, importAll,
} from '../db';
import { calculateCumulativeGpa } from '../gpaUtils';

const TEST_PROFILE = 'integration_test';

beforeEach(async () => {
  initDB(TEST_PROFILE);
  const db = getDB();
  if (db.isOpen()) {
    const tableNames = db.tables.map(t => t.name);
    for (const name of tableNames) {
      await db[name].clear();
    }
  }
});

/* ── Scenario 1: Student imports DUT program → enters grades → calculates GPA ── */

describe('Scenario 1: DUT Program → Grades → GPA', () => {
  it('imports courses, updates grades, calculates GPA correctly', async () => {
    const count = await importDUTProgram();
    expect(count).toBeGreaterThan(30);

    // Get first 3 courses and mark them as passed with different grades
    const courses = await getCourses({ semester: 1 });
    expect(courses.length).toBeGreaterThan(0);

    // Update 3 courses with grades
    await updateCourse(courses[0].id, { status: 'passed', score10: 8.5, score4: 4.0, gradeLetter: 'A' });
    await updateCourse(courses[1].id, { status: 'passed', score10: 7.0, score4: 3.0, gradeLetter: 'B' });
    await updateCourse(courses[2].id, { status: 'failed', score10: 3.5, score4: 0.0, gradeLetter: 'F' });

    // Calculate GPA from all courses
    const allCourses = await getCourses();
    const gpa = calculateCumulativeGpa(allCourses);
    expect(gpa).toBeGreaterThan(0);
    expect(gpa).toBeLessThanOrEqual(4.0);

    // Verify dashboard picks up GPA
    const today = new Date().toISOString().slice(0, 10);
    const stats = await getDashboardStats(today);
    expect(stats.gpa).toBeGreaterThan(0);
    expect(stats.credits).toBeGreaterThan(0);
  });
});

/* ── Scenario 2: Task → Pomodoro → Log verification ── */

describe('Scenario 2: Task → Pomodoro → Log', () => {
  it('creates task, runs pomodoro, saves log, verifies linkage', async () => {
    const courseId = await createCourse({ name: 'Giải tích', code: 'MATH01', credits: 3, type: 'general', semester: 1, status: 'studying' });
    const taskId = await createTask({ title: 'Solve exercises Ch.3', priority: 'high', courseId });

    // Simulate pomodoro completion
    await createPomodoroLog({ courseId, taskId, duration: 1500, date: '2026-08-12', notes: 'Done exercises 1-10' });
    await createPomodoroLog({ courseId, taskId, duration: 1500, date: '2026-08-12', notes: 'Done exercises 11-20' });

    // Verify logs linked to task
    const taskLogs = await getPomodoroLogs({ taskId });
    expect(taskLogs.length).toBe(2);

    // Verify logs linked to course
    const courseLogs = await getPomodoroLogs({ courseId });
    expect(courseLogs.length).toBe(2);

    // Mark task as done
    await updateTask(taskId, { status: 'done' });
    const completedTasks = await getTasks({ status: 'done' });
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0].completedAt).toBeTruthy();
  });
});

/* ── Scenario 3: Monthly expenses → Dashboard budget tracking ── */

describe('Scenario 3: Monthly Expenses → Dashboard Budget', () => {
  it('tracks 30 days of expenses, dashboard reflects total', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);

    // Add 30 expense entries for this month
    for (let i = 1; i <= 30; i++) {
      const day = String(i).padStart(2, '0');
      const date = `${monthPrefix}-${day}`;
      await createExpense({ amount: 100000, category: 'food', date, description: `Lunch day ${i}`, type: 'expense' });
    }

    // Also add an income entry (should not count as expense)
    await createExpense({ amount: 5000000, category: 'salary', date: `${monthPrefix}-15`, description: 'Part-time', type: 'income' });

    const stats = await getDashboardStats(today);
    expect(stats.thisMonthExpenses).toBe(3000000); // 30 * 100000
  });
});

/* ── Scenario 4: Health tracking → Sleep deprivation detection ── */

describe('Scenario 4: Health Tracking → Sleep Analysis', () => {
  it('records 7 days of health data, identifies poor sleep streak', async () => {
    const baseDate = new Date('2026-08-06');
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      await saveHealth({ date: dateStr, sleepHours: 5 + (i % 2), waterIntake: 1500 });
    }

    const range = await getHealthRange('2026-08-06', '2026-08-12');
    expect(range.length).toBe(7);

    // Check for sleep deprivation streak (< 6 hours)
    const lowSleepDays = range.filter(h => h.sleepHours < 6);
    expect(lowSleepDays.length).toBeGreaterThan(0);
  });
});

/* ── Scenario 5: Flashcard SM-2 scheduling verification ── */

describe('Scenario 5: SM-2 Spaced Repetition', () => {
  it('reviews card with increasing intervals on good quality', async () => {
    const deckId = await createDeck({ name: 'Algorithm Basics' });
    const cardId = await createFlashcard({ deckId, front: 'Big-O of binary search?', back: 'O(log n)' });

    // First review — quality 5 (perfect)
    await reviewCard(cardId, 5);
    let card = await getFlashcard(cardId);
    expect(card.interval).toBe(1);
    expect(card.repetitions).toBe(1);

    // Second review — quality 4 (good)
    await reviewCard(cardId, 4);
    card = await getFlashcard(cardId);
    expect(card.interval).toBe(6);
    expect(card.repetitions).toBe(2);

    // Third review — quality 3 (ok)
    await reviewCard(cardId, 3);
    card = await getFlashcard(cardId);
    expect(card.interval).toBeGreaterThan(6); // should be ~6 * ease
    expect(card.repetitions).toBe(3);

    // Verify nextReview is in the future
    const nextReviewDate = new Date(card.nextReview);
    expect(nextReviewDate.getTime()).toBeGreaterThan(Date.now());
  });
});

/* ── Scenario 6: Multi-profile data isolation ── */

describe('Scenario 6: Multi-Profile Data Isolation', () => {
  it('data in one profile does not leak to another', async () => {
    // Profile A
    initDB('profile_A');
    await createNote({ title: 'Note from A', content: 'Secret A' });
    await createTask({ title: 'Task from A' });

    // Profile B
    initDB('profile_B');
    await createNote({ title: 'Note from B', content: 'Secret B' });

    // Verify Profile B only sees its own data
    const notesB = await searchNotes('');
    expect(notesB.length).toBe(1);
    expect(notesB[0].title).toBe('Note from B');

    const tasksB = await getTasks();
    expect(tasksB.length).toBe(0); // No tasks in profile B

    // Switch back to A and verify
    initDB('profile_A');
    const notesA = await searchNotes('');
    expect(notesA.length).toBe(1);
    expect(notesA[0].title).toBe('Note from A');

    const tasksA = await getTasks();
    expect(tasksA.length).toBe(1);

    // Cleanup
    const dbA = getDB();
    dbA.close();
    await Dexie.delete('SecondBrainDB_profile_A');

    initDB('profile_B');
    const dbB = getDB();
    dbB.close();
    await Dexie.delete('SecondBrainDB_profile_B');

    // Re-init for afterEach
    initDB(TEST_PROFILE);
  });
});

/* ── Scenario 7: Export → Clear → Import → Verify ── */

describe('Scenario 7: Export → Clear → Import Round-trip', () => {
  it('preserves all data across export/import cycle', async () => {
    // Seed diverse data
    await createNote({ title: 'Important Note', content: '# Markdown\n**Bold**' });
    await createTask({ title: 'Deploy app', priority: 'high' });
    const deckId = await createDeck({ name: 'Vocab' });
    await createFlashcard({ deckId, front: 'Hello', back: 'Xin chào' });
    await createJournal({ date: '2026-08-12', mood: '😊', content: 'Productive day' });
    await createEvent({ title: 'Team meeting', date: '2026-08-12', startTime: '14:00', endTime: '15:00' });
    await createCourse({ name: 'AI', code: 'CS301', credits: 3, type: 'specialty', semester: 5, status: 'studying' });
    await createExpense({ amount: 35000, category: 'food', date: '2026-08-12', type: 'expense' });
    await saveHealth({ date: '2026-08-12', sleepHours: 7.5 });

    // Export
    const exported = await exportAll();
    const originalCounts = {
      notes: exported.notes.length,
      tasks: exported.tasks.length,
      decks: exported.decks.length,
      flashcards: exported.flashcards.length,
      journal: exported.journal.length,
      events: exported.events.length,
      courses: exported.courses.length,
      expenses: exported.expenses.length,
      health: exported.health.length,
    };

    // Verify non-zero
    Object.values(originalCounts).forEach(count => {
      expect(count).toBeGreaterThan(0);
    });

    // Clear everything
    const db = getDB();
    const tableNames = ['notes', 'tasks', 'flashcards', 'decks', 'journal', 'projects', 'events',
      'courses', 'expenses', 'health', 'pomodoro_logs'];
    for (const name of tableNames) {
      if (db[name]) await db[name].clear();
    }

    // Verify cleared
    expect(await db.notes.count()).toBe(0);
    expect(await db.tasks.count()).toBe(0);

    // Import
    await importAll(exported);

    // Verify restored
    expect(await db.notes.count()).toBe(originalCounts.notes);
    expect(await db.tasks.count()).toBe(originalCounts.tasks);
    expect(await db.decks.count()).toBe(originalCounts.decks);
    expect(await db.flashcards.count()).toBe(originalCounts.flashcards);
    expect(await db.journal.count()).toBe(originalCounts.journal);
    expect(await db.events.count()).toBe(originalCounts.events);
    expect(await db.courses.count()).toBe(originalCounts.courses);
    expect(await db.expenses.count()).toBe(originalCounts.expenses);
    expect(await db.health.count()).toBe(originalCounts.health);

    // Verify content integrity
    const notes = await db.notes.toArray();
    expect(notes[0].title).toBe('Important Note');
    expect(notes[0].content).toContain('**Bold**');
  });
});

/* ── Scenario 8: Markdown note creation and search ── */

describe('Scenario 8: Markdown Notes + Search', () => {
  it('creates markdown notes and finds them via search', async () => {
    await createNote({ title: 'React Hooks', content: '# useEffect\nCleanup function runs on unmount.\n\n```js\nuseEffect(() => { ... }, [])\n```' });
    await createNote({ title: 'Git Commands', content: '## Branching\n- `git branch feature`\n- `git checkout -b hotfix`' });
    await createNote({ title: 'Docker Setup', content: 'Build: `docker build -t app .`' });

    // Search by content keyword
    const hookResults = await searchNotes('useEffect');
    expect(hookResults.length).toBe(1);
    expect(hookResults[0].title).toBe('React Hooks');

    // Search by title keyword
    const gitResults = await searchNotes('Git');
    expect(gitResults.length).toBe(1);

    // Search partial match
    const dockerResults = await searchNotes('docker');
    expect(dockerResults.length).toBe(1);

    // No match
    const noResults = await searchNotes('kubernetes');
    expect(noResults.length).toBe(0);
  });
});

/* ── Scenario 9: Calendar events across 30 days ── */

describe('Scenario 9: Calendar Events Range Query', () => {
  it('queries events correctly across date ranges', async () => {
    // Create events across August 2026
    for (let i = 1; i <= 30; i++) {
      const day = String(i).padStart(2, '0');
      if (i % 3 === 0) { // Every 3rd day
        await createEvent({ title: `Event ${i}`, date: `2026-08-${day}`, startTime: '10:00', endTime: '11:00' });
      }
    }

    // Query first week
    const week1 = await getEventsRange('2026-08-01', '2026-08-07');
    expect(week1.length).toBe(2); // day 3, 6

    // Query second week
    const week2 = await getEventsRange('2026-08-08', '2026-08-14');
    expect(week2.length).toBe(2); // day 9, 12

    // Query full month
    const fullMonth = await getEventsRange('2026-08-01', '2026-08-31');
    expect(fullMonth.length).toBe(10); // days 3,6,9,12,15,18,21,24,27,30

    // Query single day
    const singleDay = await getEventsByDate('2026-08-03');
    expect(singleDay.length).toBe(1);
    expect(singleDay[0].title).toBe('Event 3');
  });
});

/* ── Scenario 10: Dashboard comprehensive stats ── */

describe('Scenario 10: Dashboard Comprehensive Stats', () => {
  it('all dashboard fields are accurate with seeded data', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Seed notes
    await createNote({ title: 'N1', content: '' });
    await createNote({ title: 'N2', content: '' });
    await createNote({ title: 'N3', content: '' });

    // Seed tasks (3 total: 1 done today, 1 overdue, 1 pending)
    const t1 = await createTask({ title: 'Done task', priority: 'high' });
    await updateTask(t1, { status: 'done' });
    await createTask({ title: 'Overdue task', priority: 'medium', dueDate: '2020-01-01' });
    await createTask({ title: 'Pending task', priority: 'low' });

    // Seed flashcards
    const deckId = await createDeck({ name: 'Test' });
    await createFlashcard({ deckId, front: 'Q1', back: 'A1' });
    await createFlashcard({ deckId, front: 'Q2', back: 'A2' });

    // Seed events
    await createEvent({ title: 'Today event', date: today, startTime: '09:00', endTime: '10:00' });

    // Seed journal
    await createJournal({ date: today, mood: '😊', content: 'OK day' });

    // Seed courses
    await createCourse({ name: 'Math', code: 'M01', credits: 3, type: 'general', semester: 1, status: 'passed', score4: 4.0, gradeLetter: 'A' });

    // Seed expenses
    await createExpense({ amount: 200000, category: 'food', date: today, type: 'expense' });

    // Verify stats
    const stats = await getDashboardStats(today);
    expect(stats.notes).toBe(3);
    expect(stats.totalTasks).toBe(3);
    expect(stats.todoPending).toBe(2);
    expect(stats.doneToday).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.cards).toBe(2);
    expect(stats.dueCards).toBe(2); // Both new cards are due today
    expect(stats.journals).toBe(1);
    expect(stats.todayEvents).toBe(1);
    expect(stats.gpa).toBe(4.0);
    expect(stats.credits).toBe(3);
    expect(stats.thisMonthExpenses).toBe(200000);
  });
});
