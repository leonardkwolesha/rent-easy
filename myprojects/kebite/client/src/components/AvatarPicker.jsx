import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const FONT = "'Segoe UI', system-ui, sans-serif";

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const IconCamera = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconGallery = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconTrash = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconFlipCamera = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const IconNoCamera = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 1l22 22" />
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
    <path d="M14.5 14.5a4 4 0 0 1-5-5" />
  </svg>
);

function CameraModal({ onCapture, onClose, onFallback }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState('user');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function startStream() {
      try {
        streamRef.current?.getTracks().forEach(t => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        if (!active) return;
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
          setTimeout(() => { onFallback?.(); onClose(); }, 1500);
        } else {
          onFallback?.(); onClose();
        }
      }
    }

    startStream();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facing]);

  function capture() {
    const v = videoRef.current;
    if (!v || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    streamRef.current?.getTracks().forEach(t => t.stop());
    canvas.toBlob(blob => { if (blob) onCapture(blob); }, 'image/jpeg', 0.92);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => setReady(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}>
          <button onClick={onClose} aria-label="Close camera"
            style={{ background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>Take Photo</span>
          <div style={{ width: '40px' }} />
        </div>

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'rgba(0,0,0,0.75)' }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}><IconNoCamera /></div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{error}</div>
              <button onClick={onClose} style={{ marginTop: '1.25rem', background: GRADIENT, border: 'none', color: '#fff', borderRadius: '999px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Close</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#111', padding: '1.5rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '52px' }} />
        <button onClick={capture} disabled={!ready} aria-label="Capture photo"
          style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'transparent', border: '4px solid rgba(255,255,255,0.7)', cursor: ready ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: ready ? '#fff' : '#555', transition: 'background 0.2s' }} />
        </button>
        <button onClick={() => { setReady(false); setFacing(f => f === 'user' ? 'environment' : 'user'); }} aria-label="Flip camera"
          style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconFlipCamera />
        </button>
      </div>
    </div>
  );
}

export default function AvatarPicker({ size = 88, fontSize = '2rem', borderColor = 'rgba(255,255,255,0.5)', background = 'rgba(255,255,255,0.25)' }) {
  const { user, refreshUser } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const galleryRef = useRef(null);
  const cameraInputRef = useRef(null);

  async function uploadBlob(file, filename) {
    setError('');
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file, filename);
    try {
      await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
      setTimeout(() => setError(''), 4000);
    } finally { setLoading(false); }
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); setTimeout(() => setError(''), 4000); return; }
    setShowOptions(false);
    await uploadBlob(file, file.name);
  }

  async function handleCameraCapture(blob) {
    setShowCamera(false);
    setShowOptions(false);
    await uploadBlob(blob, 'photo.jpg');
  }

  async function handleRemove() {
    setShowOptions(false);
    setLoading(true);
    setError('');
    try {
      await api.delete('/users/me/avatar');
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove photo.');
      setTimeout(() => setError(''), 4000);
    } finally { setLoading(false); }
  }

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => !loading && setShowOptions(true)}
          aria-label="Change profile photo"
          style={{
            width: size, height: size, borderRadius: '50%', background, border: `3px solid ${borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 900, color: '#fff',
            cursor: loading ? 'default' : 'pointer', overflow: 'hidden', position: 'relative', padding: 0, fontFamily: FONT,
          }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : loading ? (
            <div style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.4)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'avatarSpin 0.7s linear infinite' }} />
          ) : (
            getInitials(user?.name || '')
          )}
        </button>

        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: GRADIENT, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', pointerEvents: 'none' }}>
          {loading
            ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'avatarSpin 0.7s linear infinite' }} />
            : <IconCamera size={14} />}
        </div>

        {error && (
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.7rem', color: '#fff', marginTop: '6px', background: '#e63946', borderRadius: '6px', padding: '3px 10px', zIndex: 10, fontFamily: FONT }}>
            {error}
          </div>
        )}

        <style>{`@keyframes avatarSpin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFilePick} style={{ display: 'none' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilePick} style={{ display: 'none' }} />

      <AnimatePresence>
        {showOptions && (
          <motion.div
            key="avatar-options"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowOptions(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
            <motion.div
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1rem 1.25rem 1.5rem', width: '100%', maxWidth: '480px' }}>
              <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 99, margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e', marginBottom: '0.75rem', textAlign: 'center' }}>Profile photo</div>

              <button onClick={() => { setShowOptions(false); setShowCamera(true); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '0.95rem 1rem', background: '#fafafa', border: '1.5px solid #f0f0f0', borderRadius: '14px', marginBottom: '8px', cursor: 'pointer', fontFamily: FONT, color: '#1a1a2e' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff3ec', color: '#ff6b00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCamera size={20} /></span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Take Photo</div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>Use your camera</div>
                </span>
              </button>

              <button onClick={() => galleryRef.current?.click()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '0.95rem 1rem', background: '#fafafa', border: '1.5px solid #f0f0f0', borderRadius: '14px', marginBottom: '8px', cursor: 'pointer', fontFamily: FONT, color: '#1a1a2e' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eef4ff', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconGallery size={20} /></span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Choose from Gallery</div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>Pick an existing photo</div>
                </span>
              </button>

              {user?.avatar && (
                <button onClick={handleRemove}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '0.95rem 1rem', background: '#fff5f5', border: '1.5px solid #fdd', borderRadius: '14px', marginBottom: '8px', cursor: 'pointer', fontFamily: FONT, color: '#c1121f' }}>
                  <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ffe5e5', color: '#c1121f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash size={20} /></span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700 }}>Remove Photo</div>
                    <div style={{ fontSize: '0.78rem', color: '#c1121f', opacity: 0.7, marginTop: '2px' }}>Revert to initials avatar</div>
                  </span>
                </button>
              )}

              <button onClick={() => setShowOptions(false)}
                style={{ width: '100%', padding: '0.85rem', marginTop: '4px', background: 'transparent', border: 'none', color: '#888', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCamera && (
          <motion.div key="camera-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <CameraModal
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
              onFallback={() => cameraInputRef.current?.click()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
