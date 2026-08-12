import Dexie from 'dexie';
import logger from './logger';

export const masterDb = new Dexie('SecondBrainMaster');

masterDb.version(1).stores({
  profiles: '++id, name, avatar, theme, language, timezone, createdAt, lastActiveAt'
});

export async function createProfile({ name, avatar, language = 'vi', timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, universityName = 'Đại học Bách Khoa - Đại học Đà Nẵng', budgetLimit = 3000000 }) {
  logger.info('MasterDB', 'Creating profile', { name, language, timezone });
  try {
    if (!name || !name.trim()) {
      throw new Error('Profile name is required');
    }
    const id = await masterDb.profiles.add({
      name: name.trim(),
      avatar,
      theme: 'dark',
      language,
      timezone,
      universityName,
      budgetLimit,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    });
    logger.success('MasterDB', `Profile created with id: ${id}`);
    return id;
  } catch (error) {
    logger.error('MasterDB', 'Failed to create profile', error);
    throw error;
  }
}

export async function getProfiles() {
  logger.info('MasterDB', 'Fetching all profiles');
  try {
    const profiles = await masterDb.profiles.orderBy('lastActiveAt').reverse().toArray();
    logger.success('MasterDB', `Fetched ${profiles.length} profiles`);
    return profiles;
  } catch (error) {
    logger.error('MasterDB', 'Failed to fetch profiles', error);
    throw error;
  }
}

export async function updateProfile(id, changes) {
  logger.info('MasterDB', `Updating profile id: ${id}`, changes);
  try {
    const result = await masterDb.profiles.update(id, { ...changes, lastActiveAt: new Date().toISOString() });
    logger.success('MasterDB', `Profile updated: ${id}, rows affected: ${result}`);
    return result;
  } catch (error) {
    logger.error('MasterDB', `Failed to update profile id: ${id}`, error);
    throw error;
  }
}

export async function deleteProfile(id) {
  logger.info('MasterDB', `Deleting profile id: ${id}`);
  try {
    // We should also delete the corresponding profile DB
    const dbName = `SecondBrainDB_${id}`;
    logger.info('MasterDB', `Deleting profile database: ${dbName}`);
    await Dexie.delete(dbName);
    logger.success('MasterDB', `Profile database deleted: ${dbName}`);
    await masterDb.profiles.delete(id);
    logger.success('MasterDB', `Profile deleted: ${id}`);
  } catch (error) {
    logger.error('MasterDB', `Failed to delete profile id: ${id}`, error);
    throw error;
  }
}

export async function updateLastActive(id) {
  logger.info('MasterDB', `Updating last active for profile: ${id}`);
  try {
    const result = await masterDb.profiles.update(id, { lastActiveAt: new Date().toISOString() });
    logger.success('MasterDB', `Last active updated for profile: ${id}`);
    return result;
  } catch (error) {
    logger.error('MasterDB', `Failed to update last active for profile: ${id}`, error);
    throw error;
  }
}
