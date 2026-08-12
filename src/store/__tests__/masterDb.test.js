/**
 * Tests for masterDb.js — profile management
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { masterDb, createProfile, getProfiles, updateProfile, deleteProfile, updateLastActive } from '../masterDb';

beforeEach(async () => {
  await masterDb.profiles.clear();
});

afterEach(async () => {
  await masterDb.profiles.clear();
});

describe('MasterDB — Profile Management', () => {
  describe('createProfile', () => {
    it('creates a profile with required fields', async () => {
      const id = await createProfile({ name: 'Test User', avatar: '🧑‍💻' });
      expect(id).toBeGreaterThan(0);
      const profiles = await getProfiles();
      expect(profiles.length).toBe(1);
      expect(profiles[0].name).toBe('Test User');
      expect(profiles[0].avatar).toBe('🧑‍💻');
      expect(profiles[0].theme).toBe('dark');
      expect(profiles[0].language).toBe('vi');
      expect(profiles[0].createdAt).toBeTruthy();
      expect(profiles[0].lastActiveAt).toBeTruthy();
    });

    it('creates a profile with custom language and timezone', async () => {
      const id = await createProfile({ name: 'EN User', avatar: '👤', language: 'en', timezone: 'America/New_York' });
      const profiles = await getProfiles();
      expect(profiles[0].language).toBe('en');
      expect(profiles[0].timezone).toBe('America/New_York');
    });

    it('throws error for empty name', async () => {
      await expect(createProfile({ name: '', avatar: '👤' })).rejects.toThrow('Profile name is required');
    });

    it('throws error for whitespace-only name', async () => {
      await expect(createProfile({ name: '   ', avatar: '👤' })).rejects.toThrow('Profile name is required');
    });

    it('trims name whitespace', async () => {
      await createProfile({ name: '  Test  ', avatar: '👤' });
      const profiles = await getProfiles();
      expect(profiles[0].name).toBe('Test');
    });

    it('stores budget limit', async () => {
      await createProfile({ name: 'Student', avatar: '🎓', budgetLimit: 5000000 });
      const profiles = await getProfiles();
      expect(profiles[0].budgetLimit).toBe(5000000);
    });

    it('defaults budgetLimit to 3000000', async () => {
      await createProfile({ name: 'Default', avatar: '👤' });
      const profiles = await getProfiles();
      expect(profiles[0].budgetLimit).toBe(3000000);
    });
  });

  describe('getProfiles', () => {
    it('returns profiles ordered by lastActiveAt descending', async () => {
      await createProfile({ name: 'User A', avatar: '🅰️' });
      await new Promise(r => setTimeout(r, 20));
      await createProfile({ name: 'User B', avatar: '🅱️' });
      const profiles = await getProfiles();
      expect(profiles[0].name).toBe('User B');
      expect(profiles[1].name).toBe('User A');
    });

    it('returns empty array when no profiles exist', async () => {
      const profiles = await getProfiles();
      expect(profiles).toEqual([]);
    });
  });

  describe('updateProfile', () => {
    it('updates profile fields', async () => {
      const id = await createProfile({ name: 'Before', avatar: '👤' });
      await updateProfile(id, { name: 'After', language: 'en' });
      const profiles = await getProfiles();
      expect(profiles[0].name).toBe('After');
      expect(profiles[0].language).toBe('en');
    });

    it('auto-updates lastActiveAt on update', async () => {
      const id = await createProfile({ name: 'Test', avatar: '👤' });
      const before = (await getProfiles())[0].lastActiveAt;
      await new Promise(r => setTimeout(r, 20));
      await updateProfile(id, { name: 'Updated' });
      const after = (await getProfiles())[0].lastActiveAt;
      expect(after).not.toBe(before);
    });
  });

  describe('updateLastActive', () => {
    it('updates lastActiveAt timestamp', async () => {
      const id = await createProfile({ name: 'Test', avatar: '👤' });
      const before = (await getProfiles())[0].lastActiveAt;
      await new Promise(r => setTimeout(r, 20));
      await updateLastActive(id);
      const after = (await getProfiles())[0].lastActiveAt;
      expect(after).not.toBe(before);
    });
  });

  describe('deleteProfile', () => {
    it('deletes profile and its database', async () => {
      const id = await createProfile({ name: 'ToDelete', avatar: '🗑️' });
      // The delete also attempts to delete the profile's DB
      await deleteProfile(id);
      const profiles = await getProfiles();
      expect(profiles.length).toBe(0);
    });

    it('handles deleting non-existent profile gracefully', async () => {
      // Should not throw
      await deleteProfile(99999);
      const profiles = await getProfiles();
      expect(profiles.length).toBe(0);
    });
  });

  describe('Multiple profiles', () => {
    it('supports creating multiple profiles', async () => {
      await createProfile({ name: 'Alice', avatar: '👩' });
      await createProfile({ name: 'Bob', avatar: '👨' });
      await createProfile({ name: 'Charlie', avatar: '🧑' });
      const profiles = await getProfiles();
      expect(profiles.length).toBe(3);
    });
  });
});
