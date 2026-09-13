export interface NotificationSound {
  key: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface NotificationSoundLibrary {
  sounds: NotificationSound[];
  selectedKey: string | null;
}
