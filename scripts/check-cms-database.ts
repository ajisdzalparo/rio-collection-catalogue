import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_CMS_CHECK');

async function checkDatabase() {
  try {
    await prisma.$transaction(async (tx) => {
      const suffix = randomUUID();
      const product = await tx.product.create({
        data: {
          name: 'CMS integration check',
          slug: `cms-product-${suffix}`,
          category: 'test',
          color: 'Black',
          colorHex: '#000000',
          colors: ['Black'],
          colorHexes: ['#000000'],
          price: 1,
          imageUrl: '/test.jpg',
          images: ['/test.jpg'],
          description: 'Test'
        }
      });
      const journal = await tx.journal.create({
        data: {
          title: 'CMS integration check',
          slug: `cms-journal-${suffix}`,
          author: 'Test',
          date: '2026-09-12',
          category: 'PROCESS',
          imageUrl: '/test.jpg',
          excerpt: 'Test',
          content: ['Test'],
          contentHtml: '<h2>Stored formatting</h2>',
          productLinks: { create: { productId: product.id } }
        },
        include: { productLinks: { include: { product: true } } }
      });
      assert.equal(journal.productLinks[0]?.product.slug, product.slug);
      await tx.journal.delete({ where: { id: journal.id } });
      assert.equal(await tx.productJournal.count({ where: { productId: product.id } }), 0);
      await tx.orderItem.findFirst({ select: { isPreOrder: true } });
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
    console.log('PASS: rich journal persistence, product-journal relation, cascade cleanup, and pre-order column. Test transaction rolled back.');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
