export type OcrItem = { text: string; score?: number; poly: number[][] };
export type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };

const ignored = /^(break|study period|lunch|free|lesson|monday|tuesday|wednesday|thursday|friday)$/i;
const rangeRe = /\b(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)\b/;
const roomRe = /^(?:[A-Z]{1,5}\s*)?\d{2,4}[A-Z]?$|^[A-Z]{1,5}\d{2,4}[A-Z]?$/i;

function box(item: OcrItem) {
  const xs = item.poly.flatMap(p => [p[0]]);
  const ys = item.poly.flatMap(p => [p[1]]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

function parseTimeRange(text: string) {
  const m = text.replace(/\s+/g, ' ').match(rangeRe);
  if (!m) return null;
  const start = `${m[1].padStart(2, '0')}:${m[2]}`;
  const end = `${m[3].padStart(2, '0')}:${m[4]}`;
  if (start >= end) return null;
  return { start, end };
}

function dayFromX(x: number, headers: Array<{ day: number; x: number }>, width: number) {
  if (headers.length) return headers.reduce((best, h) => Math.abs(h.x - x) < Math.abs(best.x - x) ? h : best).day;
  const left = width * 0.06, right = width * 0.995;
  return Math.min(5, Math.max(1, Math.floor(((x - left) / (right - left)) * 5) + 1));
}

export function parseTimetable(items: OcrItem[], imageWidth: number): OcrLesson[] {
  const usable = items.filter(i => i.text.trim() && (i.score ?? 1) >= 0.35).map(i => ({ ...i, text: i.text.replace(/\s+/g, ' ').trim(), ...box(i) }));
  const headers = usable.flatMap(i => {
    const t = i.text.toLowerCase();
    const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].findIndex(d => t.startsWith(d));
    return day >= 0 ? [{ day: day + 1, x: i.x }] : [];
  });
  const ranges = usable.map(i => ({ item: i, time: parseTimeRange(i.text) })).filter((x): x is { item: typeof usable[number]; time: { start: string; end: string } } => Boolean(x.time));
  const result: OcrLesson[] = [];

  for (const current of ranges) {
    const day = dayFromX(current.item.x, headers, imageWidth);
    const nextSameDay = ranges.filter(r => r !== current && dayFromX(r.item.x, headers, imageWidth) === day && r.item.y > current.item.y).sort((a, b) => a.item.y - b.item.y)[0];
    const candidates = usable
      .filter(i => i !== current.item && i.x > current.item.x - imageWidth * 0.08 && i.x < current.item.x + imageWidth * 0.08 && i.y > current.item.y + 8 && (!nextSameDay || i.y < nextSameDay.item.y - 5))
      .filter(i => !parseTimeRange(i.text) && !ignored.test(i.text))
      .sort((a, b) => a.y - b.y);
    const nameItem = candidates.find(i => !roomRe.test(i.text));
    if (!nameItem) continue;
    const roomItem = candidates.find(i => i !== nameItem && roomRe.test(i.text));
    result.push({ day, start: current.time.start, end: current.time.end, name: nameItem.text, room: roomItem?.text || null });
  }

  return result.filter((lesson, index, all) => all.findIndex(x => x.day === lesson.day && x.start === lesson.start && x.end === lesson.end && x.name === lesson.name) === index).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

export type OcrEngine = {
  predict: (image: Blob) => Promise<Array<{ image: { width: number; height: number }; items: OcrItem[] }>>;
  dispose?: () => void;
};

let enginePromise: Promise<OcrEngine> | null = null;

// Loaded lazily and cached — the model is a multi-MB download, so only fetch it once per session.
export function loadOcrEngine(): Promise<OcrEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const paddleOcrUrl = 'https://esm.sh/@paddleocr/paddleocr-js@0.4.2?bundle&target=es2022';
      const { PaddleOCR } = await import(/* webpackIgnore: true */ paddleOcrUrl);
      return PaddleOCR.create({ lang: 'en', ocrVersion: 'PP-OCRv5', ortOptions: { backend: 'wasm', wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/', numThreads: 2, simd: true } });
    })().catch(e => { enginePromise = null; throw e; });
  }
  return enginePromise;
}

export async function scanTimetableImage(file: Blob): Promise<OcrLesson[]> {
  const ocr = await loadOcrEngine();
  const [result] = await ocr.predict(file);
  const lessons = parseTimetable(result.items, result.image.width);
  if (!lessons.length) throw new Error('Could not confidently find timetable cells in that screenshot. Try a clearer image, or add lessons manually below.');
  return lessons;
}
