import { EnemyManager } from './enemies';
import { ParticleManager } from './particles';
import { sounds } from './sound';
import { GameState, PlayerCar, UpgradeOption, VehicleEvolutionInfo, WeaponType } from './types';
import { WeaponManager } from './weapons';

/**
 * 레벨업시 다음 레벨업을 위해 필요한 경험치 총량을 점진적으로 증가시키는 공식
 * Level 1: 30
 * Level 2: 74
 * Level 3: 148
 * Level 4: 247
 * Level 5: 368
 * Level 6: 508
 */
export function calculateRequiredExp(level: number): number {
  return Math.round(30 + Math.pow(level - 1, 1.7) * 26 + (level - 1) * 18);
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public state: GameState = 'TITLE';
  public gameTime: number = 0; // in seconds

  public player: PlayerCar;
  public particles: ParticleManager;
  public weapons: WeaponManager;
  public enemies: EnemyManager;

  public cameraX: number = 0;
  public cameraY: number = 0;

  // Input states
  public keys: Record<string, boolean> = {
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

  public isTouchActive: boolean = false;
  public touchDirection: { x: number; y: number } = { x: 0, y: 0 };
  public touchBoost: boolean = false;

  // Level Up options
  public currentUpgrades: UpgradeOption[] = [];
  public onStateChange?: (state: GameState) => void;
  public onLevelUp?: (upgrades: UpgradeOption[], evolutionInfo: VehicleEvolutionInfo | null) => void;

  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.particles = new ParticleManager();
    this.weapons = new WeaponManager();
    this.enemies = new EnemyManager();
    this.player = this.createDefaultPlayer();

    this.bindEvents();
    this.resizeCanvas();
  }

  private createDefaultPlayer(): PlayerCar {
    return {
      x: 0,
      y: 0,
      angle: -Math.PI / 2, // facing upward initially
      vx: 0,
      vy: 0,
      speed: 0,
      maxSpeed: 275,
      acceleration: 420,
      turnSpeed: 4.2, // Lv.1 오토바이: 날렵하고 민첩한 회전력
      friction: 0.94,
      driftFactor: 0.84,
      
      hp: 75,
      maxHp: 75, // Lv.1 오토바이: 날렵하나 체력이 낮음
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
          level: 1, // Starts with basic machine gun!
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
      vehicleName: '오토바이 (Lv.1)',
      weaponPowerMultiplier: 1.0,
      
      level: 1,
      exp: 0,
      nextLevelExp: calculateRequiredExp(1), // 30 EXP for Level 1
      totalKills: 0,
      scrapCollected: 0,
    };
  }

  public getVehicleInfoForLevel(level: number): VehicleEvolutionInfo {
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

  public applyVehicleEvolution(level: number) {
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
      p.ramDamageMultiplier *= 1.6; // 묵직하고 튼튼한 체력, 밀쳐내기 강화!
      p.acceleration *= 1.15;
      p.turnSpeed = 3.1;
      p.driftFactor = 0.92;
      p.weaponPowerMultiplier = (p.weaponPowerMultiplier || 1.0) * 1.15;
    } else if (level >= 5) {
      p.vehicleType = 'sportscar';
      p.vehicleName = '스포츠카';
      p.maxHp = Math.round(p.maxHp + 45);
      p.hp = Math.min(p.maxHp, p.hp + 45);
      p.maxSpeed = Math.max(340, Math.round(p.maxSpeed * 1.18)); // 최고 속도
      p.acceleration = Math.max(540, Math.round(p.acceleration * 1.25));
      p.ramDamageMultiplier *= 1.35;
      p.turnSpeed = 3.8;
      p.driftFactor = 0.86;
      p.weaponPowerMultiplier = (p.weaponPowerMultiplier || 1.0) * 1.25; // 강력한 무기 성능 발휘
    }
  }

  public resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private bindEvents() {
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

  public startGame() {
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

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sounds.stopEngine();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      sounds.startEngine();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public restartGame() {
    this.startGame();
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private update(dt: number) {
    this.gameTime += dt;

    // 1. Player Driving Physics & Controls
    this.updatePlayerMovement(dt);

    // 2. Weapons & Combat Update
    this.weapons.update(dt, this.player, this.enemies.enemies, this.particles);

    // 3. Enemies & Drops Update
    this.enemies.update(dt, this.gameTime, this.player, this.particles, (boss) => {
      // 2분(120초) 이상 시점에 등장한 대형 보스를 처치하면 최종 탈출 승리!
      if (this.gameTime >= 120 || boss.isBoss) {
        this.particles.addScreenShake(28);
        sounds.stopEngine();
        sounds.playVictory();
        this.state = 'VICTORY';
        if (this.onStateChange) this.onStateChange(this.state);
      }
    });

    // 4. Particles & Screen Shake
    this.particles.update(dt);

    // 5. Sound Engine Pitch & Volume
    const speedRatio = Math.abs(this.player.speed) / this.player.maxSpeed;
    sounds.updateEngine(speedRatio, this.player.isBoosting);

    // 6. Camera Smooth Follow
    const targetCamX = this.player.x - this.canvas.width / 2 + (Math.random() - 0.5) * this.particles.screenShake;
    const targetCamY = this.player.y - this.canvas.height / 2 + (Math.random() - 0.5) * this.particles.screenShake;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, 10 * dt);
    this.cameraY += (targetCamY - this.cameraY) * Math.min(1, 10 * dt);

    // 7. EXP & Level Up Check
    if (this.player.exp >= this.player.nextLevelExp) {
      this.triggerLevelUp();
    }

    // 8. Player Death Check
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

  private updatePlayerMovement(dt: number) {
    const p = this.player;

    // Check throttle & steering
    const isUp = this.keys.KeyW || this.keys.ArrowUp;
    const isDown = this.keys.KeyS || this.keys.ArrowDown;
    const isLeft = this.keys.KeyA || this.keys.ArrowLeft;
    const isRight = this.keys.KeyD || this.keys.ArrowRight;
    const wantsBoost = this.keys.Space || this.keys.ShiftLeft || this.keys.ShiftRight || this.touchBoost;

    // Boost Logic
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

    // Acceleration / Braking
    if (isUp) {
      p.speed = Math.min(currentMaxSpeed, p.speed + currentAccel * dt);
    } else if (isDown) {
      p.speed = Math.max(-currentMaxSpeed * 0.45, p.speed - currentAccel * 1.3 * dt);
    } else {
      // Natural rolling friction
      p.speed *= Math.pow(p.friction, dt * 60);
      if (Math.abs(p.speed) < 2) p.speed = 0;
    }

    // Steering
    const speedRatio = Math.abs(p.speed) / p.maxSpeed;
    const effectiveTurn = p.turnSpeed * (p.isBoosting ? 0.8 : 1.0) * Math.min(1.2, 0.4 + speedRatio * 0.8);

    const oldX = p.x;
    const oldY = p.y;

    if (isLeft) {
      p.angle -= effectiveTurn * dt * (p.speed < 0 ? -1 : 1);
    }
    if (isRight) {
      p.angle += effectiveTurn * dt * (p.speed < 0 ? -1 : 1);
    }

    // Lateral drift calculation
    const forwardX = Math.cos(p.angle);
    const forwardY = Math.sin(p.angle);
    const targetVx = forwardX * p.speed;
    const targetVy = forwardY * p.speed;

    p.vx = p.vx * p.driftFactor + targetVx * (1 - p.driftFactor);
    p.vy = p.vy * p.driftFactor + targetVy * (1 - p.driftFactor);

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Skid marks & drift smoke
    const driftIntensity = Math.hypot(p.vx - targetVx, p.vy - targetVy);
    if ((driftIntensity > 40 || p.isBoosting) && Math.abs(p.speed) > 50) {
      // Rear tire offsets
      const rearDist = 20;
      const tireSpread = 12;
      const rX1 = p.x - forwardX * rearDist - forwardY * tireSpread;
      const rY1 = p.y - forwardY * rearDist + forwardX * tireSpread;
      const rX2 = p.x - forwardX * rearDist + forwardY * tireSpread;
      const rY2 = p.y - forwardY * rearDist - forwardX * tireSpread;

      const prevRX1 = oldX - forwardX * rearDist - forwardY * tireSpread;
      const prevRY1 = oldY - forwardY * rearDist + forwardX * tireSpread;
      const prevRX2 = oldX - forwardX * rearDist + forwardY * tireSpread;
      const prevRY2 = oldY - forwardY * rearDist - forwardX * tireSpread;

      this.particles.addSkidMark(prevRX1, prevRY1, rX1, rY1, p.isBoosting ? 0.7 : 0.4);
      this.particles.addSkidMark(prevRX2, prevRY2, rX2, rY2, p.isBoosting ? 0.7 : 0.4);
    }

    // Exhaust emission
    const exhaustX = p.x - forwardX * 22;
    const exhaustY = p.y - forwardY * 22;
    this.particles.addExhaustSmoke(exhaustX, exhaustY, p.angle, p.isBoosting);
  }

  private triggerLevelUp() {
    const prevVehicleType = this.player.vehicleType;
    this.player.level++;
    this.player.exp -= this.player.nextLevelExp;
    // 레벨업시 다음 레벨업을 위해 필요한 경험치 총량을 점진적이고 가파르게 증가
    this.player.nextLevelExp = calculateRequiredExp(this.player.level);

    // 탈것 순차적 진화 적용 (Lv.1 오토바이 -> Lv.2 경차 -> Lv.3 승용차 -> Lv.4 SUV -> Lv.5+ 스포츠카)
    this.applyVehicleEvolution(this.player.level);
    const didEvolve = prevVehicleType !== this.player.vehicleType || this.player.level === 5;
    const evolutionInfo = didEvolve ? this.getVehicleInfoForLevel(this.player.level) : null;

    sounds.playLevelUp();
    this.state = 'LEVEL_UP';
    sounds.stopEngine();

    // Generate 3 unique upgrade options
    this.currentUpgrades = this.generateUpgradeOptions();

    if (this.onLevelUp) this.onLevelUp(this.currentUpgrades, evolutionInfo);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  private generateUpgradeOptions(): UpgradeOption[] {
    const p = this.player;
    const allOptions: UpgradeOption[] = [];

    // Weapon 1: Front Turret
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

    // Weapon 2: Saw Blade
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

    // Weapon 3: Oil Slick
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

    // Weapon 4: Homing Missile
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

    // Stat Upgrades
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

    // Shuffle & Pick 3
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  public applyUpgrade(option: UpgradeOption) {
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
      // Stat modifications
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

    // Resume play
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    sounds.startEngine();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw World Background (Endless Desert & Asphalt Highway)
    this.renderWorldBackground(ctx, w, h);

    // 2. Draw Particles (Skid Marks & Ground Effects)
    this.particles.render(ctx, this.cameraX, this.cameraY);

    // 3. Draw Weapons Ground Effects (Oil Slicks, Bullets, Missiles)
    this.weapons.render(ctx, this.cameraX, this.cameraY, this.player);

    // 4. Draw Drops and Enemies
    this.enemies.render(ctx, this.cameraX, this.cameraY);

    // 5. Draw Player Sports Car
    this.renderPlayerCar(ctx);
  }

  private renderWorldBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Apocalyptic Desert sand base
    ctx.fillStyle = '#b48a5c';
    ctx.fillRect(0, 0, w, h);

    // Subtle desert sand dunes and grit pattern
    const camX = this.cameraX;
    const camY = this.cameraY;

    // Endless Asphalt Highway (runs vertically through the world, say width 600px from X = -300 to +300)
    const highwayLeft = -350 - camX;
    const highwayRight = 350 - camX;

    if (highwayRight >= 0 && highwayLeft <= w) {
      // Asphalt pavement
      ctx.fillStyle = '#292524';
      ctx.fillRect(highwayLeft, 0, 700, h);

      // Road shoulder rumble strips (Red & White jagged curb)
      const curbWidth = 14;
      const stripeHeight = 30;
      const offsetY = -((camY % stripeHeight) + stripeHeight) % stripeHeight;

      for (let y = offsetY - stripeHeight; y < h + stripeHeight; y += stripeHeight) {
        const isRed = Math.floor((y + camY) / stripeHeight) % 2 === 0;
        ctx.fillStyle = isRed ? '#dc2626' : '#f5f5f4';

        // Left curb
        ctx.fillRect(highwayLeft - curbWidth, y, curbWidth, stripeHeight);
        // Right curb
        ctx.fillRect(highwayRight, y, curbWidth, stripeHeight);
      }

      // Yellow solid outer highway boundary lines
      ctx.fillStyle = '#facc15';
      ctx.fillRect(highwayLeft + 20, 0, 4, h);
      ctx.fillRect(highwayRight - 24, 0, 4, h);

      // Dashed White Highway Lane Separators (3 inner lines dividing 4 lanes)
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

    // Desert Wasteland Details (Cacti, Rocks, Scrap Metal Piles)
    const gridSize = 250;
    const startGridX = Math.floor((camX - 100) / gridSize);
    const endGridX = Math.ceil((camX + w + 100) / gridSize);
    const startGridY = Math.floor((camY - 100) / gridSize);
    const endGridY = Math.ceil((camY + h + 100) / gridSize);

    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        const worldX = gx * gridSize + 125;
        const worldY = gy * gridSize + 125;

        // Skip objects on the main highway
        if (worldX > -360 && worldX < 360) continue;

        // Deterministic pseudo-random based on grid coordinate
        const seed = Math.sin(gx * 374761393 + gy * 668265263) * 10000;
        const rand = seed - Math.floor(seed);

        const screenObjX = worldX - camX;
        const screenObjY = worldY - camY;

        if (rand < 0.22) {
          // Desert Rock
          ctx.fillStyle = '#78716c';
          ctx.beginPath();
          ctx.ellipse(screenObjX, screenObjY, 14 + rand * 10, 9 + rand * 6, rand * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        } else if (rand < 0.40) {
          // Desert Shrub / Cactus
          ctx.fillStyle = '#4d7c0f';
          ctx.beginPath();
          ctx.arc(screenObjX, screenObjY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(screenObjX - 2, screenObjY - 12, 4, 16);
        } else if (rand < 0.52) {
          // Abandoned Rusty Scrap Iron Plate
          ctx.fillStyle = '#7c2d12';
          ctx.fillRect(screenObjX - 8, screenObjY - 6, 16, 12);
        }
      }
    }
  }

  private renderPlayerCar(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const screenX = p.x - this.cameraX;
    const screenY = p.y - this.cameraY;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(p.angle);

    // Subtle drop shadow of the vehicle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    const shadowLen = p.vehicleType === 'motorcycle' ? 18 : (p.vehicleType === 'suv' ? 28 : 24);
    const shadowWidth = p.vehicleType === 'motorcycle' ? 8 : (p.vehicleType === 'suv' ? 18 : 14);
    ctx.ellipse(-2, 4, shadowLen, shadowWidth, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render Vehicle Body according to evolution stage
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

    // Shared: Roof/Side Turret Mount (if unlocked)
    if (p.weapons.turret.level > 0) {
      const turretOffset = p.vehicleType === 'motorcycle' ? 8 : 0;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(turretOffset, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Dual gun barrels facing forward
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(turretOffset + 2, -3, 11, 2);
      ctx.fillRect(turretOffset + 2, 1, 11, 2);
    }

    // Shared: Nitro Boost Visual Glow
    if (p.isBoosting) {
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Lv.1 오토바이
  private renderMotorcycle(ctx: CanvasRenderingContext2D, p: PlayerCar) {
    // 2 inline wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -4, 8, 8); // Rear tire
    ctx.fillRect(12, -3, 6, 6);  // Front tire

    // Chassis frame & crimson fuel tank
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Handlebars
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(9, -8, 2.5, 16);

    // Rider in black leather suit
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Helmet with cyan visor
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(1, -2.5, 3.5, 5);

    // Chrome Exhaust Pipe
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-17, 4.5, 15, 2.5);

    // Single bright headlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(15, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Light cone
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

  // Lv.2 경차 (Compact City Car)
  private renderCompactCar(ctx: CanvasRenderingContext2D, p: PlayerCar) {
    // 4 compact wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -13, 8, 5);
    ctx.fillRect(8, -13, 8, 5);
    ctx.fillRect(-14, 8, 8, 5);
    ctx.fillRect(8, 8, 8, 5);

    // Cute rounded hatchback body (Lime/Teal)
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 20, 5);
    ctx.fill();

    // Black roof trim
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-10, -7, 18, 14);

    // Bubble Windshield
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, -7, 6, 14);

    // Dual rounded headlights
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(15, -6, 2.5, 0, Math.PI * 2);
    ctx.arc(15, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Dual light cones
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

  // Lv.3 승용차 (Sedan)
  private renderSedan(ctx: CanvasRenderingContext2D, p: PlayerCar) {
    // 4 wheels with silver rims
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -14, 9, 5);
    ctx.fillRect(10, -14, 9, 5);
    ctx.fillRect(-16, 9, 9, 5);
    ctx.fillRect(10, 9, 9, 5);

    // Metallic Royal Blue Sedan Body
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-20, -11, 40, 22, 4);
    ctx.fill();

    // Front grille
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(19, -6, 2, 12);

    // Windshield & Rear glass
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, -8, 8, 16);  // Front windshield
    ctx.fillRect(-14, -8, 5, 16); // Rear window

    // Side mirrors
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(7, -13, 3, 2);
    ctx.fillRect(7, 11, 3, 2);

    // Dual headlights
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(19, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(19, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Light cone
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

  // Lv.4 SUV (Heavy Armored SUV)
  private renderSUV(ctx: CanvasRenderingContext2D, p: PlayerCar) {
    // 4 oversized knobby all-terrain tires
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-18, -17, 11, 7);
    ctx.fillRect(11, -17, 11, 7);
    ctx.fillRect(-18, 10, 11, 7);
    ctx.fillRect(11, 10, 11, 7);

    // Tactical Olive / Gunmetal Bronze Heavy Body
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(-20, -13, 42, 26);

    // Heavy steel front bull-bar / brush guard
    ctx.fillStyle = '#52525b';
    ctx.fillRect(21, -12, 4, 24);
    // Tow hooks
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(23, -7, 2.5, 3);
    ctx.fillRect(23, 4, 2.5, 3);

    // Roof rack & spare wheel
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-12, -9, 22, 18);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Armored tinted windshield
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(5, -9, 7, 18);

    // Quad High-Intensity Fog Lights
    ctx.fillStyle = '#fef08a';
    for (let py of [-9, -4, 4, 9]) {
      ctx.beginPath();
      ctx.arc(22, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wide beam light cone
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

  // Lv.5+ 스포츠카 (Super Sports Car - 최종 진화)
  private renderSportsCar(ctx: CanvasRenderingContext2D, p: PlayerCar) {
    // 4 High-Performance Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-17, -15, 9, 6);
    ctx.fillRect(10, -15, 9, 6);
    ctx.fillRect(-17, 9, 9, 6);
    ctx.fillRect(10, 9, 9, 6);

    // Crimson Red Aerodynamic Chassis
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

    // Carbon Racing Stripes
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-22, -4, 40, 8);

    // Cockpit Tinted Windshield
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

    // Rear Carbon High-Downforce Spoiler
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-26, -14, 4, 28);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-27, -15, 6, 4);
    ctx.fillRect(-27, 11, 6, 4);

    // Dual Exhaust Pipes
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-26, -6, 3, 3);
    ctx.fillRect(-26, 3, 3, 3);

    // Headlights
    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.beginPath();
    ctx.arc(19, -8, 2.5, 0, Math.PI * 2);
    ctx.arc(19, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Light Cones
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

  public destroy() {
    this.isRunning = false;
    sounds.stopEngine();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
