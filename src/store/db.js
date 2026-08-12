import Dexie from 'dexie';
import logger from './logger';
import { calculateCumulativeGpa } from './gpaUtils';

let currentDb = null;

export function initDB(profileId) {
  logger.info('DB', `initDB called for profile: ${profileId}`);
  if (currentDb && currentDb.name === `SecondBrainDB_${profileId}` && currentDb.isOpen()) {
    logger.info('DB', 'DB already initialized for this profile, reusing');
    return currentDb;
  }
  
  if (currentDb) {
    logger.info('DB', `Closing previous DB: ${currentDb.name}`);
    currentDb.close();
  }

  const db = new Dexie(`SecondBrainDB_${profileId}`);

  db.version(2).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
  });

  db.version(3).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
  });

  db.version(4).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
    pomodoro_logs: '++id, courseId, taskId, duration, date, notes'
  });

  db.version(5).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
    pomodoro_logs: '++id, courseId, taskId, duration, date, notes',
    skills: '++id, careerPath, skillName, rating, updatedAt',
    portfolios: '++id, name, techStack, description, githubUrl, demoUrl, imagePath, createdAt',
    certificates: '++id, name, issuer, issueDate, credentialId, type, createdAt',
    networking: '++id, type, name, contact, expertise, notes, createdAt',
    side_projects: '++id, name, status, description, githubUrl, createdAt'
  });

  db.version(6).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
    pomodoro_logs: '++id, courseId, taskId, duration, date, notes',
    skills: '++id, careerPath, skillName, rating, updatedAt',
    portfolios: '++id, name, techStack, description, githubUrl, demoUrl, imagePath, createdAt',
    certificates: '++id, name, issuer, issueDate, credentialId, type, createdAt',
    networking: '++id, type, name, contact, expertise, notes, createdAt',
    side_projects: '++id, name, status, description, githubUrl, createdAt',
    books: '++id, title, author, category, status, rating, createdAt',
    language_goals: '++id, language, examDate',
    language_logs: '++id, type, date',
    research_papers: '++id, title, category, status, createdAt',
    research_ideas: '++id, title, category, status, createdAt',
    branding_posts: '++id, title, platform, status, date',
    mentor_logs: '++id, menteeName, date, createdAt'
  });

  db.version(7).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
    pomodoro_logs: '++id, courseId, taskId, duration, date, notes',
    skills: '++id, careerPath, skillName, rating, updatedAt',
    portfolios: '++id, name, techStack, description, githubUrl, demoUrl, imagePath, createdAt',
    certificates: '++id, name, issuer, issueDate, credentialId, type, createdAt',
    networking: '++id, type, name, contact, expertise, notes, createdAt',
    side_projects: '++id, name, status, description, githubUrl, createdAt',
    books: '++id, title, author, category, status, rating, createdAt',
    language_goals: '++id, language, examDate',
    language_logs: '++id, type, date',
    research_papers: '++id, title, category, status, createdAt',
    research_ideas: '++id, title, category, status, createdAt',
    branding_posts: '++id, title, platform, status, date',
    mentor_logs: '++id, menteeName, date, createdAt',
    power_devices: '++id, name, power, quantity, hoursPerDay, daysPerMonth, category, room, createdAt, updatedAt',
    electricity_bills: '++id, month, startIndex, endIndex, totalKwh, totalAmount, paid, note, createdAt'
  });

  db.version(8).stores({
    notes: '++id, title, category, area, tags, createdAt, updatedAt, pinned, courseId',
    tasks: '++id, title, status, priority, project, dueDate, createdAt, completedAt, courseId',
    flashcards: '++id, deckId, front, back, nextReview, interval, ease, repetitions',
    decks: '++id, name, category, createdAt',
    journal: '++id, date, mood, content, createdAt',
    projects: '++id, name, status, color, createdAt',
    events: '++id, title, date, startTime, endTime, color, category, description, repeat, completed, createdAt',
    courses: '++id, name, code, credits, type, semester, status, gradeLetter, score10, score4, lecturer, room, schedule, notes, createdAt, updatedAt',
    expenses: '++id, amount, category, date, description, type, createdAt',
    health: '++id, date, sleepHours, sleepQuality, weight, bmi, steps, waterIntake, workoutType, workoutDuration, workoutIntensity, notes, createdAt, updatedAt',
    pomodoro_logs: '++id, courseId, taskId, duration, date, notes',
    skills: '++id, careerPath, skillName, rating, updatedAt',
    portfolios: '++id, name, techStack, description, githubUrl, demoUrl, imagePath, createdAt',
    certificates: '++id, name, issuer, issueDate, credentialId, type, createdAt',
    networking: '++id, type, name, contact, expertise, notes, createdAt',
    side_projects: '++id, name, status, description, githubUrl, createdAt',
    books: '++id, title, author, category, status, rating, createdAt',
    language_goals: '++id, language, examDate',
    language_logs: '++id, type, date',
    research_papers: '++id, title, category, status, createdAt',
    research_ideas: '++id, title, category, status, createdAt',
    branding_posts: '++id, title, platform, status, date',
    mentor_logs: '++id, menteeName, date, createdAt',
    power_devices: '++id, name, power, quantity, hoursPerDay, daysPerMonth, category, room, createdAt, updatedAt',
    electricity_bills: '++id, month, startIndex, endIndex, totalKwh, totalAmount, paid, note, createdAt',

    // ChillPomodoro Tables
    chill_animations: '++id, name, type, mimeType, sizeBytes, createdAt',
    chill_sounds: '++id, name, type, mimeType, sizeBytes, createdAt',
    chill_presets: '++id, name, createdAt',
    chill_class_schedules: '++id, name, semester, createdAt',
    chill_daily_schedules: '++id, name, weekday, createdAt',
    chill_workout_programs: '++id, name, template, createdAt',
    chill_workout_sessions: '++id, programId, date, status, completedAt',
    chill_exercises: '++id, name, muscleGroup, equipment, difficulty',
    chill_planner_tasks: '++id, title, subject, deadline, targetDate, priority, status, createdAt',
    chill_study_goals: '++id, dailyPomodoros, weeklyMinutes, updatedAt'
  });

  currentDb = db;
  logger.success('DB', `Database initialized: SecondBrainDB_${profileId}`);
  return db;
}

export function getDB() {
  if (!currentDb) throw new Error("DB not initialized. Please select a profile first.");
  return currentDb;
}

/** Returns the current DB name (used by cloudSync to save/restore) */
export function getCurrentDbName() {
  return currentDb ? currentDb.name : null;
}

/* ── Notes ── */

