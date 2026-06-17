import { masterDb } from './masterDb';
import { exportAll, importAll, initDB, getCurrentDbName } from './db';
import { db as firestore } from './firebaseApp';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import logger from './logger';

export async function exportEntireSystem() {
  logger.info('CloudSync', 'Starting full system export');
  // FIX: Save current DB name to restore after export
  const savedDbName = getCurrentDbName();
  
  try {
    const profiles = await masterDb.profiles.toArray();
    const data = { profiles, databases: {} };
    
    for (const p of profiles) {
      logger.info('CloudSync', `Exporting data for profile: ${p.id} (${p.name})`);
      initDB(p.id);
      data.databases[p.id] = await exportAll();
    }
    
    // FIX: Restore the original DB after iterating through all profiles
    if (savedDbName) {
      const originalProfileId = savedDbName.replace('SecondBrainDB_', '');
      initDB(originalProfileId);
      logger.info('CloudSync', `Restored active DB to: ${savedDbName}`);
    }
    
    logger.success('CloudSync', `System export complete: ${profiles.length} profiles`);
    return data;
  } catch (error) {
    // Also restore DB on error
    if (savedDbName) {
      const originalProfileId = savedDbName.replace('SecondBrainDB_', '');
      try { initDB(originalProfileId); } catch (_) { /* best effort */ }
    }
    logger.error('CloudSync', 'System export failed', error);
    throw error;
  }
}

export async function importEntireSystem(data) {
  logger.info('CloudSync', 'Starting full system import');
  try {
    await masterDb.profiles.clear();
    if (data.profiles && data.profiles.length > 0) {
      await masterDb.profiles.bulkAdd(data.profiles);
      logger.info('CloudSync', `Imported ${data.profiles.length} profiles`);
    }
    if (data.databases) {
      for (const profileId in data.databases) {
        logger.info('CloudSync', `Importing data for profile: ${profileId}`);
        initDB(profileId);
        await importAll(data.databases[profileId]);
      }
    }
    logger.success('CloudSync', 'System import complete');
  } catch (error) {
    logger.error('CloudSync', 'System import failed', error);
    throw error;
  }
}

export async function pushToCloud(passcode) {
  logger.info('CloudSync', 'Starting push to cloud');
  if (!passcode || passcode.length < 4) {
    const err = new Error("Passcode must be at least 4 characters.");
    logger.error('CloudSync', 'Push failed — invalid passcode', err);
    throw err;
  }
  
  try {
    const data = await exportEntireSystem();
    const jsonStr = JSON.stringify(data);
    const CHUNK_SIZE = 900000; // ~900KB per chunk to stay under Firestore 1MB limit
    
    const chunks = [];
    for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
      chunks.push(jsonStr.substring(i, i + CHUNK_SIZE));
    }
    
    logger.info('CloudSync', `Data size: ${(jsonStr.length / 1024).toFixed(1)}KB, chunks: ${chunks.length}`);
    
    // Save metadata
    await setDoc(doc(firestore, "backups", passcode), { 
      chunksCount: chunks.length,
      updatedAt: new Date().toISOString() 
    });
    logger.info('CloudSync', 'Metadata saved');

    // Save chunks
    for (let i = 0; i < chunks.length; i++) {
      await setDoc(doc(firestore, "backups", `${passcode}_chunk_${i}`), { data: chunks[i] });
      logger.info('CloudSync', `Chunk ${i + 1}/${chunks.length} uploaded`);
    }
    
    logger.success('CloudSync', 'Push to cloud complete');
  } catch (error) {
    logger.error('CloudSync', 'Push to cloud failed', error);
    throw error;
  }
}

export async function pullFromCloud(passcode) {
  logger.info('CloudSync', 'Starting pull from cloud');
  if (!passcode) {
    const err = new Error("Please enter a passcode.");
    logger.error('CloudSync', 'Pull failed — no passcode', err);
    throw err;
  }
  
  try {
    const metaSnap = await getDoc(doc(firestore, "backups", passcode));
    if (!metaSnap.exists()) {
      const err = new Error("No backup found for this passcode.");
      logger.error('CloudSync', 'Pull failed — no backup found', err);
      throw err;
    }
    
    const { chunksCount, updatedAt } = metaSnap.data();
    logger.info('CloudSync', `Found backup: ${chunksCount} chunks, last updated: ${updatedAt}`);
    
    let jsonStr = '';
    for (let i = 0; i < chunksCount; i++) {
      const chunkSnap = await getDoc(doc(firestore, "backups", `${passcode}_chunk_${i}`));
      if (chunkSnap.exists()) {
        jsonStr += chunkSnap.data().data;
        logger.info('CloudSync', `Chunk ${i + 1}/${chunksCount} downloaded`);
      } else {
        logger.warn('CloudSync', `Chunk ${i} missing — data may be incomplete`);
      }
    }
    
    logger.info('CloudSync', `Parsing downloaded data: ${(jsonStr.length / 1024).toFixed(1)}KB`);
    const data = JSON.parse(jsonStr);
    await importEntireSystem(data);
    logger.success('CloudSync', 'Pull from cloud complete');
    return updatedAt;
  } catch (error) {
    logger.error('CloudSync', 'Pull from cloud failed', error);
    throw error;
  }
}
