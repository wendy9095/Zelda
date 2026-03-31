const STORAGE_KEY = 'renderflow_history_v1';
const MAX_ITEMS = 20;
const THUMB_MAX = 300;

function dataUrlToThumbnail(dataUrl, maxEdge) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const scale = Math.min(1, maxEdge / Math.max(w, h, 1));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      c.getContext('2d').drawImage(img, 0, 0, cw, ch);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('thumb load failed'));
    img.src = dataUrl;
  });
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function tryPersist(items) {
  let list = items;
  for (let attempts = 0; attempts < MAX_ITEMS + 2; attempts++) {
    try {
      setHistory(list);
      return true;
    } catch (e) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        if (list.length <= 1) return false;
        list = list.slice(0, -1);
        continue;
      }
      throw e;
    }
  }
  return false;
}

export async function pushHistory({ imageDataUrl, modeId }) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:')) return;

  let thumb;
  try {
    thumb = await dataUrlToThumbnail(imageDataUrl, THUMB_MAX);
  } catch {
    thumb = imageDataUrl;
  }

  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    mode: modeId || 'original',
    thumb,
    image: imageDataUrl,
  };

  const next = [item, ...getHistory()].slice(0, MAX_ITEMS);
  if (!tryPersist(next)) {
    console.warn('Picture Processing history: storage full, could not save entry.');
  }
}

export function removeHistory(id) {
  setHistory(getHistory().filter((x) => x.id !== id));
}

export function clearHistory() {
  setHistory([]);
}
