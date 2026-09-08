import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_CMS_CHECK');
async function checkDatabase() {
try {
  await prisma.$transaction(async (tx) => {
    const suffix = randomUUID();
    const journal = await tx.journal.create({ data: {
      title: 'CMS integration check', slug: `cms-check-${suffix}`, author: 'Test', date: '2026-09-08',
      category: 'PROCESS', imageUrl: '/test.jpg', excerpt: 'Test', content: ['Test'], contentHtml: '<h2>Stored formatting</h2>'
    } });
    const archive = await tx.archive.create({ data: {
      name: 'CMS integration check', slug: `cms-check-${suffix}`, imageUrl: '/test.jpg', description: 'Test', journalId: journal.id
    }, include: { journal: true } });
    assert.equal(archive.journal?.contentHtml, '<h2>Stored formatting</h2>');
    await tx.journal.delete({ where: { id: journal.id } });
    assert.equal((await tx.archive.findUniqueOrThrow({ where: { id: archive.id } })).journalId, null);
    await tx.orderItem.findFirst({ select: { isPreOrder: true } });
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
  console.log('PASS: rich journal persistence, archive relationship, deletion SET NULL, pre-order column. Test transaction rolled back.');
} finally {
  await prisma.$disconnect();
}
}

checkDatabase().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
