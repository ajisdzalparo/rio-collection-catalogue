import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { minioBucketName, minioPublicUrl, s3Client } from '@/lib/minio';
import type { NotificationSound, NotificationSoundLibrary } from '@/lib/notification-sound-types';

const SOUND_PREFIX = 'notification-sounds/';
const SETTINGS_KEY = `${SOUND_PREFIX}settings.json`;

function getPublicUrl(key: string) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${minioPublicUrl.replace(/\/$/, '')}/${encodedKey}`;
}

function getDisplayName(key: string) {
  return key
    .slice(SOUND_PREFIX.length)
    .replace(/^\d+-[a-f0-9]{8}-/, '')
    .replaceAll('_', ' ');
}

async function readSelectedKey(): Promise<string | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: minioBucketName, Key: SETTINGS_KEY })
    );
    const body = await response.Body?.transformToString();
    const parsed: unknown = body ? JSON.parse(body) : null;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'selectedKey' in parsed &&
      (typeof parsed.selectedKey === 'string' || parsed.selectedKey === null)
    ) {
      return parsed.selectedKey;
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : '';
    if (errorName !== 'NoSuchKey' && errorName !== 'NotFound') throw error;
  }
  return null;
}

async function writeSelectedKey(selectedKey: string | null) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucketName,
      Key: SETTINGS_KEY,
      Body: JSON.stringify({ selectedKey }),
      ContentType: 'application/json',
      CacheControl: 'no-store'
    })
  );
}

export async function getNotificationSoundLibrary(): Promise<NotificationSoundLibrary> {
  const [objects, selectedKey] = await Promise.all([
    s3Client.send(
      new ListObjectsV2Command({ Bucket: minioBucketName, Prefix: SOUND_PREFIX, MaxKeys: 200 })
    ),
    readSelectedKey()
  ]);

  const sounds = (objects.Contents ?? [])
    .filter((object): object is typeof object & { Key: string } =>
      Boolean(object.Key && object.Key !== SETTINGS_KEY)
    )
    .map<NotificationSound>((object) => ({
      key: object.Key,
      name: getDisplayName(object.Key),
      url: getPublicUrl(object.Key),
      size: object.Size ?? 0,
      uploadedAt: (object.LastModified ?? new Date(0)).toISOString()
    }))
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));

  const selectedExists = selectedKey ? sounds.some((sound) => sound.key === selectedKey) : false;
  return { sounds, selectedKey: selectedExists ? selectedKey : null };
}

export async function uploadNotificationSound(file: File): Promise<NotificationSound> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${SOUND_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const uploadedAt = new Date();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucketName,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );

  return {
    key,
    name: file.name,
    url: getPublicUrl(key),
    size: file.size,
    uploadedAt: uploadedAt.toISOString()
  };
}

export async function selectNotificationSound(key: string | null) {
  if (key) {
    if (!key.startsWith(SOUND_PREFIX) || key === SETTINGS_KEY) {
      throw new Error('Suara notifikasi tidak valid');
    }
    await s3Client.send(new HeadObjectCommand({ Bucket: minioBucketName, Key: key }));
  }
  await writeSelectedKey(key);
}

export async function deleteNotificationSound(key: string) {
  if (!key.startsWith(SOUND_PREFIX) || key === SETTINGS_KEY) {
    throw new Error('Suara notifikasi tidak valid');
  }

  const selectedKey = await readSelectedKey();
  await s3Client.send(new DeleteObjectCommand({ Bucket: minioBucketName, Key: key }));
  if (selectedKey === key) await writeSelectedKey(null);
}
