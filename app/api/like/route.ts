import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';

const db = new Database(path.resolve(process.cwd(), 'dev.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS ItemLike (
    itemKey TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  );
`);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item_key = body?.item_key;
  const delta = Number(body?.delta ?? 1);
  if (!item_key) return NextResponse.json({ success: false, error: 'missing item_key' }, { status: 400 });
  if (![1, -1].includes(delta)) return NextResponse.json({ success: false, error: 'invalid delta' }, { status: 400 });

  const rec = db.prepare('SELECT count FROM ItemLike WHERE itemKey = ?').get(item_key) as { count: number } | undefined;
  const current = rec?.count ?? 0;
  const newCount = Math.max(0, current + delta);

  db.prepare('INSERT INTO ItemLike (itemKey, count) VALUES (?, ?) ON CONFLICT(itemKey) DO UPDATE SET count = excluded.count').run(item_key, newCount);

  return NextResponse.json({ success: true, item_key, likes: newCount, liked: delta > 0 });
}
