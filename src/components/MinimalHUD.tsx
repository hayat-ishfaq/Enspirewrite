import React from 'react';
import {
  Menu,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Coffee,
  Download,
  Sliders,
  Maximize2,
  Minimize2,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import type { ThemeMode, FontChoice, SpotlightIntensity, JournalEntry, User } from '../types';

interface MinimalHUDProps {
  currentEntry: JournalEntry;
  wordCount: number;
  charCount: number;
  theme: ThemeMode;
  font: FontChoice;
  spotlightIntensity: SpotlightIntensity;
  isMuted: boolean;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onToggleSidebar: () => void;
  onToggleMute: () => void;
  onCycleTheme: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onCycleSpotlight: () => void;
}

export const MinimalHUD: React.FC<MinimalHUDProps> = ({
  currentEntry,
  wordCount,
  charCount,
  theme,
  spotlightIntensity,
  isMuted,
  currentUser,
  onOpenAuth,
  onSignOut,
  onToggleSidebar,
  onToggleMute,
  onCycleTheme,
  onExportMarkdown,
  onExportText,
  onCycleSpotlight,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = React.useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = React.useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Text color based on theme
  const hudTextColor = {
    slate: 'text-zinc-700/80 hover:text-zinc-950',
    midnight: 'text-zinc-400/80 hover:text-zinc-100',
    sepia: 'text-amber-900/80 hover:text-amber-950',
  }[theme];

  const pillBg = {
    slate: 'bg-zinc-200/60 hover:bg-zinc-200/90 border-zinc-300/60 text-zinc-800',
    midnight: 'bg-zinc-900/70 hover:bg-zinc-800/90 border-zinc-800/80 text-zinc-300',
    sepia: 'bg-[#e5ddd0]/80 hover:bg-[#ded4c4] border-[#cfc4b2] text-amber-950',
  }[theme];

  const dropdownBg = {
    slate: 'bg-[#9a9aa0]/95 border-zinc-400 text-zinc-900 shadow-xl',
    midnight: 'bg-[#18181c]/95 border-zinc-800 text-zinc-200 shadow-xl',
    sepia: 'bg-[#d8d0c5]/95 border-[#c4baa9] text-amber-950 shadow-xl',
  }[theme];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none p-4 sm:p-6 flex items-center justify-between">
      {/* TOP-LEFT: Subtle Drawer Trigger & Document Title */}
      <div className="pointer-events-auto flex items-center gap-3 transition-opacity duration-300 opacity-60 hover:opacity-100">
        <button
          onClick={onToggleSidebar}
          title="Open Journal & Notes Drawer (Ctrl + B)"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs tracking-wider uppercase font-mono transition-all backdrop-blur-sm cursor-pointer shadow-sm ${pillBg}`}
        >
          <Menu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Index</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono select-none">
          <span className={`font-semibold truncate max-w-[140px] sm:max-w-[240px] ${hudTextColor}`}>
            {currentEntry.title}
          </span>
          <span className="text-[10px] opacity-50 px-1.5 py-0.5 rounded border border-current">
            {currentEntry.type === 'diary' ? 'DIARY' : 'NOTE'}
          </span>
        </div>
      </div>

      {/* TOP-RIGHT: User Account, Word Count & Tactile Controls */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 transition-opacity duration-300 opacity-60 hover:opacity-100">
        {/* User Account / Sign In Badge */}
        <div className="relative">
          {currentUser ? (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={`Logged in as ${currentUser.name} (${currentUser.email})`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
            >
              <span className="w-4 h-4 rounded-full bg-current text-white dark:text-black flex items-center justify-center text-[10px] font-bold">
                {currentUser.avatarLetter}
              </span>
              <span className="hidden md:inline font-medium max-w-[90px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Sign In / Create Author Account"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Sign In</span>
            </button>
          )}

          {showUserMenu && currentUser && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-lg border p-1 font-mono text-xs z-50 backdrop-blur-md ${dropdownBg}`}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-current/15 mb-1">
                <div className="font-bold truncate">{currentUser.name}</div>
                <div className="text-[10px] opacity-60 truncate">{currentUser.email}</div>
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Words and Characters Counter */}
        <div
          className={`px-3 py-1.5 rounded-md border text-xs font-mono tracking-tight select-none backdrop-blur-sm shadow-sm ${pillBg}`}
          title="Live Word & Character Counter"
        >
          <span className="font-semibold">{wordCount}</span>
          <span className="opacity-60 ml-1">w</span>
          <span className="opacity-30 mx-1.5">|</span>
          <span className="font-semibold">{charCount}</span>
          <span className="opacity-60 ml-1">c</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Mechanical Audio (Ctrl + M)' : 'Mute Mechanical Audio (Ctrl + M)'}
          className={`p-1.5 rounded-md border transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-500/80" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Light Cone Intensity Cycle */}
        <button
          onClick={onCycleSpotlight}
          title={`Spotlight Intensity: ${spotlightIntensity.toUpperCase()} (Click to cycle)`}
          className={`p-1.5 rounded-md border transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Theme Cycle Button */}
        <button
          onClick={onCycleTheme}
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          className={`p-1.5 rounded-md border transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
        >
          {theme === 'slate' && <Sun className="w-4 h-4" />}
          {theme === 'midnight' && <Moon className="w-4 h-4" />}
          {theme === 'sepia' && <Coffee className="w-4 h-4" />}
        </button>

        {/* Export Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Document (.md / .txt)"
            className={`p-1.5 rounded-md border transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
          >
            <Download className="w-4 h-4" />
          </button>

          {showExportMenu && (
            <div
              className={`absolute right-0 mt-2 w-44 rounded-lg border p-1 font-mono text-xs z-50 backdrop-blur-md ${dropdownBg}`}
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider opacity-60 font-semibold border-b border-current/15 mb-1">
                Export As
              </div>
              <button
                onClick={() => {
                  onExportMarkdown();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Markdown</span>
                <span className="text-[10px] opacity-60 font-semibold">.md</span>
              </button>
              <button
                onClick={() => {
                  onExportText();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Plain Text</span>
                <span className="text-[10px] opacity-60 font-semibold">.txt</span>
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Focus"
          className={`hidden md:flex p-1.5 rounded-md border transition-all cursor-pointer backdrop-blur-sm shadow-sm ${pillBg}`}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
