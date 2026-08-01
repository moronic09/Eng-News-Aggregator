import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = body?.username || body?.name;
  if (!username) return NextResponse.json({ success: false, error: 'missing username' }, { status: 400 });

  // demo: echo back toggled following
  return NextResponse.json({ success: true, username, following: true });
}
