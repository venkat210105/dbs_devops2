import { API_BASE } from './apiBase';

let current = {
  pageViewId: null,
  path: null,
  startAt: null,
  hbTimer: null,
};

export async function startTracking(path) {
  try {
    const sessionId = getSessionId();
    const startAtMs = Date.now();
    const payload = {
      sessionId,
      path,
      startAtMs,
      uaHash: hashStr(navigator.userAgent || ''),
      ipHash: undefined,
    };
    const res = await fetch(`${API_BASE}/tracking/page-view/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    current.pageViewId = data.pageViewId;
    current.startAt = startAtMs;
    current.path = path;
    startHeartbeats();
  } catch (e) {
    // ignore
  }
}

export async function endTracking() {
  try {
    stopHeartbeats();
    if (!current.pageViewId) return;
    const endAtMs = Date.now();
    const durationMs = endAtMs - (current.startAt || endAtMs);
    await fetch(`${API_BASE}/tracking/page-view/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageViewId: current.pageViewId, endAtMs, durationMs }),
    });
  } catch (e) {
    // ignore
  } finally {
    current = { pageViewId: null, path: null, startAt: null, hbTimer: null };
  }
}

function startHeartbeats() {
  stopHeartbeats();
  if (!current.pageViewId) return;
  current.hbTimer = setInterval(async () => {
    try {
      await fetch(`${API_BASE}/tracking/page-view/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageViewId: current.pageViewId, tsMs: Date.now() }),
      });
    } catch {}
  }, 15000); // 15s
}

function stopHeartbeats() {
  if (current.hbTimer) {
    clearInterval(current.hbTimer);
    current.hbTimer = null;
  }
}

function getSessionId() {
  const key = 'universal_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = cryptoRandomId();
    localStorage.setItem(key, id);
  }
  return id;
}

function cryptoRandomId() {
  try {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}
