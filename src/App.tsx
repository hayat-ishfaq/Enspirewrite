import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { CarriageSpotlight } from './components/CarriageSpotlight';
import { JournalSidebar } from './components/JournalSidebar';
import { MinimalHUD } from './components/MinimalHUD';
import { AuthModal } from './components/AuthModal';
import { typewriterAudio } from './audio/typewriterAudio';
import { authService } from './services/authService';
import type {
  JournalEntry,
  EntryType,
  AppSettings,
  ThemeMode,
  SpotlightIntensity,
  User,
} from './types';

const STORAGE_SETTINGS_KEY = 'enspirewrite_settings_v1';

function getFormattedDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function getInitialWelcomeContent(authorName: string = 'Writer'): string {
  return `# The Mechanical Ribbon
${getFormattedDate()}

Welcome to your personal archival ledger, ${authorName}.
There is a quiet dignity in the mechanical carriage. Every keystroke strikes with intention, leaving indelible ink upon the paper roll.

Notice how this line remains held at sixty-two percent down your screen. As your thoughts spill forward and you press return, the carriage slides upward with a crystalline chime, keeping your active line anchored directly above the polished metallic track.

Above the carriage, an upward beam of warm light cuts through the twilight, casting soft illumination on your immediate words while older passages gently dissolve into the atmosphere above.

Press [Ctrl + B] to open your ledger archives.
Press [Ctrl + M] to toggle mechanical key strikes.
Press Enter at the end of this line to hear the return bell...
`;
}

function createDefaultEntries(user?: User | null): JournalEntry[] {
  const authorName = user ? user.name : 'Writer';
  const welcomeText = getInitialWelcomeContent(authorName);
  const today = getFormattedDate();

  return [
    {
      id: `entry-diary-${Date.now()}`,
      userId: user?.id,
      type: 'diary',
      title: `Diary — ${today}`,
      content: welcomeText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateLabel: today,
      wordCount: welcomeText.trim().split(/\s+/).length,
      charCount: welcomeText.length,
    },
    {
      id: `entry-note-manifesto-${Date.now()}`,
      userId: user?.id,
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
}

function getStorageEntriesKey(user: User | null): string {
  return user ? `enspirewrite_entries_user_${user.id}` : 'enspirewrite_entries_guest_v1';
}

function getStorageCurrentIdKey(user: User | null): string {
  return user ? `enspirewrite_current_id_${user.id}` : 'enspirewrite_current_id_guest_v1';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'slate',
  font: 'courier',
  spotlightIntensity: 'atmospheric',
  isMuted: false,
  volume: 0.65,
  typewriterLockEnabled: true,
};

export const App: React.FC = () => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return authService.getCurrentUser();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Load entries for current user
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const key = getStorageEntriesKey(currentUser);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return createDefaultEntries(currentUser);
  });

  // Current active entry ID
  const [currentEntryId, setCurrentEntryId] = useState<string>(() => {
    const idKey = getStorageCurrentIdKey(currentUser);
    try {
      const saved = localStorage.getItem(idKey);
      if (saved && entries.some((e) => e.id === saved)) return saved;
    } catch {}
    return entries[0]?.id || '';
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

  // Switch ledger data when author account changes
  const switchAuthorAccount = useCallback((newUser: User | null) => {
    setCurrentUser(newUser);
    const key = getStorageEntriesKey(newUser);
    let userEntries: JournalEntry[] = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          userEntries = parsed;
        }
      }
    } catch {}

    if (userEntries.length === 0) {
      userEntries = createDefaultEntries(newUser);
    }

    setEntries(userEntries);
    const idKey = getStorageCurrentIdKey(newUser);
    const savedId = localStorage.getItem(idKey);
    if (savedId && userEntries.some((e) => e.id === savedId)) {
      setCurrentEntryId(savedId);
    } else {
      setCurrentEntryId(userEntries[0]?.id || '');
    }
  }, []);

  const handleAuthSuccess = (user: User) => {
    switchAuthorAccount(user);
  };

  const handleSignOut = () => {
    authService.signOut();
    switchAuthorAccount(null);
  };

  // Active document
  const currentEntry = useMemo(() => {
    return entries.find((e) => e.id === currentEntryId) || entries[0] || createDefaultEntries(currentUser)[0];
  }, [entries, currentEntryId, currentUser]);

  // Persist entries to user-scoped storage
  useEffect(() => {
    const key = getStorageEntriesKey(currentUser);
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save entries to localStorage', e);
    }
  }, [entries, currentUser]);

  // Persist current ID
  useEffect(() => {
    const idKey = getStorageCurrentIdKey(currentUser);
    try {
      localStorage.setItem(idKey, currentEntryId);
    } catch {}
  }, [currentEntryId, currentUser]);

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
      userId: currentUser?.id,
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
  }, [currentUser]);

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
    const authorTag = currentUser ? currentUser.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'guest';
    a.download = `enspirewrite_${authorTag}_archives_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, currentUser]);

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
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
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
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onSelectEntry={(id) => setCurrentEntryId(id)}
        onCreateEntry={handleCreateEntry}
        onDeleteEntry={handleDeleteEntry}
        onUpdateTitle={handleUpdateTitle}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportAll={handleExportAll}
      />

      {/* 5. AUTHOR AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        theme={settings.theme}
      />
    </div>
  );
};

export default App;
