import Dexie from 'dexie';

export const masterDb = new Dexie('SecondBrainMaster');

masterDb.version(1).stores({
  profiles: '++id, name, avatar, theme, language, timezone, createdAt, lastActiveAt'
});

export async function createProfile({ name, avatar, language = 'vi', timezone = Intl.DateTimeFormat().resolvedOptions().timeZone }) {
  return masterDb.profiles.add({
    name,
    avatar,
    theme: 'dark',
    language,
    timezone,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  });
}

export async function getProfiles() {
  return masterDb.profiles.orderBy('lastActiveAt').reverse().toArray();
}

export async function updateProfile(id, changes) {
  return masterDb.profiles.update(id, { ...changes, lastActiveAt: new Date().toISOString() });
}

export async function deleteProfile(id) {
  // We should also delete the corresponding profile DB
  const dbName = `SecondBrainDB_${id}`;
  await Dexie.delete(dbName);
  return masterDb.profiles.delete(id);
}

export async function updateLastActive(id) {
  return masterDb.profiles.update(id, { lastActiveAt: new Date().toISOString() });
}
