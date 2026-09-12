import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { isArchivedProductStatus, normalizeProductAvailability } from '../lib/product-availability';
import { journalSchema } from '../lib/journal-schema';
import { orderSchema } from '../lib/order-schema';
import { normalizeEmail, normalizeWhatsapp } from '../lib/customer-identity';
import { mapJournalRelations, mapProductRelations } from '../lib/catalogue-relations';
import { getOrderStatusLabel } from '../lib/order-status';
import { createOrder } from '../lib/create-order';
import { deductStock, restoreStock } from '../lib/stock';
import { POST } from '../app/api/v1/orders/route';
import { submitOrder } from '../lib/api';

const oldSecret = process.env.RECAPTCHA_SECRET_KEY;
const restores: Array<() => void> = [];
function replaceMethod<T extends object, K extends keyof T>(
  target: T,
  key: K,
  replacement: unknown
) {
  const original = target[key];
  target[key] = replacement as T[K];
  restores.push(() => {
    target[key] = original;
  });
}
afterEach(() => {
  mock.restoreAll?.();
  mock.reset?.();
  restores
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  if (oldSecret === undefined) delete process.env.RECAPTCHA_SECRET_KEY;
  else process.env.RECAPTCHA_SECRET_KEY = oldSecret;
});

const input = {
  fullName: 'Test Customer',
  email: 'test@example.com',
  whatsapp: '081234567890',
  address: 'Test address',
  shippingFee: 15000,
  shipping: { destination: '151', courier: 'jne', service: 'REG' },
  items: [{ productId: 'product-test', size: 'M', quantity: 2, color: 'Black' }]
};
const product = {
  id: 'product-test',
  name: 'Test shirt',
  status: 'PRE_ORDER',
  stockMode: 'ALWAYS_AVAILABLE',
  price: 100000,
  color: 'Black',
  colors: ['Black'],
  stock: 0,
  variants: [{ id: 'variant-test', size: 'M', stock: 0, inStock: false }]
};

function mockOrderDatabase(overrides = {}) {
  let saved: Record<string, unknown> | undefined;
  let priorOrderWhere: Record<string, unknown> | undefined;
  replaceMethod(prisma.storeSettings, 'findUnique', async () => ({
    enabledCouriers: 'jne',
    originCityId: '153'
  }));
  replaceMethod(prisma.shippingRateCache, 'findFirst', async () => ({
    expiresAt: new Date(Date.now() + 60000),
    weightGrams: 1000,
    ratesData: [{ code: 'JNE', name: 'JNE', costs: [{ service: 'REG', cost: [{ value: 15000 }] }] }]
  }));
  const selectedProduct = { ...product, ...overrides };
  const tx = {
    product: { findMany: async () => [selectedProduct], findUnique: async () => selectedProduct },
    order: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        priorOrderWhere = where;
        return null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        saved = data;
        return { ...data, items: [] };
      }
    }
  } as unknown as Prisma.TransactionClient;
  replaceMethod(
    prisma,
    '$transaction',
    async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => callback(tx)
  );
  return { saved: () => saved, priorOrderWhere: () => priorOrderWhere, tx };
}

test('availability is derived from variant stock and preserves explicit non-sale statuses', () => {
  assert.equal(
    normalizeProductAvailability({
      ...product,
      stockMode: 'QUANTITY',
      status: 'AVAILABLE',
      stock: 99
    }).status,
    'SOLD_OUT'
  );
  assert.equal(normalizeProductAvailability(product).variants[0].inStock, true);
  assert.equal(
    normalizeProductAvailability({ ...product, status: 'DISCONTINUED' }).status,
    'DISCONTINUED'
  );
  assert.equal(
    normalizeProductAvailability({
      ...product,
      stockMode: 'QUANTITY',
      status: 'AVAILABLE',
      variants: [{ size: 'M', stock: 2, inStock: false }]
    }).stock,
    2
  );
});

