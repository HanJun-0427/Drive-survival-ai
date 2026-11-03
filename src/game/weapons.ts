import { Bullet, Enemy, HomingMissile, OilSlick, PlayerCar } from './types';
import { ParticleManager } from './particles';
import { sounds } from './sound';

export class WeaponManager {
  public bullets: Bullet[] = [];
  public missiles: HomingMissile[] = [];
  public oilSlicks: OilSlick[] = [];
  
  // Saw blade orbit angle
  public sawAngle: number = 0;
  private nextBulletId: number = 1;
  private nextMissileId: number = 1;
  private nextOilId: number = 1;

  public update(
    dt: number,
    player: PlayerCar,
    enemies: Enemy[],
    particles: ParticleManager
  ) {
    const now = performance.now();

    // 1. Update Saw Blade orbit
    const sawWeapon = player.weapons.saw;
    if (sawWeapon.level > 0) {
      const rotSpeed = 3.2 + sawWeapon.level * 0.4;
      this.sawAngle = (this.sawAngle + rotSpeed * dt) % (Math.PI * 2);

      // Check collision between rotating sawblades and enemies
      const sawCount = Math.min(4, sawWeapon.level);
      const orbitRadius = 48 + sawWeapon.level * 4;
      const sawRadius = 14 + sawWeapon.level * 2;
      const sawDamage = (18 + sawWeapon.level * 8) * dt * 5 * (player.weaponPowerMultiplier || 1.0); // sustained contact DPS

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
            // slight knockback away from saw
            const kAngle = Math.atan2(enemy.y - sawY, enemy.x - sawX);
            enemy.knockbackX += Math.cos(kAngle) * 35;
            enemy.knockbackY += Math.sin(kAngle) * 35;
          }
        }
      }
    }

    // 2. Front Turret Auto-firing
    const turret = player.weapons.turret;
    if (turret.level > 0 && now - turret.lastFired >= turret.cooldown) {
      // Find nearest enemy in range
      const range = 380 + turret.level * 30;
      let closestEnemy: Enemy | null = null;
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
        const bulletCount = 1 + Math.floor((turret.level - 1) / 2); // 1 to 4 bullets
        const bulletSpeed = 620;
        const baseDamage = (16 + turret.level * 6) * (player.weaponPowerMultiplier || 1.0);

        for (let b = 0; b < bulletCount; b++) {
          const spread = (b - (bulletCount - 1) / 2) * 0.12;
          const angle = baseAngle + spread;
          // Spawn bullet slightly in front of car
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

          // Muzzle flash particle
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

    // 3. Oil Slick / Flame Drop
    const oil = player.weapons.oil;
    if (oil.level > 0 && now - oil.lastFired >= oil.cooldown) {
      oil.lastFired = now;
      // Drop oil behind car
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
        damagePerSec: (12 + oil.level * 8) * (player.weaponPowerMultiplier || 1.0),
        lastDamageTick: now,
      });
    }

    // 4. Homing Missile
    const missile = player.weapons.missile;
    if (missile.level > 0 && now - missile.lastFired >= missile.cooldown) {
      if (enemies.length > 0) {
        missile.lastFired = now;
        sounds.playMissileLaunch();

        // Target either boss or highest HP enemy or furthest enemy
        let target: Enemy = enemies[0];
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
            damage: (65 + missile.level * 28) * (player.weaponPowerMultiplier || 1.0),
            explosionRadius: 55 + missile.level * 10,
            life: 6.0,
          });
        }
      }
    }

    // --- Update Bullets ---
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      b.x += stepX;
      b.y += stepY;
      b.distanceTraveled += Math.hypot(stepX, stepY);

      let bulletRemoved = false;

      // Check collision with enemies
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const distSq = (enemy.x - b.x) ** 2 + (enemy.y - b.y) ** 2;
        const hitDist = b.radius + enemy.radius;

        if (distSq < hitDist * hitDist) {
          enemy.hp -= b.damage;
          particles.addDamageText(enemy.x, enemy.y, b.damage, 'normal');
          particles.addSparks(b.x, b.y, 3);

          // Knockback
          const kAngle = Math.atan2(b.vy, b.vx);
          enemy.knockbackX += Math.cos(kAngle) * 50;
          enemy.knockbackY += Math.sin(kAngle) * 50;

          if (b.isExplosive && b.explosionRadius) {
            particles.addExplosion(b.x, b.y, b.explosionRadius);
            sounds.playExplosion();
            // AOE
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

    // --- Update Homing Missiles ---
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      // Find current target or fallback to nearest
      let target: Enemy | undefined = enemies.find(e => e.id === m.targetId);
      if (!target && enemies.length > 0) {
        target = enemies[0];
      }

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

      // Exhaust smoke & flame trail
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

      // Collision with any enemy
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

        // AOE damage
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

    // --- Update Oil Slicks ---
    for (let i = this.oilSlicks.length - 1; i >= 0; i--) {
      const slick = this.oilSlicks[i];
      slick.life -= dt;

      // Flame particles on burning slick
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

      // Check enemies inside slick
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const distSq = (enemy.x - slick.x) ** 2 + (enemy.y - slick.y) ** 2;
        if (distSq < slick.radius ** 2) {
          // Slow down enemy
          enemy.speed = Math.min(enemy.speed, 65);

          // Burning damage tick
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

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, player: PlayerCar) {
    // 1. Render Oil Slicks on Ground
    for (let i = 0; i < this.oilSlicks.length; i++) {
      const s = this.oilSlicks[i];
      const screenX = s.x - cameraX;
      const screenY = s.y - cameraY;
      const alpha = Math.min(1, s.life / (s.maxLife * 0.2));

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;

      if (s.isBurning) {
        // Fiery molten puddle with glow
        const grad = ctx.createRadialGradient(screenX, screenY, s.radius * 0.2, screenX, screenY, s.radius);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, 'rgba(68, 64, 60, 0.4)');
        ctx.fillStyle = grad;
      } else {
        // Deep tar-black oil puddle with rainbow sheen
        ctx.fillStyle = '#0c0a09';
      }

      ctx.beginPath();
      ctx.ellipse(screenX, screenY, s.radius, s.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner puddle sheen
      ctx.fillStyle = s.isBurning ? 'rgba(254, 240, 138, 0.4)' : 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.ellipse(screenX - s.radius * 0.2, screenY - s.radius * 0.2, s.radius * 0.4, s.radius * 0.3, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Render Bullets
    ctx.save();
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      const screenX = b.x - cameraX;
      const screenY = b.y - cameraY;

      // Bullet tracer line
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

    // 3. Render Homing Missiles
    ctx.save();
    for (let i = 0; i < this.missiles.length; i++) {
      const m = this.missiles[i];
      const screenX = m.x - cameraX;
      const screenY = m.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(m.angle);

      // Rocket body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-10, -3.5, 20, 7);

      // Red warhead tip
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(10, -3.5);
      ctx.lineTo(16, 0);
      ctx.lineTo(10, 3.5);
      ctx.closePath();
      ctx.fill();

      // Tail fins
      ctx.fillStyle = '#475569';
      ctx.fillRect(-11, -6, 4, 12);

      // Thruster flame glow
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-11, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // 4. Render Orbiting Bumper Sawblades
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
        ctx.rotate(this.sawAngle * 4); // Fast saw spin

        // Outer glow
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;

        // Saw blade body
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius, 0, Math.PI * 2);
        ctx.fill();

        // Jagged saw teeth (12 teeth)
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

        // Center hub
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Center bolt
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, sawRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  public reset() {
    this.bullets = [];
    this.missiles = [];
    this.oilSlicks = [];
    this.sawAngle = 0;
  }
}
