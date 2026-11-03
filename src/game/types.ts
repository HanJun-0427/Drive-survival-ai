export type GameState = 'TITLE' | 'PLAYING' | 'LEVEL_UP' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface Vector2D {
  x: number;
  y: number;
}

export type WeaponType = 'turret' | 'saw' | 'oil' | 'missile';

export interface WeaponState {
  type: WeaponType;
  level: number;
  maxLevel: number;
  lastFired: number;
  cooldown: number;
  name: string;
  desc: string;
}

export interface PlayerCar {
  x: number;
  y: number;
  angle: number; // in radians
  vx: number;
  vy: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  turnSpeed: number;
  friction: number;
  driftFactor: number;
  
  // Combat stats
  hp: number;
  maxHp: number;
  armor: number; // damage reduction %
  magnetRadius: number;
  ramDamageMultiplier: number;
  
  // Boost / Dash
  boostFuel: number;
  maxBoostFuel: number;
  boostRegen: number;
  isBoosting: boolean;
  boostCooldown: number;
  
  // Weapons
  weapons: Record<WeaponType, WeaponState>;
  
  // Vehicle Evolution
  vehicleType: PlayerVehicleType;
  vehicleName: string;
  weaponPowerMultiplier: number;
  
  // EXP & Progression
  level: number;
  exp: number;
  nextLevelExp: number;
  totalKills: number;
  scrapCollected: number;
}

export type PlayerVehicleType = 'motorcycle' | 'compact' | 'sedan' | 'suv' | 'sportscar';

export interface VehicleEvolutionInfo {
  type: PlayerVehicleType;
  name: string;
  description: string;
  badge: string;
}

export type EnemyType = 'kickboard' | 'bicycle' | 'motorcycle' | 'buggy' | 'boss_truck';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  angle: number;
  speed: number;
  hp: number;
  maxHp: number;
  radius: number;
  damage: number;
  expValue: number;
  knockbackX: number;
  knockbackY: number;
  isBoss?: boolean;
  color: string;
  name: string;
  specialTimer?: number;
  chargeCooldown?: number;
  isCharging?: boolean;
}

export type DropType = 'oil_drop' | 'scrap' | 'repair' | 'magnet' | 'nitro';

export interface DropItem {
  id: number;
  type: DropType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  color: string;
  life: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  range: number;
  distanceTraveled: number;
  penetration: number;
  color: string;
  isExplosive?: boolean;
  explosionRadius?: number;
}

export interface HomingMissile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  targetId: number | null;
  damage: number;
  explosionRadius: number;
  life: number;
}

export interface OilSlick {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  isBurning: boolean;
  damagePerSec: number;
  lastDamageTick: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'fire';
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface UpgradeOption {
  id: string;
  category: 'weapon' | 'stat';
  weaponType?: WeaponType;
  title: string;
  subtitle: string;
  level: number;
  maxLevel: number;
  description: string;
  iconType: string;
}