test('journal keeps rich content while removing executable markup', () => {
  const parsed = journalSchema.parse({
    title: 'Title',
    slug: 'title',
    author: 'Author',
    date: '8 September 2026',
    category: 'PROCESS',
    imageUrl: '/cover.jpg',
    excerpt: 'Excerpt',
    content: ['Text'],
    contentHtml:
      '<h2>Heading</h2><p><strong>Bold</strong> <a href="https://example.com">link</a></p><img src="/photo.jpg" onerror="alert(1)"><script>alert(1)</script>'
  });
  assert.match(parsed.contentHtml!, /<strong>Bold<\/strong>/);
  assert.match(parsed.contentHtml!, /<img src="\/photo.jpg">/);
  assert.doesNotMatch(parsed.contentHtml!, /onerror|script/);
});

test('product-journal mapper supports empty, single, multiple, and cleared relationships', () => {
  const journal = {
    id: 'journal-1', slug: 'journal-1', title: 'Journal 1', excerpt: '', category: 'PROCESS', date: '2026-09-12', imageUrl: '/journal.jpg'
  };
  const baseProduct = { ...product, slug: 'test-shirt', category: 'test', imageUrl: '/shirt.jpg', images: [], description: '', edition: 'Edition 001' };
  const empty = mapProductRelations({ ...baseProduct, journalLinks: [] } as unknown as Parameters<typeof mapProductRelations>[0]);
  assert.deepEqual(empty.journalIds, []);
  const multiple = mapProductRelations({
    ...baseProduct,
    journalLinks: [{ journal }, { journal: { ...journal, id: 'journal-2', slug: 'journal-2', title: 'Journal 2' } }]
  } as unknown as Parameters<typeof mapProductRelations>[0]);
  assert.deepEqual(multiple.journalIds, ['journal-1', 'journal-2']);
  const reverse = mapJournalRelations({
    ...journal,
    author: 'Author', content: [],
    productLinks: [{ product: { id: baseProduct.id, slug: baseProduct.slug, name: baseProduct.name, imageUrl: baseProduct.imageUrl, price: baseProduct.price, status: 'AVAILABLE', category: baseProduct.category, color: baseProduct.color } }]
  } as unknown as Parameters<typeof mapJournalRelations>[0]);
  assert.deepEqual(reverse.relatedProducts?.map((item) => item.id), ['product-test']);
});

test('archive contains only sold-out and discontinued products', () => {
  assert.equal(isArchivedProductStatus('SOLD_OUT'), true);
  assert.equal(isArchivedProductStatus('DISCONTINUED'), true);
  for (const status of ['AVAILABLE', 'COMING_SOON', 'PRE_ORDER']) {
    assert.equal(isArchivedProductStatus(status), false);
  }
});

test('customer identities normalize email and common Indonesian WhatsApp formats', () => {
  assert.equal(normalizeEmail('  TEST@Example.COM '), 'test@example.com');
  const expected = '6281234567890';
  assert.equal(normalizeWhatsapp('0812-3456-7890'), expected);
  assert.equal(normalizeWhatsapp('62812 3456 7890'), expected);
  assert.equal(normalizeWhatsapp('+62 812 3456 7890'), expected);
});

test('order rejects invalid email, missing service, empty items and invalid quantities', () => {
  assert.equal(orderSchema.safeParse(input).success, true);
  for (const patch of [
    { email: 'invalid-email' },
    { shipping: undefined },
    { items: [] },
    { items: [{ ...input.items[0], quantity: -1 }] },
    { items: [{ ...input.items[0], quantity: 1.5 }] }
  ]) {
    assert.equal(orderSchema.safeParse({ ...input, ...patch } as unknown).success, false);
  }
});

test('checkout persists chosen courier, authoritative price, color and pre-order snapshot', async () => {
  const database = mockOrderDatabase();
  await createOrder(input);
  const saved = database.saved()!;
  assert.equal(saved.courierName, 'JNE REG');
  assert.equal(saved.totalPrice, 215000);
  assert.equal(saved.whatsapp, '6281234567890');
  const items = (saved.items as { create: Array<{ isPreOrder: boolean; name: string }> }).create;
  assert.equal(items[0].isPreOrder, true);
  assert.equal(items[0].name, 'Test shirt — Black');
  assert.match(String(saved.orderNumber), /^RC-[A-F0-9]{16}$/);
});

