/**
 * Brain Tiles - Modern Number Merge Puzzle Game
 * Core Engine, Animation Controller, Persistence & Audio Engine
 */

'use strict';

class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
    this.initFromStorage();
  }

  initFromStorage() {
    try {
      const saved = localStorage.getItem('braintiles_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('braintiles_sound_enabled', String(this.enabled));
    } catch (e) {
      console.warn('LocalStorage unavailable for sound preference', e);
    }
    return this.enabled;
  }

  ensureContext() {
    if (!this.audioCtx && typeof window.AudioContext !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSlide() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.debug('Audio slide suppressed:', e);
    }
  }

  playMerge(value) {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const baseFreq = 320 + Math.min(Math.log2(value || 4) * 45, 600);

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      console.debug('Audio merge suppressed:', e);
    }
  }

  playVictory() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.38);
      });
    } catch (e) {
      console.debug('Audio victory suppressed:', e);
    }
  }

  playGameOver() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const notes = [320, 260, 210];
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.07, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.2);
      });
    } catch (e) {
      console.debug('Audio game over suppressed:', e);
    }
  }
}

class BrainTilesGame {
  constructor() {
    this.size = 4;
    this.grid = []; // 4x4 holding tile objects or null
    this.tiles = []; // Active list of tile objects
    this.tileIdCounter = 1;

    this.score = 0;
    this.bestScore = 0;
    this.hasWon = false;
    this.keepPlaying = false;
    this.isGameOver = false;

    this.undoState = null; // Single-step undo snapshot
    this.isAnimating = false;
    this.animationDuration = 120; // Matches CSS transition

    this.sound = new SoundManager();

    // DOM Elements
    this.boardContainer = document.getElementById('board-container');
    this.tileLayer = document.getElementById('tile-layer');
    this.currentScoreEl = document.getElementById('current-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.scoreAdditionEl = document.getElementById('score-addition');
    this.undoBtn = document.getElementById('undo-btn');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.soundBtn = document.getElementById('sound-btn');
    this.soundIconOn = this.soundBtn?.querySelector('.sound-icon-on');
    this.soundIconOff = this.soundBtn?.querySelector('.sound-icon-off');

    // Overlays & Modals
    this.victoryOverlay = document.getElementById('victory-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreEl = document.getElementById('final-score');
    this.keepPlayingBtn = document.getElementById('keep-playing-btn');
    this.victoryRestartBtn = document.getElementById('victory-restart-btn');
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.gameoverUndoBtn = document.getElementById('gameover-undo-btn');

    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    this.confirmProceedBtn = document.getElementById('confirm-proceed-btn');

    this.helpBtn = document.getElementById('help-btn');
    this.helpModal = document.getElementById('help-modal');
    this.helpCloseBtn = document.getElementById('help-close-btn');
    this.helpOkBtn = document.getElementById('help-ok-btn');

    this.init();
  }

  init() {
    this.loadBestScore();
    this.updateSoundButtonUI();
    this.attachEventListeners();

    if (!this.restoreGameState()) {
      this.startFreshGame();
    }
  }

  // --- Sound & UI helpers ---
  updateSoundButtonUI() {
    if (!this.soundBtn) return;
    if (this.sound.enabled) {
      this.soundIconOn?.classList.remove('hidden');
      this.soundIconOff?.classList.add('hidden');
      this.soundBtn.setAttribute('title', 'Sound Effects: ON (Click to Mute)');
    } else {
      this.soundIconOn?.classList.add('hidden');
      this.soundIconOff?.classList.remove('hidden');
      this.soundBtn.setAttribute('title', 'Sound Effects: MUTED (Click to Enable)');
    }
  }

  loadBestScore() {
    try {
      const saved = localStorage.getItem('braintiles_best_score');
      if (saved) {
        this.bestScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.bestScore = 0;
    }
    this.bestScoreEl.textContent = this.bestScore.toLocaleString();
  }

  saveBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    try {
      localStorage.setItem('braintiles_best_score', String(this.bestScore));
    } catch (e) {
      console.warn('LocalStorage unavailable for best score', e);
    }
    if (this.bestScoreEl) {
      this.bestScoreEl.textContent = this.bestScore.toLocaleString();
    }
  }

  // --- Grid Management ---
  createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < this.size; r++) {
      grid[r] = [];
      for (let c = 0; c < this.size; c++) {
        grid[r][c] = null;
      }
    }
    return grid;
  }

