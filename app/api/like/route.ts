import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item_key = body?.item_key;
  const delta = Number(body?.delta ?? 1);

  if (!item_key) {
    return NextResponse.json({ success: false, error: 'missing item_key' }, { status: 400 });
  }
  if (![1, -1].includes(delta)) {
    return NextResponse.json({ success: false, error: 'invalid delta' }, { status: 400 });
  }

  const existing = await prisma.itemLike.findUnique({ where: { itemKey: item_key } });
  const current = existing?.count ?? 0;
  const newCount = Math.max(0, current + delta);

  await prisma.itemLike.upsert({
    where: { itemKey: item_key },
    update: { count: newCount },
    create: { itemKey: item_key, count: newCount },
  });

  return NextResponse.json({ success: true, item_key, likes: newCount, liked: delta > 0 });
}