import { NextResponse } from 'next/server';
import { getActivityLogViewer } from '@/lib/auth/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const viewer = await getActivityLogViewer();
  if (!viewer) {
    return NextResponse.json(
      { code: 403, status: 'error', message: 'Activity Log hanya dapat diakses Super Admin dan Owner.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const activity = await prisma.activityLog.findUnique({ where: { id } });

    if (!activity) {
      return NextResponse.json(
        { code: 404, status: 'error', message: 'Aktivitas tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: 200, status: 'success', data: activity });
  } catch (error) {
    console.error('Error fetching activity log detail:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat detail aktivitas.' },
      { status: 500 }
    );
  }
}
