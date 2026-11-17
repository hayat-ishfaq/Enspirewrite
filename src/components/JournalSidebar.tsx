import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  FileText,
  Search,
  Trash2,
  Calendar,
  Sliders,
  Type,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Sparkles,
  Download,
  User as UserIcon,
  LogOut,
  Feather,
} from 'lucide-react';
import type {
  JournalEntry,
  EntryType,
  ThemeMode,
  SpotlightIntensity,
  AppSettings,
  User,
} from '../types';

interface JournalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  currentEntryId: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSelectEntry: (id: string) => void;
  onCreateEntry: (type: EntryType) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportAll: () => void;
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  isOpen,
  onClose,
  entries,
  currentEntryId,
  currentUser,
  onOpenAuth,
  onSignOut,
  onSelectEntry,
  onCreateEntry,
  onDeleteEntry,
  onUpdateTitle,
  settings,
  onUpdateSettings,
  onExportAll,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'diary' | 'note'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entries' | 'settings'>('entries');

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesType = filterType === 'all' || entry.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.dateLabel.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [entries, filterType, searchQuery]);

  // Total words across user's archives
  const totalWords = useMemo(() => {
    return entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
  }, [entries]);

  // Handle inline title editing
  const handleStartEditTitle = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(entry.id);
    setEditTitleValue(entry.title);
  };

  const handleSaveTitle = (id: string) => {
    if (editTitleValue.trim()) {
      onUpdateTitle(id, editTitleValue.trim());
    }
    setEditingTitleId(null);
  };

  // Color scheme based on active theme
  const sidebarStyles = {
    slate: {
      bg: 'bg-[#919198] text-zinc-900 border-zinc-500/40',
      itemActive: 'bg-zinc-800/15 border-zinc-700/50 shadow-sm',
      itemHover: 'hover:bg-zinc-800/8 border-transparent',
      input: 'bg-zinc-200/50 border-zinc-400 focus:border-zinc-800 text-zinc-900',
      badge: 'bg-zinc-800/10 text-zinc-800',
      tabActive: 'border-zinc-900 font-bold',
      tabInactive: 'border-transparent opacity-60 hover:opacity-100',
    },
    midnight: {
      bg: 'bg-[#141416] text-zinc-200 border-zinc-800/80',
      itemActive: 'bg-zinc-800/60 border-zinc-700/60 shadow-sm',
      itemHover: 'hover:bg-zinc-800/30 border-transparent',
      input: 'bg-zinc-900/80 border-zinc-700 focus:border-zinc-400 text-zinc-100',
      badge: 'bg-zinc-800 text-zinc-300',
      tabActive: 'border-zinc-200 font-bold',
      tabInactive: 'border-transparent opacity-50 hover:opacity-100',
    },
    sepia: {
      bg: 'bg-[#d0c6b8] text-amber-950 border-[#b8ab9a]',
      itemActive: 'bg-amber-900/15 border-amber-900/30 shadow-sm',
      itemHover: 'hover:bg-amber-900/8 border-transparent',
      input: 'bg-[#dfd7cb] border-[#bdae9c] focus:border-amber-900 text-amber-950',
      badge: 'bg-amber-900/10 text-amber-900',
      tabActive: 'border-amber-950 font-bold',
      tabInactive: 'border-transparent opacity-60 hover:opacity-100',
    },
  }[settings.theme];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-84 sm:w-96 z-50 shadow-2xl flex flex-col font-mono text-sm border-r transition-transform duration-300 ease-in-out ${
          sidebarStyles.bg
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Header Bar */}
        <div className="p-5 border-b border-current/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-current opacity-70" />
            <h2 className="font-bold tracking-wider text-xs uppercase">
              Enspirewrite Ledger
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-current/10 transition-colors cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Author Status Card */}
        <div className="p-3.5 border-b border-current/10 bg-current/5 text-xs flex items-center justify-between">
          {currentUser ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="w-7 h-7 rounded-full bg-current text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.avatarLetter}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{currentUser.name}</div>
                <div className="text-[10px] opacity-60 truncate">
                  {entries.length} docs · {totalWords} words written
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded hover:bg-current/10 text-red-500/80 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Feather className="w-3.5 h-3.5 opacity-60" />
                <span className="text-[11px] opacity-75">Guest Writer</span>
              </div>
              <button
                onClick={() => {
                  onOpenAuth();
                  onClose();
                }}
                className="px-2.5 py-1 rounded border border-current/25 hover:bg-current/10 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserIcon className="w-3 h-3" />
                <span>Sign In / Up</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs (Entries vs Settings) */}
        <div className="flex border-b border-current/15 text-xs">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 py-3 text-center border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'entries' ? sidebarStyles.tabActive : sidebarStyles.tabInactive
            }`}
          >
            Archives ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'settings' ? sidebarStyles.tabActive : sidebarStyles.tabInactive
            }`}
          >
            Machine Config
          </button>
        </div>

        {activeTab === 'entries' ? (
          <>
            {/* Quick Actions (New Diary / New Note) */}
            <div className="p-4 grid grid-cols-2 gap-2 border-b border-current/10">
              <button
                onClick={() => onCreateEntry('diary')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-current/20 bg-current/5 hover:bg-current/10 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>+ Today's Diary</span>
              </button>
              <button
                onClick={() => onCreateEntry('note')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-current/20 bg-current/5 hover:bg-current/10 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>+ Blank Note</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 space-y-3 border-b border-current/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
                <input
                  type="text"
                  placeholder="Search archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded border outline-none font-mono ${sidebarStyles.input}`}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    filterType === 'all' ? sidebarStyles.badge : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  All ({entries.length})
                </button>
                <button
                  onClick={() => setFilterType('diary')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    filterType === 'diary' ? sidebarStyles.badge : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  Diary ({entries.filter((e) => e.type === 'diary').length})
                </button>
                <button
                  onClick={() => setFilterType('note')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    filterType === 'note' ? sidebarStyles.badge : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Notes ({entries.filter((e) => e.type === 'note').length})
                </button>
              </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 opacity-50 text-xs">
                  No records match your query.
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isCurrent = entry.id === currentEntryId;
                  const isEditing = editingTitleId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        onSelectEntry(entry.id);
                        if (window.innerWidth < 640) onClose();
                      }}
                      className={`group relative p-3 rounded-md border transition-all cursor-pointer ${
                        isCurrent ? sidebarStyles.itemActive : sidebarStyles.itemHover
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitleValue}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onBlur={() => handleSaveTitle(entry.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(entry.id);
                              if (e.key === 'Escape') setEditingTitleId(null);
                            }}
                            className={`w-full px-1 py-0.5 text-xs font-semibold rounded border outline-none ${sidebarStyles.input}`}
                          />
                        ) : (
                          <div
                            onDoubleClick={(e) => handleStartEditTitle(entry, e)}
                            className="font-semibold text-xs truncate flex-1"
                            title="Double-click to rename"
                          >
                            {entry.title}
                          </div>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {entries.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(`Delete "${entry.title}"? This cannot be undone.`)
                                ) {
                                  onDeleteEntry(entry.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-60 mt-1.5">
                        <span className="flex items-center gap-1">
                          {entry.type === 'diary' ? (
                            <BookOpen className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span>{entry.dateLabel}</span>
                        </span>
                        <span>
                          {entry.wordCount} words · {entry.charCount} chars
                        </span>
                      </div>

                      {entry.content && (
                        <div className="text-[11px] opacity-45 line-clamp-1 mt-1 font-serif italic">
                          {entry.content.slice(0, 80).replace(/\n/g, ' ')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Export All Action */}
            <div className="p-3 border-t border-current/15">
              <button
                onClick={onExportAll}
                className="w-full flex items-center justify-center gap-2 py-2 rounded border border-current/20 hover:bg-current/10 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All Archives (.json)</span>
              </button>
            </div>
          </>
        ) : (
          /* Settings / Machine Config Tab */
          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar text-xs">
            {/* Visual Canvas Theme */}
            <div className="space-y-2">
              <label className="font-semibold uppercase tracking-wider flex items-center gap-2 opacity-80">
                <Sliders className="w-3.5 h-3.5" />
                <span>Canvas Atmosphere</span>
              </label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['slate', 'midnight', 'sepia'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateSettings({ theme: mode })}
                    className={`py-2 px-2.5 rounded border text-center uppercase tracking-wider transition-all cursor-pointer font-semibold ${
                      settings.theme === mode
                        ? 'border-current bg-current/15 ring-1 ring-current'
                        : 'border-current/20 hover:bg-current/5'
                    }`}
                  >
                    {mode === 'slate' && 'Slate (Default)'}
                    {mode === 'midnight' && 'Midnight'}
                    {mode === 'sepia' && 'Sepia'}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <label className="font-semibold uppercase tracking-wider flex items-center gap-2 opacity-80">
                <Type className="w-3.5 h-3.5" />
                <span>Typeface Family</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onUpdateSettings({ font: 'courier' })}
                  className={`py-2 px-3 rounded border text-center transition-all cursor-pointer ${
                    settings.font === 'courier'
                      ? 'border-current bg-current/15 ring-1 ring-current font-bold'
                      : 'border-current/20 hover:bg-current/5'
                  }`}
                  style={{ fontFamily: "'Courier Prime', monospace" }}
                >
                  Courier Prime
                </button>
                <button
                  onClick={() => onUpdateSettings({ font: 'ibm-plex' })}
                  className={`py-2 px-3 rounded border text-center transition-all cursor-pointer ${
                    settings.font === 'ibm-plex'
                      ? 'border-current bg-current/15 ring-1 ring-current font-bold'
                      : 'border-current/20 hover:bg-current/5'
                  }`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  IBM Plex Mono
                </button>
              </div>
            </div>

            {/* Headlight / Spotlight Beam Intensity */}
            <div className="space-y-2">
              <label className="font-semibold uppercase tracking-wider flex items-center gap-2 opacity-80">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spotlight Cone Intensity</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['off', 'subtle', 'atmospheric', 'dramatic'] as SpotlightIntensity[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => onUpdateSettings({ spotlightIntensity: level })}
                    className={`py-2 px-2.5 rounded border text-center capitalize transition-all cursor-pointer ${
                      settings.spotlightIntensity === level
                        ? 'border-current bg-current/15 ring-1 ring-current font-bold'
                        : 'border-current/20 hover:bg-current/5'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Typewriter Scroll Lock */}
            <div className="space-y-2 border-t border-current/15 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold uppercase tracking-wider flex items-center gap-2">
                    {settings.typewriterLockEnabled ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                    <span>Typewriter-Scroll Lock</span>
                  </div>
                  <div className="text-[11px] opacity-60 mt-0.5">
                    Locks active line at 62% viewport height
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      typewriterLockEnabled: !settings.typewriterLockEnabled,
                    })
                  }
                  className={`px-3 py-1.5 rounded border text-xs uppercase font-bold cursor-pointer transition-colors ${
                    settings.typewriterLockEnabled
                      ? 'bg-current text-white dark:text-black border-current'
                      : 'border-current/30 hover:bg-current/10'
                  }`}
                >
                  {settings.typewriterLockEnabled ? 'Locked' : 'Free'}
                </button>
              </div>
            </div>

            {/* Mechanical Audio Synthesizer */}
            <div className="space-y-3 border-t border-current/15 pt-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold uppercase tracking-wider flex items-center gap-2">
                  {settings.isMuted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>Mechanical Audio</span>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ isMuted: !settings.isMuted })
                  }
                  className={`px-3 py-1.5 rounded border text-xs uppercase font-bold cursor-pointer transition-colors ${
                    !settings.isMuted
                      ? 'bg-current text-white dark:text-black border-current'
                      : 'border-current/30 text-red-500'
                  }`}
                >
                  {settings.isMuted ? 'Muted' : 'Active'}
                </button>
              </div>

              {!settings.isMuted && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>Platen & Bell Volume</span>
                    <span>{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) =>
                      onUpdateSettings({ volume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-current cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Tactile Keyboard Shortcuts Quick Guide */}
            <div className="border-t border-current/15 pt-4 space-y-2 text-[11px] opacity-75">
              <div className="font-semibold uppercase tracking-wider">
                Keyboard Navigation
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Toggle Index Drawer</span>
                  <span className="font-mono bg-current/10 px-1 rounded">Ctrl + B</span>
                </div>
                <div className="flex justify-between">
                  <span>New Diary Entry</span>
                  <span className="font-mono bg-current/10 px-1 rounded">Ctrl + D</span>
                </div>
                <div className="flex justify-between">
                  <span>New Note</span>
                  <span className="font-mono bg-current/10 px-1 rounded">Ctrl + N</span>
                </div>
                <div className="flex justify-between">
                  <span>Toggle Audio Mute</span>
                  <span className="font-mono bg-current/10 px-1 rounded">Ctrl + M</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Markdown</span>
                  <span className="font-mono bg-current/10 px-1 rounded">Ctrl + S</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
