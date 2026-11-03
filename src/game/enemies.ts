import { DropItem, DropType, Enemy, EnemyType, PlayerCar } from './types';
import { ParticleManager } from './particles';
import { sounds } from './sound';

export class EnemyManager {
  public enemies: Enemy[] = [];
  public drops: DropItem[] = [];
  private nextEnemyId: number = 1;
  private nextDropId: number = 1;

  private spawnTimer: number = 0;
  private bossSpawnedTimers: Set<number> = new Set();

  public update(
    dt: number,
    gameTime: number,
    player: PlayerCar,
    particles: ParticleManager,
    onBossKilled?: (boss: Enemy) => void
  ) {
    // 1. Spawning Director based on gameTime (seconds)
    this.spawnDirector(dt, gameTime, player);

    // 2. Update Enemies AI & Physics
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Handle knockback decay
      e.x += e.knockbackX * dt;
      e.y += e.knockbackY * dt;
      e.knockbackX *= Math.pow(0.05, dt);
      e.knockbackY *= Math.pow(0.05, dt);

      // Boss special ability: Charge Rush
      if (e.isBoss) {
        if (!e.chargeCooldown) e.chargeCooldown = 6.0;
        e.chargeCooldown -= dt;

        if (e.chargeCooldown <= 0 && !e.isCharging) {
          e.isCharging = true;
          e.specialTimer = 1.6; // charge for 1.6s
          sounds.playBoost();
          particles.addScreenShake(8);
        }

        if (e.isCharging) {
          e.specialTimer = (e.specialTimer || 0) - dt;
          // Heavy smoke from boss
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

      // Desired angle towards player
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const targetAngle = Math.atan2(dy, dx);

      // Smooth rotation
      let angleDiff = targetAngle - e.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      const turnRate = e.isBoss ? 1.8 : 3.8;
      e.angle += angleDiff * Math.min(1, turnRate * dt);

      // Movement
      let currentSpeed = e.speed;
      if (e.isCharging) {
        currentSpeed *= 2.4;
      }
      e.x += Math.cos(e.angle) * currentSpeed * dt;
      e.y += Math.sin(e.angle) * currentSpeed * dt;

      // Soft separation between enemies
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

      // Check collision with Player
      const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
      const pCollisionDist = e.radius + 18; // car average radius

      if (pDistSq < pCollisionDist * pCollisionDist) {
        if (player.isBoosting) {
          // PLAYER RAMMING ATTACK!
          const ramDmg = 80 * player.ramDamageMultiplier * (1 + player.speed / player.maxSpeed);
          e.hp -= ramDmg;
          particles.addDamageText(e.x, e.y, ramDmg, 'crit');
          particles.addSparks(e.x, e.y, 8);
          particles.addScreenShake(6);
          sounds.playCrash();

          // Big knockback on enemy
          const ramAngle = player.angle;
          if (!e.isBoss) {
            e.knockbackX += Math.cos(ramAngle) * 450;
            e.knockbackY += Math.sin(ramAngle) * 450;
          } else {
            e.knockbackX += Math.cos(ramAngle) * 80;
            e.knockbackY += Math.sin(ramAngle) * 80;
          }

          // Minor player recoil damage if enemy is boss
          if (e.isBoss) {
            player.hp -= 8 * (1 - player.armor);
          }
        } else {
          // Normal enemy damage to player
          const effectiveDmg = e.damage * (1 - player.armor);
          player.hp -= effectiveDmg * dt * 1.5;
          if (Math.random() < 0.15) {
            sounds.playCrash();
            particles.addScreenShake(4);
            particles.addDamageText(player.x, player.y, effectiveDmg * 2, 'crit');
          }
          // Slight bounce
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

        // Drop item
        this.spawnDrop(e);

        if (e.isBoss && onBossKilled) {
          onBossKilled(e);
        }

        this.enemies.splice(i, 1);
      }
    }

    // 3. Update Drops & Magnet Attraction
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const dist = Math.hypot(player.x - drop.x, player.y - drop.y);

      // Vacuum towards player
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

      // Pickup trigger
      if (dist < 22) {
        sounds.playPickup();

        // 경험치 수급율 감소: 레벨 상승에 따라 획득 경험치 점진적 감쇠 (최소 40%까지 점진적 감소)
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
          // Magnet: suck all drops on map immediately!
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

  private spawnDirector(dt: number, gameTime: number, player: PlayerCar) {
    this.spawnTimer += dt;

    // 난이도: 적 출현 빈도가 플레이어 레벨업에 따라 점진적으로 증가
    // 레벨 1일 때 약 1.35초 -> 레벨 상승에 따라 점진적으로 단축 (최대 0.15초까지 고속 소환)
    const levelSpawnReduction = Math.min(0.85, (player.level - 1) * 0.055);
    const timeReduction = Math.min(0.4, (gameTime / 240) * 0.4);
    const spawnInterval = Math.max(0.15, (1.35 - timeReduction) * (1 - levelSpawnReduction));

    // 화면 내 최대 적 허용 수도 플레이어 레벨에 따라 점진적으로 증가 (기본 100마리 -> 고레벨 최대 260마리)
    const maxEnemies = Math.min(260, 100 + player.level * 10);

    if (this.spawnTimer >= spawnInterval && this.enemies.length < maxEnemies) {
      this.spawnTimer = 0;
      this.spawnWave(gameTime, player);
    }

    // Boss checks every 120s (2m, 4m, 6m...)
    const bossMilestones = [120, 240, 360, 480];
    for (const mile of bossMilestones) {
      if (gameTime >= mile && !this.bossSpawnedTimers.has(mile)) {
        this.bossSpawnedTimers.add(mile);
        this.spawnBoss(player, gameTime);
      }
    }
  }

  private spawnWave(gameTime: number, player: PlayerCar) {
    // Determine pool of available enemies (시간 및 플레이어 레벨에 따라 고난도 적 해금)
    const types: EnemyType[] = ['kickboard'];
    if (gameTime > 30 || player.level >= 3) types.push('bicycle');
    if (gameTime > 75 || player.level >= 6) types.push('motorcycle');
    if (gameTime > 130 || player.level >= 10) types.push('buggy');

    // 난이도: 레벨업에 따라 한 번에 스폰되는 적 떼(Wave)의 규모 점진적 증가
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

  public spawnBoss(player: PlayerCar, gameTime: number) {
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

  private createEnemy(type: EnemyType, x: number, y: number, gameTime: number) {
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

  private spawnDrop(enemy: Enemy) {
    const roll = Math.random();
    let type: DropType = 'oil_drop';
    let value = enemy.expValue;
    let radius = 6;
    let color = '#f59e0b'; // amber oil drop

    if (enemy.isBoss) {
      // Boss always drops rare repair & large scrap
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
      color = '#cbd5e1'; // metal scrap
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

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    // 1. Render Drops
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      const screenX = drop.x - cameraX;
      const screenY = drop.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (drop.type === 'oil_drop') {
        // Glowing Amber Droplet
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
        // Metallic Hexagonal Cog / Nut
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

        // Inner hole
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (drop.type === 'repair') {
        // Green Cross Medkit
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 4, 12);
        ctx.fillRect(-6, -2, 12, 4);
      } else if (drop.type === 'magnet') {
        // Blue Magnet Horseshoe
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 7, Math.PI, 0);
        ctx.stroke();
      } else if (drop.type === 'nitro') {
        // Cyan Nitro Canister
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillRect(-4, -8, 8, 16);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-2, -10, 4, 3);
      }

      ctx.restore();
    }

    // 2. Render Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const screenX = e.x - cameraX;
      const screenY = e.y - cameraY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(e.angle);

      this.renderEnemyVehicle(ctx, e);

      ctx.restore();

      // HP Bar above enemy (if damaged or boss)
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

  private renderEnemyVehicle(ctx: CanvasRenderingContext2D, e: Enemy) {
    if (e.type === 'kickboard') {
      // 전동 킥보드: Slender deck with handle column and glowing front light
      ctx.fillStyle = '#334155';
      ctx.fillRect(-12, -3.5, 24, 7);

      // Foot deck grip
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-8, -2, 16, 4);

      // Tiny front wheel & back wheel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, -3, 3, 6);
      ctx.fillRect(-12, -3, 3, 6);

      // Handlebar
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(8, -7, 2, 14);

      // Glowing headlight
      ctx.fillStyle = '#a7f3d0';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'bicycle') {
      // 자전거: Dual wheels, triangular frame, handlebars
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -2.5, 5, 5); // front wheel
      ctx.fillRect(-16, -2.5, 5, 5); // rear wheel

      // Frame
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // Handlebar
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, -7);
      ctx.lineTo(11, 7);
      ctx.stroke();

      // Cyclist torso helmet
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'motorcycle') {
      // 폭주족 오토바이: Aggressive chopper bike with fat rear wheel and exhaust pipes
      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -4, 7, 8); // fat rear tire
      ctx.fillRect(14, -3, 5, 6); // front tire

      // Body & gas tank
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual chrome exhaust pipes
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-16, -7, 18, 2);
      ctx.fillRect(-16, 5, 18, 2);

      // Spiked front fender
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(14, -5);
      ctx.lineTo(22, 0);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();

      // Rider leather jacket
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(-2, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      // Helmet with red visor
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -2, 3, 4);
    } else if (e.type === 'buggy') {
      // 사막 버기카: Sand tires, roll cage, rugged chassis
      // 4 knobby sand tires
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-18, -16, 10, 7);
      ctx.fillRect(10, -16, 9, 7);
      ctx.fillRect(-18, 9, 10, 7);
      ctx.fillRect(10, 9, 9, 7);

      // Armored body
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(-15, -11, 30, 22);

      // Roll cage bars
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-10, -8, 20, 16);

      // Cockpit netting
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-5, -5, 10, 10);
    } else if (e.type === 'boss_truck') {
      // 대형 몬스터 트럭: Huge monster tires, massive armor, menacing red body, spiked cowcatcher
      // 4 Huge Monster Tires
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(-35, -34, 24, 15);
      ctx.fillRect(14, -34, 24, 15);
      ctx.fillRect(-35, 19, 24, 15);
      ctx.fillRect(14, 19, 24, 15);

      // Tire treads
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2;
      for (let tx of [-30, -20, 18, 28]) {
        ctx.beginPath();
        ctx.moveTo(tx, -34); ctx.lineTo(tx + 4, -19);
        ctx.moveTo(tx, 19); ctx.lineTo(tx + 4, 34);
        ctx.stroke();
      }

      // Massive Heavy Truck Chassis
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-32, -22, 64, 44);

      // Black Hood & Roof Stripes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-28, -6, 56, 12);

      // Windshield & Armor Plating
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -16, 12, 32);

      // Giant Steel Spiked Cowcatcher (Front Bumper)
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(32, -24);
      ctx.lineTo(48, -12);
      ctx.lineTo(44, 0);
      ctx.lineTo(48, 12);
      ctx.lineTo(32, 24);
      ctx.closePath();
      ctx.fill();

      // Sharp Cowcatcher Teeth
      ctx.fillStyle = '#f43f5e';
      for (let py of [-18, -9, 0, 9, 18]) {
        ctx.beginPath();
        ctx.moveTo(42, py - 3);
        ctx.lineTo(52, py);
        ctx.lineTo(42, py + 3);
        ctx.closePath();
        ctx.fill();
      }

      // Exhaust Smokestacks
      ctx.fillStyle = '#52525b';
      ctx.fillRect(-18, -25, 8, 5);
      ctx.fillRect(-18, 20, 8, 5);
    }
  }

  public reset() {
    this.enemies = [];
    this.drops = [];
    this.spawnTimer = 0;
    this.bossSpawnedTimers.clear();
  }
}
