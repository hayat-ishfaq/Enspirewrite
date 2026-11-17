export type ThemeMode = 'slate' | 'midnight' | 'sepia';

export type FontChoice = 'courier' | 'ibm-plex';

export type SpotlightIntensity = 'off' | 'subtle' | 'atmospheric' | 'dramatic';

export type EntryType = 'diary' | 'note';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  avatarLetter: string;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  type: EntryType;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  dateLabel: string; // e.g. "Nov 18, 2026"
  wordCount: number;
  charCount: number;
}

export interface AppSettings {
  theme: ThemeMode;
  font: FontChoice;
  spotlightIntensity: SpotlightIntensity;
  isMuted: boolean;
  volume: number;
  typewriterLockEnabled: boolean;
}
