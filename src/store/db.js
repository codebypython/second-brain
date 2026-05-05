import Dexie from 'dexie';

let currentDb = null;

export function initDB(profileId) {
  if (currentDb && currentDb.name === `SecondBrainDB_${profileId}`) {
    return currentDb;
  }
  
  if (currentDb) {
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

  currentDb = db;
  return db;
}

export function getDB() {
  if (!currentDb) throw new Error("DB not initialized. Please select a profile first.");
  return currentDb;
}

/* ── Wrappers for all CRUD operations ── */

export async function createNote(data) {
  const db = getDB();
  const now = new Date().toISOString();
  return db.notes.add({ ...data, pinned: 0, createdAt: now, updatedAt: now });
}
export async function getNote(id) { return getDB().notes.get(id); }
export async function updateNote(id, changes) {
  return getDB().notes.update(id, { ...changes, updatedAt: new Date().toISOString() });
}
export async function deleteNote(id) { return getDB().notes.delete(id); }
export async function getNotes(filter = {}) {
  const db = getDB();
  let col = db.notes.orderBy('updatedAt').reverse();
  if (filter.category) col = db.notes.where('category').equals(filter.category).reverse();
  return col.toArray();
}
export async function searchNotes(query) {
  const q = query.toLowerCase();
  return getDB().notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).toArray();
}

/* ── Tasks ── */
export async function createTask(data) {
  const db = getDB();
  return db.tasks.add({ ...data, status: 'todo', createdAt: new Date().toISOString(), completedAt: '' });
}
export async function getTask(id) { return getDB().tasks.get(id); }
export async function updateTask(id, changes) {
  const db = getDB();
  if (changes.status === 'done' && !changes.completedAt) changes.completedAt = new Date().toISOString();
  if (changes.status && changes.status !== 'done') changes.completedAt = '';
  return db.tasks.update(id, changes);
}
export async function deleteTask(id) { return getDB().tasks.delete(id); }
export async function getTasks(filter = {}) {
  let items = await getDB().tasks.toArray();
  if (filter.status) items = items.filter(t => t.status === filter.status);
  if (filter.project) items = items.filter(t => t.project === filter.project);
  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

/* ── Flashcards & Decks ── */
export async function createDeck(data) {
  return getDB().decks.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getDeck(id) { return getDB().decks.get(id); }
export async function updateDeck(id, changes) { return getDB().decks.update(id, changes); }
export async function getDecks() { return getDB().decks.toArray(); }
export async function deleteDeck(id) {
  const db = getDB();
  await db.flashcards.where('deckId').equals(id).delete();
  return db.decks.delete(id);
}

export async function createFlashcard(data) {
  return getDB().flashcards.add({ ...data, nextReview: new Date().toISOString(), interval: 0, ease: 2.5, repetitions: 0 });
}
export async function getFlashcard(id) { return getDB().flashcards.get(id); }
export async function updateFlashcard(id, changes) { return getDB().flashcards.update(id, changes); }
export async function deleteFlashcard(id) { return getDB().flashcards.delete(id); }
export async function getDueCards(deckId, todayStr) {
  // Use timezone-aware todayStr
  return getDB().flashcards.where('deckId').equals(deckId).filter(c => c.nextReview.slice(0, 10) <= todayStr).toArray();
}
export async function getAllCards(deckId) {
  return getDB().flashcards.where('deckId').equals(deckId).toArray();
}
export async function reviewCard(id, quality) {
  const db = getDB();
  const card = await db.flashcards.get(id);
  if (!card) return;
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
  return db.flashcards.update(id, { interval, ease, repetitions, nextReview });
}

/* ── Journal ── */
export async function createJournal(data) {
  const db = getDB();
  const existing = await db.journal.where('date').equals(data.date).first();
  if (existing) return db.journal.update(existing.id, { mood: data.mood, content: data.content });
  return db.journal.add({ ...data, createdAt: new Date().toISOString() });
}
export async function getJournal(date) { return getDB().journal.where('date').equals(date).first(); }
export async function getJournalById(id) { return getDB().journal.get(id); }
export async function deleteJournal(id) { return getDB().journal.delete(id); }
export async function getJournalRange(from, to) {
  return getDB().journal.where('date').between(from, to, true, true).toArray();
}

/* ── Projects ── */
export async function createProject(data) {
  return getDB().projects.add({ ...data, status: 'active', createdAt: new Date().toISOString() });
}
export async function getProject(id) { return getDB().projects.get(id); }
export async function updateProject(id, changes) { return getDB().projects.update(id, changes); }
export async function getProjects() { return getDB().projects.toArray(); }
export async function deleteProject(id) { return getDB().projects.delete(id); }

/* ── Calendar Events ── */
export async function createEvent(data) {
  return getDB().events.add({ ...data, completed: false, createdAt: new Date().toISOString() });
}
export async function getEvent(id) { return getDB().events.get(id); }
export async function updateEvent(id, changes) { return getDB().events.update(id, changes); }
export async function deleteEvent(id) { return getDB().events.delete(id); }
export async function getEventsByDate(date) {
  return getDB().events.where('date').equals(date).toArray();
}
export async function getEventsRange(from, to) {
  return getDB().events.where('date').between(from, to, true, true).toArray();
}
export async function toggleEventComplete(id) {
  const db = getDB();
  const event = await db.events.get(id);
  if (event) return db.events.update(id, { completed: !event.completed });
}

/* ── Dashboard Stats ── */
export async function getDashboardStats(todayStr) {
  const db = getDB();
  const [notes, tasks, cards, journals, projects, todayEvents] = await Promise.all([
    db.notes.count(),
    db.tasks.toArray(),
    db.flashcards.count(),
    db.journal.count(),
    db.projects.where('status').equals('active').count(),
    getEventsByDate(todayStr),
  ]);
  const dueCards = await db.flashcards.filter(c => c.nextReview.slice(0, 10) <= todayStr).count();
  const todoPending = tasks.filter(t => t.status !== 'done').length;
  const doneToday = tasks.filter(t => t.completedAt?.slice(0, 10) === todayStr).length;
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done').length;
  return { notes, totalTasks: tasks.length, todoPending, doneToday, overdue, cards, dueCards, journals, projects, todayEvents: todayEvents.length };
}

/* ── Global Search ── */
export async function globalSearch(query) {
  const db = getDB();
  const q = query.toLowerCase();
  const [notes, tasks, cards, events] = await Promise.all([
    db.notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).toArray(),
    db.tasks.filter(t => t.title.toLowerCase().includes(q)).toArray(),
    db.flashcards.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)).toArray(),
    db.events.filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)).toArray(),
  ]);
  return [
    ...notes.map(n => ({ type: 'note', id: n.id, title: n.title, preview: n.content.slice(0, 80) })),
    ...tasks.map(t => ({ type: 'task', id: t.id, title: t.title, preview: t.status })),
    ...cards.map(c => ({ type: 'flashcard', id: c.id, title: c.front, preview: c.back.slice(0, 80) })),
    ...events.map(e => ({ type: 'event', id: e.id, title: e.title, preview: `${e.date} ${e.startTime}-${e.endTime}` })),
  ];
}

