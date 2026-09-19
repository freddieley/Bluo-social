export type OcrItem = { text: string; score?: number; poly: number[][] };
export type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };

type PositionedItem = OcrItem & { x: number; y: number; width: number; height: number };

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ignored = /^(break|study period|lunch|free|lesson|monday|tuesday|wednesday|thursday|friday)$/i;
const rangeRe = /\b(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)\b/;
const singleTimeRe = /\b(\d{1,2}):([0-5]\d)\b/;
const roomRe = /^(?:[A-Z]{1,5}\s*)?\d{2,4}[A-Z]?$|^[A-Z]{1,5}\d{2,4}[A-Z]?$/i;

function box(item: OcrItem) {
  const xs = item.poly.flatMap(p => [p[0]]);
  const ys = item.poly.flatMap(p => [p[1]]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY };
}

function normalizeItems(items: OcrItem[]): PositionedItem[] {
  return items
    .filter(i => i.text.trim() && (i.score ?? 1) >= 0.25 && i.poly?.length >= 4)
    .map(i => ({ ...i, text: i.text.replace(/\s+/g, ' ').trim(), ...box(i) }))
    .filter(i => i.width > 0 && i.height > 0);
}

function parseTime(text: string) {
  const m = text.replace(/\s+/g, ' ').match(singleTimeRe);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function parseTimeRange(text: string) {
  const m = text.replace(/\s+/g, ' ').match(rangeRe);
  if (!m) return null;
  const start = `${m[1].padStart(2, '0')}:${m[2]}`;
  const end = `${m[3].padStart(2, '0')}:${m[4]}`;
  if (start >= end) return null;
  return { start, end };
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function dayFromX(x: number, headers: Array<{ day: number; x: number }>, width: number) {
  if (headers.length) return headers.reduce((best, h) => Math.abs(h.x - x) < Math.abs(best.x - x) ? h : best).day;
  const left = width * 0.06, right = width * 0.995;
  return Math.min(5, Math.max(1, Math.floor(((x - left) / (right - left)) * 5) + 1));
}

function uniqueLessons(lessons: OcrLesson[]) {
  return lessons
    .filter(lesson => lesson.name.trim())
    .filter((lesson, index, all) => all.findIndex(x => x.day === lesson.day && x.start === lesson.start && x.end === lesson.end && x.name === lesson.name) === index)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

function parseRangeLayout(items: PositionedItem[], headers: Array<{ day: number; x: number }>, imageWidth: number) {
  const ranges = items.map(i => ({ item: i, time: parseTimeRange(i.text) })).filter((x): x is { item: PositionedItem; time: { start: string; end: string } } => Boolean(x.time));
  const result: OcrLesson[] = [];

  for (const current of ranges) {
    const day = dayFromX(current.item.x, headers, imageWidth);
    const nextSameDay = ranges
      .filter(r => r !== current && dayFromX(r.item.x, headers, imageWidth) === day && r.item.y > current.item.y)
      .sort((a, b) => a.item.y - b.item.y)[0];
    const candidates = items
      .filter(i => i !== current.item && i.x > current.item.x - imageWidth * 0.08 && i.x < current.item.x + imageWidth * 0.08 && i.y > current.item.y + 8 && (!nextSameDay || i.y < nextSameDay.item.y - 5))
      .filter(i => !parseTime(i.text) && !parseTimeRange(i.text) && !ignored.test(i.text))
      .sort((a, b) => a.y - b.y);

    const roomIndex = candidates.findIndex(i => roomRe.test(i.text));
    const nameCandidates = roomIndex >= 0 ? candidates.slice(0, roomIndex) : candidates.slice(0, 1);
    const roomItem = roomIndex >= 0 ? candidates[roomIndex] : undefined;
    const name = nameCandidates.map(i => i.text).join(' ').trim();
    if (!name) continue;

    result.push({ day, start: current.time.start, end: current.time.end, name, room: roomItem?.text || null });
  }

  return uniqueLessons(result);
}

function parseGridLayout(items: PositionedItem[], headers: Array<{ day: number; x: number }>, imageWidth: number): OcrLesson[] {
  const timeLabels = items
    .map(item => ({ item, time: parseTime(item.text) }))
    .filter((x): x is { item: PositionedItem; time: string } => Boolean(x.time))
    .sort((a, b) => a.item.y - b.item.y);

  if (!timeLabels.length) return [];

  const rows = timeLabels.filter((entry, index, all) => index === 0 || Math.abs(entry.item.y - all[index - 1].item.y) > Math.max(entry.item.height, all[index - 1].item.height) * 1.5);
  const rowGap = rows.length > 1
    ? rows.slice(1).reduce((sum, row, index) => sum + (row.item.y - rows[index].item.y), 0) / (rows.length - 1)
    : 60;
  const result: OcrLesson[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const nextY = rows[index + 1]?.item.y ?? row.item.y + rowGap;
    const bandTop = row.item.y - Math.max(row.item.height * 1.5, 8);
    const bandBottom = nextY - Math.max(row.item.height * 0.25, 3);
    const rowItems = items.filter(i => i.y >= bandTop && i.y < bandBottom && !parseTime(i.text) && !parseTimeRange(i.text) && !ignored.test(i.text));

    const byDay = new Map<number, PositionedItem[]>();
    for (const item of rowItems) {
      const day = dayFromX(item.x, headers, imageWidth);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(item);
    }

    for (const [day, candidates] of byDay) {
      const meaningful = candidates.filter(i => i.text.length > 1 || /[A-Za-z]/.test(i.text));
      if (!meaningful.length) continue;
      meaningful.sort((a, b) => a.y - b.y || a.x - b.x);
      const room = meaningful.find(i => roomRe.test(i.text))?.text ?? null;
      const nameParts = meaningful.filter(i => !roomRe.test(i.text) && !ignored.test(i.text));
      if (!nameParts.length) continue;
      const name = nameParts.map(i => i.text).join(' ').trim();
      const end = index + 1 < rows.length ? rows[index + 1].time : addMinutes(row.time, 60);
      if (row.time < end) result.push({ day, start: row.time, end, name, room });
    }
  }

  return uniqueLessons(result);
}

export function parseTimetable(items: OcrItem[], imageWidth: number): OcrLesson[] {
  const usable = normalizeItems(items);
  const headers = usable.flatMap(i => {
    const text = i.text.toLowerCase();
    const day = daysOfWeek.findIndex(d => text.startsWith(d) || text.includes(d));
    return day >= 0 ? [{ day: day + 1, x: i.x }] : [];
  });

  const rangeLessons = parseRangeLayout(usable, headers, imageWidth);
  const gridLessons = parseGridLayout(usable, headers, imageWidth);
  return uniqueLessons([...rangeLessons, ...gridLessons]);
}

export async function scanTimetableImage(file: Blob): Promise<OcrLesson[]> {
  const form = new FormData();
  form.append('image', file, file instanceof File ? file.name : 'timetable-image');

  let response: Response;
  try {
    response = await fetch('/api/timetable/ocr', {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });
  } catch {
    throw new Error('Could not reach the timetable OCR service. Please check your connection and try again.');
  }

  let payload: { items?: OcrItem[]; image?: { width?: number; height?: number }; error?: string } = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error('The timetable OCR service returned an invalid response. Please try again.');
  }

  if (!response.ok) throw new Error(payload.error || 'Could not read the timetable. Please try again.');

  const items = payload.items ?? [];
  const imageWidth = Number(payload.image?.width ?? 0);
  if (!items.length || !imageWidth) throw new Error('OCR returned no usable timetable text. Please try the screenshot again.');

  const lessons = parseTimetable(items, imageWidth);
  if (!lessons.length) {
    throw new Error(`OCR detected ${items.length} text regions, but could not map them to timetable lessons. Please try a clearer screenshot or add lessons manually.`);
  }
  return lessons;
}
