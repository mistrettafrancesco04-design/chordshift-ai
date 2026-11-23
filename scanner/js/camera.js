// Rear camera stream helpers.

export class CameraError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'denied' | 'unavailable' | 'insecure'
  }
}

let stream = null;

export async function startCamera(video) {
  if (!window.isSecureContext) throw new CameraError('insecure', 'Nicht sichere Verbindung');
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError('unavailable', 'Keine Kamera-Schnittstelle');
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
    });
  } catch (e) {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw new CameraError('denied', e.message);
    throw new CameraError('unavailable', e?.message || String(e));
  }
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play().catch(() => {});
  if (!video.videoWidth) await new Promise((ok) => video.addEventListener('loadedmetadata', ok, { once: true }));
  const track = stream.getVideoTracks()[0];
  return { track, settings: track.getSettings?.() || {} };
}

export function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

/** Current video frame at full stream resolution. */
export function grabFrame(video) {
  const c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
  return c;
}

export function torchSupported(track) {
  return Boolean(track?.getCapabilities?.().torch);
}

export async function setTorch(track, on) {
  if (!torchSupported(track)) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: on }] });
    return true;
  } catch {
    return false;
  }
}
