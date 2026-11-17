import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { CarriageSpotlight } from './components/CarriageSpotlight';
import { JournalSidebar } from './components/JournalSidebar';
import { MinimalHUD } from './components/MinimalHUD';
import { typewriterAudio } from './audio/typewriterAudio';
import type {
  JournalEntry,
  EntryType,
  AppSettings,
  ThemeMode,
  SpotlightIntensity,
} from './types';

const STORAGE_ENTRIES_KEY = 'enspirewrite_entries_v1';
const STORAGE_CURRENT_ID_KEY = 'enspirewrite_current_id_v1';
const STORAGE_SETTINGS_KEY = 'enspirewrite_settings_v1';

function getFormattedDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

const INITIAL_WELCOME_CONTENT = `# The Mechanical Ribbon
Nov 18, 2026

There is a quiet dignity in the mechanical carriage.
Every keystroke strikes with intention, leaving indelible ink upon the paper roll.

Notice how this line remains held at sixty-two percent down your screen. As your thoughts spill forward and you press return, the carriage slides upward with a crystalline chime, keeping your active line anchored directly above the polished metallic track.

Above the carriage, an upward beam of warm light cuts through the twilight, casting soft illumination on your immediate words while older passages gently dissolve into the atmosphere above.

Press [Ctrl + B] to open the archival ledger.
Press [Ctrl + M] to toggle the mechanical key strikes.
Press Enter at the end of this line to hear the return bell...
`;

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-diary-default',
    type: 'diary',
    title: `Diary — ${getFormattedDate()}`,
    content: INITIAL_WELCOME_CONTENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dateLabel: getFormattedDate(),
    wordCount: INITIAL_WELCOME_CONTENT.trim().split(/\s+/).length,
    charCount: INITIAL_WELCOME_CONTENT.length,
  },
  {
    id: 'entry-note-manifesto',
    type: 'note',
    title: 'The Tactile Manifesto',
    content: `A writer requires neither notifications nor distractions. Only a clean margin, a responsive platen, and the tactile rhythm of metal striking paper.

Typewriters do not judge our hesitation; they merely wait in patient stillness for the next word.`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    dateLabel: getFormattedDate(new Date(Date.now() - 86400000)),
    wordCount: 35,
    charCount: 226,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'slate',
  font: 'courier',
  spotlightIntensity: 'atmospheric',
  isMuted: false,
  volume: 0.65,
  typewriterLockEnabled: true,
};