  getEmptyCells() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }
    return emptyCells;
  }

  // --- Tile Creation & DOM Rendering ---
  addTile(r, c, value, isNew = false) {
    const tile = {
      id: this.tileIdCounter++,
      value,
      r,
      c,
      domEl: null
    };

    const el = document.createElement('div');
    el.className = `tile tile-${value}`;
    if (value > 2048) {
      el.classList.add(value === 4096 ? 'tile-4096' : 'tile-super');
    }
    el.setAttribute('data-value', value);
    el.setAttribute('data-digits', String(value).length);
    el.textContent = value;
    el.style.setProperty('--row', r);
    el.style.setProperty('--col', c);

    if (isNew) {
      el.classList.add('tile-new');
    }

    tile.domEl = el;
    this.tileLayer.appendChild(el);

    this.grid[r][c] = tile;
    this.tiles.push(tile);
    return tile;
  }

  spawnRandomTile() {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return null;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    // 90% chance of 2, 10% chance of 4
    const value = Math.random() < 0.9 ? 2 : 4;
    return this.addTile(randomCell.r, randomCell.c, value, true);
  }

  // --- Move Mechanics ---
  move(direction) {
    // 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT
    if (this.isAnimating) return false;
    if (this.isGameOver) return false;

    const vectors = {
      0: { r: -1, c: 0 },
      1: { r: 0, c: 1 },
      2: { r: 1, c: 0 },
      3: { r: 0, c: -1 }
    };
    const vector = vectors[direction];
    if (!vector) return false;

    // Save snapshot for Undo BEFORE executing move
    const previousSnapshot = this.takeSnapshot();

    const rTraversal = [0, 1, 2, 3];
    const cTraversal = [0, 1, 2, 3];
    if (vector.r === 1) rTraversal.reverse();
    if (vector.c === 1) cTraversal.reverse();

    let moved = false;
    let scoreGain = 0;
    let reached2048ThisMove = false;
    const mergedPositions = new Set();
    const tilesToRemove = [];
    const tilesToSpawn = [];

    rTraversal.forEach(r => {
      cTraversal.forEach(c => {
        const tile = this.grid[r][c];
        if (!tile) return;

        // Trace farthest position in vector direction
        let currR = r;
        let currC = c;
        let nextR = currR + vector.r;
        let nextC = currC + vector.c;

        while (
          nextR >= 0 && nextR < this.size &&
          nextC >= 0 && nextC < this.size &&
          !this.grid[nextR][nextC]
        ) {
          currR = nextR;
          currC = nextC;
          nextR = currR + vector.r;
          nextC = currC + vector.c;
        }

        const nextTile = (nextR >= 0 && nextR < this.size && nextC >= 0 && nextC < this.size)
          ? this.grid[nextR][nextC]
          : null;
        const targetPosKey = `${nextR},${nextC}`;

        if (nextTile && nextTile.value === tile.value && !mergedPositions.has(targetPosKey)) {
          // Valid Merge!
          mergedPositions.add(targetPosKey);

          // Displace current tile
          this.grid[r][c] = null;
          tile.r = nextR;
          tile.c = nextC;
          tile.domEl.style.setProperty('--row', nextR);
          tile.domEl.style.setProperty('--col', nextC);

          const mergedValue = tile.value * 2;
          scoreGain += mergedValue;
          if (mergedValue === 2048) {
            reached2048ThisMove = true;
          }

          // Mark old tiles for removal
          tilesToRemove.push(tile, nextTile);

          // Queue new merged tile
          tilesToSpawn.push({ r: nextR, c: nextC, value: mergedValue });
          moved = true;
        } else if (currR !== r || currC !== c) {
          // Slide to farthest empty cell
          this.grid[r][c] = null;
          tile.r = currR;
          tile.c = currC;
          tile.domEl.style.setProperty('--row', currR);
          tile.domEl.style.setProperty('--col', currC);
          this.grid[currR][currC] = tile;
          moved = true;
        }
      });
    });

    if (!moved) {
      // Invalid move: visually shake board, do not spawn tile, do not change state
      this.triggerInvalidMoveFeedback();
      return false;
    }

    // A valid move occurred!
    this.isAnimating = true;
    this.undoState = previousSnapshot;
    this.undoBtn.disabled = false;
    this.gameoverUndoBtn.disabled = false;

    // Update Score
    this.score += scoreGain;
    this.currentScoreEl.textContent = this.score.toLocaleString();
    this.saveBestScore();

    if (scoreGain > 0) {
      this.showScoreAddition(scoreGain);
      this.sound.playMerge(tilesToSpawn[0]?.value || 4);
    } else {
      this.sound.playSlide();
    }

    // Process Merged Tiles after sliding animation finishes
    setTimeout(() => {
      // Remove old merged tiles
      tilesToRemove.forEach(tile => {
        if (tile.domEl && tile.domEl.parentNode) {
          tile.domEl.parentNode.removeChild(tile.domEl);
        }
        const idx = this.tiles.indexOf(tile);
        if (idx !== -1) this.tiles.splice(idx, 1);
      });

      // Spawn new merged tiles
      tilesToSpawn.forEach(item => {
        const newMergedTile = this.addTile(item.r, item.c, item.value, false);
        newMergedTile.domEl.classList.add('tile-merged');
      });

      // Spawn 1 new random tile (2 or 4)
      this.spawnRandomTile();

      // Check for 2048 Victory
      if (reached2048ThisMove && !this.hasWon && !this.keepPlaying) {
        this.hasWon = true;
        this.showVictoryOverlay();
      }

      // Check Game Over
      if (!this.canMove()) {
        this.isGameOver = true;
        this.showGameOverOverlay();
      }

      this.saveGameState();
      this.isAnimating = false;
    }, this.animationDuration);

    return true;
  }

  canMove() {
    if (this.getEmptyCells().length > 0) return true;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (!tile) return true;
        // Check right neighbor
        if (c + 1 < this.size && this.grid[r][c + 1] && this.grid[r][c + 1].value === tile.value) {
          return true;
        }
        // Check down neighbor
        if (r + 1 < this.size && this.grid[r + 1][c] && this.grid[r + 1][c].value === tile.value) {
          return true;
        }
      }
    }
    return false;
  }

  triggerInvalidMoveFeedback() {
    this.boardContainer.classList.remove('shake');
    // Trigger reflow to restart animation
    void this.boardContainer.offsetWidth;
    this.boardContainer.classList.add('shake');
  }

  showScoreAddition(gain) {
    if (!this.scoreAdditionEl) return;
    this.scoreAdditionEl.textContent = `+${gain}`;
    this.scoreAdditionEl.classList.remove('animate');
    void this.scoreAdditionEl.offsetWidth;
    this.scoreAdditionEl.classList.add('animate');

    const scoreCard = document.getElementById('score-card');
    if (scoreCard) {
      scoreCard.classList.remove('pulse');
      void scoreCard.offsetWidth;
      scoreCard.classList.add('pulse');
    }
  }

  // --- Snapshot & Undo Mechanics ---
  takeSnapshot() {
    const boardState = [];
    for (let r = 0; r < this.size; r++) {
      boardState[r] = [];
      for (let c = 0; c < this.size; c++) {
        boardState[r][c] = this.grid[r][c] ? this.grid[r][c].value : 0;
      }
    }
    return {
      board: boardState,
      score: this.score,
      hasWon: this.hasWon,
      keepPlaying: this.keepPlaying
    };
  }

  undo() {
    if (!this.undoState || this.isAnimating) return;

    this.clearTileLayer();
    this.grid = this.createEmptyGrid();
    this.tiles = [];

    // Restore board
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.undoState.board[r][c];
        if (val > 0) {
          this.addTile(r, c, val, false);
        }
      }
    }

    // Restore scores and flags
    this.score = this.undoState.score;
    this.currentScoreEl.textContent = this.score.toLocaleString();
    this.hasWon = this.undoState.hasWon;
    this.keepPlaying = this.undoState.keepPlaying;
    this.isGameOver = false;

    // Hide overlays if undoing out of game-over or victory
    this.gameoverOverlay.classList.add('hidden');
    this.victoryOverlay.classList.add('hidden');

    this.undoState = null;
    this.undoBtn.disabled = true;
    this.gameoverUndoBtn.disabled = true;

    this.sound.playSlide();
    this.saveGameState();
  }

  // --- Persistence (localStorage) ---
  saveGameState() {
    try {
      const boardValues = [];
      for (let r = 0; r < this.size; r++) {
        boardValues[r] = [];
        for (let c = 0; c < this.size; c++) {
          boardValues[r][c] = this.grid[r][c] ? this.grid[r][c].value : 0;
        }
      }

      const state = {
        board: boardValues,
        score: this.score,
        hasWon: this.hasWon,
        keepPlaying: this.keepPlaying,
        isGameOver: this.isGameOver,
        undoState: this.undoState
      };

      localStorage.setItem('braintiles_saved_game', JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  restoreGameState() {
    try {
      const raw = localStorage.getItem('braintiles_saved_game');
      if (!raw) return false;

      const state = JSON.parse(raw);
      if (!state || !Array.isArray(state.board) || state.board.length !== 4) {
        return false;
      }

      // Validate board numbers
      let tileCount = 0;
      for (let r = 0; r < 4; r++) {
        if (!Array.isArray(state.board[r]) || state.board[r].length !== 4) return false;
        for (let c = 0; c < 4; c++) {
          const val = state.board[r][c];
          if (typeof val !== 'number' || val < 0) return false;
          if (val > 0) tileCount++;
        }
      }

      if (tileCount === 0) return false;

      // Restore board
      this.clearTileLayer();
      this.grid = this.createEmptyGrid();
      this.tiles = [];

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = state.board[r][c];
          if (val > 0) {
            this.addTile(r, c, val, false);
          }
        }
      }

      this.score = typeof state.score === 'number' ? state.score : 0;
      this.currentScoreEl.textContent = this.score.toLocaleString();
      this.hasWon = Boolean(state.hasWon);
      this.keepPlaying = Boolean(state.keepPlaying);
      this.isGameOver = Boolean(state.isGameOver);

      this.undoState = state.undoState || null;
      this.undoBtn.disabled = !this.undoState;
      this.gameoverUndoBtn.disabled = !this.undoState;

      if (this.hasWon && !this.keepPlaying) {
        this.showVictoryOverlay(true);
      } else if (this.isGameOver) {
        this.showGameOverOverlay(true);
      }

      return true;
    } catch (e) {
      console.warn('LocalStorage restore error', e);
      return false;
    }
  }

  clearTileLayer() {
    this.tileLayer.innerHTML = '';
  }

  startFreshGame() {
    this.clearTileLayer();
    this.grid = this.createEmptyGrid();
    this.tiles = [];
    this.score = 0;
    this.hasWon = false;
    this.keepPlaying = false;
    this.isGameOver = false;
    this.undoState = null;
    this.isAnimating = false;
    this.undoBtn.disabled = true;
    this.gameoverUndoBtn.disabled = true;

    this.currentScoreEl.textContent = '0';
    this.victoryOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');

    // Standard starting state: 2 random tiles
    this.spawnRandomTile();
    this.spawnRandomTile();

    this.saveGameState();
  }

  // --- Overlays & Modals ---
  showVictoryOverlay(silent = false) {
    if (!silent) {
      this.sound.playVictory();
    }
    this.victoryOverlay.classList.remove('hidden');
  }

  showGameOverOverlay(silent = false) {
    if (!silent) {
      this.sound.playGameOver();
    }
    this.finalScoreEl.textContent = this.score.toLocaleString();
    this.gameoverOverlay.classList.remove('hidden');
  }

  promptNewGame() {
    // If active meaningful game exists (score > 0 or at least one move made), prompt confirmation
    if ((this.score > 0 || this.undoState !== null) && !this.isGameOver) {
      this.confirmModal.classList.remove('hidden');
    } else {
      this.startFreshGame();
    }
  }

  // --- Input Handlers (Keyboard, Touch, Buttons) ---
  attachEventListeners() {
    // Desktop Keyboard controls (Arrows & WASD)
    window.addEventListener('keydown', (e) => {
      // Prevent accidental repeat events when holding keys
      if (e.repeat) return;
      // Do not capture key events if modal is open
      if (!this.helpModal.classList.contains('hidden') || !this.confirmModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          this.helpModal.classList.add('hidden');
          this.confirmModal.classList.add('hidden');
        }
        return;
      }

      // Ignore if user is focused on an input element
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      let direction = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 0;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 2;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 3;
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.undo();
            return;
          }
          break;
        default:
          return;
      }

      if (direction !== null) {
        e.preventDefault(); // Prevent page scrolling
        this.move(direction);
      }
    });

    // Mobile Touch Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.boardContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return; // Ignore multi-touch pinches
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    this.boardContainer.addEventListener('touchmove', (e) => {
      // Prevent browser from scrolling while swiping inside the game board
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });

    this.boardContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      const minDistance = 30; // Minimum pixel threshold for a swipe
      const maxDuration = 800; // Ignore slow dragging

      if (deltaTime > maxDuration) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) < minDistance) return;

      let direction = null;
      if (absX > absY) {
        // Horizontal swipe
        direction = deltaX > 0 ? 1 : 3; // 1: Right, 3: Left
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? 2 : 0; // 2: Down, 0: Up
      }

      if (direction !== null) {
        this.move(direction);
      }
    }, { passive: true });

    // Mobile D-Pad Buttons
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dir = parseInt(btn.getAttribute('data-dir'), 10);
        if (!isNaN(dir)) {
          this.move(dir);
        }
      });
    });

    // Primary Control Buttons
    this.undoBtn.addEventListener('click', () => this.undo());
    this.newGameBtn.addEventListener('click', () => this.promptNewGame());

    this.soundBtn.addEventListener('click', () => {
      this.sound.toggle();
      this.updateSoundButtonUI();
      if (this.sound.enabled) {
        this.sound.playSlide();
      }
    });

    // Overlays Actions
    this.keepPlayingBtn.addEventListener('click', () => {
      this.victoryOverlay.classList.add('hidden');
      this.keepPlaying = true;
      this.saveGameState();
    });

    this.victoryRestartBtn.addEventListener('click', () => {
      this.victoryOverlay.classList.add('hidden');
      this.startFreshGame();
    });

    this.playAgainBtn.addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      this.startFreshGame();
    });

    this.gameoverUndoBtn.addEventListener('click', () => {
      this.undo();
    });

    // Confirmation Modal Actions
    this.confirmCancelBtn.addEventListener('click', () => {
      this.confirmModal.classList.add('hidden');
    });

    this.confirmProceedBtn.addEventListener('click', () => {
      this.confirmModal.classList.add('hidden');
      this.startFreshGame();
    });

    // Help / Instructions Modal Actions
    this.helpBtn.addEventListener('click', () => {
      this.helpModal.classList.remove('hidden');
    });

    this.helpCloseBtn.addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });

    this.helpOkBtn.addEventListener('click', () => {
      this.helpModal.classList.add('hidden');
    });

    // Close modals on clicking outside the card
    window.addEventListener('click', (e) => {
      if (e.target === this.confirmModal) {
        this.confirmModal.classList.add('hidden');
      }
      if (e.target === this.helpModal) {
        this.helpModal.classList.add('hidden');
      }
    });
  }
}