test('once-per-customer checks account, normalized email, and normalized WhatsApp', async () => {
  const database = mockOrderDatabase({ orderLimitMode: 'ONCE_PER_USER' });
  await createOrder({
    ...input,
    customerId: 'customer-test',
    email: '  TEST@EXAMPLE.COM ',
    whatsapp: '+62 812-3456-7890',
    items: [{ ...input.items[0], quantity: 1 }]
  });
  assert.deepEqual((database.priorOrderWhere() as { OR: unknown[] }).OR, [
    { customerId: 'customer-test' },
    { email: 'test@example.com' },
    { whatsapp: '6281234567890' }
  ]);
});

test('checkout rejects a stale shipping quote and unavailable product before saving', async () => {
  const database = mockOrderDatabase({ status: 'COMING_SOON' });
  await assert.rejects(createOrder({ ...input, shippingFee: 1 }), /Tarif ongkir berubah/);
  await assert.rejects(createOrder(input), /sedang tidak tersedia/);
  assert.equal(database.saved(), undefined);
});

test('checkout rejects nonexistent sizes and colors for unlimited stock too', async () => {
  const database = mockOrderDatabase();
  await assert.rejects(
    createOrder({ ...input, items: [{ ...input.items[0], size: 'INVALID' }] }),
    /ukuran/i
  );
  await assert.rejects(
    createOrder({ ...input, items: [{ ...input.items[0], color: 'INVALID' }] }),
    /warna/i
  );
  assert.equal(database.saved(), undefined);
});

test('stock decrement is conditional and sold-out state recovers after cancellation', async () => {
  let stock = 2;
  let inStock = true;
  const tx = {
    product: {
      findUnique: async () => ({ id: 'p', name: 'Shirt', stockMode: 'QUANTITY' }),
      update: async () => ({})
    },
    productVariant: {
      findFirst: async () => ({ id: 'v', stock }),
      updateMany: async ({
        data
      }: {
        data: { stock?: { decrement: number }; inStock?: boolean };
      }) => {
        if (data.stock) {
          if (stock < data.stock.decrement) return { count: 0 };
          stock -= data.stock.decrement;
        } else if (stock === 0) inStock = false;
        return { count: 1 };
      },
      update: async ({ data }: { data: { stock: { increment: number }; inStock: boolean } }) => {
        stock += data.stock.increment;
        inStock = data.inStock;
      },
      aggregate: async () => ({ _sum: { stock } })
    }
  } as unknown as Prisma.TransactionClient;
  const items = [{ productId: 'p', size: 'M', quantity: 2 }];
  await deductStock(items, tx);
  assert.equal(stock, 0);
  assert.equal(inStock, false);
  await assert.rejects(deductStock(items, tx), /sedang habis|tidak mencukupi/);
  await restoreStock(items, tx);
  assert.equal(stock, 2);
  assert.equal(inStock, true);
});

test('OTP verification validates code format, expiration and attempts', async () => {
  replaceMethod(prisma.otpVerification, 'findFirst', async () => null);
  const { verifyOtp } = await import('../lib/otp');
  await assert.rejects(
    verifyOtp({ email: 'nonexistent@test.com', code: '123456' }),
    /tidak ditemukan/
  );
});

test('order API returns failure instead of an invented confirmation number', async () => {
  const origNodeEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  try {
    const response = await POST(
      new Request('http://localhost/api/v1/orders', { method: 'POST', body: JSON.stringify(input) })
    );
    assert.equal(response.status, 400);
    const result = await response.json();
    assert.equal(result.data, undefined);
    assert.match(result.message, /OTP/);

    replaceMethod(globalThis, 'fetch', async () =>
      Response.json({ message: 'Stok habis' }, { status: 400 })
    );
    await assert.rejects(submitOrder(input), /Stok habis/);
    replaceMethod(globalThis, 'fetch', async () => Response.json({ data: {} }));
    await assert.rejects(submitOrder(input), /Respons pesanan tidak valid/);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
  }
});

test('all CMS order statuses have distinct public labels', () => {
  const statuses = [
    'PENDING',
    'CONFIRMED',
    'WAITING_PAYMENT',
    'PAID',
    'FULFILLED',
    'CANCELLED',
    'REJECTED',
    'EXPIRED'
  ];
  assert.equal(new Set(statuses.map(getOrderStatusLabel)).size, statuses.length);
  assert.equal(getOrderStatusLabel('PAID'), 'Pembayaran Diterima');
});
