import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';
const MAX_BYTES = 4 * 1024 * 1024;

type OcrSpaceWord = {
  WordText?: string;
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
};

type OcrSpaceLine = { Words?: OcrSpaceWord[] };

type OcrSpaceResponse = {
  ParsedResults?: Array<{
    TextOverlay?: { Lines?: OcrSpaceLine[] } | null;
    ErrorMessage?: string | null;
    ErrorDetails?: string | null;
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | null;
  ErrorDetails?: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function lineToItem(line: OcrSpaceLine) {
  const words = (line.Words ?? []).filter(word => word.WordText?.trim());
  if (!words.length) return null;

  const left = Math.min(...words.map(word => Number(word.Left ?? 0)));
  const top = Math.min(...words.map(word => Number(word.Top ?? 0)));
  const right = Math.max(...words.map(word => Number(word.Left ?? 0) + Number(word.Width ?? 0)));
  const bottom = Math.max(...words.map(word => Number(word.Top ?? 0) + Number(word.Height ?? 0)));
  const text = words.map(word => word.WordText!.replace(/\s+/g, ' ').trim()).join(' ').trim();

  if (!text || right <= left || bottom <= top) return null;
  return {
    text,
    score: 1,
    poly: [[left, top], [right, top], [right, bottom], [left, bottom]],
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return jsonError('Server OCR is not configured yet. Add OCR_SPACE_API_KEY to the deployment environment.', 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Could not read the uploaded image.', 400);
  }

  const image = form.get('image');
  if (!(image instanceof File)) return jsonError('Please upload a timetable image.', 400);
  if (!image.type.startsWith('image/')) return jsonError('Please upload an image file.', 415);
  if (image.size > MAX_BYTES) return jsonError('That image is too large. Please use an image under 4 MB.', 413);

  const upstream = new FormData();
  upstream.append('file', image, image.name || 'timetable-image');
  upstream.append('language', 'eng');
  upstream.append('isOverlayRequired', 'true');
  upstream.append('detectOrientation', 'true');
  upstream.append('scale', 'true');
  upstream.append('isTable', 'true');
  upstream.append('OCREngine', '2');

  let response: Response;
  try {
    response = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { apikey: apiKey },
      body: upstream,
      cache: 'no-store',
    });
  } catch {
    return jsonError('The OCR service could not be reached. Please try again.', 502);
  }

  if (!response.ok) return jsonError('The OCR service returned an error. Please try again.', 502);

  let payload: OcrSpaceResponse;
  try {
    payload = await response.json() as OcrSpaceResponse;
  } catch {
    return jsonError('The OCR service returned an invalid response.', 502);
  }

  if (payload.IsErroredOnProcessing || !payload.ParsedResults?.length) {
    const detail = payload.ErrorMessage || payload.ErrorDetails;
    return jsonError(detail ? `OCR failed: ${detail}` : 'The OCR service could not read this timetable.', 422);
  }

  // OCR.space exposes word-level coordinates inside visual lines. Convert each
  // line into the same line-level regions consumed by our timetable parser.
  const items = payload.ParsedResults.flatMap(result =>
    (result.TextOverlay?.Lines ?? [])
      .map(lineToItem)
      .filter((item): item is NonNullable<ReturnType<typeof lineToItem>> => Boolean(item)),
  );

  if (!items.length) return jsonError('OCR completed but returned no positioned text. Please try the screenshot again.', 422);

  const imageWidth = Math.max(...items.flatMap(item => item.poly.map(point => point[0])));
  const imageHeight = Math.max(...items.flatMap(item => item.poly.map(point => point[1])));

  return NextResponse.json({
    items,
    image: { width: imageWidth, height: imageHeight },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
