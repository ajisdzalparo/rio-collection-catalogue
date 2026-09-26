import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSuperAdminUser } from '@/lib/auth/authorization';
import { recordActivity } from '@/lib/activity-log';

const SETTINGS_ID = 'default';
const paidStatuses = ['PAID', 'FULFILLED'] as const;

const financeSettingsSchema = z.object({
  commissionMode: z.enum(['PERCENTAGE', 'NOMINAL']),
  commissionValue: z.number().int().min(0)
});

interface FinancePeriod {
  from: Date;
  to: Date;
  month: string;
}

function parseDateParam(value: string, label: string, endOfDay = false): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Format ${label} harus YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Tanggal ${label} tidak valid.`);
  }
  return date;
}

function getFinancePeriod(params: URLSearchParams): FinancePeriod {
  const startDateParam = params.get('startDate');
  const endDateParam = params.get('endDate');

  if (startDateParam || endDateParam) {
    const startDate = startDateParam || endDateParam;
    const endDate = endDateParam || startDateParam;
    if (!startDate || !endDate) {
      throw new Error('Periode tanggal belum lengkap.');
    }

    const from = parseDateParam(startDate, 'mulai');
    const to = parseDateParam(endDate, 'akhir', true);
    if (from > to) {
      throw new Error('Tanggal mulai tidak boleh setelah tanggal akhir.');
    }

    return {
      from,
      to,
      month: startDate.slice(0, 7)
    };
  }

  return getMonthRange(params.get('month'));
}

function getMonthRange(monthParam: string | null): FinancePeriod {
  const now = new Date();
  const month = monthParam || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  const year = Number(match?.[1]);
  const monthNumber = Number(match?.[2]);

  if (!match || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Format periode harus YYYY-MM.');
  }

  return {
    from: new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999)),
    month
  };
}

async function getSettings() {
  return prisma.platformFinanceSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      serverCostMonthly: 300000,
      markupMode: 'NOMINAL',
      markupValue: 0,
      commissionMode: 'PERCENTAGE',
      commissionRate: 20
    }
  });
}

export async function GET(request: Request) {
  const user = await getSuperAdminUser();
  if (!user) {
    return NextResponse.json(
      { code: 403, status: 'error', message: 'Hanya Super Admin yang dapat melihat finance platform.' },
      { status: 403 }
    );
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const { from, to, month } = getFinancePeriod(searchParams);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status')?.trim() || '';
    const exportAll = searchParams.get('export') === 'true';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    const settings = await getSettings();
    const orders = await prisma.order.findMany({
      where: {
        status: { in: [...paidStatuses] },
        createdAt: { gte: from, lte: to }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        createdAt: true,
        status: true,
        commissionRateSnapshot: true,
        commissionModeSnapshot: true,
        commissionBaseAmount: true,
        commissionAmount: true,
        discountAmount: true,
        items: {
          select: { price: true, quantity: true }
        }
      }
    });

    const transactions = orders.map((order) => {
      const calculatedBase = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - order.discountAmount;
      const baseAmount = order.commissionBaseAmount > 0 ? order.commissionBaseAmount : calculatedBase;
      const commissionMode = order.commissionModeSnapshot === 'NOMINAL' ? 'NOMINAL' : 'PERCENTAGE';
      const commissionValue = order.commissionRateSnapshot;
      const commissionAmount =
        order.commissionBaseAmount > 0
          ? order.commissionAmount
          : commissionMode === 'NOMINAL'
            ? commissionValue
            : Math.round((baseAmount * commissionValue) / 100);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.fullName,
        createdAt: order.createdAt,
        status: order.status,
        commissionMode,
        commissionValue,
        baseAmount,
        commissionAmount
      };
    });

    const commissionTotal = transactions.reduce((sum, transaction) => sum + transaction.commissionAmount, 0);
    const filteredTransactions = transactions.filter((transaction) => {
      const matchesSearch =
        !search ||
        transaction.orderNumber.toLowerCase().includes(search) ||
        transaction.customerName.toLowerCase().includes(search);
      const matchesStatus = !status || transaction.status === status;
      return matchesSearch && matchesStatus;
    });
    const total = filteredTransactions.length;
    const paginatedTransactions = exportAll
      ? filteredTransactions
      : filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: {
        month,
        settings: {
          commissionMode: settings.commissionMode === 'NOMINAL' ? 'NOMINAL' : 'PERCENTAGE',
          commissionValue: settings.commissionRate,
          updatedAt: settings.updatedAt
        },
        summary: {
          transactionCount: transactions.length,
          commissionTotal,
          averageCommission: transactions.length ? Math.round(commissionTotal / transactions.length) : 0
        },
        transactions: paginatedTransactions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat finance platform.';
    return NextResponse.json({ code: 400, status: 'error', message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSuperAdminUser();
  if (!user) {
    return NextResponse.json(
      { code: 403, status: 'error', message: 'Hanya Super Admin yang dapat mengubah finance platform.' },
      { status: 403 }
    );
  }

  const parsed = financeSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Pengaturan finance tidak valid.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.commissionMode === 'PERCENTAGE' && parsed.data.commissionValue > 100) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Komisi persentase harus berada antara 0% sampai 100%.' },
      { status: 400 }
    );
  }

  try {
    const previousSettings = await getSettings();
    const settings = await prisma.platformFinanceSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        commissionMode: parsed.data.commissionMode,
        commissionRate: parsed.data.commissionValue
      },
      create: {
        id: SETTINGS_ID,
        serverCostMonthly: 300000,
        markupMode: 'NOMINAL',
        markupValue: 0,
        commissionMode: parsed.data.commissionMode,
        commissionRate: parsed.data.commissionValue
      }
    });

    await recordActivity({
      actor: user,
      action: 'SETTINGS_UPDATE',
      module: 'FINANCE',
      description: 'Mengubah pengaturan komisi platform.',
      entityType: 'PlatformFinanceSettings',
      entityId: SETTINGS_ID,
      metadata: {
        before: {
          commissionMode: previousSettings.commissionMode,
          commissionValue: previousSettings.commissionRate
        },
        after: {
          commissionMode: settings.commissionMode,
          commissionValue: settings.commissionRate
        }
      },
      request
    });

    return NextResponse.json({ code: 200, status: 'success', data: settings });
  } catch (error) {
    console.error('Error updating platform finance settings:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal menyimpan pengaturan finance platform.' },
      { status: 500 }
    );
  }
}
