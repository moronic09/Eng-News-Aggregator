import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const fallbackDbPath = path.resolve(process.cwd(), 'dev.db');
const sourceDbPath = path.resolve(process.cwd(), '..', 'eng_news.db');
const itemsDbPath = fs.existsSync(sourceDbPath) ? sourceDbPath : fallbackDbPath;
const db = new Database(itemsDbPath);

const likesDb = new Database(fallbackDbPath);

likesDb.exec(`
  CREATE TABLE IF NOT EXISTS ItemLike (
    itemKey TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  );
`);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || undefined;
  const q = searchParams.get('q') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const conditions: string[] = [];
  const params: string[] = [];
  if (source && source !== 'Latest') {
    conditions.push('source = ?');
    params.push(source);
  }
  if (q) {
    conditions.push('title LIKE ?');
    params.push(`%${q}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const items = db.prepare(`
    SELECT id, title, url, date, source, stat
    FROM items
    ${whereClause}
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Array<any>;

  const likesRows = likesDb.prepare('SELECT itemKey, count FROM ItemLike').all() as Array<{ itemKey: string; count: number }>;
  const likesMap: Record<string, number> = {};
  likesRows.forEach((row) => { likesMap[row.itemKey] = row.count; });

  const lastUpdatedRow = db.prepare('SELECT MAX(date) as lastUpdated FROM items').get() as { lastUpdated?: string };
  const lastUpdated = lastUpdatedRow?.lastUpdated || new Date().toISOString();

  const payload = items.map((it) => ({
    ...it,
    likes: likesMap[String(it.id)] || 0,
    item_key: String(it.id),
  }));

  return NextResponse.json({ items: payload, lastUpdated });
}
