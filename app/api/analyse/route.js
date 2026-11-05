// POST /api/analyse — run the full AI pipeline on arbitrary text(s)
// Body: { text } or { texts: [...] } or { records: [raw records] }
import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    let rawRecords = [];
    if (Array.isArray(body.records)) rawRecords = body.records;
    else if (Array.isArray(body.texts)) rawRecords = body.texts.map((t) => ({ description: t }));
    else if (typeof body.text === 'string') rawRecords = [{ description: body.text }];
    else return NextResponse.json({ ok: false, error: 'provide text, texts[] or records[]' }, { status: 400 });

    const result = runPipeline(rawRecords);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
