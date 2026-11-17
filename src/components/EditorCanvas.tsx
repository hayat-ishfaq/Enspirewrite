import React, { useRef, useEffect, useCallback } from 'react';
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
  const lastScrollTopRef = useRef<number>(0);

  // Font family string
  const fontFamily =
    font === 'ibm-plex'
      ? "'IBM Plex Mono', monospace"
      : "'Courier Prime', monospace";

  // Ink color according to theme
  const inkColor = {
    slate: 'text-[#1a1a20] placeholder-[#5c5c66]',
    midnight: 'text-[#f2eee6] placeholder-[#6b6862]',
    sepia: 'text-[#2a221a] placeholder-[#7d6f63]',
  }[theme];

  // Measure and align caret and scroll lock
  const updateCaretAndScroll = useCallback(
    (smoothScroll: boolean = false) => {
      const textarea = textareaRef.current;
      const container = containerRef.current;
      if (!textarea || !container) return;

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
      // In our container: top padding is 65vh, bottom padding is 40vh
      const paddingTop = vh * 0.65;
      const lineYInContainer = paddingTop + coords.elementY;
      const targetScrollTop = lineYInContainer - lockViewportY + coords.lineHeight / 2;

      if (Math.abs(container.scrollTop - targetScrollTop) > 1) {
        if (smoothScroll) {
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        } else {
          container.scrollTop = targetScrollTop;
        }
        lastScrollTopRef.current = targetScrollTop;
      }
    },
    [onCaretChange, typewriterLockEnabled]
  );

  // Synchronize on content changes or window resize
  useEffect(() => {
    const handleResize = () => {
      updateCaretAndScroll(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCaretAndScroll]);

  // Initial positioning after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCaretAndScroll(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [content, updateCaretAndScroll]);

  // Handle keyboard sound synthesis & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if audio should play
    if (e.key === 'Enter') {
      typewriterAudio.playCarriageReturn();
      // On enter, give smooth scroll upwards to feel like a carriage return
      requestAnimationFrame(() => {
        updateCaretAndScroll(true);
      });
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

    // Defer coordinate update to after DOM mutation
    requestAnimationFrame(() => {
      updateCaretAndScroll(false);
    });
  };

  const handleKeyUp = () => {
    updateCaretAndScroll(false);
  };

  const handleClick = () => {
    updateCaretAndScroll(true);
  };

  const handleSelect = () => {
    updateCaretAndScroll(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    requestAnimationFrame(() => {
      updateCaretAndScroll(false);
    });
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
      onClick={handleContainerClick}
      className="relative w-full h-full overflow-y-auto no-scrollbar cursor-text select-text"
      style={{
        paddingTop: '65vh',
        paddingBottom: '40vh',
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
            updateCaretAndScroll(false);
          }}
          onBlur={() => {
            onFocusChange(false);
          }}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            updateCaretAndScroll(false);
          }}
          spellCheck={false}
          autoFocus
          placeholder="Begin typing your thoughts into the ribbon..."
          className={`w-full bg-transparent resize-none border-none outline-none overflow-hidden text-[18px] leading-[32.4px] ${inkColor} selection:bg-amber-400/25 selection:text-current`}
          style={{
            fontFamily,
            minHeight: '280px',
            height: 'auto',
          }}
          rows={Math.max(12, content.split('\n').length + 3)}
        />
      </div>
    </div>
  );
};
