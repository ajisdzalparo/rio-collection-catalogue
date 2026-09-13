'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Music2, Play, Square, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useNotificationSounds } from '@/hooks/use-notification-sounds';
import { playNotificationSound } from '@/lib/notification-sound-player';
import type { NotificationSound } from '@/lib/notification-sound-types';

interface NotificationSoundManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const acceptedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function NotificationSoundManager({ open, onOpenChange }: NotificationSoundManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationSound | null>(null);
  const {
    sounds,
    selectedKey,
    isLoading,
    isError,
    uploadSounds,
    selectSound,
    deleteSound,
    isUploading,
    isSelecting,
    isDeleting
  } = useNotificationSounds();

  useEffect(() => () => audioRef.current?.pause(), []);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingKey(null);
  };

  const previewSound = async (sound: NotificationSound) => {
    if (playingKey === sound.key) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(sound.url);
    audio.volume = 0.8;
    audioRef.current = audio;
    audio.addEventListener('ended', stopPreview, { once: true });
    try {
      await audio.play();
      setPlayingKey(sound.key);
    } catch {
      toast.error('Preview audio tidak dapat diputar');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    const invalidFile = files.find(
      (file) => !acceptedTypes.includes(file.type) || file.size > 5 * 1024 * 1024
    );
    if (files.length > 10 || invalidFile) {
      toast.error(
        files.length > 10
          ? 'Maksimal 10 audio dalam sekali upload.'
          : `${invalidFile?.name}: gunakan MP3, WAV, OGG, atau M4A maksimal 5 MB.`
      );
      return;
    }
    try {
      await uploadSounds(files);
      toast.success(`${files.length} suara notifikasi berhasil disimpan.`);
    } catch (error) {
      toast.error('Gagal mengunggah suara notifikasi', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  };

  const handleSelect = async (key: string | null) => {
    try {
      await selectSound(key);
      const sound = sounds.find((item) => item.key === key);
      await playNotificationSound(sound?.url);
      toast.success(key ? 'Suara notifikasi aktif diganti.' : 'Nada bawaan kembali digunakan.');
    } catch {
      toast.error('Gagal memilih suara notifikasi');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      stopPreview();
      await deleteSound(deleteTarget.key);
      toast.success(`Suara “${deleteTarget.name}” berhasil dihapus.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Gagal menghapus suara notifikasi');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl rounded-2xl border-border/60 p-5 sm:p-6">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <Music2 className="h-4 w-4 text-primary" />
              Suara Notifikasi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload beberapa audio, putar preview, lalu pilih satu suara yang aktif.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
            onChange={handleUpload}
            className="hidden"
            aria-label="Upload suara notifikasi"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-full gap-2 rounded-xl border-dashed"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Mengunggah audio...' : 'Upload Suara (bisa lebih dari satu)'}
          </Button>

          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => void handleSelect(null)}
              disabled={isSelecting}
              className="flex w-full items-center gap-3 rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Music2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold">Nada bawaan</span>
                <span className="block text-[10px] text-muted-foreground">Nada singkat aplikasi</span>
              </span>
              {!selectedKey ? <Check className="h-4 w-4 text-emerald-500" /> : null}
            </button>

            {isLoading ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Memuat pustaka audio...</p>
            ) : isError ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 py-6 text-center text-xs text-destructive">
                Storage audio belum dapat dihubungi.
              </p>
            ) : sounds.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground">
                Belum ada audio tersimpan.
              </p>
            ) : (
              sounds.map((sound) => (
                <div key={sound.key} className="flex items-center gap-2 rounded-xl border border-border/50 p-2.5">
                  <button
                    type="button"
                    onClick={() => void handleSelect(sound.key)}
                    disabled={isSelecting}
                    className="min-w-0 flex-1 rounded-lg px-1 text-left"
                  >
                    <span className="block truncate text-xs font-bold">{sound.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{formatFileSize(sound.size)}</span>
                  </button>
                  {selectedKey === sound.key ? <Check className="h-4 w-4 shrink-0 text-emerald-500" /> : null}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void previewSound(sound)}
                    aria-label={playingKey === sound.key ? `Hentikan ${sound.name}` : `Putar ${sound.name}`}
                  >
                    {playingKey === sound.key ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(sound)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Hapus ${sound.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
        title="Hapus Suara Notifikasi"
        description={deleteTarget ? `Audio “${deleteTarget.name}” akan dihapus permanen dari pustaka.` : ''}
        confirmText="Hapus Suara"
        cancelText="Batal"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