/**
 * Lightweight, high-performance ambient particles & glowing motes
 */
class ArcadeAtmosphere {
  constructor() {
    this.canvas = document.getElementById('ambient-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.reducedMotion = false;

    try {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      this.reducedMotion = false;
    }

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    this.createParticles();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticles() {
    // 28 particles on desktop, 12 on mobile
    const count = this.width > 768 ? 28 : 12;
    this.particles = [];
    const colors = [
      'rgba(34, 211, 238, ',  // Cyan
      'rgba(167, 139, 250, ', // Violet
      'rgba(251, 191, 36, '   // Gold
    ];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.8 + 0.8,
        speedY: -(Math.random() * 0.35 + 0.15),
        speedX: (Math.random() - 0.5) * 0.2,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const now = Date.now() * 0.001;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!this.reducedMotion) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = this.height + 10;
          p.x = Math.random() * this.width;
        }
        if (p.x < -10) p.x = this.width + 10;
        if (p.x > this.width + 10) p.x = -10;
      }

      const dynamicAlpha = Math.max(0.05, p.alpha + Math.sin(now * p.pulseSpeed * 60 + p.pulseOffset) * 0.15);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.colorPrefix}${dynamicAlpha.toFixed(2)})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = `${p.colorPrefix}0.6)`;
      this.ctx.fill();
    }
  }

  start() {
    if (this.isRunning || this.reducedMotion) {
      if (this.reducedMotion) this.render();
      return;
    }
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Bootstrap game on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new BrainTilesGame();
  window.arcadeAtmosphere = new ArcadeAtmosphere();
});
