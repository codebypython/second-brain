import { storage, ensureFirebaseAuth } from './firebaseApp';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getChillAnimations, getChillSounds, createChillAnimation, createChillSound } from './db';
import { getPasscodeHash } from './cloudSync';
import logger from './logger';

export async function uploadMediaToCloud(passcode, onProgress) {
  logger.info('MediaSync', 'Starting media upload to cloud');
  await ensureFirebaseAuth();
  const passcodeHash = await getPasscodeHash(passcode);
  if (!passcodeHash) throw new Error('Passcode required for media upload');

  const animations = await getChillAnimations();
  const sounds = await getChillSounds();
  const allMedia = [
    ...animations.map((a) => ({ ...a, folder: 'animations' })),
    ...sounds.map((s) => ({ ...s, folder: 'sounds' })),
  ];

  const total = allMedia.length;
  if (total === 0) {
    if (onProgress) onProgress(100, 'Không có file media nào để upload');
    return;
  }

  let completed = 0;
  for (const item of allMedia) {
    if (item.blob) {
      const storageRef = ref(storage, `backups/${passcodeHash}/${item.folder}/${item.id}_${item.name}`);
      const uploadTask = uploadBytesResumable(storageRef, item.blob);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (onProgress) {
              const currentTotal = Math.round(((completed + percent / 100) / total) * 100);
              onProgress(currentTotal, `Đang upload ${item.name} (${currentTotal}%)`);
            }
          },
          (error) => reject(error),
          () => {
            completed++;
            resolve();
          }
        );
      });
    }
  }

  logger.success('MediaSync', `Uploaded ${total} media files to Firebase Storage`);
  if (onProgress) onProgress(100, `Hoàn thành upload ${total} file media!`);
}

export async function downloadMediaFromCloud(passcode, onProgress) {
  logger.info('MediaSync', 'Starting media download from cloud');
  await ensureFirebaseAuth();
  const passcodeHash = await getPasscodeHash(passcode);
  if (!passcodeHash) throw new Error('Passcode required for media download');

  const animsFolderRef = ref(storage, `backups/${passcodeHash}/animations`);
  const soundsFolderRef = ref(storage, `backups/${passcodeHash}/sounds`);

  try {
    const animList = await listAll(animsFolderRef);
    const soundList = await listAll(soundsFolderRef);
    const total = animList.items.length + soundList.items.length;

    let count = 0;

    // Download animations
    for (const itemRef of animList.items) {
      const url = await getDownloadURL(itemRef);
      const res = await fetch(url);
      const blob = await res.blob();
      await createChillAnimation({
        name: itemRef.name,
        type: 'video',
        mimeType: blob.type,
        sizeBytes: blob.size,
        blob,
      });
      count++;
      if (onProgress) onProgress(Math.round((count / total) * 100), `Đang tải ${itemRef.name}`);
    }

    // Download sounds
    for (const itemRef of soundList.items) {
      const url = await getDownloadURL(itemRef);
      const res = await fetch(url);
      const blob = await res.blob();
      await createChillSound({
        name: itemRef.name,
        type: 'audio',
        mimeType: blob.type,
        sizeBytes: blob.size,
        blob,
      });
      count++;
      if (onProgress) onProgress(Math.round((count / total) * 100), `Đang tải ${itemRef.name}`);
    }

    logger.success('MediaSync', `Downloaded ${count} media files from Firebase Storage`);
    if (onProgress) onProgress(100, `Hoàn thành tải ${count} file media!`);
  } catch (err) {
    logger.error('MediaSync', 'Media download failed or no media found', err);
  }
}
