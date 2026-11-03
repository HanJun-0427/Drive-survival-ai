/**
 * Drive & Survival - 드라이브 서바이벌
 * 순수 바닐라 자바스크립트(Vanilla JS) 게임 엔진
 * GitHub Pages 및 빌드 없는 환경에서 즉시 실행 가능
 */

// --- 1. Sound Engine (Web Audio API 실시간 합성 사운드) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  startEngine() {
    if (this.isEngineRunning || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (e) {}
  }

  updateEngine(speedNorm, isBoosting) {
    if (!this.engineOsc || !this.engineGain || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const baseFreq = 40 + speedNorm * 65 + (isBoosting ? 50 : 0);
    const volume = 0.03 + speedNorm * 0.05 + (isBoosting ? 0.06 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(volume, now, 0.08);
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
    this.isEngineRunning = false;
  }

  playGunShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  playSawHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playMissileLaunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.2);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {}
  }

  playBoost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const notes = [523.25, 659.25, 783.99, 1046.5];
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch (e) {}
  }

  playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [
        { freq: 523.25, time: 0.0, dur: 0.2 },
        { freq: 659.25, time: 0.18, dur: 0.2 },
        { freq: 783.99, time: 0.36, dur: 0.25 },
        { freq: 1046.5, time: 0.6, dur: 0.8 },
      ];

      chords.forEach(c => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const st = now + c.time;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(c.freq, st);

        gain.gain.setValueAtTime(0.2, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + c.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(st);
        osc.stop(st + c.dur + 0.05);
      });
    } catch (e) {}
  }
}

const sounds = new SoundEngine();

