import JSZip from 'jszip';
import { exportAll, importAll, getChillAnimations, getChillSounds, createChillAnimation, createChillSound } from './db';
import { exportEntireSystem, importEntireSystem } from './cloudSync';
import logger from './logger';

export async function exportZipBackup() {
  logger.info('OfflineBackup', 'Creating full ZIP backup');
  const zip = new JSZip();

  // Export full text & database metadata
  const systemData = await exportEntireSystem();
  zip.file('system_metadata.json', JSON.stringify(systemData, null, 2));

  // Export media blobs
  const animations = await getChillAnimations();
  const sounds = await getChillSounds();

  const animFolder = zip.folder('media/animations');
  animations.forEach((a) => {
    if (a.blob) {
      animFolder.file(`${a.id}_${a.name}`, a.blob);
    }
  });

  const soundFolder = zip.folder('media/sounds');
  sounds.forEach((s) => {
    if (s.blob) {
      soundFolder.file(`${s.id}_${s.name}`, s.blob);
    }
  });

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `SecondBrain_Backup_${new Date().toISOString().slice(0, 10)}.zip`;

  // Trigger browser download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logger.success('OfflineBackup', `Exported ZIP backup: ${filename}`);
}

export async function importZipBackup(file) {
  logger.info('OfflineBackup', 'Importing ZIP backup');
  const zip = await JSZip.loadAsync(file);

  // Read metadata JSON
  const metaFile = zip.file('system_metadata.json');
  if (!metaFile) throw new Error('File ZIP không đúng định dạng — thiếu system_metadata.json');

  const metaText = await metaFile.async('text');
  const systemData = JSON.parse(metaText);

  await importEntireSystem(systemData);

  // Read animations
  const animFiles = zip.folder('media/animations')?.files || {};
  for (const path in animFiles) {
    if (!animFiles[path].dir) {
      const blob = await animFiles[path].async('blob');
      const filename = path.split('/').pop();
      await createChillAnimation({
        name: filename,
        type: 'video',
        mimeType: blob.type || 'video/mp4',
        sizeBytes: blob.size,
        blob,
      });
    }
  }

  // Read sounds
  const soundFiles = zip.folder('media/sounds')?.files || {};
  for (const path in soundFiles) {
    if (!soundFiles[path].dir) {
      const blob = await soundFiles[path].async('blob');
      const filename = path.split('/').pop();
      await createChillSound({
        name: filename,
        type: 'audio',
        mimeType: blob.type || 'audio/mp3',
        sizeBytes: blob.size,
        blob,
      });
    }
  }

  logger.success('OfflineBackup', 'ZIP backup imported successfully');
}
