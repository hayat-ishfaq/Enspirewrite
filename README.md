# Enspirewrite — Tactile Vintage Typewriter Journal & Notes

A minimalist, tactile, vintage-typewriter-inspired journaling, diary, and notes application built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**, configured and ready for **Tauri v2** desktop packaging.

---

## Key Features & Signature Mechanics

### 1. Vertical Typewriter-Scroll Lock
- The active line of text remains **vertically anchored at 62% down the viewport height**.
- Pressing `Enter` or wrapping smoothly advances the platen upward so the active line always sits directly above the fixed hairline track.
- Generous container padding (`65vh` top, `40vh` bottom) ensures the very first line and last line can sit cleanly on the active line.
- Toggle between **Locked** and **Free Scroll** in the Machine Config panel.

### 2. Sliding Carriage Track & Pill
- A thin, 1px horizontal hairline track stretches full-width across the platen at `62vh + 22px`.
- A sleek, 28px × 6px metallic/frosted pill slider tracks the exact horizontal X coordinate of the cursor with **GPU-accelerated 50ms ease-out transitions**.
- Includes subtle vintage carriage graduation ruler markings.

### 3. Upward "Headlight / Spotlight" Cone Illumination
- Moody atmospheric canvas:
  - **Slate (Default)**: Soft shadowy slate-gray `#9a9aa0` with dark charcoal ink `#1c1b1f`.
  - **Midnight**: Nocturnal study tone `#141416` with warm ivory ink `#f2eee6`.
  - **Sepia Parchment**: Antique desk tone `#d8d0c5` with rich walnut ink `#29211b`.
- Radiates upward from the carriage pill (`caretX, trackY`) with layered radial, conic, and polygon gradient beams (`rgba(255, 248, 225, 0.75)`).
- Naturally illuminates text directly above the cursor while older lines drift into soft shadow.
- 4-level intensity toggle: `Off` · `Subtle` · `Atmospheric` · `Dramatic`.

### 4. Zero-Latency Synthesized Web Audio API Engine
- **No external MP3 files required**: 100% synthesized in-browser using standard Web Audio oscillators, noise buffers, and biquad filters.
- **Key Clicks**: Crisp mechanical strike transient + platen cylinder thump + spring shimmer with organic pitch jitter.
- **Space & Backspace**: Deeper platen thud and heavy escapement inertia.
- **Enter / Return**: Clear, crystalline metallic bell chime (C7 fundamental + harmonic overtone) followed by a carriage ratchet glide whoosh.
- Volume slider & mute toggle (`Ctrl + M`).

### 5. Journal & Notes Archival Ledger
- Slide-out drawer (`Ctrl + B` or click `Index`):
  - **Diary Entries**: Auto-dated (e.g. `Nov 18, 2026`).
  - **Freeform Notes**: Blank notes with double-click title renaming.
  - Instant fuzzy/substring search over titles, dates, and contents.
  - Filter tabs: All, Diary, Notes.
  - Auto-persisted to `localStorage`.
- One-click export to **Markdown (`.md`)**, **Plain Text (`.txt`)**, or complete **JSON archive**.

### 6. Minimalist Distraction-Free HUD
- Live word and character counter (`142 w | 840 c`).
- Subtly dims when typing, smoothly expands on hover.
- Fullscreen focus toggle.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl / Cmd + B` | Toggle Archival Drawer |
| `Ctrl / Cmd + D` | Create Today's Diary Entry |
| `Ctrl / Cmd + N` | Create Blank Note |
| `Ctrl / Cmd + M` | Toggle Mechanical Audio Mute |
| `Ctrl / Cmd + S` | Export Current Note as Markdown (.md) |
| `Esc` | Close Archival Drawer |

---

## Desktop Packaging (Tauri v2)

The repository is pre-configured for Tauri v2 desktop builds:
- Configuration: `src-tauri/tauri.conf.json`
- Rust Entrypoint: `src-tauri/src/main.rs`
- Cargo manifest: `src-tauri/Cargo.toml`
- Capabilities: `src-tauri/capabilities/default.json`

To build the desktop executable on Windows, macOS, or Linux:
```bash
npm install -g @tauri-apps/cli
cargo tauri build
```