/* ── Export/Import ── */
export async function exportAll() {
  const db = getDB();
  const [notes, tasks, flashcards, decks, journal, projects, events] = await Promise.all([
    db.notes.toArray(), db.tasks.toArray(), db.flashcards.toArray(),
    db.decks.toArray(), db.journal.toArray(), db.projects.toArray(), db.events.toArray(),
  ]);
  return { version: 2, exportedAt: new Date().toISOString(), notes, tasks, flashcards, decks, journal, projects, events };
}
export async function importAll(data) {
  const db = getDB();
  await db.transaction('rw', db.notes, db.tasks, db.flashcards, db.decks, db.journal, db.projects, db.events, async () => {
    if (data.notes) { await db.notes.clear(); await db.notes.bulkAdd(data.notes); }
    if (data.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(data.tasks); }
    if (data.flashcards) { await db.flashcards.clear(); await db.flashcards.bulkAdd(data.flashcards); }
    if (data.decks) { await db.decks.clear(); await db.decks.bulkAdd(data.decks); }
    if (data.journal) { await db.journal.clear(); await db.journal.bulkAdd(data.journal); }
    if (data.projects) { await db.projects.clear(); await db.projects.bulkAdd(data.projects); }
    if (data.events) { await db.events.clear(); await db.events.bulkAdd(data.events); }
  });
}
