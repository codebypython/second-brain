import { useEffect, useRef, useState } from 'react';

export default function BackgroundPlayer({ backgroundMedia, soundTracks, isPlaying }) {
  const videoRef = useRef(null);
  const [bgUrl, setBgUrl] = useState(null);

  // Convert background Blob to Object URL
  useEffect(() => {
    if (backgroundMedia?.blob) {
      const url = URL.createObjectURL(backgroundMedia.blob);
      setBgUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBgUrl(null);
    }
  }, [backgroundMedia]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity: backgroundMedia ? 0.35 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {backgroundMedia?.type === 'video' && bgUrl && (
        <video
          ref={videoRef}
          src={bgUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {backgroundMedia?.type === 'image' && bgUrl && (
        <img
          src={bgUrl}
          alt="Background"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
}
