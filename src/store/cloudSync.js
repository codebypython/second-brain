import { masterDb } from './masterDb';
import { exportAll, importAll, initDB } from './db';
import { db as firestore } from './firebaseApp';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function exportEntireSystem() {
  const profiles = await masterDb.profiles.toArray();
  const data = { profiles, databases: {} };
  for (const p of profiles) {
    initDB(p.id);
    data.databases[p.id] = await exportAll();
  }
  return data;
}

export async function importEntireSystem(data) {
  await masterDb.profiles.clear();
  if (data.profiles && data.profiles.length > 0) {
    await masterDb.profiles.bulkAdd(data.profiles);
  }
  if (data.databases) {
    for (const profileId in data.databases) {
      initDB(profileId);
      await importAll(data.databases[profileId]);
    }
  }
}

export async function pushToCloud(passcode) {
  if (!passcode || passcode.length < 4) throw new Error("Passcode must be at least 4 characters.");
  
  const data = await exportEntireSystem();
  const jsonStr = JSON.stringify(data);
  const CHUNK_SIZE = 900000; // ~900KB per chunk to stay under Firestore 1MB limit
  
  const chunks = [];
  for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
    chunks.push(jsonStr.substring(i, i + CHUNK_SIZE));
  }
  
  // Save metadata
  await setDoc(doc(firestore, "backups", passcode), { 
    chunksCount: chunks.length,
    updatedAt: new Date().toISOString() 
  });

  // Save chunks
  for (let i = 0; i < chunks.length; i++) {
    await setDoc(doc(firestore, "backups", `${passcode}_chunk_${i}`), { data: chunks[i] });
  }
}

export async function pullFromCloud(passcode) {
  if (!passcode) throw new Error("Please enter a passcode.");
  
  const metaSnap = await getDoc(doc(firestore, "backups", passcode));
  if (!metaSnap.exists()) throw new Error("No backup found for this passcode.");
  
  const { chunksCount, updatedAt } = metaSnap.data();
  let jsonStr = '';
  for (let i = 0; i < chunksCount; i++) {
    const chunkSnap = await getDoc(doc(firestore, "backups", `${passcode}_chunk_${i}`));
    if (chunkSnap.exists()) {
      jsonStr += chunkSnap.data().data;
    }
  }
  
  const data = JSON.parse(jsonStr);
  await importEntireSystem(data);
  return updatedAt;
}
