import React, { useRef, useEffect, useCallback, useState } from 'react';
import { getCaretCoordinates } from '../utils/caretPosition';
import { typewriterAudio } from '../audio/typewriterAudio';
import type { ThemeMode, FontChoice } from '../types';

interface EditorCanvasProps {
  content: string;
  onChange: (newContent: string) => void;
  theme: ThemeMode;
  font: FontChoice;
  typewriterLockEnabled: boolean;
  onCaretChange: (coords: { x: number; y: number; trackY: number }) => void;
  onFocusChange: (isFocused: boolean) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  content,
  onChange,
  theme,
  font,
  typewriterLockEnabled,
  onCaretChange,
  onFocusChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef<boolean>(false);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const [isScrolledAway, setIsScrolledAway] = useState<boolean>(false);

  // Font family string with robust offline fallbacks
  const fontFamily =
    font === 'ibm-plex'
      ? "'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace"
      : "'Courier Prime', 'Courier New', 'Courier', monospace";

  // Ink color according to theme
  const inkColor = {
    slate: 'text-[#1a1a20] placeholder-[#5c5c66]',
    midnight: 'text-[#f2eee6] placeholder-[#6b6862]',
    sepia: 'text-[#2a221a] placeholder-[#7d6f63]',
  }[theme];

  // Dynamically adjust textarea height to fit content exactly so it never scrolls internally
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.max(320, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Measure and align caret and scroll lock
  const updateCaretAndScroll = useCallback(
    (smoothScroll: boolean = false, forceLock: boolean = false) => {
      const textarea = textareaRef.current;
      const container = containerRef.current;
      if (!textarea || !container) return;

      adjustTextareaHeight();

      const vh = window.innerHeight;
      const lockViewportY = vh * 0.62; // 62% down the viewport
      const trackY = lockViewportY + 22; // Hairline track directly below baseline

      const coords = getCaretCoordinates(textarea, textarea.selectionStart);

      // Caret X on screen
      const caretX = coords.viewportX;

      onCaretChange({
        x: caretX,
        y: lockViewportY,
        trackY,
      });

      if (!typewriterLockEnabled) return;

      // Calculate desired scroll position
      // Top padding of container is 65vh
      const paddingTop = vh * 0.65;
      const lineYInContainer = paddingTop + coords.elementY;
      const targetScrollTop = Math.max(0, lineYInContainer - lockViewportY + coords.lineHeight / 2);

      // If user is actively scrolling with mouse wheel and not forcing a lock, don't interrupt
      if (isUserScrollingRef.current && !forceLock) {
        const diff = Math.abs(container.scrollTop - targetScrollTop);
        setIsScrolledAway(diff > 60);
        return;
      }

      setIsScrolledAway(false);

      if (Math.abs(container.scrollTop - targetScrollTop) > 2) {
        if (smoothScroll) {
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        } else {
          container.scrollTop = targetScrollTop;
        }
      }
    },
    [onCaretChange, typewriterLockEnabled, adjustTextareaHeight]
  );

  // Synchronize on content changes or window resize
  useEffect(() => {
    const handleResize = () => {
      adjustTextareaHeight();
      updateCaretAndScroll(false, true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCaretAndScroll, adjustTextareaHeight]);

  // Adjust height and initial positioning after mount or content change
  useEffect(() => {
    adjustTextareaHeight();
    const timer = setTimeout(() => {
      updateCaretAndScroll(false, true);
    }, 60);
    return () => clearTimeout(timer);
  }, [content, updateCaretAndScroll, adjustTextareaHeight]);

  // Detect manual mouse wheel scrolling so the user can freely scroll up/down without fighting the lock
  const handleWheel = () => {
    isUserScrollingRef.current = true;
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = window.setTimeout(() => {
      isUserScrollingRef.current = false;
      const container = containerRef.current;
      const textarea = textareaRef.current;
      if (container && textarea) {
        const vh = window.innerHeight;
        const lockViewportY = vh * 0.62;
        const coords = getCaretCoordinates(textarea, textarea.selectionStart);
        const paddingTop = vh * 0.65;
        const lineYInContainer = paddingTop + coords.elementY;
        const targetScrollTop = Math.max(0, lineYInContainer - lockViewportY + coords.lineHeight / 2);
        setIsScrolledAway(Math.abs(container.scrollTop - targetScrollTop) > 60);
      }
    }, 1200);
  };

  // Re-center on active line
  const handleRecenter = () => {
    isUserScrollingRef.current = false;
    updateCaretAndScroll(true, true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle keyboard sound synthesis & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    isUserScrollingRef.current = false;

    // Check if audio should play
    if (e.key === 'Enter') {
      typewriterAudio.playCarriageReturn();
      // On enter, smoothly scroll upward so the new line settles on 62vh
      setTimeout(() => {
        updateCaretAndScroll(true, true);
      }, 10);
      return;
    }

    if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Delete') {
      typewriterAudio.playHeavyThud();
    } else if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      typewriterAudio.playKeyClick();
    }

    // Navigation keys (ArrowUp, ArrowDown, PageUp, PageDown, Home, End):
    // Use smooth scroll so line jumps feel tactile and graceful
    const isNavKey =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Home' ||
      e.key === 'End';

    setTimeout(() => {
      updateCaretAndScroll(isNavKey, true);
    }, 0);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isNavKey =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown';

    setTimeout(() => {
      updateCaretAndScroll(isNavKey, true);
    }, 0);
  };

  const handleClick = () => {
    isUserScrollingRef.current = false;
    setTimeout(() => {
      updateCaretAndScroll(true, true);
    }, 0);
  };

  const handleSelect = () => {
    setTimeout(() => {
      updateCaretAndScroll(false, false);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isUserScrollingRef.current = false;
    onChange(e.target.value);
    adjustTextareaHeight();
    setTimeout(() => {
      updateCaretAndScroll(false, true);
    }, 0);
  };

  // Focus textarea when clicking anywhere in canvas container
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onClick={handleContainerClick}
      className="relative w-full h-full overflow-y-scroll overscroll-y-contain no-scrollbar cursor-text select-text"
      style={{
        paddingTop: '65vh',
        paddingBottom: '60vh',
      }}
    >
      <div className="w-full max-w-3xl mx-auto px-8 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          onSelect={handleSelect}
          onFocus={() => {
            onFocusChange(true);
            updateCaretAndScroll(false, true);
          }}
          onBlur={() => {
            onFocusChange(false);
          }}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            updateCaretAndScroll(false, true);
          }}
          spellCheck={false}
          autoFocus
          placeholder="Begin typing your thoughts into the ribbon..."
          className={`w-full bg-transparent resize-none border-none outline-none overflow-hidden text-[18px] leading-[32.4px] ${inkColor} selection:bg-amber-400/25 selection:text-current`}
          style={{
            fontFamily,
            minHeight: '320px',
          }}
        />
      </div>

      {/* Subtle "Return to Carriage" indicator when user manually scrolls far away */}
      {isScrolledAway && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRecenter();
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full border border-current/20 bg-black/60 dark:bg-white/10 text-white backdrop-blur-md text-xs font-mono tracking-wider uppercase cursor-pointer shadow-lg transition-all hover:scale-105 active:scale-95 animate-fade-in flex items-center gap-2"
        >
          <span>Return to Active Line</span>
          <span className="text-[10px] opacity-60">↓</span>
        </button>
      )}
    </div>
  );
};
