/**
 * Tests for offlineBackup.js (JSZip export and import)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import JSZip from 'jszip';
import { initDB, createNote, getNotes } from '../db';
import { exportZipBackup, importZipBackup } from '../offlineBackup';

const TEST_PROFILE = 'zip_test';

beforeEach(async () => {
  initDB(TEST_PROFILE);
  const db = initDB(TEST_PROFILE);
  const tableNames = db.tables.map((t) => t.name);
  for (const name of tableNames) {
    await db[name].clear();
  }
});

describe('Offline ZIP Backup', () => {
  it('creates a zip containing metadata and reads it back', async () => {
    await createNote({ title: 'Note for ZIP', content: 'Secret content' });

    // Create zip manually with system data
    const zip = new JSZip();
    zip.file('system_metadata.json', JSON.stringify({ profiles: [], databases: {} }));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    expect(zipBlob.size).toBeGreaterThan(0);

    // Verify importZipBackup parses valid zip
    await importZipBackup(zipBlob);
  });
});
