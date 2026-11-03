import { DamageNumber, Particle, SkidMark } from './types';

export class ParticleManager {
  public particles: Particle[] = [];
  public skidMarks: SkidMark[] = [];
  public damageNumbers: DamageNumber[] = [];
  public screenShake: number = 0;
  private nextDamageId: number = 1;

  public addScreenShake(amount: number) {
    this.screenShake = Math.min(25, this.screenShake + amount);
  }

  public update(dt: number) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 35 * dt);
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.shape === 'smoke') {
        p.radius += 8 * dt; // Smoke expands
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Skid marks decay slowly (capped at 500 for high performance)
    if (this.skidMarks.length > 500) {
      this.skidMarks.splice(0, this.skidMarks.length - 500);
    }
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.alpha -= 0.015 * dt;
      if (s.alpha <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }

    // Damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += d.vy * dt;
      d.alpha -= 1.2 * dt;
      d.scale = Math.max(0.8, d.scale - 0.5 * dt);
      if (d.alpha <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public addExhaustSmoke(x: number, y: number, angle: number, isBoosting: boolean) {
    if (isBoosting) {
      // Nitro fire jet
      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        const speed = -(120 + Math.random() * 180);
        const pAngle = angle + spread;
        const color = Math.random() > 0.4 ? '#06b6d4' : (Math.random() > 0.5 ? '#f97316' : '#e0f2fe');
        this.particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          radius: 3 + Math.random() * 4,
          color,
          alpha: 0.9,
          decay: 2.8,
          shape: 'fire',
        });
      }
    } else {
      // Normal exhaust puff
      if (Math.random() < 0.4) {
        const spread = (Math.random() - 0.5) * 0.6;
        const speed = -(40 + Math.random() * 40);
        const pAngle = angle + spread;
        this.particles.push({
          x,
          y,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          radius: 2 + Math.random() * 3,
          color: 'rgba(214, 211, 209, 0.6)',
          alpha: 0.5,
          decay: 1.5,
          shape: 'smoke',
        });
      }
    }
  }

  public addSkidMark(x1: number, y1: number, x2: number, y2: number, alpha: number = 0.5) {
    this.skidMarks.push({
      x1,
      y1,
      x2,
      y2,
      alpha,
    });
  }

  public addSparks(x: number, y: number, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.5,
        color: Math.random() > 0.3 ? '#facc15' : '#fb923c',
        alpha: 1,
        decay: 3.5,
        shape: 'spark',
      });
    }
  }

  public addExplosion(x: number, y: number, radius = 50) {
    this.addScreenShake(Math.min(15, radius * 0.2));

    // Shockwave & core fireball particles
    const count = Math.floor(radius * 0.8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (radius * 3.5);
      const isFire = Math.random() > 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: (isFire ? 4 : 8) + Math.random() * 8,
        color: isFire ? (Math.random() > 0.5 ? '#ef4444' : '#f97316') : '#44403c',
        alpha: 0.95,
        decay: isFire ? 2.0 : 1.2,
        shape: isFire ? 'fire' : 'smoke',
      });
    }

    // Heavy sparks flying outward
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 240;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2,
        color: '#fef08a',
        alpha: 1,
        decay: 2.2,
        shape: 'spark',
      });
    }
  }

  public addDamageText(x: number, y: number, damage: number, type: 'normal' | 'crit' | 'saw' | 'fire' = 'normal') {
    let color = '#fef08a'; // normal gun - bright yellow
    let scale = 1.0;
    if (type === 'crit') {
      color = '#ef4444'; // critical ram - crimson red
      scale = 1.4;
    } else if (type === 'saw') {
      color = '#38bdf8'; // saw blade - sky blue
      scale = 1.1;
    } else if (type === 'fire') {
      color = '#fb923c'; // burning fire - orange
      scale = 0.95;
    }

    this.damageNumbers.push({
      id: this.nextDamageId++,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text: Math.round(damage).toString(),
      color,
      alpha: 1.0,
      scale,
      vy: -55 - Math.random() * 25,
    });
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    // 1. Render Skid Marks (behind everything)
    ctx.lineWidth = 4;
    for (let i = 0; i < this.skidMarks.length; i++) {
      const s = this.skidMarks[i];
      ctx.strokeStyle = `rgba(28, 25, 23, ${s.alpha * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(s.x1 - cameraX, s.y1 - cameraY);
      ctx.lineTo(s.x2 - cameraX, s.y2 - cameraY);
      ctx.stroke();
    }

    // 2. Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'fire') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Render Damage Numbers
    for (let i = 0; i < this.damageNumbers.length; i++) {
      const d = this.damageNumbers[i];
      const screenX = d.x - cameraX;
      const screenY = d.y - cameraY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.font = `bold ${Math.round(14 * d.scale)}px 'Chakra Petch', sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(d.text, screenX, screenY);
      ctx.fillStyle = d.color;
      ctx.fillText(d.text, screenX, screenY);
      ctx.restore();
    }
  }

  public reset() {
    this.particles = [];
    this.skidMarks = [];
    this.damageNumbers = [];
    this.screenShake = 0;
  }
}
