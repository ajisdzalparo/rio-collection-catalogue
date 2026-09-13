import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteNotificationSound,
  getNotificationSoundLibrary,
  selectNotificationSound,
  uploadNotificationSound
} from '@/lib/notification-sounds.server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;
const allowedMimeTypes = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']);
const selectionSchema = z.object({ selectedKey: z.string().min(1).nullable() });
const deleteSchema = z.object({ key: z.string().min(1) });

import { parseAuthCookieUser } from '@/lib/auth/roles';

async function isAuthenticated(request?: Request) {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('auth_token')?.value;
  const authHeader = request?.headers.get('authorization')?.replace('Bearer ', '');
  const token = rawCookie || authHeader;
  return Boolean(parseAuthCookieUser(token));
}

function unauthorizedResponse() {
  return NextResponse.json(
    { code: 401, status: 'error', message: 'Sesi admin tidak valid' },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) return unauthorizedResponse();
  try {
    return NextResponse.json({
      code: 200,
      status: 'success',
      data: await getNotificationSoundLibrary()
    });
  } catch (error) {
    console.error('Error loading notification sounds:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal memuat daftar suara notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) return unauthorizedResponse();
  try {
    const formData = await request.formData();
    const files = [...formData.getAll('files'), ...formData.getAll('file')].filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );
    if (files.length === 0 || files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { code: 400, status: 'error', message: `Pilih 1-${MAX_FILES_PER_UPLOAD} file audio` },
        { status: 400 }
      );
    }

    const invalidFile = files.find(
      (file) => !allowedMimeTypes.has(file.type) || file.size > MAX_FILE_SIZE
    );
    if (invalidFile) {
      return NextResponse.json(
        {
          code: 400,
          status: 'error',
          message: `${invalidFile.name}: gunakan MP3, WAV, OGG, atau M4A maksimal 5 MB`
        },
        { status: 400 }
      );
    }

    const beforeUpload = await getNotificationSoundLibrary();
    const uploaded = await Promise.all(files.map(uploadNotificationSound));
    if (beforeUpload.sounds.length === 0 && uploaded[0]) {
      await selectNotificationSound(uploaded[0].key);
    }

    return NextResponse.json(
      { code: 201, status: 'success', data: uploaded },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading notification sounds:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal mengunggah suara notifikasi' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated(request))) return unauthorizedResponse();
  const parsed = selectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Pilihan suara tidak valid' },
      { status: 400 }
    );
  }
  try {
    await selectNotificationSound(parsed.data.selectedKey);
    return NextResponse.json({ code: 200, status: 'success', message: 'Suara aktif diperbarui' });
  } catch (error) {
    console.error('Error selecting notification sound:', error);
    return NextResponse.json(
      { code: 404, status: 'error', message: 'Suara notifikasi tidak ditemukan' },
      { status: 404 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated(request))) return unauthorizedResponse();
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, status: 'error', message: 'Suara yang akan dihapus tidak valid' },
      { status: 400 }
    );
  }
  try {
    await deleteNotificationSound(parsed.data.key);
    return NextResponse.json({ code: 200, status: 'success', message: 'Suara berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting notification sound:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Gagal menghapus suara notifikasi' },
      { status: 500 }
    );
  }
}
