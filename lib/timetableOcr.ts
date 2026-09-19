export type OcrItem = { text: string; score?: number; poly: number[][] };
export type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };

type PositionedItem = OcrItem & { x: number; y: number; width: number; height: number };
type Column = { day: number; x: number };

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ignored = /^(break|study period|lunch|free|lesson|monday(?:\s+\d+)?|tuesday(?:\s+\d+)?|wednesday(?:\s+\d+)?|thursday(?:\s+\d+)?|friday(?:\s+\d+)?)$/i;
const rangeRe = /\b(\d{1,2})\s*:\s*([0-5]\d)\s*[-–—]\s*(\d{1,2})\s*:\s*([0-5]\d)\b/;
const singleTimeRe = /\b(\d{1,2})\s*:\s*([0-5]\d)\b/;
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

function uniqueLessons(lessons: OcrLesson[]) {
  return lessons
    .filter(lesson => lesson.name.trim())
    .filter((lesson, index, all) => all.findIndex(x => x.day === lesson.day && x.start === lesson.start && x.end === lesson.end && x.name === lesson.name) === index)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

function detectColumns(items: PositionedItem[], headers: Column[], imageWidth: number): Column[] {
  const explicit = headers
    .filter((header, index, all) => all.findIndex(h => h.day === header.day) === index)
    .sort((a, b) => a.day - b.day);
  if (explicit.length >= 3) return explicit;

  const rangeXs = items
    .filter(item => parseTimeRange(item.text))
    .map(item => item.x)
    .sort((a, b) => a - b);

  // Timetables normally have one or more range anchors per day. Cluster those
  // anchors by the largest horizontal gaps so OCR does not need to preserve the
  // exact day-header text to recover the five columns.
  const uniqueXs = rangeXs.filter((x, index, all) => index === 0 || Math.abs(x - all[index - 1]) > imageWidth * 0.025);
  if (uniqueXs.length >= 3) {
    const gaps = uniqueXs.slice(1).map((x, index) => ({ gap: x - uniqueXs[index], index }));
    const cuts = gaps.sort((a, b) => b.gap - a.gap).slice(0, Math.min(4, uniqueXs.length - 1)).map(g => g.index).sort((a, b) => a - b);
    const groups: number[][] = [];
    let start = 0;
    for (const cut of cuts) {
      groups.push(uniqueXs.slice(start, cut + 1));
      start = cut + 1;
    }
    groups.push(uniqueXs.slice(start));
    if (groups.length >= 3) {
      return groups.slice(0, 5).map((group, index) => ({ day: index + 1, x: group.reduce((sum, x) => sum + x, 0) / group.length }));
    }
  }

  const left = imageWidth * 0.06;
  const right = imageWidth * 0.995;
  return Array.from({ length: 5 }, (_, index) => ({
    day: index + 1,
    x: left + ((index + 0.5) / 5) * (right - left),
  }));
}

function dayFromX(x: number, columns: Column[]) {
  return columns.reduce((best, column) => Math.abs(column.x - x) < Math.abs(best.x - x) ? column : best).day;
}

function parseRangeLayout(items: PositionedItem[], columns: Column[]) {
  const ranges = items
    .map(item => ({ item, time: parseTimeRange(item.text) }))
    .filter((x): x is { item: PositionedItem; time: { start: string; end: string } } => Boolean(x.time))
    .sort((a, b) => a.item.y - b.item.y);

  const result: OcrLesson[] = [];
  for (const current of ranges) {
    const day = dayFromX(current.item.x, columns);
    const sameDayRanges = ranges
      .filter(r => r !== current && dayFromX(r.item.x, columns) === day)
      .sort((a, b) => a.item.y - b.item.y);
    const nextSameDay = sameDayRanges.find(r => r.item.y > current.item.y);
    const currentBottom = current.item.y + current.item.height / 2;
    const nextTop = nextSameDay ? nextSameDay.item.y - nextSameDay.item.height / 2 : Number.POSITIVE_INFINITY;

    // Assign by column rather than a fixed percentage around the time label.
    // Subject/room text can be substantially indented or aligned differently
    // between timetable providers.
    const candidates = items
      .filter(i => i !== current.item)
      .filter(i => dayFromX(i.x, columns) === day)
      .filter(i => i.y > currentBottom + Math.max(3, current.item.height * 0.25) && i.y < nextTop - 2)
      .filter(i => !parseTime(i.text) && !parseTimeRange(i.text) && !ignored.test(i.text))
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (!candidates.length) continue;

    const roomIndex = candidates.findIndex(i => roomRe.test(i.text.replace(/\s+/g, ' ').trim()));
    const roomItem = roomIndex >= 0 ? candidates[roomIndex] : undefined;
    const nameCandidates = roomIndex >= 0
      ? candidates.slice(0, roomIndex)
      : candidates.slice(0, Math.min(2, candidates.length));

    // OCR can split a subject over several visual lines. Preserve all text up
    // to the room line instead of silently dropping the continuation.
    const name = nameCandidates.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
    if (!name) continue;

    result.push({
      day,
      start: current.time.start,
      end: current.time.end,
      name,
      room: roomItem?.text.replace(/\s+/g, ' ').trim() || null,
    });
  }

  return uniqueLessons(result);
}

function parseGridLayout(items: PositionedItem[], columns: Column[]): OcrLesson[] {
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
      const day = dayFromX(item.x, columns);
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
  const headers: Column[] = usable.flatMap(i => {
    const text = i.text.toLowerCase();
    const day = daysOfWeek.findIndex(d => text.startsWith(d) || text.includes(d));
    return day >= 0 ? [{ day: day + 1, x: i.x }] : [];
  });
  const columns = detectColumns(usable, headers, Math.max(imageWidth, 1));

  const rangeLessons = parseRangeLayout(usable, columns);
  const gridLessons = parseGridLayout(usable, columns);
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
