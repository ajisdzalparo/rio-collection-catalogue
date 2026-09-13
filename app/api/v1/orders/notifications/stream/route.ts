import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getOrderNotificationSnapshot,
  subscribeToOrderCreated
} from '@/lib/order-notifications.server';

export const dynamic = 'force-dynamic';

const sinceSchema = z.coerce.date();
const HEARTBEAT_INTERVAL_MS = 20_000;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return Response.json(
      { code: 401, status: 'error', message: 'Belum login' },
      { status: 401 }
    );
  }

  try {
    JSON.parse(token);
  } catch {
    return Response.json(
      { code: 401, status: 'error', message: 'Sesi tidak valid' },
      { status: 401 }
    );
  }

  const sinceParam = new URL(request.url).searchParams.get('since');
  const parsedSince = sinceSchema.safeParse(sinceParam);
  if (!parsedSince.success) {
    return Response.json(
      { code: 400, status: 'error', message: 'Waktu notifikasi tidak valid' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  let dispose: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let snapshotInFlight = false;
      let snapshotQueued = false;

      const enqueue = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };

      const sendSnapshot = async () => {
        if (closed) return;
        if (snapshotInFlight) {
          snapshotQueued = true;
          return;
        }
        snapshotInFlight = true;
        try {
          const snapshot = await getOrderNotificationSnapshot(parsedSince.data);
          enqueue(`event: orders\ndata: ${JSON.stringify(snapshot)}\n\n`);
        } catch (error) {
          console.error('Error streaming order notifications:', error);
          enqueue('event: stream-error\ndata: {"message":"Gagal memperbarui notifikasi"}\n\n');
        } finally {
          snapshotInFlight = false;
          if (snapshotQueued) {
            snapshotQueued = false;
            void sendSnapshot();
          }
        }
      };

      const unsubscribe = subscribeToOrderCreated(() => void sendSnapshot());
      const heartbeat = setInterval(() => enqueue(': heartbeat\n\n'), HEARTBEAT_INTERVAL_MS);

      dispose = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
      };

      request.signal.addEventListener('abort', dispose, { once: true });
      enqueue('retry: 3000\n\n');
      void sendSnapshot();
    },
    cancel() {
      dispose?.();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