export async function createNote(data) {
  logger.info('Notes', 'Creating note', { title: data.title });
  try {
    const db = getDB();
    const now = new Date().toISOString();
    const id = await db.notes.add({ ...data, pinned: 0, createdAt: now, updatedAt: now });
    logger.success('Notes', `Note created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Notes', 'Failed to create note', error);
    throw error;
  }
}

export async function getNote(id) {
  logger.info('Notes', `Reading note id: ${id}`);
  try {
    const note = await getDB().notes.get(id);
    logger.success('Notes', note ? `Note found: ${id}` : `Note not found: ${id}`);
    return note;
  } catch (error) {
    logger.error('Notes', `Failed to read note id: ${id}`, error);
    throw error;
  }
}

export async function updateNote(id, changes) {
  logger.info('Notes', `Updating note id: ${id}`, changes);
  try {
    const result = await getDB().notes.update(id, { ...changes, updatedAt: new Date().toISOString() });
    logger.success('Notes', `Note updated: ${id}, rows affected: ${result}`);
    return result;
  } catch (error) {
    logger.error('Notes', `Failed to update note id: ${id}`, error);
    throw error;
  }
}

export async function deleteNote(id) {
  logger.info('Notes', `Deleting note id: ${id}`);
  try {
    await getDB().notes.delete(id);
    logger.success('Notes', `Note deleted: ${id}`);
  } catch (error) {
    logger.error('Notes', `Failed to delete note id: ${id}`, error);
    throw error;
  }
}

export async function getNotes(filter = {}) {
  logger.info('Notes', 'Fetching notes', filter);
  try {
    const db = getDB();
    let items;
    if (filter.category) {
      // FIX: where().equals() rồi sort thủ công theo updatedAt (thay vì .reverse() sai ngữ nghĩa)
      items = await db.notes.where('category').equals(filter.category).toArray();
      items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    } else {
      items = await db.notes.orderBy('updatedAt').reverse().toArray();
    }
    logger.success('Notes', `Fetched ${items.length} notes`);
    return items;
  } catch (error) {
    logger.error('Notes', 'Failed to fetch notes', error);
    throw error;
  }
}

export async function searchNotes(query) {
  logger.info('Notes', `Searching notes for: "${query}"`);
  try {
    const q = query.toLowerCase();
    const results = await getDB().notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    ).toArray();
    logger.success('Notes', `Search found ${results.length} results`);
    return results;
  } catch (error) {
    logger.error('Notes', `Search failed for: "${query}"`, error);
    throw error;
  }
}

/* ── Tasks ── */

export async function createTask(data) {
  logger.info('Tasks', 'Creating task', { title: data.title });
  try {
    const db = getDB();
    const id = await db.tasks.add({ ...data, status: 'todo', createdAt: new Date().toISOString(), completedAt: '' });
    logger.success('Tasks', `Task created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Tasks', 'Failed to create task', error);
    throw error;
  }
}

export async function getTask(id) {
  logger.info('Tasks', `Reading task id: ${id}`);
  try {
    const task = await getDB().tasks.get(id);
    return task;
  } catch (error) {
    logger.error('Tasks', `Failed to read task id: ${id}`, error);
    throw error;
  }
}

export async function updateTask(id, changes) {
  logger.info('Tasks', `Updating task id: ${id}`, changes);
  try {
    const db = getDB();
    if (changes.status === 'done' && !changes.completedAt) changes.completedAt = new Date().toISOString();
    if (changes.status && changes.status !== 'done') changes.completedAt = '';
    const result = await db.tasks.update(id, changes);
    logger.success('Tasks', `Task updated: ${id}, rows affected: ${result}`);
    return result;
  } catch (error) {
    logger.error('Tasks', `Failed to update task id: ${id}`, error);
    throw error;
  }
}

export async function deleteTask(id) {
  logger.info('Tasks', `Deleting task id: ${id}`);
  try {
    await getDB().tasks.delete(id);
    logger.success('Tasks', `Task deleted: ${id}`);
  } catch (error) {
    logger.error('Tasks', `Failed to delete task id: ${id}`, error);
    throw error;
  }
}

export async function getTasks(filter = {}) {
  logger.info('Tasks', 'Fetching tasks', filter);
  try {
    let items = await getDB().tasks.toArray();
    if (filter.status) items = items.filter(item => item.status === filter.status);
    if (filter.project) items = items.filter(item => item.project === filter.project);
    const order = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
    logger.success('Tasks', `Fetched ${items.length} tasks`);
    return items;
  } catch (error) {
    logger.error('Tasks', 'Failed to fetch tasks', error);
    throw error;
  }
}

/* ── Flashcards & Decks ── */

export async function createDeck(data) {
  logger.info('Decks', 'Creating deck', { name: data.name });
  try {
    const id = await getDB().decks.add({ ...data, createdAt: new Date().toISOString() });
    logger.success('Decks', `Deck created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Decks', 'Failed to create deck', error);
    throw error;
  }
}

export async function getDeck(id) {
  try {
    return await getDB().decks.get(id);
  } catch (error) {
    logger.error('Decks', `Failed to read deck id: ${id}`, error);
    throw error;
  }
}

export async function updateDeck(id, changes) {
  logger.info('Decks', `Updating deck id: ${id}`);
  try {
    const result = await getDB().decks.update(id, changes);
    logger.success('Decks', `Deck updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Decks', `Failed to update deck id: ${id}`, error);
    throw error;
  }
}

export async function getDecks() {
  logger.info('Decks', 'Fetching all decks');
  try {
    const decks = await getDB().decks.toArray();
    logger.success('Decks', `Fetched ${decks.length} decks`);
    return decks;
  } catch (error) {
    logger.error('Decks', 'Failed to fetch decks', error);
    throw error;
  }
}

export async function deleteDeck(id) {
  logger.info('Decks', `Deleting deck id: ${id} and its flashcards`);
  try {
    const db = getDB();
    const deletedCards = await db.flashcards.where('deckId').equals(id).delete();
    logger.info('Decks', `Deleted ${deletedCards} flashcards from deck ${id}`);
    await db.decks.delete(id);
    logger.success('Decks', `Deck deleted: ${id}`);
  } catch (error) {
    logger.error('Decks', `Failed to delete deck id: ${id}`, error);
    throw error;
  }
}

export async function createFlashcard(data) {
  logger.info('Flashcards', 'Creating flashcard', { deckId: data.deckId, front: data.front?.slice(0, 30) });
  try {
    const id = await getDB().flashcards.add({ ...data, nextReview: new Date().toISOString(), interval: 0, ease: 2.5, repetitions: 0 });
    logger.success('Flashcards', `Flashcard created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Flashcards', 'Failed to create flashcard', error);
    throw error;
  }
}

export async function getFlashcard(id) {
  try {
    return await getDB().flashcards.get(id);
  } catch (error) {
    logger.error('Flashcards', `Failed to read flashcard id: ${id}`, error);
    throw error;
  }
}

export async function updateFlashcard(id, changes) {
  logger.info('Flashcards', `Updating flashcard id: ${id}`);
  try {
    const result = await getDB().flashcards.update(id, changes);
    logger.success('Flashcards', `Flashcard updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Flashcards', `Failed to update flashcard id: ${id}`, error);
    throw error;
  }
}

export async function deleteFlashcard(id) {
  logger.info('Flashcards', `Deleting flashcard id: ${id}`);
  try {
    await getDB().flashcards.delete(id);
    logger.success('Flashcards', `Flashcard deleted: ${id}`);
  } catch (error) {
    logger.error('Flashcards', `Failed to delete flashcard id: ${id}`, error);
    throw error;
  }
}

export async function getDueCards(deckId, todayStr) {
  logger.info('Flashcards', `Getting due cards for deck: ${deckId}, date: ${todayStr}`);
  try {
    // Use timezone-aware todayStr
    const cards = await getDB().flashcards.where('deckId').equals(deckId)
      .filter(c => (c.nextReview || '').slice(0, 10) <= todayStr).toArray();
    logger.success('Flashcards', `Found ${cards.length} due cards`);
    return cards;
  } catch (error) {
    logger.error('Flashcards', 'Failed to get due cards', error);
    throw error;
  }
}

export async function getAllCards(deckId) {
  logger.info('Flashcards', `Getting all cards for deck: ${deckId}`);
  try {
    const cards = await getDB().flashcards.where('deckId').equals(deckId).toArray();
    logger.success('Flashcards', `Found ${cards.length} cards in deck ${deckId}`);
    return cards;
  } catch (error) {
    logger.error('Flashcards', `Failed to get cards for deck: ${deckId}`, error);
    throw error;
  }
}

export async function reviewCard(id, quality) {
  logger.info('Flashcards', `Reviewing card id: ${id}, quality: ${quality}`);
  try {
    const db = getDB();
    const card = await db.flashcards.get(id);
    if (!card) {
      logger.warn('Flashcards', `Card not found for review: ${id}`);
      return;
    }
    let { interval, ease, repetitions } = card;
    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ease);
      repetitions += 1;
    } else {
      repetitions = 0; interval = 1;
    }
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    const nextReview = new Date(Date.now() + interval * 86400000).toISOString();
    const result = await db.flashcards.update(id, { interval, ease, repetitions, nextReview });
    logger.success('Flashcards', `Card reviewed: ${id}, next review: ${nextReview.slice(0, 10)}, interval: ${interval}d`);
    return result;
  } catch (error) {
    logger.error('Flashcards', `Failed to review card id: ${id}`, error);
    throw error;
  }
}

/* ── Journal ── */

export async function createJournal(data) {
  logger.info('Journal', `Saving journal for date: ${data.date}`, { mood: data.mood });
  try {
    const db = getDB();
    const existing = await db.journal.where('date').equals(data.date).first();
    if (existing) {
      logger.info('Journal', `Updating existing journal entry: ${existing.id}`);
      const result = await db.journal.update(existing.id, { mood: data.mood, content: data.content });
      logger.success('Journal', `Journal updated for date: ${data.date}`);
      return result;
    }
    const id = await db.journal.add({ ...data, createdAt: new Date().toISOString() });
    logger.success('Journal', `Journal created with id: ${id} for date: ${data.date}`);
    return id;
  } catch (error) {
    logger.error('Journal', `Failed to save journal for date: ${data.date}`, error);
    throw error;
  }
}

export async function getJournal(date) {
  logger.info('Journal', `Reading journal for date: ${date}`);
  try {
    const entry = await getDB().journal.where('date').equals(date).first();
    logger.success('Journal', entry ? `Journal found for: ${date}` : `No journal for: ${date}`);
    return entry;
  } catch (error) {
    logger.error('Journal', `Failed to read journal for date: ${date}`, error);
    throw error;
  }
}

export async function getJournalById(id) {
  try {
    return await getDB().journal.get(id);
  } catch (error) {
    logger.error('Journal', `Failed to read journal id: ${id}`, error);
    throw error;
  }
}

export async function deleteJournal(id) {
  logger.info('Journal', `Deleting journal id: ${id}`);
  try {
    await getDB().journal.delete(id);
    logger.success('Journal', `Journal deleted: ${id}`);
  } catch (error) {
    logger.error('Journal', `Failed to delete journal id: ${id}`, error);
    throw error;
  }
}

export async function getJournalRange(from, to) {
  logger.info('Journal', `Fetching journal range: ${from} to ${to}`);
  try {
    const entries = await getDB().journal.where('date').between(from, to, true, true).toArray();
    logger.success('Journal', `Fetched ${entries.length} journal entries`);
    return entries;
  } catch (error) {
    logger.error('Journal', `Failed to fetch journal range`, error);
    throw error;
  }
}

/* ── Projects ── */

export async function createProject(data) {
  logger.info('Projects', 'Creating project', { name: data.name });
  try {
    const id = await getDB().projects.add({ ...data, status: 'active', createdAt: new Date().toISOString() });
    logger.success('Projects', `Project created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Projects', 'Failed to create project', error);
    throw error;
  }
}

export async function getProject(id) {
  try {
    return await getDB().projects.get(id);
  } catch (error) {
    logger.error('Projects', `Failed to read project id: ${id}`, error);
    throw error;
  }
}

export async function updateProject(id, changes) {
  logger.info('Projects', `Updating project id: ${id}`);
  try {
    const result = await getDB().projects.update(id, changes);
    logger.success('Projects', `Project updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Projects', `Failed to update project id: ${id}`, error);
    throw error;
  }
}

export async function getProjects() {
  logger.info('Projects', 'Fetching all projects');
  try {
    const projects = await getDB().projects.toArray();
    logger.success('Projects', `Fetched ${projects.length} projects`);
    return projects;
  } catch (error) {
    logger.error('Projects', 'Failed to fetch projects', error);
    throw error;
  }
}

export async function deleteProject(id) {
  logger.info('Projects', `Deleting project id: ${id}`);
  try {
    await getDB().projects.delete(id);
    logger.success('Projects', `Project deleted: ${id}`);
  } catch (error) {
    logger.error('Projects', `Failed to delete project id: ${id}`, error);
    throw error;
  }
}

/* ── Calendar Events ── */

export async function createEvent(data) {
  logger.info('Events', 'Creating event', { title: data.title, date: data.date });
  try {
    const id = await getDB().events.add({ ...data, completed: false, createdAt: new Date().toISOString() });
    logger.success('Events', `Event created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Events', 'Failed to create event', error);
    throw error;
  }
}

export async function getEvent(id) {
  try {
    return await getDB().events.get(id);
  } catch (error) {
    logger.error('Events', `Failed to read event id: ${id}`, error);
    throw error;
  }
}

export async function updateEvent(id, changes) {
  logger.info('Events', `Updating event id: ${id}`);
  try {
    const result = await getDB().events.update(id, changes);
    logger.success('Events', `Event updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Events', `Failed to update event id: ${id}`, error);
    throw error;
  }
}

export async function deleteEvent(id) {
  logger.info('Events', `Deleting event id: ${id}`);
  try {
    await getDB().events.delete(id);
    logger.success('Events', `Event deleted: ${id}`);
  } catch (error) {
    logger.error('Events', `Failed to delete event id: ${id}`, error);
    throw error;
  }
}

export async function getEventsByDate(date) {
  logger.info('Events', `Fetching events for date: ${date}`);
  try {
    const events = await getDB().events.where('date').equals(date).toArray();
    logger.success('Events', `Found ${events.length} events for ${date}`);
    return events;
  } catch (error) {
    logger.error('Events', `Failed to fetch events for date: ${date}`, error);
    throw error;
  }
}

export async function getEventsRange(from, to) {
  logger.info('Events', `Fetching events range: ${from} to ${to}`);
  try {
    const events = await getDB().events.where('date').between(from, to, true, true).toArray();
    logger.success('Events', `Found ${events.length} events in range`);
    return events;
  } catch (error) {
    logger.error('Events', 'Failed to fetch events range', error);
    throw error;
  }
}

export async function toggleEventComplete(id) {
  logger.info('Events', `Toggling completion for event: ${id}`);
  try {
    const db = getDB();
    const event = await db.events.get(id);
    if (!event) {
      logger.warn('Events', `Event not found: ${id}`);
      return;
    }
    const result = await db.events.update(id, { completed: !event.completed });
    logger.success('Events', `Event ${id} completion toggled to: ${!event.completed}`);
    return result;
  } catch (error) {
    logger.error('Events', `Failed to toggle event: ${id}`, error);
    throw error;
  }
}

/* ── Dashboard Stats ── */

export async function getDashboardStats(todayStr) {
  logger.info('Dashboard', `Loading stats for: ${todayStr}`);
  try {
    const db = getDB();
    const [notesCount, tasks, cardsCount, journalsCount, projectsCount, todayEvents] = await Promise.all([
      db.notes.count(),
      db.tasks.toArray(),
      db.flashcards.count(),
      db.journal.count(),
      db.projects.where('status').equals('active').count(),
      getEventsByDate(todayStr),
    ]);
    const dueCards = await db.flashcards.filter(c => (c.nextReview || '').slice(0, 10) <= todayStr).count();
    const todoPending = tasks.filter(item => item.status !== 'done').length;
    const doneToday = tasks.filter(item => (item.completedAt || '').slice(0, 10) === todayStr).length;
    const overdue = tasks.filter(item => item.dueDate && item.dueDate < todayStr && item.status !== 'done').length;

    // Academic & Financial Stats for Student MVP
    let gpa = 0.00;
    let credits = 0;
    let thisMonthExpenses = 0;
    let budget = 3000000; // Default budget

    try {
      if (db.courses) {
        const courses = await db.courses.toArray();
        gpa = calculateCumulativeGpa(courses);
        credits = courses
          .filter(c => c.status === 'passed')
          .reduce((sum, c) => sum + (c.credits || 0), 0);
      }
    } catch (err) {
      logger.warn('Dashboard', 'Failed to calculate course stats', err);
    }

    try {
      if (db.expenses) {
        const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
        const expenses = await db.expenses.toArray();
        thisMonthExpenses = expenses
          .filter(e => e.date && e.date.startsWith(monthPrefix) && e.type === 'expense')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      }
    } catch (err) {
      logger.warn('Dashboard', 'Failed to calculate expense stats', err);
    }

    const stats = { 
      notes: notesCount, 
      totalTasks: tasks.length, 
      todoPending, 
      doneToday, 
      overdue, 
      cards: cardsCount, 
      dueCards, 
      journals: journalsCount, 
      projects: projectsCount, 
      todayEvents: todayEvents.length,
      gpa,
      credits,
      thisMonthExpenses,
      budget
    };
    logger.success('Dashboard', 'Stats loaded', stats);
    return stats;
  } catch (error) {
    logger.error('Dashboard', 'Failed to load stats', error);
    throw error;
  }
}

/* ── Global Search ── */

export async function globalSearch(query) {
  logger.info('Search', `Global search: "${query}"`);
  try {
    const db = getDB();
    const q = query.toLowerCase();
    const [notes, tasks, cards, events] = await Promise.all([
      db.notes.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)).toArray(),
      db.tasks.filter(item => (item.title || '').toLowerCase().includes(q)).toArray(),
      db.flashcards.filter(c => (c.front || '').toLowerCase().includes(q) || (c.back || '').toLowerCase().includes(q)).toArray(),
      db.events.filter(e => (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)).toArray(),
    ]);
    const results = [
      ...notes.map(n => ({ type: 'note', id: n.id, title: n.title, preview: (n.content || '').slice(0, 80) })),
      ...tasks.map(item => ({ type: 'task', id: item.id, title: item.title, preview: item.status })),
      ...cards.map(c => ({ type: 'flashcard', id: c.id, title: c.front, preview: (c.back || '').slice(0, 80) })),
      ...events.map(e => ({ type: 'event', id: e.id, title: e.title, preview: `${e.date} ${e.startTime}-${e.endTime}` })),
    ];
    
    // Add courses to search
    if (db.courses) {
      const courses = await db.courses.filter(c => (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q) || (c.lecturer || '').toLowerCase().includes(q)).toArray();
      results.push(...courses.map(c => ({ type: 'course', id: c.id, title: c.name, preview: `${c.code || ''} - ${c.credits} TC - ${c.status}` })));
    }

    logger.success('Search', `Found ${results.length} results`);
    return results;
  } catch (error) {
    logger.error('Search', `Global search failed for: "${query}"`, error);
    throw error;
  }
}

/* ── Export/Import ── */

export async function exportAll() {
  logger.info('Export', 'Exporting all data');
  try {
    const db = getDB();
    const safeArray = (table) => (table ? table.toArray() : Promise.resolve([]));
    
    const [
      notes, tasks, flashcards, decks, journal, projects, events, courses, expenses, health,
      pomodoroLogs, skills, portfolios, certificates, networking, sideProjects, books,
      languageGoals, languageLogs, researchPapers, researchIdeas, brandingPosts, mentorLogs,
      powerDevices, electricityBills,
      chillAnimations, chillSounds, chillPresets, chillClassSchedules, chillDailySchedules,
      chillWorkoutPrograms, chillWorkoutSessions, chillExercises, chillPlannerTasks, chillStudyGoals
    ] = await Promise.all([
      db.notes.toArray(), db.tasks.toArray(), db.flashcards.toArray(),
      db.decks.toArray(), db.journal.toArray(), db.projects.toArray(), db.events.toArray(),
      safeArray(db.courses), safeArray(db.expenses), safeArray(db.health), safeArray(db.pomodoro_logs),
      safeArray(db.skills), safeArray(db.portfolios), safeArray(db.certificates), safeArray(db.networking),
      safeArray(db.side_projects), safeArray(db.books), safeArray(db.language_goals), safeArray(db.language_logs),
      safeArray(db.research_papers), safeArray(db.research_ideas), safeArray(db.branding_posts),
      safeArray(db.mentor_logs), safeArray(db.power_devices), safeArray(db.electricity_bills),
      safeArray(db.chill_animations), safeArray(db.chill_sounds), safeArray(db.chill_presets),
      safeArray(db.chill_class_schedules), safeArray(db.chill_daily_schedules),
      safeArray(db.chill_workout_programs), safeArray(db.chill_workout_sessions),
      safeArray(db.chill_exercises), safeArray(db.chill_planner_tasks), safeArray(db.chill_study_goals)
    ]);

    const data = { 
      version: 8, 
      exportedAt: new Date().toISOString(), 
      notes, tasks, flashcards, decks, journal, projects, events, courses, expenses, health, 
      pomodoro_logs: pomodoroLogs,
      skills, portfolios, certificates, networking, side_projects: sideProjects,
      books, language_goals: languageGoals, language_logs: languageLogs,
      research_papers: researchPapers, research_ideas: researchIdeas,
      branding_posts: brandingPosts, mentor_logs: mentorLogs,
      power_devices: powerDevices,
      electricity_bills: electricityBills,
      chill_animations: chillAnimations,
      chill_sounds: chillSounds,
      chill_presets: chillPresets,
      chill_class_schedules: chillClassSchedules,
      chill_daily_schedules: chillDailySchedules,
      chill_workout_programs: chillWorkoutPrograms,
      chill_workout_sessions: chillWorkoutSessions,
      chill_exercises: chillExercises,
      chill_planner_tasks: chillPlannerTasks,
      chill_study_goals: chillStudyGoals
    };
    logger.success('Export', `Exported all data for version 8`);
    return data;
  } catch (error) {
    logger.error('Export', 'Failed to export data', error);
    throw error;
  }
}

export async function importAll(data) {
  logger.info('Import', 'Importing data', { version: data.version, exportedAt: data.exportedAt });
  if (data.version && data.version < 4) {
    logger.warn('Import', `Data version ${data.version} is older than current DB version. Some tables may be empty after import.`);
  }
  try {
    const db = getDB();
    const tables = [
      { t: db.notes, data: data.notes },
      { t: db.tasks, data: data.tasks },
      { t: db.flashcards, data: data.flashcards },
      { t: db.decks, data: data.decks },
      { t: db.journal, data: data.journal },
      { t: db.projects, data: data.projects },
      { t: db.events, data: data.events },
      { t: db.courses, data: data.courses },
      { t: db.expenses, data: data.expenses },
      { t: db.health, data: data.health },
      { t: db.pomodoro_logs, data: data.pomodoro_logs },
      { t: db.skills, data: data.skills },
      { t: db.portfolios, data: data.portfolios },
      { t: db.certificates, data: data.certificates },
      { t: db.networking, data: data.networking },
      { t: db.side_projects, data: data.side_projects },
      { t: db.books, data: data.books },
      { t: db.language_goals, data: data.language_goals },
      { t: db.language_logs, data: data.language_logs },
      { t: db.research_papers, data: data.research_papers },
      { t: db.research_ideas, data: data.research_ideas },
      { t: db.branding_posts, data: data.branding_posts },
      { t: db.mentor_logs, data: data.mentor_logs },
      { t: db.power_devices, data: data.power_devices },
      { t: db.electricity_bills, data: data.electricity_bills },
      { t: db.chill_animations, data: data.chill_animations },
      { t: db.chill_sounds, data: data.chill_sounds },
      { t: db.chill_presets, data: data.chill_presets },
      { t: db.chill_class_schedules, data: data.chill_class_schedules },
      { t: db.chill_daily_schedules, data: data.chill_daily_schedules },
      { t: db.chill_workout_programs, data: data.chill_workout_programs },
      { t: db.chill_workout_sessions, data: data.chill_workout_sessions },
      { t: db.chill_exercises, data: data.chill_exercises },
      { t: db.chill_planner_tasks, data: data.chill_planner_tasks },
      { t: db.chill_study_goals, data: data.chill_study_goals },
    ];

    for (const item of tables) {
      if (item.t && Array.isArray(item.data)) {
        await item.t.clear();
        if (item.data.length > 0) {
          await item.t.bulkAdd(item.data);
        }
      }
    }
    logger.success('Import', 'All data imported successfully');
  } catch (error) {
    logger.error('Import', 'Failed to import data', error);
    throw error;
  }
}

/* ── Courses (Academic) ── */

export async function createCourse(data) {
  logger.info('Courses', 'Creating course', { name: data.name });
  try {
    const db = getDB();
    const now = new Date().toISOString();
    const id = await db.courses.add({ ...data, createdAt: now, updatedAt: now });
    logger.success('Courses', `Course created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Courses', 'Failed to create course', error);
    throw error;
  }
}

export async function getCourse(id) {
  try {
    return await getDB().courses.get(id);
  } catch (error) {
    logger.error('Courses', `Failed to read course id: ${id}`, error);
    throw error;
  }
}

export async function updateCourse(id, changes) {
  logger.info('Courses', `Updating course id: ${id}`, changes);
  try {
    const result = await getDB().courses.update(id, { ...changes, updatedAt: new Date().toISOString() });
    logger.success('Courses', `Course updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Courses', `Failed to update course id: ${id}`, error);
    throw error;
  }
}

export async function deleteCourse(id) {
  logger.info('Courses', `Deleting course id: ${id}`);
  try {
    await getDB().courses.delete(id);
    logger.success('Courses', `Course deleted: ${id}`);
  } catch (error) {
    logger.error('Courses', `Failed to delete course id: ${id}`, error);
    throw error;
  }
}

export async function getCourses(filter = {}) {
  logger.info('Courses', 'Fetching courses', filter);
  try {
    const db = getDB();
    let items = await db.courses.toArray();
    if (filter.semester) items = items.filter(c => c.semester === Number(filter.semester));
    if (filter.status) items = items.filter(c => c.status === filter.status);
    if (filter.type) items = items.filter(c => c.type === filter.type);
    logger.success('Courses', `Fetched ${items.length} courses`);
    return items;
  } catch (error) {
    logger.error('Courses', 'Failed to fetch courses', error);
    throw error;
  }
}

export async function importDUTProgram() {
  logger.info('Courses', 'Importing default DUT IT program framework');
  try {
    const db = getDB();
    const count = await db.courses.count();
    if (count > 0) {
      logger.info('Courses', 'Program already has courses, skipping default import');
      return 0;
    }
    
    // Default DUT IT program courses (~150 credits total)
    const defaultCourses = [
      // Semester 1
      { name: 'Triết học Mác - Lênin', code: '1022413', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Giải tích', code: '1020013', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Đại số tuyến tính', code: '1020023', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Vật lý đại cương', code: '1020033', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Tin học đại cương', code: '1020103', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Tiếng Anh cơ sở 1', code: '1020213', credits: 3, type: 'general', semester: 1, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 2
      { name: 'Kinh tế chính trị Mác - Lênin', code: '1022422', credits: 2, type: 'general', semester: 2, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Kỹ thuật lập trình', code: '1022013', credits: 3, type: 'foundation', semester: 2, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Kiến trúc máy tính', code: '1022023', credits: 3, type: 'foundation', semester: 2, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Toán rời rạc', code: '1022033', credits: 3, type: 'foundation', semester: 2, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Tiếng Anh cơ sở 2', code: '1020223', credits: 3, type: 'general', semester: 2, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 3
      { name: 'Chủ nghĩa xã hội khoa học', code: '1022432', credits: 2, type: 'general', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Cấu trúc dữ liệu và giải thuật', code: '1022043', credits: 3, type: 'foundation', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Cơ sở dữ liệu', code: '1022053', credits: 3, type: 'foundation', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Lập trình hướng đối tượng', code: '1022063', credits: 3, type: 'foundation', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Mạng máy tính', code: '1022073', credits: 3, type: 'foundation', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'PBL 1: Dự án Lập trình', code: '1022082', credits: 2, type: 'pbl', semester: 3, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 4
      { name: 'Lịch sử Đảng Cộng sản Việt Nam', code: '1022442', credits: 2, type: 'general', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Hệ điều hành', code: '1022093', credits: 3, type: 'foundation', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Phân tích và thiết kế hệ thống', code: '1022103', credits: 3, type: 'foundation', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Lập trình Web', code: '1022113', credits: 3, type: 'specialty', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Công nghệ phần mềm', code: '1022123', credits: 3, type: 'specialty', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'PBL 2: Dự án Cơ sở dữ liệu', code: '1022132', credits: 2, type: 'pbl', semester: 4, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 5
      { name: 'Tư tưởng Hồ Chí Minh', code: '1022452', credits: 2, type: 'general', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Trí tuệ nhân tạo', code: '1022143', credits: 3, type: 'specialty', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'An toàn và bảo mật hệ thống', code: '1022153', credits: 3, type: 'specialty', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Kiểm thử phần mềm', code: '1022163', credits: 3, type: 'specialty', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Lập trình di động (Tự chọn)', code: '1022173', credits: 3, type: 'elective', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'PBL 3: Dự án Công nghệ phần mềm', code: '1022182', credits: 2, type: 'pbl', semester: 5, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 6
      { name: 'Quản trị dự án phần mềm', code: '1022193', credits: 3, type: 'specialty', semester: 6, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Xử lý dữ liệu lớn (Tự chọn)', code: '1022203', credits: 3, type: 'elective', semester: 6, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Điện toán đám mây (Tự chọn)', code: '1022213', credits: 3, type: 'elective', semester: 6, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'PBL 4: Dự án Hệ thống thông tin', code: '1022222', credits: 2, type: 'pbl', semester: 6, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Tiếng Anh chuyên ngành CNTT', code: '1022232', credits: 2, type: 'specialty', semester: 6, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 7
      { name: 'Thiết kế UI/UX (Tự chọn)', code: '1022243', credits: 3, type: 'elective', semester: 7, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'DevOps và CI/CD (Tự chọn)', code: '1022253', credits: 3, type: 'elective', semester: 7, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'Thực tập tốt nghiệp', code: '1022263', credits: 3, type: 'internship', semester: 7, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      { name: 'PBL 5: Dự án chuyên ngành', code: '1022273', credits: 3, type: 'pbl', semester: 7, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' },
      
      // Semester 8
      { name: 'Khóa luận tốt nghiệp', code: '1022281', credits: 10, type: 'thesis', semester: 8, status: 'not_started', score10: null, score4: null, gradeLetter: '', lecturer: '', room: '', schedule: '', notes: '' }
    ];

    const now = new Date().toISOString();
    const coursesToInsert = defaultCourses.map(c => ({
      ...c,
      createdAt: now,
      updatedAt: now
    }));

    await db.courses.bulkAdd(coursesToInsert);
    logger.success('Courses', `Successfully imported ${defaultCourses.length} default DUT courses`);
    return defaultCourses.length;
  } catch (error) {
    logger.error('Courses', 'Failed to import default DUT courses', error);
    throw error;
  }
}

/* ── Expenses (Financials) ── */

export async function createExpense(data) {
  logger.info('Expenses', 'Creating expense', { amount: data.amount, category: data.category });
  try {
    const db = getDB();
    const id = await db.expenses.add({
      ...data,
      createdAt: new Date().toISOString()
    });
    logger.success('Expenses', `Expense created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Expenses', 'Failed to create expense', error);
    throw error;
  }
}

export async function getExpense(id) {
  try {
    return await getDB().expenses.get(id);
  } catch (error) {
    logger.error('Expenses', `Failed to read expense id: ${id}`, error);
    throw error;
  }
}

export async function updateExpense(id, changes) {
  logger.info('Expenses', `Updating expense id: ${id}`);
  try {
    const result = await getDB().expenses.update(id, changes);
    logger.success('Expenses', `Expense updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Expenses', `Failed to update expense id: ${id}`, error);
    throw error;
  }
}

export async function deleteExpense(id) {
  logger.info('Expenses', `Deleting expense id: ${id}`);
  try {
    await getDB().expenses.delete(id);
    logger.success('Expenses', `Expense deleted: ${id}`);
  } catch (error) {
    logger.error('Expenses', `Failed to delete expense id: ${id}`, error);
    throw error;
  }
}

export async function getExpenses(filter = {}) {
  logger.info('Expenses', 'Fetching expenses', filter);
  try {
    const db = getDB();
    let items = await db.expenses.toArray();
    
    // Sort by date desc (guard against null/undefined date)
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    if (filter.type) {
      items = items.filter(e => e.type === filter.type);
    }
    if (filter.category) {
      items = items.filter(e => e.category === filter.category);
    }
    if (filter.month) {
      items = items.filter(e => e.date.startsWith(filter.month));
    }
    
    logger.success('Expenses', `Fetched ${items.length} expenses`);
    return items;
  } catch (error) {
    logger.error('Expenses', 'Failed to fetch expenses', error);
    throw error;
  }
}

/* ── Health & Sleep ── */

export async function saveHealth(data) {
  logger.info('Health', `Saving health record for date: ${data.date}`);
  try {
    const db = getDB();
    const existing = await db.health.where('date').equals(data.date).first();
    const now = new Date().toISOString();
    if (existing) {
      logger.info('Health', `Updating existing health record: ${existing.id}`);
      await db.health.update(existing.id, {
        ...data,
        updatedAt: now
      });
      return existing.id;
    } else {
      const id = await db.health.add({
        ...data,
        createdAt: now,
        updatedAt: now
      });
      logger.success('Health', `Health record created with id: ${id}`);
      return id;
    }
  } catch (error) {
    logger.error('Health', `Failed to save health record for date: ${data.date}`, error);
    throw error;
  }
}

export async function getHealth(date) {
  logger.info('Health', `Reading health record for date: ${date}`);
  try {
    const entry = await getDB().health.where('date').equals(date).first();
    return entry || null;
  } catch (error) {
    logger.error('Health', `Failed to read health record for date: ${date}`, error);
    throw error;
  }
}

export async function getHealthRange(from, to) {
  logger.info('Health', `Fetching health records from ${from} to ${to}`);
  try {
    const entries = await getDB().health.where('date').between(from, to, true, true).toArray();
    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  } catch (error) {
    logger.error('Health', 'Failed to fetch health records in range', error);
    throw error;
  }
}

/* ── Pomodoro Focus Logs ── */

export async function createPomodoroLog(data) {
  logger.info('Pomodoro', 'Creating Pomodoro session log');
  try {
    const db = getDB();
    const id = await db.pomodoro_logs.add({
      ...data,
      timestamp: new Date().toISOString()
    });
    logger.success('Pomodoro', `Pomodoro session logged with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Pomodoro', 'Failed to log Pomodoro session', error);
    throw error;
  }
}

export async function getPomodoroLogs(filter = {}) {
  logger.info('Pomodoro', 'Fetching Pomodoro logs', filter);
  try {
    const db = getDB();
    let items = await db.pomodoro_logs.toArray();
    // Sort by timestamp desc
    items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    
    if (filter.courseId) {
      items = items.filter(l => l.courseId === Number(filter.courseId));
    }
    if (filter.taskId) {
      items = items.filter(l => l.taskId === Number(filter.taskId));
    }
    return items;
  } catch (error) {
    logger.error('Pomodoro', 'Failed to fetch Pomodoro logs', error);
    throw error;
  }
}

/* ── Skills & Career Path ── */

export async function saveSkillRating(data) {
  logger.info('Skills', 'Saving skill rating', data);
  try {
    const db = getDB();
    const existing = await db.skills.where('careerPath').equals(data.careerPath).filter(s => s.skillName === data.skillName).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.skills.update(existing.id, { rating: Number(data.rating), updatedAt: now });
      return existing.id;
    } else {
      return await db.skills.add({ ...data, rating: Number(data.rating), updatedAt: now });
    }
  } catch (error) {
    logger.error('Skills', 'Failed to save skill rating', error);
    throw error;
  }
}

export async function getSkillRatings(careerPath) {
  logger.info('Skills', `Fetching skill ratings for: ${careerPath}`);
  try {
    const db = getDB();
    return await db.skills.where('careerPath').equals(careerPath).toArray();
  } catch (error) {
    logger.error('Skills', 'Failed to fetch skill ratings', error);
    throw error;
  }
}

/* ── Portfolios (Projects) ── */

export async function createPortfolio(data) {
  logger.info('Portfolio', 'Creating project record');
  try {
    const db = getDB();
    return await db.portfolios.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Portfolio', 'Failed to create portfolio project', error);
    throw error;
  }
}

export async function updatePortfolio(id, changes) {
  logger.info('Portfolio', `Updating project record: ${id}`);
  try {
    return await getDB().portfolios.update(Number(id), changes);
  } catch (error) {
    logger.error('Portfolio', 'Failed to update portfolio project', error);
    throw error;
  }
}

export async function deletePortfolio(id) {
  logger.info('Portfolio', `Deleting project record: ${id}`);
  try {
    await getDB().portfolios.delete(Number(id));
  } catch (error) {
    logger.error('Portfolio', 'Failed to delete portfolio project', error);
    throw error;
  }
}

export async function getPortfolios() {
  try {
    const items = await getDB().portfolios.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Portfolio', 'Failed to fetch portfolio projects', error);
    throw error;
  }
}

/* ── Certificates ── */

export async function createCertificate(data) {
  logger.info('Certificates', 'Creating certificate record');
  try {
    const db = getDB();
    return await db.certificates.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Certificates', 'Failed to create certificate', error);
    throw error;
  }
}

export async function updateCertificate(id, changes) {
  logger.info('Certificates', `Updating certificate record: ${id}`);
  try {
    return await getDB().certificates.update(Number(id), changes);
  } catch (error) {
    logger.error('Certificates', 'Failed to update certificate', error);
    throw error;
  }
}

export async function deleteCertificate(id) {
  logger.info('Certificates', `Deleting certificate record: ${id}`);
  try {
    await getDB().certificates.delete(Number(id));
  } catch (error) {
    logger.error('Certificates', 'Failed to delete certificate', error);
    throw error;
  }
}

export async function getCertificates() {
  try {
    const items = await getDB().certificates.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Certificates', 'Failed to fetch certificates', error);
    throw error;
  }
}

/* ── Networking ── */

export async function createNetworkContact(data) {
  logger.info('Networking', 'Creating networking record');
  try {
    const db = getDB();
    return await db.networking.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Networking', 'Failed to create contact', error);
    throw error;
  }
}

export async function updateNetworkContact(id, changes) {
  logger.info('Networking', `Updating networking record: ${id}`);
  try {
    return await getDB().networking.update(Number(id), changes);
  } catch (error) {
    logger.error('Networking', 'Failed to update contact', error);
    throw error;
  }
}

export async function deleteNetworkContact(id) {
  logger.info('Networking', `Deleting networking record: ${id}`);
  try {
    await getDB().networking.delete(Number(id));
  } catch (error) {
    logger.error('Networking', 'Failed to delete contact', error);
    throw error;
  }
}

export async function getNetworkContacts(type = null) {
  try {
    let items = await getDB().networking.toArray();
    if (type) items = items.filter(i => i.type === type);
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Networking', 'Failed to fetch contacts', error);
    throw error;
  }
}

/* ── Side Projects ── */

export async function createSideProject(data) {
  logger.info('SideProjects', 'Creating side project record');
  try {
    const db = getDB();
    return await db.side_projects.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('SideProjects', 'Failed to create side project', error);
    throw error;
  }
}

export async function updateSideProject(id, changes) {
  logger.info('SideProjects', `Updating side project record: ${id}`);
  try {
    return await getDB().side_projects.update(Number(id), changes);
  } catch (error) {
    logger.error('SideProjects', 'Failed to update side project', error);
    throw error;
  }
}

export async function deleteSideProject(id) {
  logger.info('SideProjects', `Deleting side project record: ${id}`);
  try {
    await getDB().side_projects.delete(Number(id));
  } catch (error) {
    logger.error('SideProjects', 'Failed to delete side project', error);
    throw error;
  }
}

export async function getSideProjects() {
  try {
    const items = await getDB().side_projects.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('SideProjects', 'Failed to fetch side projects', error);
    throw error;
  }
}

/* ── Books (Reading List & Book Tracker) ── */

export async function createBook(data) {
  logger.info('Books', 'Creating book entry');
  try {
    const db = getDB();
    return await db.books.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Books', 'Failed to create book', error);
    throw error;
  }
}

export async function updateBook(id, changes) {
  logger.info('Books', `Updating book: ${id}`);
  try {
    return await getDB().books.update(Number(id), changes);
  } catch (error) {
    logger.error('Books', 'Failed to update book', error);
    throw error;
  }
}

export async function deleteBook(id) {
  logger.info('Books', `Deleting book: ${id}`);
  try {
    await getDB().books.delete(Number(id));
  } catch (error) {
    logger.error('Books', 'Failed to delete book', error);
    throw error;
  }
}

export async function getBooks() {
  try {
    const items = await getDB().books.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Books', 'Failed to fetch books', error);
    throw error;
  }
}

/* ── Language Goals ── */

export async function saveLanguageGoal(data) {
  logger.info('Language', 'Saving language goal', data);
  try {
    const db = getDB();
    const existing = await db.language_goals.where('language').equals(data.language).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.language_goals.update(existing.id, { ...data, updatedAt: now });
      return existing.id;
    } else {
      return await db.language_goals.add({ ...data, updatedAt: now });
    }
  } catch (error) {
    logger.error('Language', 'Failed to save language goal', error);
    throw error;
  }
}

export async function getLanguageGoals() {
  try {
    return await getDB().language_goals.toArray();
  } catch (error) {
    logger.error('Language', 'Failed to fetch language goals', error);
    throw error;
  }
}

/* ── Language Logs ── */

export async function createLanguageLog(data) {
  logger.info('Language', 'Creating language practice log');
  try {
    const db = getDB();
    return await db.language_logs.add({ ...data });
  } catch (error) {
    logger.error('Language', 'Failed to create language log', error);
    throw error;
  }
}

export async function deleteLanguageLog(id) {
  logger.info('Language', `Deleting language log: ${id}`);
  try {
    await getDB().language_logs.delete(Number(id));
  } catch (error) {
    logger.error('Language', 'Failed to delete language log', error);
    throw error;
  }
}

export async function getLanguageLogs() {
  try {
    const items = await getDB().language_logs.toArray();
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return items;
  } catch (error) {
    logger.error('Language', 'Failed to fetch language logs', error);
    throw error;
  }
}

/* ── Research Papers ── */

export async function createResearchPaper(data) {
  logger.info('Research', 'Creating research paper record');
  try {
    const db = getDB();
    return await db.research_papers.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Research', 'Failed to create research paper', error);
    throw error;
  }
}

export async function updateResearchPaper(id, changes) {
  logger.info('Research', `Updating research paper: ${id}`);
  try {
    return await getDB().research_papers.update(Number(id), changes);
  } catch (error) {
    logger.error('Research', 'Failed to update research paper', error);
    throw error;
  }
}

export async function deleteResearchPaper(id) {
  logger.info('Research', `Deleting research paper: ${id}`);
  try {
    await getDB().research_papers.delete(Number(id));
  } catch (error) {
    logger.error('Research', 'Failed to delete research paper', error);
    throw error;
  }
}

export async function getResearchPapers() {
  try {
    const items = await getDB().research_papers.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Research', 'Failed to fetch research papers', error);
    throw error;
  }
}

/* ── Research Ideas ── */

export async function createResearchIdea(data) {
  logger.info('Research', 'Creating research idea');
  try {
    const db = getDB();
    return await db.research_ideas.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Research', 'Failed to create research idea', error);
    throw error;
  }
}

export async function updateResearchIdea(id, changes) {
  logger.info('Research', `Updating research idea: ${id}`);
  try {
    return await getDB().research_ideas.update(Number(id), changes);
  } catch (error) {
    logger.error('Research', 'Failed to update research idea', error);
    throw error;
  }
}

export async function deleteResearchIdea(id) {
  logger.info('Research', `Deleting research idea: ${id}`);
  try {
    await getDB().research_ideas.delete(Number(id));
  } catch (error) {
    logger.error('Research', 'Failed to delete research idea', error);
    throw error;
  }
}

export async function getResearchIdeas() {
  try {
    const items = await getDB().research_ideas.toArray();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch (error) {
    logger.error('Research', 'Failed to fetch research ideas', error);
    throw error;
  }
}

/* ── Branding Posts ── */

export async function createBrandingPost(data) {
  logger.info('Branding', 'Creating branding post record');
  try {
    const db = getDB();
    return await db.branding_posts.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Branding', 'Failed to create branding post', error);
    throw error;
  }
}

export async function updateBrandingPost(id, changes) {
  logger.info('Branding', `Updating branding post: ${id}`);
  try {
    return await getDB().branding_posts.update(Number(id), changes);
  } catch (error) {
    logger.error('Branding', 'Failed to update branding post', error);
    throw error;
  }
}

export async function deleteBrandingPost(id) {
  logger.info('Branding', `Deleting branding post: ${id}`);
  try {
    await getDB().branding_posts.delete(Number(id));
  } catch (error) {
    logger.error('Branding', 'Failed to delete branding post', error);
    throw error;
  }
}

export async function getBrandingPosts() {
  try {
    const items = await getDB().branding_posts.toArray();
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return items;
  } catch (error) {
    logger.error('Branding', 'Failed to fetch branding posts', error);
    throw error;
  }
}

/* ── Mentor Logs ── */

export async function createMentorLog(data) {
  logger.info('Mentoring', 'Creating mentor log record');
  try {
    const db = getDB();
    return await db.mentor_logs.add({ ...data, createdAt: new Date().toISOString() });
  } catch (error) {
    logger.error('Mentoring', 'Failed to create mentor log', error);
    throw error;
  }
}

export async function updateMentorLog(id, changes) {
  logger.info('Mentoring', `Updating mentor log: ${id}`);
  try {
    return await getDB().mentor_logs.update(Number(id), changes);
  } catch (error) {
    logger.error('Mentoring', 'Failed to update mentor log', error);
    throw error;
  }
}

export async function deleteMentorLog(id) {
  logger.info('Mentoring', `Deleting mentor log: ${id}`);
  try {
    await getDB().mentor_logs.delete(Number(id));
  } catch (error) {
    logger.error('Mentoring', 'Failed to delete mentor log', error);
    throw error;
  }
}

export async function getMentorLogs() {
  try {
    const items = await getDB().mentor_logs.toArray();
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return items;
  } catch (error) {
    logger.error('Mentoring', 'Failed to fetch mentor logs', error);
    throw error;
  }
}

/* ── Power Hub (Electricity Management) ── */

export async function createPowerDevice(data) {
  logger.info('Power', 'Creating power device', { name: data.name });
  try {
    const db = getDB();
    const now = new Date().toISOString();
    const id = await db.power_devices.add({ ...data, createdAt: now, updatedAt: now });
    logger.success('Power', `Power device created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Power', 'Failed to create power device', error);
    throw error;
  }
}

export async function getPowerDevices() {
  logger.info('Power', 'Fetching power devices');
  try {
    const db = getDB();
    const devices = await db.power_devices.toArray();
    logger.success('Power', `Fetched ${devices.length} power devices`);
    return devices;
  } catch (error) {
    logger.error('Power', 'Failed to fetch power devices', error);
    throw error;
  }
}

export async function updatePowerDevice(id, changes) {
  logger.info('Power', `Updating power device id: ${id}`, changes);
  try {
    const result = await getDB().power_devices.update(Number(id), { ...changes, updatedAt: new Date().toISOString() });
    logger.success('Power', `Power device updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Power', `Failed to update power device id: ${id}`, error);
    throw error;
  }
}

export async function deletePowerDevice(id) {
  logger.info('Power', `Deleting power device id: ${id}`);
  try {
    await getDB().power_devices.delete(Number(id));
    logger.success('Power', `Power device deleted: ${id}`);
  } catch (error) {
    logger.error('Power', `Failed to delete power device id: ${id}`, error);
    throw error;
  }
}

export async function createElectricityBill(data) {
  logger.info('Power', 'Creating electricity bill', { month: data.month });
  try {
    const db = getDB();
    const now = new Date().toISOString();
    const id = await db.electricity_bills.add({ ...data, createdAt: now });
    logger.success('Power', `Electricity bill created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('Power', 'Failed to create electricity bill', error);
    throw error;
  }
}

export async function getElectricityBills() {
  logger.info('Power', 'Fetching electricity bills');
  try {
    const db = getDB();
    const bills = await db.electricity_bills.toArray();
    bills.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
    logger.success('Power', `Fetched ${bills.length} electricity bills`);
    return bills;
  } catch (error) {
    logger.error('Power', 'Failed to fetch electricity bills', error);
    throw error;
  }
}

export async function updateElectricityBill(id, changes) {
  logger.info('Power', `Updating electricity bill id: ${id}`, changes);
  try {
    const result = await getDB().electricity_bills.update(Number(id), changes);
    logger.success('Power', `Electricity bill updated: ${id}`);
    return result;
  } catch (error) {
    logger.error('Power', `Failed to update electricity bill id: ${id}`, error);
    throw error;
  }
}

export async function deleteElectricityBill(id) {
  logger.info('Power', `Deleting electricity bill id: ${id}`);
  try {
    await getDB().electricity_bills.delete(Number(id));
    logger.success('Power', `Electricity bill deleted: ${id}`);
  } catch (error) {
    logger.error('Power', `Failed to delete electricity bill id: ${id}`, error);
    throw error;
  }
}

/* ────────────────────────── ChillPomodoro Storage Functions ────────────────────────── */

/* Animations */
export async function createChillAnimation(data) {
  const db = getDB();
  return await db.chill_animations.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillAnimations() {
  const db = getDB();
  return await db.chill_animations.toArray();
}
export async function deleteChillAnimation(id) {
  const db = getDB();
  return await db.chill_animations.delete(Number(id));
}

/* Sounds */
export async function createChillSound(data) {
  const db = getDB();
  return await db.chill_sounds.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillSounds() {
  const db = getDB();
  return await db.chill_sounds.toArray();
}
export async function deleteChillSound(id) {
  const db = getDB();
  return await db.chill_sounds.delete(Number(id));
}

/* Presets */
export async function createChillPreset(data) {
  const db = getDB();
  return await db.chill_presets.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillPresets() {
  const db = getDB();
  return await db.chill_presets.toArray();
}
export async function deleteChillPreset(id) {
  const db = getDB();
  return await db.chill_presets.delete(Number(id));
}

/* Class Schedules (Excel) */
export async function createChillClassSchedule(data) {
  const db = getDB();
  return await db.chill_class_schedules.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillClassSchedules() {
  const db = getDB();
  return await db.chill_class_schedules.toArray();
}
export async function deleteChillClassSchedule(id) {
  const db = getDB();
  return await db.chill_class_schedules.delete(Number(id));
}

/* Daily Schedules */
export async function createChillDailySchedule(data) {
  const db = getDB();
  return await db.chill_daily_schedules.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillDailySchedules() {
  const db = getDB();
  return await db.chill_daily_schedules.toArray();
}
export async function updateChillDailySchedule(id, changes) {
  const db = getDB();
  return await db.chill_daily_schedules.update(Number(id), changes);
}
export async function deleteChillDailySchedule(id) {
  const db = getDB();
  return await db.chill_daily_schedules.delete(Number(id));
}

/* Workout Programs & Sessions */
export async function createChillWorkoutProgram(data) {
  const db = getDB();
  return await db.chill_workout_programs.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillWorkoutPrograms() {
  const db = getDB();
  return await db.chill_workout_programs.toArray();
}
export async function createChillWorkoutSession(data) {
  const db = getDB();
  return await db.chill_workout_sessions.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getChillWorkoutSessions() {
  const db = getDB();
  return await db.chill_workout_sessions.toArray();
}
export async function updateChillWorkoutSession(id, changes) {
  const db = getDB();
  return await db.chill_workout_sessions.update(Number(id), changes);
}

/* Exercises */
export async function seedChillExercises(exercises) {
  const db = getDB();
  const existing = await db.chill_exercises.count();
  if (existing === 0 && Array.isArray(exercises)) {
    await db.chill_exercises.bulkAdd(exercises);
  }
}
export async function getChillExercises() {
  const db = getDB();
  return await db.chill_exercises.toArray();
}

/* Planner Tasks */
export async function createChillPlannerTask(data) {
  const db = getDB();
  return await db.chill_planner_tasks.add({ ...data, status: 'pending', completedPomodoros: 0, createdAt: new Date().toISOString() });
}
export async function getChillPlannerTasks() {
  const db = getDB();
  return await db.chill_planner_tasks.toArray();
}
export async function updateChillPlannerTask(id, changes) {
  const db = getDB();
  return await db.chill_planner_tasks.update(Number(id), changes);
}
export async function deleteChillPlannerTask(id) {
  const db = getDB();
  return await db.chill_planner_tasks.delete(Number(id));
}

/* Study Goals */
export async function saveChillStudyGoal(data) {
  const db = getDB();
  const existing = await db.chill_study_goals.toCollection().first();
  const now = new Date().toISOString();
  if (existing) {
    await db.chill_study_goals.update(existing.id, { ...data, updatedAt: now });
    return existing.id;
  } else {
    return await db.chill_study_goals.add({ ...data, updatedAt: now });
  }
}
export async function getChillStudyGoals() {
  const db = getDB();
  return await db.chill_study_goals.toCollection().first();
}
