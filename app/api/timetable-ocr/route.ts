import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MAX_BYTES = 8 * 1024 * 1024;

const timetableSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          day: { type: 'integer', minimum: 1, maximum: 5 },
          start: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          end: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          name: { type: 'string' },
          room: { type: ['string', 'null'] },
        },
        required: ['day', 'start', 'end', 'name', 'room'],
      },
    },
  },
  required: ['lessons'],
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'You must be signed in.' }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: 'Timetable scanning is not configured yet.' }, { status: 503 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Upload a timetable image.' }, { status: 400 });
  if (!file.type.startsWith('image/')) return Response.json({ error: 'Please upload an image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'That image is too large. Please upload one under 8 MB.' }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString('base64')}`;

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_TIMETABLE_MODEL || 'gpt-5.6-luna',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Extract a college/school weekly timetable from this image. Return ONLY lessons that are visibly supported by the image. Do not invent missing lessons, times, rooms, or subjects. Map Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5. Ignore weekends, headers, break/lunch labels, empty cells, teacher names, and unrelated text. If a cell spans multiple periods, preserve its actual start and end time. Normalize times to 24-hour HH:MM. Use the subject/class title as name and the room if one is clearly present. If the image is ambiguous, omit the ambiguous lesson rather than guessing.`,
          },
          { type: 'input_image', image_url: dataUrl, detail: 'high' },
        ],
      }],
      text: {
        format: {
          type: 'json_schema',
          name: 'timetable',
          strict: true,
          schema: timetableSchema,
        },
      },
    }),
  });

  if (!openaiResponse.ok) {
    const detail = await openaiResponse.text();
    console.error('Timetable OCR provider error:', detail);
    return Response.json({ error: 'The timetable scanner could not process that image. Try a clearer photo.' }, { status: 502 });
  }

  const result = await openaiResponse.json() as { output_text?: string };
  if (!result.output_text) return Response.json({ error: 'The scanner returned no timetable data. Try a clearer image.' }, { status: 422 });

  try {
    const parsed = JSON.parse(result.output_text);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'The scanner returned an unreadable result. Try again.' }, { status: 422 });
  }
}
