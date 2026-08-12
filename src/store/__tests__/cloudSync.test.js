/**
 * Tests for cloudSync.js (export/import entire system, passcode hashing)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { masterDb, createProfile } from '../masterDb';
import { initDB, createNote, getNotes } from '../db';
import { exportEntireSystem, importEntireSystem, getPasscodeHash } from '../cloudSync';

beforeEach(async () => {
  await masterDb.profiles.clear();
});

describe('CloudSync System Export/Import', () => {
  it('hashes passcode consistently with SHA-256', async () => {
    const hash1 = await getPasscodeHash('mySecret123');
    const hash2 = await getPasscodeHash('mySecret123');
    const hash3 = await getPasscodeHash('otherSecret');

    expect(hash1).toHaveLength(64); // SHA-256 hex length
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('exports and imports multi-profile entire system', async () => {
    // Profile 1
    const id1 = await createProfile({ name: 'User 1', avatar: '👤' });
    initDB(id1);
    await createNote({ title: 'Note in P1', content: 'Secret 1' });

    // Profile 2
    const id2 = await createProfile({ name: 'User 2', avatar: '👥' });
    initDB(id2);
    await createNote({ title: 'Note in P2', content: 'Secret 2' });

    // Export entire system
    const systemData = await exportEntireSystem();
    expect(systemData.profiles.length).toBe(2);
    expect(systemData.databases[id1]).toBeDefined();
    expect(systemData.databases[id2]).toBeDefined();
    expect(systemData.databases[id1].notes.length).toBe(1);
    expect(systemData.databases[id2].notes.length).toBe(1);

    // Clear master db and import system
    await masterDb.profiles.clear();
    await importEntireSystem(systemData);

    const profiles = await masterDb.profiles.toArray();
    expect(profiles.length).toBe(2);

    // Verify P1 notes restored
    initDB(id1);
    const notes1 = await getNotes();
    expect(notes1.length).toBe(1);
    expect(notes1[0].title).toBe('Note in P1');

    // Clean up DBs
    Dexie.delete(`SecondBrainDB_${id1}`);
    Dexie.delete(`SecondBrainDB_${id2}`);
  });
});
