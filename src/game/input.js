/**
 * Input manager - handles keyboard and touch controls.
 * Provides normalized movement direction and action states.
 */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.moveDir = { x: 0, y: 0 };
    this.shooting = false;
    this.specialPressed = false;
    this.pausePressed = false;
    this.aimDir = { x: 0, y: -1 };

    // Joystick state
    this._joystickActive = false;
    this._joystickTouchId = null;
    this._joystickCenter = { x: 0, y: 0 };
    this._joystickPos = { x: 0, y: 0 };

    // Touch shoot state
    this._shootTouchActive = false;

    this._setupKeyboard();
    this._setupTouch();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') this.pausePressed = true;
      if (e.code === 'Space') {
        this.shooting = true;
        e.preventDefault();
      }
      if (e.code === 'KeyE') this.specialPressed = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') this.shooting = false;
    });

    // Mouse click to shoot on desktop
    this.canvas.addEventListener('mousedown', (e) => {
      this.shooting = true;
      this._updateAimFromMouse(e);
    });
    this.canvas.addEventListener('mouseup', () => {
      this.shooting = false;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.shooting) this._updateAimFromMouse(e);
    });
  }

  _updateAimFromMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (window.devicePixelRatio || 1) / rect.width;
    const scaleY = this.canvas.height / (window.devicePixelRatio || 1) / rect.height;
    this._mouseWorld = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  _setupTouch() {
    const joystickArea = document.getElementById('joystick-area');
    const shootBtn = document.getElementById('shoot-btn');
    const specialBtn = document.getElementById('special-btn');

    if (joystickArea) {
      joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this._joystickTouchId = touch.identifier;
        this._joystickActive = true;
        const rect = joystickArea.getBoundingClientRect();
        this._joystickCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        this._updateJoystick(touch);
      });

      joystickArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
          if (touch.identifier === this._joystickTouchId) {
            this._updateJoystick(touch);
          }
        }
      });

      joystickArea.addEventListener('touchend', (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === this._joystickTouchId) {
            this._joystickActive = false;
            this._joystickTouchId = null;
            this.moveDir = { x: 0, y: 0 };
            this._resetJoystickVisual();
          }
        }
      });

      joystickArea.addEventListener('touchcancel', () => {
        this._joystickActive = false;
        this._joystickTouchId = null;
        this.moveDir = { x: 0, y: 0 };
        this._resetJoystickVisual();
      });
    }

    if (shootBtn) {
      shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.shooting = true;
        this._shootTouchActive = true;
      });
      shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.shooting = false;
        this._shootTouchActive = false;
      });
      shootBtn.addEventListener('touchcancel', () => {
        this.shooting = false;
        this._shootTouchActive = false;
      });
    }

    if (specialBtn) {
      specialBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.specialPressed = true;
      });
      specialBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
      });
    }
  }

  _updateJoystick(touch) {
    const dx = touch.clientX - this._joystickCenter.x;
    const dy = touch.clientY - this._joystickCenter.y;
    const maxDist = 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    this.moveDir = {
      x: (Math.cos(angle) * clampedDist) / maxDist,
      y: (Math.sin(angle) * clampedDist) / maxDist,
    };

    // Update aim direction based on movement
    if (dist > 5) {
      this.aimDir = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    }

    // Move joystick stick visual
    const stick = document.getElementById('joystick-stick');
    if (stick) {
      const visualDist = Math.min(dist, maxDist);
      stick.style.transform = `translate(${Math.cos(angle) * visualDist}px, ${Math.sin(angle) * visualDist}px)`;
    }
  }

  _resetJoystickVisual() {
    const stick = document.getElementById('joystick-stick');
    if (stick) {
      stick.style.transform = 'translate(0, 0)';
    }
  }

  /** Called each tick to read current keyboard state into moveDir */
  update(playerPos) {
    // Keyboard movement
    if (!this._joystickActive) {
      let kx = 0, ky = 0;
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) kx -= 1;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) kx += 1;
      if (this.keys['ArrowUp'] || this.keys['KeyW']) ky -= 1;
      if (this.keys['ArrowDown'] || this.keys['KeyS']) ky += 1;

      const len = Math.sqrt(kx * kx + ky * ky);
      if (len > 0) {
        this.moveDir = { x: kx / len, y: ky / len };
        this.aimDir = { x: kx / len, y: ky / len };
      } else {
        this.moveDir = { x: 0, y: 0 };
      }
    }

    // Mouse aim for desktop
    if (this._mouseWorld && playerPos) {
      const dx = this._mouseWorld.x - playerPos.x;
      const dy = this._mouseWorld.y - playerPos.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        this.aimDir = { x: dx / len, y: dy / len };
      }
    }

    // Auto-shoot on mobile when moving
    if (this._joystickActive && !this._shootTouchActive) {
      this.shooting = true;
    }
  }

  /** Consume one-shot inputs */
  consumeSpecial() {
    const val = this.specialPressed;
    this.specialPressed = false;
    return val;
  }

  consumePause() {
    const val = this.pausePressed;
    this.pausePressed = false;
    return val;
  }
}

export default InputManager;
