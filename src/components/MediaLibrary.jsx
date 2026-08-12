import { useState } from 'react';

export default function MediaLibrary({ title, description, items, type, onUpload, onDelete, onSelect, activeId }) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(e.target.files);
    }
  };

  const processFiles = async (files) => {
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const arrayBuffer = evt.target.result;
          const blob = new Blob([arrayBuffer], { type: file.type });
          await onUpload({
            name: file.name.replace(/\.[^/.]+$/, ''),
            type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
            mimeType: file.type,
            sizeBytes: file.size,
            blob,
          });
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.error('Failed to process file upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '30px 20px',
          textAlign: 'center',
          background: dragActive ? 'rgba(108, 92, 231, 0.08)' : 'var(--bg-glass)',
          cursor: 'pointer',
          transition: 'var(--transition)',
        }}
      >
        <input
          type="file"
          id={`media-upload-${type}`}
          accept={type === 'animation' ? 'video/*,image/*' : 'audio/*'}
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor={`media-upload-${type}`} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {type === 'animation' ? '🎬' : '🎵'}
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
            {isUploading ? 'Đang tải file...' : 'Kéo thả file vào đây hoặc nhấp để chọn'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {type === 'animation' ? 'Hỗ trợ MP4, WEBM, GIF, PNG, JPG (Tối đa 50MB)' : 'Hỗ trợ MP3, WAV, OGG, AAC (Tối đa 20MB)'}
          </div>
        </label>
      </div>

      {/* Media Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {items && items.length > 0 ? (
          items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {item.type === 'video' ? '🎬' : item.type === 'audio' ? '🎵' : '🖼️'}
                  </span>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--red)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    title="Xóa media"
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {item.type}
                </div>

                <button
                  onClick={() => onSelect && onSelect(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'var(--accent)' : 'var(--bg-glass)',
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  {isActive ? '✓ Đang dùng' : 'Chọn'}
                </button>
              </div>
            );
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            Chưa có media nào. Hãy tải lên file đầu tiên của bạn! 🚀
          </div>
        )}
      </div>
    </div>
  );
}
