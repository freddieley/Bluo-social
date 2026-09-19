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

type OcrSpaceResponse = {
  ParsedResults?: Array<{
    FileParseExitCode?: number | string;
    ParsedText?: string;
    TextOverlay?: {
      HasOverlay?: boolean;
      Lines?: Array<{ Words?: OcrSpaceWord[] }>;
    } | null;
    ErrorMessage?: string | null;
    ErrorDetails?: string | null;
  }>;
  OCRExitCode?: number | string;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | null;
  ErrorDetails?: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

  if (!response.ok) {
    return jsonError('The OCR service returned an error. Please try again.', 502);
  }

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

  const items = payload.ParsedResults.flatMap(result =>
    result.TextOverlay?.Lines?.flatMap(line =>
      (line.Words ?? []).map(word => {
        const text = word.WordText?.replace(/\s+/g, ' ').trim() ?? '';
        const left = Number(word.Left ?? 0);
        const top = Number(word.Top ?? 0);
        const width = Number(word.Width ?? 0);
        const height = Number(word.Height ?? 0);
        return {
          text,
          score: 1,
          poly: [
            [left, top],
            [left + width, top],
            [left + width, top + height],
            [left, top + height],
          ],
        };
      }),
    ) ?? [],
  ).filter(item => item.text && item.poly[1][0] > item.poly[0][0] && item.poly[2][1] > item.poly[0][1]);

  if (!items.length) return jsonError('OCR completed but returned no positioned text. Please try the screenshot again.', 422);

  return NextResponse.json({
    items,
    // OCR.space overlay coordinates are in the original uploaded image space.
    image: { width: image.width || 0, height: image.height || 0 },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