export const App: React.FC = () => {
  // Load initial entries
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ENTRIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ENTRIES;
  });

  // Current active entry ID
  const [currentEntryId, setCurrentEntryId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_ID_KEY);
      if (saved) return saved;
    } catch {}
    return entries[0]?.id || 'entry-diary-default';
  });

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Caret and track position
  const [caretState, setCaretState] = useState<{ x: number; y: number; trackY: number }>({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.62,
    trackY: window.innerHeight * 0.62 + 22,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isEditorFocused, setIsEditorFocused] = useState<boolean>(true);

  // Active document
  const currentEntry = useMemo(() => {
    return entries.find((e) => e.id === currentEntryId) || entries[0];
  }, [entries, currentEntryId]);

  // Persist entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save entries to localStorage', e);
    }
  }, [entries]);

  // Persist current ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_ID_KEY, currentEntryId);
    } catch {}
  }, [currentEntryId]);

  // Persist settings & sync audio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
    typewriterAudio.setMuted(settings.isMuted);
    typewriterAudio.setVolume(settings.volume);
  }, [settings]);

  // Content change handler
  const handleContentChange = useCallback(
    (newContent: string) => {
      const words = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
      const chars = newContent.length;

      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== currentEntryId) return entry;
          return {
            ...entry,
            content: newContent,
            wordCount: words,
            charCount: chars,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [currentEntryId]
  );

  // Create new entry
  const handleCreateEntry = useCallback((type: EntryType) => {
    const today = getFormattedDate();
    const newId = `entry-${Date.now()}`;
    const newTitle =
      type === 'diary'
        ? `Diary — ${today}`
        : `Note — Untitled ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newEntry: JournalEntry = {
      id: newId,
      type,
      title: newTitle,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateLabel: today,
      wordCount: 0,
      charCount: 0,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setCurrentEntryId(newId);
  }, []);

  // Delete entry
  const handleDeleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (id === currentEntryId && next.length > 0) {
          setCurrentEntryId(next[0].id);
        }
        return next;
      });
    },
    [currentEntryId]
  );

  // Update title
  const handleUpdateTitle = useCallback((id: string, newTitle: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title: newTitle } : e))
    );
  }, []);

  // Update settings
  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Quick cycle theme
  const handleCycleTheme = useCallback(() => {
    const themeOrder: ThemeMode[] = ['slate', 'midnight', 'sepia'];
    const nextTheme = themeOrder[(themeOrder.indexOf(settings.theme) + 1) % themeOrder.length];
    handleUpdateSettings({ theme: nextTheme });
  }, [settings.theme, handleUpdateSettings]);

  // Quick cycle spotlight intensity
  const handleCycleSpotlight = useCallback(() => {
    const intensityOrder: SpotlightIntensity[] = ['off', 'subtle', 'atmospheric', 'dramatic'];
    const next =
      intensityOrder[(intensityOrder.indexOf(settings.spotlightIntensity) + 1) % intensityOrder.length];
    handleUpdateSettings({ spotlightIntensity: next });
  }, [settings.spotlightIntensity, handleUpdateSettings]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    handleUpdateSettings({ isMuted: !settings.isMuted });
  }, [settings.isMuted, handleUpdateSettings]);

  // Export handlers
  const handleExportMarkdown = useCallback(() => {
    if (!currentEntry) return;
    const blob = new Blob([currentEntry.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEntry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentEntry]);

  const handleExportText = useCallback(() => {
    if (!currentEntry) return;
    const blob = new Blob([currentEntry.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEntry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentEntry]);

  const handleExportAll = useCallback(() => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enspirewrite_archives_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (isModifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleCreateEntry('diary');
      } else if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateEntry('note');
      } else if (isModifier && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportMarkdown();
      } else if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSidebarOpen, handleCreateEntry, handleToggleMute, handleExportMarkdown]);

  // Theme styling for canvas
  const canvasBgClass = {
    slate: 'bg-[#9a9aa0] text-[#1c1b1f] paper-grain',
    midnight: 'bg-[#141416] text-[#f2eee6] paper-grain-dark',
    sepia: 'bg-[#d8d0c5] text-[#29211b] paper-grain',
  }[settings.theme];

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-500 ${canvasBgClass}`}
      style={{
        fontFamily:
          settings.font === 'ibm-plex'
            ? "'IBM Plex Mono', monospace"
            : "'Courier Prime', monospace",
      }}
    >
      {/* 1. MINIMAL HUD (Top Header) */}
      <MinimalHUD
        currentEntry={currentEntry}
        wordCount={currentEntry.wordCount}
        charCount={currentEntry.charCount}
        theme={settings.theme}
        font={settings.font}
        spotlightIntensity={settings.spotlightIntensity}
        isMuted={settings.isMuted}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleMute={handleToggleMute}
        onCycleTheme={handleCycleTheme}
        onExportMarkdown={handleExportMarkdown}
        onExportText={handleExportText}
        onCycleSpotlight={handleCycleSpotlight}
      />

      {/* 2. FIXED CARRIAGE TRACK, SLIDING PILL, & UPWARD CONE SPOTLIGHT */}
      <CarriageSpotlight
        caretX={caretState.x}
        trackY={caretState.trackY}
        theme={settings.theme}
        intensity={settings.spotlightIntensity}
        isFocused={isEditorFocused}
      />

      {/* 3. TYPEWRITER-SCROLL LOCK EDITOR CANVAS */}
      <main className="w-full h-full relative z-20">
        <EditorCanvas
          key={currentEntry.id}
          content={currentEntry.content}
          onChange={handleContentChange}
          theme={settings.theme}
          font={settings.font}
          typewriterLockEnabled={settings.typewriterLockEnabled}
          onCaretChange={(coords) => setCaretState(coords)}
          onFocusChange={(focused) => setIsEditorFocused(focused)}
        />
      </main>

      {/* 4. JOURNAL & NOTES ARCHIVE DRAWER */}
      <JournalSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        entries={entries}
        currentEntryId={currentEntry.id}
        onSelectEntry={(id) => setCurrentEntryId(id)}
        onCreateEntry={handleCreateEntry}
        onDeleteEntry={handleDeleteEntry}
        onUpdateTitle={handleUpdateTitle}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportAll={handleExportAll}
      />
    </div>
  );
};

export default App;
