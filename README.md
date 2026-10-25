# Brain Tiles ⚡ — Futuristic Number Merge Arcade

> Modern, immersive futuristic arcade puzzle game built with pure HTML5, CSS3, and Vanilla JavaScript.

**Brain Tiles** is a 4×4 number fusion arcade puzzle inspired by the classic 2048 concept, featuring an electric neon arcade visual identity (deep midnight space background, animated perspective synth grid, floating glowing motes, layered glass-metal bezel frame, and vivid energy tile progression), fluid CSS sliding animations, synthesized Web Audio FX, robust state persistence, single-step undo capability, and touch support.

---

## 🎮 Features

- **Accurate 2048 Engine**:
  - Deterministic 4×4 board mechanics.
  - Tiles merge only once per move.
  - Score increments by the value of each newly created tile.
  - 90% chance of spawning 2, 10% chance of spawning 4 on valid moves.
  - Invalid moves that don't alter the board trigger a subtle shake animation without spawning any tile.
  - Full board merge check prevents premature game-over when valid moves exist.
- **Victory & Endless Mode**:
  - Reaching the **2048** tile unlocks the cosmic victory overlay.
  - Players can choose **"Keep Going"** to continue merging up to 4096, 8192, and beyond without interruptions.
- **Full Undo Support**:
  - Snapshot state history allows instant recovery from accidental moves or game-over states.
- **Audio Synthesis**:
  - Custom Web Audio API synthesized audio (slide sweeps, harmonic merge chimes, 2048 victory fanfare, game-over minor cadence).
  - Toggleable mute button with persistent state.
  - Zero external sound files or asset dependencies.
- **Persistence (`localStorage`)**:
  - Automatically saves board configuration, current score, high score, victory state, and undo snapshot.
  - Resumes on browser refresh or tab reopen.
- **Responsive & Mobile-Optimized**:
  - Prevents accidental page scrolling when swiping inside the game board (`touch-action: none`).
  - Fluid sizing adapted for screens from 320px to 4K displays.
  - On-screen touch D-pad for mobile accessibility.
- **AdSense & Monetization Ready**:
  - Clean semantic slot `<aside class="ad-slot-container">` placed outside gameplay controls without simulated or intrusive ads.
- **SEO & Accessibility**:
  - Open Graph meta tags, semantic HTML tags, accessible ARIA roles, live regions, and visible keyboard focus rings.
  - Respects user preference for reduced motion (`prefers-reduced-motion`).

---

## 🕹️ Controls

| Platform | Controls |
| :--- | :--- |
| **Desktop Keyboard** | `↑` `↓` `←` `→` (Arrow Keys) or `W` `A` `S` `D` |
| **Undo Shortcut** | `Ctrl + Z` or `Cmd + Z` |
| **Mobile / Tablet** | Touch swipe gesture (Up, Down, Left, Right) |
| **On-screen D-Pad** | Tap Up, Down, Left, Right directional buttons |
| **UI Buttons** | **New Game**, **Undo**, **Sound Toggle**, **How to Play** |

---

## 📁 File Structure

```text
├── index.html        # Semantic HTML5 layout, metadata, modals & overlays
├── style.css         # Dark neon theme, fluid typography, transitions & animations
├── game.js           # Game engine, move calculations, audio synthesis & storage
├── favicon.svg       # Crisp SVG vector favicon
├── robots.txt        # Search engine crawler configuration
├── sitemap.xml       # XML sitemap for SEO discovery
└── README.md         # Documentation & deployment guide
```

---

## 🚀 Running Locally

No build tools, bundlers, or packages are needed. You can run the game directly using any local HTTP server:

### Option A: Using Python 3
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option B: Using Node.js (npx)
```bash
npx serve .
```

### Option C: Direct File Opening
Double-click `index.html` to open it directly in modern browsers (Chrome, Edge, Firefox, Safari).

---

## ☁️ Deployment Guide (Vercel)

Since **Brain Tiles** is a 100% static project:

### Deploying via Vercel CLI:
1. Open terminal in the project directory:
   ```bash
   npx vercel
   ```
2. Follow prompts (accept default settings: static framework, no build command required).

### Deploying via GitHub & Vercel Dashboard:
1. Push this folder to a GitHub repository.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Leave **Framework Preset** as **Other** and **Build Command** blank.
5. Click **Deploy**. Your game will be live globally in seconds!

---

## 🧪 Testing Verification Summary

The project underwent browser and automated testing:

| Test Case | Status | Verified Result |
| :--- | :---: | :--- |
| **Directional Movement** | ✅ PASSED | Up, Down, Left, Right move tiles across empty spaces |
| **Tile Merging** | ✅ PASSED | Matching adjacent tiles merge into double value |
| **Single Merge Rule** | ✅ PASSED | `[2, 2, 2, 2]` produces `[4, 4, 0, 0]` (no double merge) |
| **Score Calculation** | ✅ PASSED | Correct score added on each merge with floating indicator |
| **Invalid Move Guard** | ✅ PASSED | Board shakes, score unchanged, no tile spawned |
| **Victory Detection** | ✅ PASSED | 2048 tile triggers celebration overlay |
| **Continued Play** | ✅ PASSED | Merging past 2048 up to 4096+ works without overlay re-triggering |
| **Locked Grid Detection** | ✅ PASSED | Correctly detects Game Over only when 0 empty slots AND 0 matches |
| **Board Full with Matches** | ✅ PASSED | Doesn't trigger game over when merges remain on full board |
| **Undo State** | ✅ PASSED | Reverts board, score, and flags cleanly |
| **New Game Confirmation** | ✅ PASSED | Confirmation modal prevents accidental resets during active game |
| **LocalStorage Persistence**| ✅ PASSED | Page refresh faithfully restores board and high score |
| **Responsive Viewports** | ✅ PASSED | Tested across 320×568, 375×667, 390×844, 430×932, 768×1024, 1920×1080 |
| **Console Errors** | ✅ PASSED | 0 errors, clean execution |
