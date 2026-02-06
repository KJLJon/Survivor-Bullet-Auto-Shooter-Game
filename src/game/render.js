/**
 * Canvas rendering utilities.
 * Draws game state using simple shapes and colors.
 * All drawing is based on game state - no game logic here.
 */

import CONFIG from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.CANVAS_WIDTH;
    this.height = CONFIG.CANVAS_HEIGHT;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;
    const aspect = this.width / this.height;
    let w, h;
    if (containerW / containerH < aspect) {
      w = containerW;
      h = containerW / aspect;
    } else {
      h = containerH;
      w = containerH * aspect;
    }
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = w / this.width;
  }

  clear(color) {
    this.ctx.fillStyle = color || '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw a subtle grid background */
  drawGrid(color, spacing = 40) {
    this.ctx.strokeStyle = color || 'rgba(255,255,255,0.03)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  /** Draw the player */
  drawPlayer(player) {
    const { pos, size, color, health, maxHealth, invulnTimer, shieldActive } = player;
    const ctx = this.ctx;

    // Shield effect
    if (shieldActive) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52,152,219,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Flash when invulnerable
    if (invulnTimer > 0 && Math.floor(invulnTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Body
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Direction indicator
    if (player.aimDir) {
      ctx.beginPath();
      ctx.moveTo(
        pos.x + player.aimDir.x * size * 0.5,
        pos.y + player.aimDir.y * size * 0.5
      );
      ctx.lineTo(
        pos.x + player.aimDir.x * (size + 6),
        pos.y + player.aimDir.y * (size + 6)
      );
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Health bar above player
    if (health < maxHealth) {
      const barWidth = size * 2.5;
      const barHeight = 3;
      const barX = pos.x - barWidth / 2;
      const barY = pos.y - size - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = health > maxHealth * 0.3 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(barX, barY, barWidth * (health / maxHealth), barHeight);
    }
  }

  /** Draw enemies */
  drawEnemies(enemies) {
    const ctx = this.ctx;
    for (const e of enemies) {
      // Flash on hit
      if (e.hitFlash > 0) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = e.color;
      }

      if (e.isBoss || e.isMiniBoss) {
        // Draw bosses as pentagons
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const px = e.pos.x + Math.cos(a) * e.size;
          const py = e.pos.y + Math.sin(a) * e.size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Regular enemies as squares
        ctx.fillRect(
          e.pos.x - e.size,
          e.pos.y - e.size,
          e.size * 2,
          e.size * 2
        );
      }

      // Enemy health bar
      if (e.hp < e.maxHp) {
        const barW = e.size * 2;
        const barH = 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(e.pos.x - barW / 2, e.pos.y - e.size - 5, barW, barH);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(
          e.pos.x - barW / 2,
          e.pos.y - e.size - 5,
          barW * (e.hp / e.maxHp),
          barH
        );
      }
    }
  }

  /** Draw projectiles */
  drawProjectiles(projectiles) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
  }

  /** Draw coins */
  drawCoins(coins) {
    const ctx = this.ctx;
    for (const c of coins) {
      ctx.beginPath();
      ctx.arc(c.pos.x, c.pos.y, CONFIG.COIN.SIZE, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.COIN.COLOR;
      ctx.fill();
      ctx.strokeStyle = '#c9a800';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /** Draw explosion effects */
  drawExplosions(explosions) {
    const ctx = this.ctx;
    for (const ex of explosions) {
      const alpha = 1 - ex.timer / ex.duration;
      ctx.beginPath();
      ctx.arc(ex.pos.x, ex.pos.y, ex.radius * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 160, 50, ${(1 - alpha) * 0.6})`;
      ctx.fill();
    }
  }

  /** Draw turrets */
  drawTurrets(turrets) {
    const ctx = this.ctx;
    for (const t of turrets) {
      ctx.beginPath();
      ctx.arc(t.pos.x, t.pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#e67e22';
      ctx.fill();
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export default Renderer;
