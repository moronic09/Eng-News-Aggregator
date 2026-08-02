import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || undefined;
  const q = searchParams.get('q') || undefined;
  const sort = searchParams.get('sort') || 'latest';
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const where: any = {};
  if (source && source !== 'Latest' && source !== 'Saved') {
    where.source = source;
  }
  if (q) {
    where.title = { contains: q, mode: 'insensitive' };
  }

  const items = await prisma.item.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
    skip: offset,
  });

  const likesRows = await prisma.itemLike.findMany();
  const likesMap: Record<string, number> = {};
  likesRows.forEach((row) => {
    likesMap[row.itemKey] = row.count;
  });

  const lastItem = await prisma.item.findFirst({ orderBy: { date: 'desc' } });
  const lastUpdated = lastItem?.date || new Date().toISOString();

  let payload = items.map((it) => ({
    ...it,
    likes: likesMap[String(it.id)] || 0,
    item_key: String(it.id),
  }));

  if (sort === 'liked' || sort === 'hot') {
    payload.sort((a, b) => b.likes - a.likes);
  }

  const totalCount = await prisma.item.count();

  return NextResponse.json({ items: payload, lastUpdated, totalCount });
}