// --- 2. Particle & SkidMark Manager ---
class ParticleManager {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
    this.damageNumbers = [];
    this.screenShake = 0;
    this.nextDamageId = 1;
  }

  addScreenShake(amount) {
    this.screenShake = Math.min(28, this.screenShake + amount);
  }

  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 35 * dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.shape === 'smoke') {
        p.radius += 8 * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

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

  addExhaustSmoke(x, y, angle, isBoosting) {
    if (isBoosting) {
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

  addSkidMark(x1, y1, x2, y2, alpha = 0.5) {
    this.skidMarks.push({ x1, y1, x2, y2, alpha });
  }

  addSparks(x, y, count = 5) {
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

  addExplosion(x, y, radius = 50) {
    this.addScreenShake(Math.min(18, radius * 0.2));
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

  addDamageText(x, y, damage, type = 'normal') {
    let color = '#fef08a';
    let scale = 1.0;
    if (type === 'crit') {
      color = '#ef4444';
      scale = 1.4;
    } else if (type === 'saw') {
      color = '#38bdf8';
      scale = 1.1;
    } else if (type === 'fire') {
      color = '#fb923c';
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

  render(ctx, cameraX, cameraY) {
    ctx.lineWidth = 4;
    for (let i = 0; i < this.skidMarks.length; i++) {
      const s = this.skidMarks[i];
      ctx.strokeStyle = `rgba(28, 25, 23, ${s.alpha * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(s.x1 - cameraX, s.y1 - cameraY);
      ctx.lineTo(s.x2 - cameraX, s.y2 - cameraY);
      ctx.stroke();
    }

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

  reset() {
    this.particles = [];
    this.skidMarks = [];
    this.damageNumbers = [];
    this.screenShake = 0;
  }
}

// --- 3. Weapon Manager ---
class WeaponManager {
  constructor() {
    this.bullets = [];
    this.missiles = [];
    this.oilSlicks = [];
    this.sawAngle = 0;
    this.nextBulletId = 1;
    this.nextMissileId = 1;
    this.nextOilId = 1;
  }

  update(dt, player, enemies, particles) {
    const now = performance.now();
    const powerMult = player.weaponPowerMultiplier || 1.0;

    // 1. Saw Blade
    const sawWeapon = player.weapons.saw;
    if (sawWeapon.level > 0) {
      const rotSpeed = 3.2 + sawWeapon.level * 0.4;
      this.sawAngle = (this.sawAngle + rotSpeed * dt) % (Math.PI * 2);

      const sawCount = Math.min(4, sawWeapon.level);
      const orbitRadius = 48 + sawWeapon.level * 4;
      const sawRadius = 14 + sawWeapon.level * 2;
      const sawDamage = (18 + sawWeapon.level * 8) * dt * 5 * powerMult;

      for (let s = 0; s < sawCount; s++) {
        const angle = this.sawAngle + (s * (Math.PI * 2) / sawCount);
        const sawX = player.x + Math.cos(angle) * orbitRadius;
        const sawY = player.y + Math.sin(angle) * orbitRadius;

        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          const distSq = (enemy.x - sawX) ** 2 + (enemy.y - sawY) ** 2;
          const hitDist = sawRadius + enemy.radius;

          if (distSq < hitDist * hitDist) {
            enemy.hp -= sawDamage;
            particles.addSparks(sawX, sawY, 2);
            if (Math.random() < 0.25) {
              sounds.playSawHit();
              particles.addDamageText(enemy.x, enemy.y, sawDamage * 1.5, 'saw');
            }
            const kAngle = Math.atan2(enemy.y - sawY, enemy.x - sawX);
            enemy.knockbackX += Math.cos(kAngle) * 35;
            enemy.knockbackY += Math.sin(kAngle) * 35;
          }
        }
      }
    }

    // 2. Front Turret
    const turret = player.weapons.turret;
    if (turret.level > 0 && now - turret.lastFired >= turret.cooldown) {
      const range = 380 + turret.level * 30;
      let closestEnemy = null;
      let closestDistSq = range * range;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const distSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        turret.lastFired = now;
        sounds.playGunShot();
        const baseAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
        const bulletCount = 1 + Math.floor((turret.level - 1) / 2);
        const bulletSpeed = 620;
        const baseDamage = (16 + turret.level * 6) * powerMult;

        for (let b = 0; b < bulletCount; b++) {
          const spread = (b - (bulletCount - 1) / 2) * 0.12;
          const angle = baseAngle + spread;
          const spawnX = player.x + Math.cos(player.angle) * 18;
          const spawnY = player.y + Math.sin(player.angle) * 18;

          this.bullets.push({
            id: this.nextBulletId++,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: baseDamage,
            radius: 3.5,
            range: range,
            distanceTraveled: 0,
            penetration: turret.level >= 5 ? 2 : 1,
            color: '#fef08a',
            isExplosive: turret.level >= 7,
            explosionRadius: 36,
          });

          particles.particles.push({
            x: spawnX + Math.cos(angle) * 10,
            y: spawnY + Math.sin(angle) * 10,
            vx: Math.cos(angle) * 60,
            vy: Math.sin(angle) * 60,
            radius: 5,
            color: '#facc15',
            alpha: 1,
            decay: 14,
            shape: 'spark',
          });
        }
      }
    }

    // 3. Oil Slick
    const oil = player.weapons.oil;
    if (oil.level > 0 && now - oil.lastFired >= oil.cooldown) {
      oil.lastFired = now;
      const rearX = player.x - Math.cos(player.angle) * 26;
      const rearY = player.y - Math.sin(player.angle) * 26;
      const isBurning = oil.level >= 3;
      const radius = 32 + oil.level * 6;
      const maxLife = 5.0 + oil.level * 0.8;

      this.oilSlicks.push({
        id: this.nextOilId++,
        x: rearX,
        y: rearY,
        radius,
        life: maxLife,
        maxLife,
        isBurning,
        damagePerSec: (12 + oil.level * 8) * powerMult,
        lastDamageTick: now,
      });
    }

    // 4. Homing Missile
    const missile = player.weapons.missile;
    if (missile.level > 0 && now - missile.lastFired >= missile.cooldown) {
      if (enemies.length > 0) {
        missile.lastFired = now;
        sounds.playMissileLaunch();

        let target = enemies[0];
        let maxScore = -1;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          const score = (e.isBoss ? 1000 : 0) + e.hp + dist * 0.2;
          if (score > maxScore) {
            maxScore = score;
            target = e;
          }
        }

        const missileCount = 1 + Math.floor((missile.level - 1) / 2);
        for (let m = 0; m < missileCount; m++) {
          const offsetAngle = player.angle + ((m % 2 === 0 ? 1 : -1) * (0.4 + m * 0.2));
          this.missiles.push({
            id: this.nextMissileId++,
            x: player.x,
            y: player.y,
            vx: Math.cos(offsetAngle) * 180,
            vy: Math.sin(offsetAngle) * 180,
            angle: offsetAngle,
            speed: 280 + missile.level * 25,
            targetId: target.id,
            damage: (65 + missile.level * 28) * powerMult,
            explosionRadius: 55 + missile.level * 10,
            life: 6.0,
          });
        }
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      b.x += stepX;
      b.y += stepY;
      b.distanceTraveled += Math.hypot(stepX, stepY);

      let bulletRemoved = false;
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const distSq = (enemy.x - b.x) ** 2 + (enemy.y - b.y) ** 2;
        const hitDist = b.radius + enemy.radius;

        if (distSq < hitDist * hitDist) {
          enemy.hp -= b.damage;
          particles.addDamageText(enemy.x, enemy.y, b.damage, 'normal');
          particles.addSparks(b.x, b.y, 3);

          const kAngle = Math.atan2(b.vy, b.vx);
          enemy.knockbackX += Math.cos(kAngle) * 50;
          enemy.knockbackY += Math.sin(kAngle) * 50;

          if (b.isExplosive && b.explosionRadius) {
            particles.addExplosion(b.x, b.y, b.explosionRadius);
            sounds.playExplosion();
            for (let k = 0; k < enemies.length; k++) {
              if (k === j) continue;
              const oe = enemies[k];
              const oDist = Math.hypot(oe.x - b.x, oe.y - b.y);
              if (oDist < b.explosionRadius) {
                oe.hp -= b.damage * 0.7;
                particles.addDamageText(oe.x, oe.y, b.damage * 0.7, 'fire');
              }
            }
          }

          b.penetration--;
          if (b.penetration <= 0) {
            this.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
      }

      if (!bulletRemoved && b.distanceTraveled >= b.range) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Homing Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      let target = enemies.find(e => e.id === m.targetId) || enemies[0];

      if (target) {
        const desiredAngle = Math.atan2(target.y - m.y, target.x - m.x);
        let diff = desiredAngle - m.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        m.angle += diff * Math.min(1, 5.0 * dt);
      }

      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      particles.particles.push({
        x: m.x - Math.cos(m.angle) * 8,
        y: m.y - Math.sin(m.angle) * 8,
        vx: -Math.cos(m.angle) * 30 + (Math.random() - 0.5) * 20,
        vy: -Math.sin(m.angle) * 30 + (Math.random() - 0.5) * 20,
        radius: 3 + Math.random() * 2,
        color: Math.random() > 0.4 ? '#f97316' : '#78716c',
        alpha: 0.8,
        decay: 2.5,
        shape: 'smoke',
      });

      let detonated = false;
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const distSq = (enemy.x - m.x) ** 2 + (enemy.y - m.y) ** 2;
        if (distSq < (enemy.radius + 12) ** 2) {
          detonated = true;
          break;
        }
      }

      if (detonated || m.life <= 0) {
        sounds.playExplosion();
        particles.addExplosion(m.x, m.y, m.explosionRadius);

        for (let k = 0; k < enemies.length; k++) {
          const oe = enemies[k];
          const dist = Math.hypot(oe.x - m.x, oe.y - m.y);
          if (dist < m.explosionRadius) {
            const damageFactor = 1 - (dist / m.explosionRadius) * 0.4;
            const appliedDamage = m.damage * damageFactor;
            oe.hp -= appliedDamage;
            particles.addDamageText(oe.x, oe.y, appliedDamage, 'fire');
            const kAngle = Math.atan2(oe.y - m.y, oe.x - m.x);
            oe.knockbackX += Math.cos(kAngle) * 140;
            oe.knockbackY += Math.sin(kAngle) * 140;
          }
        }

        this.missiles.splice(i, 1);
      }
    }

    // Update Oil Slicks
    for (let i = this.oilSlicks.length - 1; i >= 0; i--) {
      const slick = this.oilSlicks[i];
      slick.life -= dt;

      if (slick.isBurning && Math.random() < 0.6) {
        const offsetR = Math.random() * slick.radius * 0.8;
        const offsetA = Math.random() * Math.PI * 2;
        particles.particles.push({
          x: slick.x + Math.cos(offsetA) * offsetR,
          y: slick.y + Math.sin(offsetA) * offsetR,
          vx: (Math.random() - 0.5) * 15,
          vy: -20 - Math.random() * 25,
          radius: 3 + Math.random() * 4,
          color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
          alpha: 0.9,
          decay: 2.2,
          shape: 'fire',
        });
      }

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const distSq = (enemy.x - slick.x) ** 2 + (enemy.y - slick.y) ** 2;
        if (distSq < slick.radius ** 2) {
          enemy.speed = Math.min(enemy.speed, 65);
          if (slick.isBurning) {
            const burnDamage = slick.damagePerSec * dt;
            enemy.hp -= burnDamage;
            if (Math.random() < 0.1) {
              particles.addDamageText(enemy.x, enemy.y, slick.damagePerSec * 0.5, 'fire');
            }
          }
        }
      }

      if (slick.life <= 0) {
        this.oilSlicks.splice(i, 1);
      }
    }
  }

  render(ctx, cameraX, cameraY, player) {
    // Oil Slicks
    for (let i = 0; i < this.oilSlicks.length; i++) {
      const s = this.oilSlicks[i];
      const screenX = s.x - cameraX;
      const screenY = s.y - cameraY;
      const alpha = Math.min(1, s.life / (s.maxLife * 0.2));

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;

      if (s.isBurning) {
        const grad = ctx.createRadialGradient(screenX, screenY, s.radius * 0.2, screenX, screenY, s.radius);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, 'rgba(68, 64, 60, 0.4)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#0c0a09';
      }

      ctx.beginPath();
      ctx.ellipse(screenX, screenY, s.radius, s.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = s.isBurning ? 'rgba(254, 240, 138, 0.4)' : 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.ellipse(screenX - s.radius * 0.2, screenY - s.radius * 0.2, s.radius * 0.4, s.radius * 0.3, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Bullets
    ctx.save();
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      const screenX = b.x - cameraX;
      const screenY = b.y - cameraY;

      const length = 12;
      const angle = Math.atan2(b.vy, b.vx);
      const tailX = screenX - Math.cos(angle) * length;
      const tailY = screenY - Math.sin(angle) * length;

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = b.radius * 1.5;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(screenX, screenY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Homing Missiles
    ctx.save();
    for (let i = 0; i < this.missiles.length; i++) {
      const m = this.missiles[i];
      const screenX = m.x - cameraX;
      const screenY = m.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(m.angle);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-10, -3.5, 20, 7);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(10, -3.5);
      ctx.lineTo(16, 0);
      ctx.lineTo(10, 3.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(-11, -6, 4, 12);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-11, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // Orbiting Bumper Sawblades
    const sawWeapon = player.weapons.saw;
    if (sawWeapon.level > 0) {
      const sawCount = Math.min(4, sawWeapon.level);
      const orbitRadius = 48 + sawWeapon.level * 4;
      const sawRadius = 14 + sawWeapon.level * 2;

      for (let s = 0; s < sawCount; s++) {
        const angle = this.sawAngle + (s * (Math.PI * 2) / sawCount);
        const sawX = player.x + Math.cos(angle) * orbitRadius - cameraX;
        const sawY = player.y + Math.sin(angle) * orbitRadius - cameraY;

        ctx.save();
        ctx.translate(sawX, sawY);
        ctx.rotate(this.sawAngle * 4);

        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        const teeth = 12;
        for (let t = 0; t < teeth; t++) {
          const tAngle = (t * Math.PI * 2) / teeth;
          const tx = Math.cos(tAngle) * (sawRadius + 4);
          const ty = Math.sin(tAngle) * (sawRadius + 4);
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  reset() {
    this.bullets = [];
    this.missiles = [];
    this.oilSlicks = [];
    this.sawAngle = 0;
  }
}

// --- 4. Enemy Manager ---
class EnemyManager {
  constructor() {
    this.enemies = [];
    this.drops = [];
    this.nextEnemyId = 1;
    this.nextDropId = 1;
    this.spawnTimer = 0;
    this.bossSpawnedTimers = new Set();
  }

  update(dt, gameTime, player, particles, onBossKilled) {
    this.spawnDirector(dt, gameTime, player);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      e.x += e.knockbackX * dt;
      e.y += e.knockbackY * dt;
      e.knockbackX *= Math.pow(0.05, dt);
      e.knockbackY *= Math.pow(0.05, dt);

      if (e.isBoss) {
        if (!e.chargeCooldown) e.chargeCooldown = 6.0;
        e.chargeCooldown -= dt;

        if (e.chargeCooldown <= 0 && !e.isCharging) {
          e.isCharging = true;
          e.specialTimer = 1.6;
          sounds.playBoost();
          particles.addScreenShake(8);
        }

        if (e.isCharging) {
          e.specialTimer = (e.specialTimer || 0) - dt;
          particles.addExhaustSmoke(
            e.x - Math.cos(e.angle) * 35,
            e.y - Math.sin(e.angle) * 35,
            e.angle,
            true
          );
          if ((e.specialTimer || 0) <= 0) {
            e.isCharging = false;
            e.chargeCooldown = 7.0;
          }
        }
      }

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - e.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      const turnRate = e.isBoss ? 1.8 : 3.8;
      e.angle += angleDiff * Math.min(1, turnRate * dt);

      let currentSpeed = e.speed;
      if (e.isCharging) currentSpeed *= 2.4;
      e.x += Math.cos(e.angle) * currentSpeed * dt;
      e.y += Math.sin(e.angle) * currentSpeed * dt;

      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const distSq = (other.x - e.x) ** 2 + (other.y - e.y) ** 2;
        const minDist = e.radius + other.radius;
        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist) * 0.4;
          const pushX = ((e.x - other.x) / dist) * push;
          const pushY = ((e.y - other.y) / dist) * push;
          e.x += pushX * dt * 30;
          e.y += pushY * dt * 30;
        }
      }

      // Collision with Player
      const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
      const pCollisionDist = e.radius + 18;

      if (pDistSq < pCollisionDist * pCollisionDist) {
        if (player.isBoosting) {
          const ramDmg = 80 * player.ramDamageMultiplier * (1 + player.speed / player.maxSpeed);
          e.hp -= ramDmg;
          particles.addDamageText(e.x, e.y, ramDmg, 'crit');
          particles.addSparks(e.x, e.y, 8);
          particles.addScreenShake(6);
          sounds.playCrash();

          const ramAngle = player.angle;
          if (!e.isBoss) {
            e.knockbackX += Math.cos(ramAngle) * 450;
            e.knockbackY += Math.sin(ramAngle) * 450;
          } else {
            e.knockbackX += Math.cos(ramAngle) * 80;
            e.knockbackY += Math.sin(ramAngle) * 80;
          }

          if (e.isBoss) {
            player.hp -= 8 * (1 - player.armor);
          }
        } else {
          const effectiveDmg = e.damage * (1 - player.armor);
          player.hp -= effectiveDmg * dt * 1.5;
          if (Math.random() < 0.15) {
            sounds.playCrash();
            particles.addScreenShake(4);
            particles.addDamageText(player.x, player.y, effectiveDmg * 2, 'crit');
          }
          const pushAngle = Math.atan2(player.y - e.y, player.x - e.x);
          player.vx += Math.cos(pushAngle) * 30;
          player.vy += Math.sin(pushAngle) * 30;
        }
      }

      // Death check
      if (e.hp <= 0) {
        sounds.playExplosion();
        particles.addExplosion(e.x, e.y, e.radius * 2.2);
        player.totalKills++;

        this.spawnDrop(e);

        if (e.isBoss && onBossKilled) {
          onBossKilled(e);
        }

        this.enemies.splice(i, 1);
      }
    }

    // Drops & Magnet
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const dist = Math.hypot(player.x - drop.x, player.y - drop.y);

      if (dist < player.magnetRadius) {
        const pullFactor = 1 - dist / player.magnetRadius;
        const speed = 250 + pullFactor * 450;
        const angle = Math.atan2(player.y - drop.y, player.x - drop.x);
        drop.vx = Math.cos(angle) * speed;
        drop.vy = Math.sin(angle) * speed;
      } else {
        drop.vx *= Math.pow(0.08, dt);
        drop.vy *= Math.pow(0.08, dt);
      }

      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;

      if (dist < 22) {
        sounds.playPickup();
        const expYieldRate = Math.max(0.4, Math.pow(0.965, player.level - 1));

        if (drop.type === 'oil_drop') {
          player.exp += Math.max(1, Math.round(drop.value * expYieldRate));
          player.scrapCollected += 1;
        } else if (drop.type === 'scrap') {
          player.exp += Math.max(2, Math.round(drop.value * 1.5 * expYieldRate));
          player.scrapCollected += 3;
        } else if (drop.type === 'repair') {
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
          particles.addDamageText(player.x, player.y, Math.round(player.maxHp * 0.35), 'saw');
        } else if (drop.type === 'magnet') {
          for (let d = 0; d < this.drops.length; d++) {
            const od = this.drops[d];
            const a = Math.atan2(player.y - od.y, player.x - od.x);
            od.vx = Math.cos(a) * 800;
            od.vy = Math.sin(a) * 800;
          }
        } else if (drop.type === 'nitro') {
          player.boostFuel = player.maxBoostFuel;
        }

        this.drops.splice(i, 1);
      }
    }
  }

  spawnDirector(dt, gameTime, player) {
    this.spawnTimer += dt;

    // 난이도: 적 출현 빈도 레벨업에 따라 점진적으로 증가
    const levelSpawnReduction = Math.min(0.85, (player.level - 1) * 0.055);
    const timeReduction = Math.min(0.4, (gameTime / 240) * 0.4);
    const spawnInterval = Math.max(0.15, (1.35 - timeReduction) * (1 - levelSpawnReduction));

    const maxEnemies = Math.min(260, 100 + player.level * 10);

    if (this.spawnTimer >= spawnInterval && this.enemies.length < maxEnemies) {
      this.spawnTimer = 0;
      this.spawnWave(gameTime, player);
    }

    const bossMilestones = [120, 240, 360, 480];
    for (const mile of bossMilestones) {
      if (gameTime >= mile && !this.bossSpawnedTimers.has(mile)) {
        this.bossSpawnedTimers.add(mile);
        this.spawnBoss(player, gameTime);
      }
    }
  }

  spawnWave(gameTime, player) {
    const types = ['kickboard'];
    if (gameTime > 30 || player.level >= 3) types.push('bicycle');
    if (gameTime > 75 || player.level >= 6) types.push('motorcycle');
    if (gameTime > 130 || player.level >= 10) types.push('buggy');

    const levelBonusBatch = Math.floor((player.level - 1) / 3);
    const maxBatch = Math.min(7, 2 + levelBonusBatch + (gameTime > 120 ? 2 : 0));
    const count = 1 + Math.floor(Math.random() * maxBatch);
    const baseSpawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 650 + Math.random() * 150;

    for (let c = 0; c < count; c++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const angle = baseSpawnAngle + (Math.random() - 0.5) * 0.6;
      const x = player.x + Math.cos(angle) * spawnDist;
      const y = player.y + Math.sin(angle) * spawnDist;

      this.createEnemy(type, x, y, gameTime);
    }
  }

  spawnBoss(player, gameTime) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 750;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    const hpScale = 1 + (gameTime / 120) * 0.6;

    this.enemies.push({
      id: this.nextEnemyId++,
      type: 'boss_truck',
      x,
      y,
      angle: Math.atan2(player.y - y, player.x - x),
      speed: 85,
      hp: Math.round(1800 * hpScale),
      maxHp: Math.round(1800 * hpScale),
      radius: 38,
      damage: 32,
      expValue: 70,
      knockbackX: 0,
      knockbackY: 0,
      isBoss: true,
      color: '#dc2626',
      name: '대형 몬스터 트럭 (BOSS)',
    });
  }

  createEnemy(type, x, y, gameTime) {
    const timeScale = 1 + (gameTime / 240);

    let speed = 90;
    let hp = 24 * timeScale;
    let radius = 12;
    let damage = 10;
    let expValue = 6;
    let color = '#22c55e';
    let name = '전동 킥보드';

    switch (type) {
      case 'kickboard':
        speed = 135;
        hp = 22 * timeScale;
        radius = 11;
        damage = 8;
        expValue = 5;
        color = '#10b981';
        name = '전동 킥보드';
        break;
      case 'bicycle':
        speed = 105;
        hp = 50 * timeScale;
        radius = 15;
        damage = 14;
        expValue = 10;
        color = '#38bdf8';
        name = '자전거';
        break;
      case 'motorcycle':
        speed = 175;
        hp = 110 * timeScale;
        radius = 18;
        damage = 22;
        expValue = 18;
        color = '#f97316';
        name = '폭주족 오토바이';
        break;
      case 'buggy':
        speed = 120;
        hp = 260 * timeScale;
        radius = 24;
        damage = 26;
        expValue = 32;
        color = '#a855f7';
        name = '사막 버기카';
        break;
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      x,
      y,
      angle: 0,
      speed,
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      radius,
      damage,
      expValue,
      knockbackX: 0,
      knockbackY: 0,
      color,
      name,
    });
  }

  spawnDrop(enemy) {
    const roll = Math.random();
    let type = 'oil_drop';
    let value = enemy.expValue;
    let radius = 6;
    let color = '#f59e0b';

    if (enemy.isBoss) {
      type = 'repair';
      radius = 11;
      color = '#22c55e';
      value = 100;
    } else if (roll < 0.04) {
      type = 'repair';
      radius = 10;
      color = '#22c55e';
    } else if (roll < 0.07) {
      type = 'magnet';
      radius = 10;
      color = '#38bdf8';
    } else if (roll < 0.10) {
      type = 'nitro';
      radius = 10;
      color = '#06b6d4';
    } else if (roll < 0.35) {
      type = 'scrap';
      radius = 8;
      color = '#cbd5e1';
      value = enemy.expValue * 2;
    }

    this.drops.push({
      id: this.nextDropId++,
      type,
      x: enemy.x,
      y: enemy.y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      value,
      radius,
      color,
      life: 90,
    });
  }

  render(ctx, cameraX, cameraY) {
    // Drops
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      const screenX = drop.x - cameraX;
      const screenY = drop.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (drop.type === 'oil_drop') {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-2, -2, drop.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (drop.type === 'scrap') {
        ctx.shadowColor = '#cbd5e1';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * Math.PI) / 3;
          const px = Math.cos(a) * drop.radius;
          const py = Math.sin(a) * drop.radius;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (drop.type === 'repair') {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 4, 12);
        ctx.fillRect(-6, -2, 12, 4);
      } else if (drop.type === 'magnet') {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 7, Math.PI, 0);
        ctx.stroke();
      } else if (drop.type === 'nitro') {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillRect(-4, -8, 8, 16);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-2, -10, 4, 3);
      }

      ctx.restore();
    }

    // Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const screenX = e.x - cameraX;
      const screenY = e.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(e.angle);

      this.renderEnemyVehicle(ctx, e);

      ctx.restore();

      if (e.hp < e.maxHp || e.isBoss) {
        const barW = e.isBoss ? 80 : 32;
        const barH = e.isBoss ? 8 : 4;
        const barX = screenX - barW / 2;
        const barY = screenY - e.radius - (e.isBoss ? 20 : 12);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = e.isBoss ? '#ef4444' : '#22c55e';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        if (e.isBoss) {
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#f87171';
          ctx.textAlign = 'center';
          ctx.fillText(e.name, screenX, barY - 4);
        }
      }
    }
  }

  renderEnemyVehicle(ctx, e) {
    if (e.type === 'kickboard') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-12, -3.5, 24, 7);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(-8, -2, 16, 4);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, -3, 3, 6);
      ctx.fillRect(-12, -3, 3, 6);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(8, -7, 2, 14);

      ctx.fillStyle = '#a7f3d0';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'bicycle') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -2.5, 5, 5);
      ctx.fillRect(-16, -2.5, 5, 5);

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, -7);
      ctx.lineTo(11, 7);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'motorcycle') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -4, 7, 8);
      ctx.fillRect(14, -3, 5, 6);

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-16, -7, 18, 2);
      ctx.fillRect(-16, 5, 18, 2);

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(14, -5);
      ctx.lineTo(22, 0);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(-2, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -2, 3, 4);
    } else if (e.type === 'buggy') {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-18, -16, 10, 7);
      ctx.fillRect(10, -16, 9, 7);
      ctx.fillRect(-18, 9, 10, 7);
      ctx.fillRect(10, 9, 9, 7);

      ctx.fillStyle = '#9333ea';
      ctx.fillRect(-15, -11, 30, 22);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-10, -8, 20, 16);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-5, -5, 10, 10);
    } else if (e.type === 'boss_truck') {
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(-35, -34, 24, 15);
      ctx.fillRect(14, -34, 24, 15);
      ctx.fillRect(-35, 19, 24, 15);
      ctx.fillRect(14, 19, 24, 15);

      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2;
      for (let tx of [-30, -20, 18, 28]) {
        ctx.beginPath();
        ctx.moveTo(tx, -34); ctx.lineTo(tx + 4, -19);
        ctx.moveTo(tx, 19); ctx.lineTo(tx + 4, 34);
        ctx.stroke();
      }

      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-32, -22, 64, 44);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(-28, -6, 56, 12);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -16, 12, 32);

      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(32, -24);
      ctx.lineTo(48, -12);
      ctx.lineTo(44, 0);
      ctx.lineTo(48, 12);
      ctx.lineTo(32, 24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      for (let py of [-18, -9, 0, 9, 18]) {
        ctx.beginPath();
        ctx.moveTo(42, py - 3);
        ctx.lineTo(52, py);
        ctx.lineTo(42, py + 3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#52525b';
      ctx.fillRect(-18, -25, 8, 5);
      ctx.fillRect(-18, 20, 8, 5);
    }
  }

  reset() {
    this.enemies = [];
    this.drops = [];
    this.spawnTimer = 0;
    this.bossSpawnedTimers.clear();
  }
}

// --- 5. Required EXP Calculation ---
function calculateRequiredExp(level) {
  return Math.round(30 + Math.pow(level - 1, 1.7) * 26 + (level - 1) * 18);
}

// --- 6. Game Engine ---
class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'TITLE';
    this.gameTime = 0;

    this.particles = new ParticleManager();
    this.weapons = new WeaponManager();
    this.enemies = new EnemyManager();
    this.player = this.createDefaultPlayer();

    this.cameraX = 0;
    this.cameraY = 0;

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      Space: false,
      ShiftLeft: false,
      ShiftRight: false,
    };

    this.touchBoost = false;
    this.currentUpgrades = [];
    this.onStateChange = null;
    this.onLevelUp = null;

    this.lastTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    this.bindEvents();
    this.resizeCanvas();
  }

  createDefaultPlayer() {
    return {
      x: 0,
      y: 0,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      maxSpeed: 275,
      acceleration: 420,
      turnSpeed: 4.2, // Lv.1 오토바이: 민첩한 회전력
      friction: 0.94,
      driftFactor: 0.84,

      hp: 75,
      maxHp: 75,
      armor: 0.05,
      magnetRadius: 110,
      ramDamageMultiplier: 0.85,

      boostFuel: 100,
      maxBoostFuel: 100,
      boostRegen: 16,
      isBoosting: false,
      boostCooldown: 0,

      weapons: {
        turret: {
          type: 'turret',
          level: 1,
          maxLevel: 8,
          lastFired: 0,
          cooldown: 350,
          name: '전방 기관총',
          desc: '차량 전방의 가장 가까운 적을 조준 사격합니다.',
        },
        saw: {
          type: 'saw',
          level: 0,
          maxLevel: 6,
          lastFired: 0,
          cooldown: 0,
          name: '회전 범퍼 톱날',
          desc: '차량 주위를 공전하며 접근하는 적을 절단합니다.',
        },
        oil: {
          type: 'oil',
          level: 0,
          maxLevel: 6,
          lastFired: 0,
          cooldown: 2200,
          name: '오일 슬릭 & 화염',
          desc: '후방에 오일을 살포하여 적을 감속시키고 화염을 일으킵니다.',
        },
        missile: {
          type: 'missile',
          level: 0,
          maxLevel: 6,
          lastFired: 0,
          cooldown: 3200,
          name: '오토 타겟 미사일',
          desc: '원거리의 강한 적을 추적하여 광역 폭발을 일으킵니다.',
        },
      },

      vehicleType: 'motorcycle',
      vehicleName: '오토바이',
      weaponPowerMultiplier: 1.0,

      level: 1,
      exp: 0,
      nextLevelExp: calculateRequiredExp(1),
      totalKills: 0,
      scrapCollected: 0,
    };
  }

  getVehicleInfoForLevel(level) {
    if (level === 1) {
      return {
        type: 'motorcycle',
        name: '오토바이',
        description: '날렵하고 민첩한 기동성을 지녔으나 내구도가 낮습니다.',
        badge: 'Lv.1 오토바이',
      };
    } else if (level === 2) {
      return {
        type: 'compact',
        name: '경차',
        description: '균형 잡힌 소형 차량으로 차체 내구도와 충돌 안정성이 상승합니다.',
        badge: 'Lv.2 경차 진화',
      };
    } else if (level === 3) {
      return {
        type: 'sedan',
        name: '승용차',
        description: '안정적인 최고 속도와 든든한 방어력, 강화된 무기 화력을 갖춘 4도어 세단입니다.',
        badge: 'Lv.3 승용차 진화',
      };
    } else if (level === 4) {
      return {
        type: 'suv',
        name: 'SUV',
        description: '묵직하고 튼튼한 체력, 적 밀쳐내기와 부스터 돌진 충돌력이 대폭 강화됩니다.',
        badge: 'Lv.4 SUV 진화',
      };
    } else {
      return {
        type: 'sportscar',
        name: '슈퍼 스포츠카',
        description: '최고 속도와 강력한 무기 성능(화력 +45%)을 발휘하는 최종 진화입니다.',
        badge: level === 5 ? 'Lv.5 최종 진화: 스포츠카' : `Lv.${level} 스포츠카 강화`,
      };
    }
  }

  applyVehicleEvolution(level) {
    const p = this.player;
    if (level === 2) {
      p.vehicleType = 'compact';
      p.vehicleName = '경차';
      p.maxHp = Math.round(p.maxHp + 25);
      p.hp = Math.min(p.maxHp, p.hp + 25);
      p.armor = Math.min(0.65, p.armor + 0.06);
      p.maxSpeed = Math.round(p.maxSpeed * 1.06);
      p.ramDamageMultiplier *= 1.2;
      p.turnSpeed = 3.6;
      p.driftFactor = 0.88;
    } else if (level === 3) {
      p.vehicleType = 'sedan';
      p.vehicleName = '승용차';
      p.maxHp = Math.round(p.maxHp + 35);
      p.hp = Math.min(p.maxHp, p.hp + 35);
      p.armor = Math.min(0.65, p.armor + 0.08);
      p.maxSpeed = Math.round(p.maxSpeed * 1.08);
      p.ramDamageMultiplier *= 1.25;
      p.turnSpeed = 3.4;
      p.driftFactor = 0.90;
      p.weaponPowerMultiplier = (p.weaponPowerMultiplier || 1.0) * 1.15;
    } else if (level === 4) {
      p.vehicleType = 'suv';
      p.vehicleName = 'SUV';
      p.maxHp = Math.round(p.maxHp + 50);
      p.hp = Math.min(p.maxHp, p.hp + 50);
      p.armor = Math.min(0.65, p.armor + 0.12);
      p.ramDamageMultiplier *= 1.6;
      p.acceleration *= 1.15;
      p.turnSpeed = 3.1;
      p.driftFactor = 0.92;
      p.weaponPowerMultiplier = (p.weaponPowerMultiplier || 1.0) * 1.15;
    } else if (level >= 5) {
      p.vehicleType = 'sportscar';
      p.vehicleName = '스포츠카';
      p.maxHp = Math.round(p.maxHp + 45);
      p.hp = Math.min(p.maxHp, p.hp + 45);
      p.maxSpeed = Math.max(340, Math.round(p.maxSpeed * 1.18));
      p.acceleration = Math.max(540, Math.round(p.acceleration * 1.25));
      p.ramDamageMultiplier *= 1.35;
      p.turnSpeed = 3.8;
      p.driftFactor = 0.86;
      p.weaponPowerMultiplier = (p.weaponPowerMultiplier || 1.0) * 1.25;
    }
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
      if (e.code === 'KeyM') {
        sounds.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    });
  }

  startGame() {
    this.state = 'PLAYING';
    this.gameTime = 0;
    this.player = this.createDefaultPlayer();
    this.particles.reset();
    this.weapons.reset();
    this.enemies.reset();
    sounds.startEngine();

    if (this.onStateChange) this.onStateChange(this.state);

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop = this.loop.bind(this);
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sounds.stopEngine();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      sounds.startEngine();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  restartGame() {
    this.startGame();
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.gameTime += dt;

    this.updatePlayerMovement(dt);
    this.weapons.update(dt, this.player, this.enemies.enemies, this.particles);

    this.enemies.update(dt, this.gameTime, this.player, this.particles, (boss) => {
      // 2분 보스 격파 시 최종 승리!
      if (this.gameTime >= 120 || boss.isBoss) {
        this.particles.addScreenShake(28);
        sounds.stopEngine();
        sounds.playVictory();
        this.state = 'VICTORY';
        if (this.onStateChange) this.onStateChange(this.state);
      }
    });

    this.particles.update(dt);

    const speedRatio = Math.abs(this.player.speed) / this.player.maxSpeed;
    sounds.updateEngine(speedRatio, this.player.isBoosting);

    const targetCamX = this.player.x - this.canvas.width / 2 + (Math.random() - 0.5) * this.particles.screenShake;
    const targetCamY = this.player.y - this.canvas.height / 2 + (Math.random() - 0.5) * this.particles.screenShake;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, 10 * dt);
    this.cameraY += (targetCamY - this.cameraY) * Math.min(1, 10 * dt);

    if (this.player.exp >= this.player.nextLevelExp) {
      this.triggerLevelUp();
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.state = 'GAME_OVER';
      sounds.stopEngine();
      sounds.playCrash();
      sounds.playExplosion();
      this.particles.addExplosion(this.player.x, this.player.y, 70);
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  updatePlayerMovement(dt) {
    const p = this.player;

    const isUp = this.keys.KeyW || this.keys.ArrowUp;
    const isDown = this.keys.KeyS || this.keys.ArrowDown;
    const isLeft = this.keys.KeyA || this.keys.ArrowLeft;
    const isRight = this.keys.KeyD || this.keys.ArrowRight;
    const wantsBoost = this.keys.Space || this.keys.ShiftLeft || this.keys.ShiftRight || this.touchBoost;

    if (wantsBoost && p.boostFuel > 5) {
      if (!p.isBoosting) {
        sounds.playBoost();
        this.particles.addScreenShake(4);
      }
      p.isBoosting = true;
      p.boostFuel = Math.max(0, p.boostFuel - 28 * dt);
    } else {
      p.isBoosting = false;
      p.boostFuel = Math.min(p.maxBoostFuel, p.boostFuel + p.boostRegen * dt);
    }

    const currentMaxSpeed = p.maxSpeed * (p.isBoosting ? 1.75 : 1.0);
    const currentAccel = p.acceleration * (p.isBoosting ? 2.2 : 1.0);

    if (isUp) {
      p.speed = Math.min(currentMaxSpeed, p.speed + currentAccel * dt);
    } else if (isDown) {
      p.speed = Math.max(-currentMaxSpeed * 0.45, p.speed - currentAccel * 1.3 * dt);
    } else {
      p.speed *= Math.pow(p.friction, dt * 60);
      if (Math.abs(p.speed) < 2) p.speed = 0;
    }

    const speedRatio = Math.abs(p.speed) / p.maxSpeed;
    const effectiveTurn = p.turnSpeed * (p.isBoosting ? 0.8 : 1.0) * Math.min(1.2, 0.4 + speedRatio * 0.8);

    const oldX = p.x;
    const oldY = p.y;

    if (isLeft) p.angle -= effectiveTurn * dt * (p.speed < 0 ? -1 : 1);
    if (isRight) p.angle += effectiveTurn * dt * (p.speed < 0 ? -1 : 1);

    const forwardX = Math.cos(p.angle);
    const forwardY = Math.sin(p.angle);
    const targetVx = forwardX * p.speed;
    const targetVy = forwardY * p.speed;

    p.vx = p.vx * p.driftFactor + targetVx * (1 - p.driftFactor);
    p.vy = p.vy * p.driftFactor + targetVy * (1 - p.driftFactor);

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const driftIntensity = Math.hypot(p.vx - targetVx, p.vy - targetVy);
    if ((driftIntensity > 40 || p.isBoosting) && Math.abs(p.speed) > 50) {
      const rearDist = p.vehicleType === 'motorcycle' ? 14 : 20;
      const tireSpread = p.vehicleType === 'motorcycle' ? 2 : 12;

      const rX1 = p.x - forwardX * rearDist - forwardY * tireSpread;
      const rY1 = p.y - forwardY * rearDist + forwardX * tireSpread;
      const rX2 = p.x - forwardX * rearDist + forwardY * tireSpread;
      const rY2 = p.y - forwardY * rearDist - forwardX * tireSpread;

      const prevRX1 = oldX - forwardX * rearDist - forwardY * tireSpread;
      const prevRY1 = oldY - forwardY * rearDist + forwardX * tireSpread;
      const prevRX2 = oldX - forwardX * rearDist + forwardY * tireSpread;
      const prevRY2 = oldY - forwardY * rearDist - forwardX * tireSpread;

      this.particles.addSkidMark(prevRX1, prevRY1, rX1, rY1, p.isBoosting ? 0.7 : 0.4);
      if (p.vehicleType !== 'motorcycle') {
        this.particles.addSkidMark(prevRX2, prevRY2, rX2, rY2, p.isBoosting ? 0.7 : 0.4);
      }
    }

    const exhaustX = p.x - forwardX * 22;
    const exhaustY = p.y - forwardY * 22;
    this.particles.addExhaustSmoke(exhaustX, exhaustY, p.angle, p.isBoosting);
  }

  triggerLevelUp() {
    const prevVehicleType = this.player.vehicleType;
    this.player.level++;
    this.player.exp -= this.player.nextLevelExp;
    this.player.nextLevelExp = calculateRequiredExp(this.player.level);

    this.applyVehicleEvolution(this.player.level);
    const didEvolve = prevVehicleType !== this.player.vehicleType || this.player.level === 5;
    const evolutionInfo = didEvolve ? this.getVehicleInfoForLevel(this.player.level) : null;

    sounds.playLevelUp();
    this.state = 'LEVEL_UP';
    sounds.stopEngine();

    this.currentUpgrades = this.generateUpgradeOptions();

    if (this.onLevelUp) this.onLevelUp(this.currentUpgrades, evolutionInfo);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  generateUpgradeOptions() {
    const p = this.player;
    const allOptions = [];

    const turret = p.weapons.turret;
    if (turret.level < turret.maxLevel) {
      allOptions.push({
        id: 'weapon_turret',
        category: 'weapon',
        weaponType: 'turret',
        title: turret.level === 0 ? '전방 기관총 (신규)' : `전방 기관총 (Lv.${turret.level + 1})`,
        subtitle: '기본 화력 강화',
        level: turret.level + 1,
        maxLevel: turret.maxLevel,
        description: turret.level === 0
          ? '차량 전방에 기관총을 장착하여 가장 가까운 적을 연속 사격합니다.'
          : turret.level === 4
          ? '탄환 수 +1 및 연사 속도 대폭 증가'
          : turret.level >= 6
          ? '폭발성 탄환으로 진화! 탄환 착탄 시 소형 광역 폭발 발생'
          : '공격력 +25%, 연사 속도 +15%, 사거리 확대',
        iconType: 'turret',
      });
    }

    const saw = p.weapons.saw;
    if (saw.level < saw.maxLevel) {
      allOptions.push({
        id: 'weapon_saw',
        category: 'weapon',
        weaponType: 'saw',
        title: saw.level === 0 ? '회전 범퍼 톱날 (신규)' : `회전 범퍼 톱날 (Lv.${saw.level + 1})`,
        subtitle: '접근 차단 근접 무기',
        level: saw.level + 1,
        maxLevel: saw.maxLevel,
        description: saw.level === 0
          ? '차량 주변을 공전하는 대형 톱날을 장착하여 접근하는 적을 지속 절단합니다.'
          : saw.level % 2 === 1
          ? '회전 톱날 1개 추가 배치 및 회전 속도 증가'
          : '톱날 절단 공격력 +35% 및 톱날 크기 확대',
        iconType: 'saw',
      });
    }

    const oil = p.weapons.oil;
    if (oil.level < oil.maxLevel) {
      allOptions.push({
        id: 'weapon_oil',
        category: 'weapon',
        weaponType: 'oil',
        title: oil.level === 0 ? '오일 슬릭 (신규)' : `오일 슬릭 & 화염 (Lv.${oil.level + 1})`,
        subtitle: '적 감속 & 화염 지대',
        level: oil.level + 1,
        maxLevel: oil.maxLevel,
        description: oil.level === 0
          ? '차량 후방에 끈적한 오일을 방출해 뒤따라오는 적을 50% 감속시킵니다.'
          : oil.level === 2
          ? '네이팜 화염 점화! 오일 웅덩이가 불타며 지속 화염 피해를 입힙니다.'
          : '오일 유출 쿨다운 -25% 및 웅덩이 반경 확대, 화염 지속시간 증가',
        iconType: 'oil',
      });
    }

    const missile = p.weapons.missile;
    if (missile.level < missile.maxLevel) {
      allOptions.push({
        id: 'weapon_missile',
        category: 'weapon',
        weaponType: 'missile',
        title: missile.level === 0 ? '오토 유도 미사일 (신규)' : `오토 유도 미사일 (Lv.${missile.level + 1})`,
        subtitle: '초장거리 광역 타격',
        level: missile.level + 1,
        maxLevel: missile.maxLevel,
        description: missile.level === 0
          ? '체력이 높거나 멀리 있는 엘리트 적을 자동 추적하는 고폭 미사일을 발사합니다.'
          : missile.level % 2 === 1
          ? '동시 발사 미사일 수 +1 및 유도 속도 증가'
          : '폭발 반경 +30% 및 직격 데미지 +40%',
        iconType: 'missile',
      });
    }

    allOptions.push({
      id: 'stat_armor',
      category: 'stat',
      title: '티타늄 강화 장갑판',
      subtitle: '방어 성능 강화',
      level: 1,
      maxLevel: 5,
      description: '최대 체력 +30 및 모든 받는 피해 15% 감소',
      iconType: 'shield',
    });

    allOptions.push({
      id: 'stat_engine',
      category: 'stat',
      title: '트윈 터보 V8 엔진',
      subtitle: '기동성 극대화',
      level: 1,
      maxLevel: 5,
      description: '최고 속도 +18% 및 가속도 +25% 증가',
      iconType: 'engine',
    });

    allOptions.push({
      id: 'stat_nitro',
      category: 'stat',
      title: '대용량 니트로 부스터',
      subtitle: '대시 효율 상승',
      level: 1,
      maxLevel: 5,
      description: '부스터 연료 최대치 +25 및 자동 충전 속도 +35%',
      iconType: 'nitro',
    });

    allOptions.push({
      id: 'stat_magnet',
      category: 'stat',
      title: '마그네틱 수거 범퍼',
      subtitle: '경험치 흡수 반경',
      level: 1,
      maxLevel: 5,
      description: '오일/스크랩 아이템 흡수 반경 +45% 확대',
      iconType: 'magnet',
    });

    allOptions.push({
      id: 'stat_ram',
      category: 'stat',
      title: '강화 스파이크 범퍼',
      subtitle: '돌진 충돌 공격력',
      level: 1,
      maxLevel: 5,
      description: '부스터 돌진 시 충돌 데미지 2배 및 적 넉백 대폭 강화',
      iconType: 'spikes',
    });

    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  applyUpgrade(option) {
    const p = this.player;

    if (option.category === 'weapon' && option.weaponType) {
      const w = p.weapons[option.weaponType];
      w.level = Math.min(w.maxLevel, w.level + 1);

      if (option.weaponType === 'turret') {
        w.cooldown = Math.max(140, 350 - w.level * 25);
      } else if (option.weaponType === 'oil') {
        w.cooldown = Math.max(1200, 2200 - w.level * 160);
      } else if (option.weaponType === 'missile') {
        w.cooldown = Math.max(1600, 3200 - w.level * 220);
      }
    } else {
      if (option.id === 'stat_armor') {
        p.maxHp += 30;
        p.hp = Math.min(p.maxHp, p.hp + 30);
        p.armor = Math.min(0.65, p.armor + 0.12);
      } else if (option.id === 'stat_engine') {
        p.maxSpeed *= 1.16;
        p.acceleration *= 1.22;
      } else if (option.id === 'stat_nitro') {
        p.maxBoostFuel += 25;
        p.boostFuel = p.maxBoostFuel;
        p.boostRegen *= 1.35;
      } else if (option.id === 'stat_magnet') {
        p.magnetRadius *= 1.45;
      } else if (option.id === 'stat_ram') {
        p.ramDamageMultiplier *= 1.6;
      }
    }

    this.state = 'PLAYING';
    this.lastTime = performance.now();
    sounds.startEngine();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.renderWorldBackground(ctx, w, h);
    this.particles.render(ctx, this.cameraX, this.cameraY);
    this.weapons.render(ctx, this.cameraX, this.cameraY, this.player);
    this.enemies.render(ctx, this.cameraX, this.cameraY);
    this.renderPlayerCar(ctx);
  }

  renderWorldBackground(ctx, w, h) {
    ctx.fillStyle = '#b48a5c';
    ctx.fillRect(0, 0, w, h);

    const camX = this.cameraX;
    const camY = this.cameraY;

    const highwayLeft = -350 - camX;
    const highwayRight = 350 - camX;

    if (highwayRight >= 0 && highwayLeft <= w) {
      ctx.fillStyle = '#292524';
      ctx.fillRect(highwayLeft, 0, 700, h);

      const curbWidth = 14;
      const stripeHeight = 30;
      const offsetY = -((camY % stripeHeight) + stripeHeight) % stripeHeight;

      for (let y = offsetY - stripeHeight; y < h + stripeHeight; y += stripeHeight) {
        const isRed = Math.floor((y + camY) / stripeHeight) % 2 === 0;
        ctx.fillStyle = isRed ? '#dc2626' : '#f5f5f4';
        ctx.fillRect(highwayLeft - curbWidth, y, curbWidth, stripeHeight);
        ctx.fillRect(highwayRight, y, curbWidth, stripeHeight);
      }

      ctx.fillStyle = '#facc15';
      ctx.fillRect(highwayLeft + 20, 0, 4, h);
      ctx.fillRect(highwayRight - 24, 0, 4, h);

      const laneStep = 700 / 4;
      const dashLen = 40;
      const dashGap = 50;
      const totalDash = dashLen + dashGap;
      const dashOffsetY = -((camY % totalDash) + totalDash) % totalDash;

      ctx.fillStyle = 'rgba(245, 245, 244, 0.7)';
      for (let lane = 1; lane <= 3; lane++) {
        const laneX = highwayLeft + lane * laneStep;
        for (let y = dashOffsetY - totalDash; y < h + totalDash; y += totalDash) {
          ctx.fillRect(laneX - 2, y, 4, dashLen);
        }
      }
    }

    const gridSize = 250;
    const startGridX = Math.floor((camX - 100) / gridSize);
    const endGridX = Math.ceil((camX + w + 100) / gridSize);
    const startGridY = Math.floor((camY - 100) / gridSize);
    const endGridY = Math.ceil((camY + h + 100) / gridSize);

    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        const worldX = gx * gridSize + 125;
        const worldY = gy * gridSize + 125;
        if (worldX > -360 && worldX < 360) continue;

        const seed = Math.sin(gx * 374761393 + gy * 668265263) * 10000;
        const rand = seed - Math.floor(seed);

        const screenObjX = worldX - camX;
        const screenObjY = worldY - camY;

        if (rand < 0.22) {
          ctx.fillStyle = '#78716c';
          ctx.beginPath();
          ctx.ellipse(screenObjX, screenObjY, 14 + rand * 10, 9 + rand * 6, rand * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        } else if (rand < 0.40) {
          ctx.fillStyle = '#4d7c0f';
          ctx.beginPath();
          ctx.arc(screenObjX, screenObjY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(screenObjX - 2, screenObjY - 12, 4, 16);
        } else if (rand < 0.52) {
          ctx.fillStyle = '#7c2d12';
          ctx.fillRect(screenObjX - 8, screenObjY - 6, 16, 12);
        }
      }
    }
  }

  renderPlayerCar(ctx) {
    const p = this.player;
    const screenX = p.x - this.cameraX;
    const screenY = p.y - this.cameraY;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(p.angle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    const shadowLen = p.vehicleType === 'motorcycle' ? 18 : (p.vehicleType === 'suv' ? 28 : 24);
    const shadowWidth = p.vehicleType === 'motorcycle' ? 8 : (p.vehicleType === 'suv' ? 18 : 14);
    ctx.ellipse(-2, 4, shadowLen, shadowWidth, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (p.vehicleType) {
      case 'motorcycle':
        this.renderMotorcycle(ctx, p);
        break;
      case 'compact':
        this.renderCompactCar(ctx, p);
        break;
      case 'sedan':
        this.renderSedan(ctx, p);
        break;
      case 'suv':
        this.renderSUV(ctx, p);
        break;
      case 'sportscar':
      default:
        this.renderSportsCar(ctx, p);
        break;
    }

    if (p.weapons.turret.level > 0) {
      const turretOffset = p.vehicleType === 'motorcycle' ? 8 : 0;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(turretOffset, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(turretOffset + 2, -3, 11, 2);
      ctx.fillRect(turretOffset + 2, 1, 11, 2);
    }

    if (p.isBoosting) {
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderMotorcycle(ctx, p) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -4, 8, 8);
    ctx.fillRect(12, -3, 6, 6);

    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(9, -8, 2.5, 16);

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(1, -2.5, 3.5, 5);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-17, 4.5, 15, 2.5);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(15, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lightGrad = ctx.createRadialGradient(16, 0, 6, 90, 0, 90);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(15, -6);
    ctx.lineTo(110, -35);
    ctx.lineTo(110, 35);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();
  }

  renderCompactCar(ctx, p) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -13, 8, 5);
    ctx.fillRect(8, -13, 8, 5);
    ctx.fillRect(-14, 8, 8, 5);
    ctx.fillRect(8, 8, 8, 5);

    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 20, 5);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-10, -7, 18, 14);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, -7, 6, 14);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(15, -6, 2.5, 0, Math.PI * 2);
    ctx.arc(15, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lightGrad = ctx.createRadialGradient(16, 0, 8, 100, 0, 100);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(15, -8);
    ctx.lineTo(115, -40);
    ctx.lineTo(115, 40);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fill();
  }

  renderSedan(ctx, p) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -14, 9, 5);
    ctx.fillRect(10, -14, 9, 5);
    ctx.fillRect(-16, 9, 9, 5);
    ctx.fillRect(10, 9, 9, 5);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-20, -11, 40, 22, 4);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(19, -6, 2, 12);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, -8, 8, 16);
    ctx.fillRect(-14, -8, 5, 16);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(7, -13, 3, 2);
    ctx.fillRect(7, 11, 3, 2);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(19, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(19, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lightGrad = ctx.createRadialGradient(20, 0, 10, 110, 0, 110);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(18, -9);
    ctx.lineTo(125, -45);
    ctx.lineTo(125, 45);
    ctx.lineTo(18, 9);
    ctx.closePath();
    ctx.fill();
  }

  renderSUV(ctx, p) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-18, -17, 11, 7);
    ctx.fillRect(11, -17, 11, 7);
    ctx.fillRect(-18, 10, 11, 7);
    ctx.fillRect(11, 10, 11, 7);

    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(-20, -13, 42, 26);

    ctx.fillStyle = '#52525b';
    ctx.fillRect(21, -12, 4, 24);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(23, -7, 2.5, 3);
    ctx.fillRect(23, 4, 2.5, 3);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(-12, -9, 22, 18);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(5, -9, 7, 18);

    ctx.fillStyle = '#fef08a';
    for (let py of [-9, -4, 4, 9]) {
      ctx.beginPath();
      ctx.arc(22, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const lightGrad = ctx.createRadialGradient(22, 0, 10, 120, 0, 120);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(21, -12);
    ctx.lineTo(135, -55);
    ctx.lineTo(135, 55);
    ctx.lineTo(21, 12);
    ctx.closePath();
    ctx.fill();
  }

  renderSportsCar(ctx, p) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-17, -15, 9, 6);
    ctx.fillRect(10, -15, 9, 6);
    ctx.fillRect(-17, 9, 9, 6);
    ctx.fillRect(10, 9, 9, 6);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(16, -12);
    ctx.lineTo(-14, -13);
    ctx.lineTo(-24, -10);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-14, 13);
    ctx.lineTo(16, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.fillRect(-22, -4, 40, 8);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(-4, -9);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-4, 9);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.fillRect(-26, -14, 4, 28);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-27, -15, 6, 4);
    ctx.fillRect(-27, 11, 6, 4);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-26, -6, 3, 3);
    ctx.fillRect(-26, 3, 3, 3);

    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.beginPath();
    ctx.arc(19, -8, 2.5, 0, Math.PI * 2);
    ctx.arc(19, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lightGrad = ctx.createRadialGradient(20, 0, 10, 130, 0, 130);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.2)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(18, -10);
    ctx.lineTo(140, -50);
    ctx.lineTo(140, 50);
    ctx.lineTo(18, 10);
    ctx.closePath();
    ctx.fill();
  }

  destroy() {
    this.isRunning = false;
    sounds.stopEngine();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// --- 7. Vanilla JS UI Controller ---
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const engine = new GameEngine(canvas);

  // DOM Elements
  const hudContainer = document.getElementById('hud-container');
  const titleModal = document.getElementById('title-modal');
  const levelupModal = document.getElementById('levelup-modal');
  const pausedModal = document.getElementById('paused-modal');
  const gameoverModal = document.getElementById('gameover-modal');
  const victoryModal = document.getElementById('victory-modal');
  const mobileControls = document.getElementById('mobile-controls');

  // HUD Elements
  const expLevelText = document.getElementById('exp-level-text');
  const expRatioText = document.getElementById('exp-ratio-text');
  const expBarFill = document.getElementById('exp-bar-fill');
  const vehicleNameBadge = document.getElementById('vehicle-name-badge');
  const hpText = document.getElementById('hp-text');
  const hpBarFill = document.getElementById('hp-bar-fill');
  const boostStatusText = document.getElementById('boost-status-text');
  const boostBarFill = document.getElementById('boost-bar-fill');
  const timerText = document.getElementById('timer-text');
  const killsText = document.getElementById('kills-text');

  // Weapon icons in HUD
  const weaponTurretTag = document.getElementById('weapon-turret-tag');
  const weaponSawTag = document.getElementById('weapon-saw-tag');
  const weaponOilTag = document.getElementById('weapon-oil-tag');
  const weaponMissileTag = document.getElementById('weapon-missile-tag');

  // Evolution banner in Level Up modal
  const evolutionBanner = document.getElementById('evolution-banner');
  const evolutionBadge = document.getElementById('evolution-badge');
  const evolutionName = document.getElementById('evolution-name');
  const evolutionDesc = document.getElementById('evolution-desc');
  const upgradeCardsContainer = document.getElementById('upgrade-cards-container');

  // Summary fields
  const goTime = document.getElementById('go-time');
  const goKills = document.getElementById('go-kills');
  const goLevel = document.getElementById('go-level');
  const goScrap = document.getElementById('go-scrap');

  const vicTime = document.getElementById('vic-time');
  const vicKills = document.getElementById('vic-kills');
  const vicLevel = document.getElementById('vic-level');
  const vicScrap = document.getElementById('vic-scrap');

  const muteBtn = document.getElementById('mute-btn');
  const muteIcon = document.getElementById('mute-icon');
  const pauseBtn = document.getElementById('pause-btn');

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function getWeaponSvgIcon(type) {
    switch (type) {
      case 'turret':
        return `<svg class="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`;
      case 'saw':
        return `<svg class="w-6 h-6 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
      case 'oil':
        return `<svg class="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
      case 'missile':
        return `<svg class="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`;
      case 'shield':
        return `<svg class="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      case 'engine':
        return `<svg class="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`;
      case 'nitro':
        return `<svg class="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case 'magnet':
        return `<svg class="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
      default:
        return `<svg class="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    }
  }

  function updateHUD() {
    const p = engine.player;
    const expPct = Math.min(100, Math.floor((p.exp / p.nextLevelExp) * 100));
    const hpPct = Math.min(100, Math.max(0, Math.floor((p.hp / p.maxHp) * 100)));
    const boostPct = Math.min(100, Math.max(0, Math.floor((p.boostFuel / p.maxBoostFuel) * 100)));

    if (expLevelText) expLevelText.textContent = `LV. ${p.level}`;
    if (expRatioText) expRatioText.textContent = `${Math.round(p.exp)} / ${Math.round(p.nextLevelExp)} EXP (${expPct}%)`;
    if (expBarFill) expBarFill.style.width = `${expPct}%`;

    if (vehicleNameBadge) vehicleNameBadge.textContent = `[${p.vehicleName}]`;
    if (hpText) hpText.textContent = `${Math.round(p.hp)} / ${Math.round(p.maxHp)}`;
    if (hpBarFill) {
      hpBarFill.style.width = `${hpPct}%`;
      hpBarFill.className = `h-full transition-all duration-150 rounded-sm ${
        hpPct > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
        hpPct > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
        'bg-gradient-to-r from-rose-700 to-rose-500 animate-pulse'
      }`;
    }

    if (boostStatusText) boostStatusText.textContent = p.isBoosting ? '돌진 중!' : `${Math.round(p.boostFuel)}%`;
    if (boostBarFill) boostBarFill.style.width = `${boostPct}%`;

    if (timerText) timerText.textContent = formatTime(engine.gameTime);
    if (killsText) killsText.textContent = p.totalKills.toString();

    // Weapon tags
    const w = p.weapons;
    if (weaponTurretTag) {
      weaponTurretTag.className = `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${w.turret.level > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'opacity-40 text-stone-500'}`;
      weaponTurretTag.querySelector('.level-span').textContent = `Lv.${w.turret.level}`;
    }
    if (weaponSawTag) {
      weaponSawTag.className = `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${w.saw.level > 0 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'opacity-40 text-stone-500'}`;
      weaponSawTag.querySelector('.level-span').textContent = `Lv.${w.saw.level}`;
    }
    if (weaponOilTag) {
      weaponOilTag.className = `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${w.oil.level > 0 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'opacity-40 text-stone-500'}`;
      weaponOilTag.querySelector('.level-span').textContent = `Lv.${w.oil.level}`;
    }
    if (weaponMissileTag) {
      weaponMissileTag.className = `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${w.missile.level > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'opacity-40 text-stone-500'}`;
      weaponMissileTag.querySelector('.level-span').textContent = `Lv.${w.missile.level}`;
    }
  }

  function setGameState(newState) {
    if (titleModal) titleModal.classList.toggle('hidden', newState !== 'TITLE');
    if (hudContainer) hudContainer.classList.toggle('hidden', newState === 'TITLE');
    if (levelupModal) levelupModal.classList.toggle('hidden', newState !== 'LEVEL_UP');
    if (pausedModal) pausedModal.classList.toggle('hidden', newState !== 'PAUSED');
    if (gameoverModal) gameoverModal.classList.toggle('hidden', newState !== 'GAME_OVER');
    if (victoryModal) victoryModal.classList.toggle('hidden', newState !== 'VICTORY');
    if (mobileControls) mobileControls.classList.toggle('hidden', newState !== 'PLAYING');

    if (newState === 'GAME_OVER') {
      const p = engine.player;
      if (goTime) goTime.textContent = formatTime(engine.gameTime);
      if (goKills) goKills.textContent = `${p.totalKills} 마리`;
      if (goLevel) goLevel.textContent = `Lv. ${p.level}`;
      if (goScrap) goScrap.textContent = `${p.scrapCollected} 개`;
    }

    if (newState === 'VICTORY') {
      const p = engine.player;
      if (vicTime) vicTime.textContent = formatTime(engine.gameTime);
      if (vicKills) vicKills.textContent = `${p.totalKills} 마리`;
      if (vicLevel) vicLevel.textContent = `Lv. ${p.level}`;
      if (vicScrap) vicScrap.textContent = `${p.scrapCollected} 개`;
    }
  }

  engine.onStateChange = (st) => setGameState(st);

  engine.onLevelUp = (upgrades, evolutionInfo) => {
    if (evolutionBanner) {
      if (evolutionInfo) {
        evolutionBanner.classList.remove('hidden');
        if (evolutionBadge) evolutionBadge.textContent = `[${evolutionInfo.badge}]`;
        if (evolutionName) evolutionName.textContent = evolutionInfo.name;
        if (evolutionDesc) evolutionDesc.textContent = `${evolutionInfo.description} (내구도 즉시 회복!)`;
      } else {
        evolutionBanner.classList.add('hidden');
      }
    }

    if (upgradeCardsContainer) {
      upgradeCardsContainer.innerHTML = '';
      upgrades.forEach((opt, idx) => {
        const cardBtn = document.createElement('button');
        cardBtn.className = 'relative group bg-stone-950/80 hover:bg-stone-800/90 border border-stone-700/80 hover:border-amber-400/80 rounded-xl p-4 text-left flex flex-col justify-between transition-all duration-150 transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10 cursor-pointer';
        cardBtn.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 rounded-lg bg-stone-900 border border-stone-800 group-hover:border-amber-500/40">
                ${getWeaponSvgIcon(opt.iconType)}
              </div>
              <span class="font-mono text-xs font-bold text-stone-500 group-hover:text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">[${idx + 1}]</span>
            </div>
            <div class="mb-2">
              <div class="text-[10px] font-display font-semibold uppercase tracking-wider text-amber-400/90 mb-0.5">${opt.subtitle}</div>
              <h3 class="text-sm font-bold text-white group-hover:text-amber-300">${opt.title}</h3>
            </div>
            <p class="text-stone-300 text-xs leading-relaxed">${opt.description}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span>${opt.category === 'weapon' ? '무기 슬롯' : '엔진 개조'}</span>
            <span class="text-amber-400 font-semibold">장착하기 &rarr;</span>
          </div>
        `;

        cardBtn.addEventListener('click', () => {
          engine.applyUpgrade(opt);
        });

        upgradeCardsContainer.appendChild(cardBtn);
      });
    }
  };

  // Keyboard shortcut listener for Level Up (1, 2, 3)
  window.addEventListener('keydown', (e) => {
    if (engine.state === 'LEVEL_UP' && engine.currentUpgrades.length > 0) {
      if (e.key === '1' && engine.currentUpgrades[0]) engine.applyUpgrade(engine.currentUpgrades[0]);
      if (e.key === '2' && engine.currentUpgrades[1]) engine.applyUpgrade(engine.currentUpgrades[1]);
      if (e.key === '3' && engine.currentUpgrades[2]) engine.applyUpgrade(engine.currentUpgrades[2]);
    }
  });

  // Buttons Event Listeners
  document.getElementById('start-btn')?.addEventListener('click', () => engine.startGame());
  document.getElementById('resume-btn')?.addEventListener('click', () => engine.resumeGame());
  document.getElementById('restart-from-pause-btn')?.addEventListener('click', () => engine.restartGame());
  document.getElementById('restart-gameover-btn')?.addEventListener('click', () => engine.restartGame());
  document.getElementById('restart-victory-btn')?.addEventListener('click', () => engine.restartGame());

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const muted = sounds.toggleMute();
      if (muteIcon) {
        muteIcon.innerHTML = muted
          ? `<svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>`
          : `<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      }
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (engine.state === 'PLAYING') engine.pauseGame();
      else if (engine.state === 'PAUSED') engine.resumeGame();
    });
  }

  // Mobile Touch Controls
  const btnUp = document.getElementById('touch-up');
  const btnDown = document.getElementById('touch-down');
  const btnLeft = document.getElementById('touch-left');
  const btnRight = document.getElementById('touch-right');
  const btnBoost = document.getElementById('mobile-boost-btn');

  function bindTouchKey(el, code) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); engine.keys[code] = true; });
    el.addEventListener('pointerup', (e) => { e.preventDefault(); engine.keys[code] = false; });
    el.addEventListener('pointerleave', (e) => { e.preventDefault(); engine.keys[code] = false; });
  }

  bindTouchKey(btnUp, 'ArrowUp');
  bindTouchKey(btnDown, 'ArrowDown');
  bindTouchKey(btnLeft, 'ArrowLeft');
  bindTouchKey(btnRight, 'ArrowRight');

  if (btnBoost) {
    btnBoost.addEventListener('pointerdown', (e) => { e.preventDefault(); engine.touchBoost = true; });
    btnBoost.addEventListener('pointerup', (e) => { e.preventDefault(); engine.touchBoost = false; });
    btnBoost.addEventListener('pointerleave', (e) => { e.preventDefault(); engine.touchBoost = false; });
  }

  // 20 FPS HUD update timer
  setInterval(() => {
    if (engine.state === 'PLAYING' || engine.state === 'PAUSED' || engine.state === 'LEVEL_UP') {
      updateHUD();
    }
  }, 50);

  // Initialize state
  setGameState('TITLE');
});
