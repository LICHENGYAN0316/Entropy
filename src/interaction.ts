/**
 * Interaction and force field management module.
 * Handles mouse and touch coordinates, and detects gestures (double click, double tap, long press).
 */
export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private onReSummon: () => void;
  private longPressTimeout: number | null = null;
  private lastTouchTime = 0;
  private startPos = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, onReSummon: () => void) {
    this.canvas = canvas;
    this.onReSummon = onReSummon;

    this.initListeners();
  }

  private initListeners(): void {
    // 1. Double click (Desktop)
    this.canvas.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.onReSummon();
    });

    // Helper functions for long press detection
    const handleStart = (clientX: number, clientY: number) => {
      this.clearLongPressTimer();

      // Fire re-summon action if button is held down for 600ms
      this.longPressTimeout = window.setTimeout(() => {
        this.onReSummon();
      }, 600);

      this.startPos = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      this.clearLongPressTimer();
    };

    const handleMove = (clientX: number, clientY: number) => {
      // If user drags/swipes too much, cancel the long press
      const dx = clientX - this.startPos.x;
      const dy = clientY - this.startPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        this.clearLongPressTimer();
      }
    };

    // Mouse Listeners
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        handleStart(e.clientX, e.clientY);
      }
    });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    // Touch Listeners (Mobile)
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);

          // Double tap detection
          const now = Date.now();
          if (now - this.lastTouchTime < 300) {
            e.preventDefault();
            this.onReSummon();
          }
          this.lastTouchTime = now;
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener('touchend', handleEnd);
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }
      },
      { passive: true }
    );
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimeout !== null) {
      window.clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  // Placeholder for mouse/touch coordinates (to be used in Phase 2)
  handleMove(_x: number, _y: number): void {
    // Will be implemented in Phase 2 for scattering force fields
  }
}
