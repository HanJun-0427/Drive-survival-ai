import React, { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Disc,
  Droplet,
  Flame,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Rocket,
  Shield,
  Skull,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { GameEngine } from './game/engine';
import { sounds } from './game/sound';
import { GameState, UpgradeOption, VehicleEvolutionInfo } from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [levelUpOptions, setLevelUpOptions] = useState<UpgradeOption[]>([]);
  const [evolutionInfo, setEvolutionInfo] = useState<VehicleEvolutionInfo | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // HUD Realtime updates
  const [hudData, setHudData] = useState({
    hp: 100,
    maxHp: 100,
    boostFuel: 100,
    maxBoostFuel: 100,
    isBoosting: false,
    level: 1,
    exp: 0,
    nextLevelExp: 30,
    kills: 0,
    scrap: 0,
    gameTime: 0,
    vehicleName: '오토바이',
    vehicleType: 'motorcycle',
    weapons: {
      turret: 1,
      saw: 0,
      oil: 0,
      missile: 0,
    },
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.onLevelUp = (upgrades, evolution) => {
      setLevelUpOptions(upgrades);
      setEvolutionInfo(evolution);
    };

    // HUD sync timer at 20fps for silky smooth numbers without bogging React
    const hudInterval = setInterval(() => {
      if (engine.state === 'PLAYING' || engine.state === 'PAUSED' || engine.state === 'LEVEL_UP') {
        const p = engine.player;
        setHudData({
          hp: Math.max(0, Math.round(p.hp)),
          maxHp: Math.round(p.maxHp),
          boostFuel: Math.round(p.boostFuel),
          maxBoostFuel: Math.round(p.maxBoostFuel),
          isBoosting: p.isBoosting,
          level: p.level,
          exp: Math.round(p.exp),
          nextLevelExp: Math.round(p.nextLevelExp),
          kills: p.totalKills,
          scrap: p.scrapCollected,
          gameTime: Math.floor(engine.gameTime),
          vehicleName: p.vehicleName,
          vehicleType: p.vehicleType,
          weapons: {
            turret: p.weapons.turret.level,
            saw: p.weapons.saw.level,
            oil: p.weapons.oil.level,
            missile: p.weapons.missile.level,
          },
        });
      }
    }, 50);

    return () => {
      clearInterval(hudInterval);
      engine.destroy();
    };
  }, []);

  // Keyboard shortcut listener for Level Up (1, 2, 3)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState === 'LEVEL_UP' && levelUpOptions.length > 0) {
        if (e.key === '1' && levelUpOptions[0]) handleSelectUpgrade(levelUpOptions[0]);
        if (e.key === '2' && levelUpOptions[1]) handleSelectUpgrade(levelUpOptions[1]);
        if (e.key === '3' && levelUpOptions[2]) handleSelectUpgrade(levelUpOptions[2]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, levelUpOptions]);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handleSelectUpgrade = (upgrade: UpgradeOption) => {
    if (engineRef.current) {
      engineRef.current.applyUpgrade(upgrade);
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handlePause = () => {
    if (engineRef.current) {
      if (gameState === 'PLAYING') engineRef.current.pauseGame();
      else if (gameState === 'PAUSED') engineRef.current.resumeGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const expPercentage = Math.min(100, Math.floor((hudData.exp / hudData.nextLevelExp) * 100));
  const hpPercentage = Math.min(100, Math.max(0, Math.floor((hudData.hp / hudData.maxHp) * 100)));
  const boostPercentage = Math.min(100, Math.max(0, Math.floor((hudData.boostFuel / hudData.maxBoostFuel) * 100)));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* 1. Underlying WebGL / Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair z-0"
      />

      {/* 2. Top In-Game HUD (During active play, paused, or level up) */}
      {gameState !== 'TITLE' && (
        <div className="absolute inset-x-0 top-0 pointer-events-none z-10 p-3 sm:p-5 flex flex-col gap-2.5">
          {/* EXP Bar full width */}
          <div className="w-full bg-stone-900/80 backdrop-blur-md rounded-full border border-stone-700/60 p-1 shadow-lg pointer-events-auto">
            <div className="flex items-center justify-between px-3 py-0.5 text-xs font-display">
              <span className="text-amber-400 font-bold tracking-wider">
                LV. {hudData.level}
              </span>
              <span className="text-stone-300 tabular-nums">
                {hudData.exp} / {hudData.nextLevelExp} EXP ({expPercentage}%)
              </span>
            </div>
            <div className="w-full bg-stone-950/80 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full transition-all duration-150 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-start justify-between gap-3">
            {/* Left: Player Car Vital Meters */}
            <div className="flex flex-col gap-2 min-w-[210px] sm:min-w-[250px] bg-stone-900/85 backdrop-blur-md p-3 rounded-xl border border-stone-700/60 shadow-xl pointer-events-auto">
              {/* HP Bar with Vehicle Evolution Stage */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-rose-400 font-display">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-amber-300 font-bold">[{hudData.vehicleName}]</span> 내구도
                  </span>
                  <span className="text-stone-200 tabular-nums font-mono text-[11px]">
                    {hudData.hp} / {hudData.maxHp}
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-3 rounded-md overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-150 rounded-sm ${
                      hpPercentage > 50
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        : hpPercentage > 25
                        ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                        : 'bg-gradient-to-r from-rose-700 to-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${hpPercentage}%` }}
                  />
                </div>
              </div>

              {/* Nitro Boost Fuel Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-display">
                    <Zap className="w-3.5 h-3.5" /> 니트로 부스터 (SPACE)
                  </span>
                  <span className="text-stone-300 tabular-nums font-mono text-[11px]">
                    {hudData.isBoosting ? '돌진 중!' : `${hudData.boostFuel}%`}
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-md overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-sky-300 transition-all duration-100 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    style={{ width: `${boostPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Center: Survival Time & Kills */}
            <div className="flex items-center gap-3 bg-stone-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-stone-700/60 shadow-xl pointer-events-auto">
              <div className="text-center px-2">
                <div className="text-[10px] text-stone-400 font-display uppercase tracking-wider">생존 시간</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 tabular-nums">
                  {formatTime(hudData.gameTime)}
                </div>
              </div>
              <div className="w-px h-8 bg-stone-700/60" />
              <div className="text-center px-2 flex items-center gap-2">
                <Skull className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-[10px] text-stone-400 font-display uppercase tracking-wider">처치 수</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-stone-100 tabular-nums">
                    {hudData.kills}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Weapons List & Utilities */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Equipped Weapons Icons */}
              <div className="hidden md:flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md p-1.5 rounded-xl border border-stone-700/60 shadow-xl">
                {/* Turret */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${
                    hudData.weapons.turret > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'opacity-40 text-stone-500'
                  }`}
                  title="전방 기관총"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Lv.{hudData.weapons.turret}</span>
                </div>
                {/* Saw */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${
                    hudData.weapons.saw > 0 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'opacity-40 text-stone-500'
                  }`}
                  title="회전 범퍼 톱날"
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>Lv.{hudData.weapons.saw}</span>
                </div>
                {/* Oil */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${
                    hudData.weapons.oil > 0 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'opacity-40 text-stone-500'
                  }`}
                  title="오일 슬릭 & 화염"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Lv.{hudData.weapons.oil}</span>
                </div>
                {/* Missile */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${
                    hudData.weapons.missile > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'opacity-40 text-stone-500'
                  }`}
                  title="오토 타겟 미사일"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Lv.{hudData.weapons.missile}</span>
                </div>
              </div>

              {/* Audio Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-2.5 bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-700/60 shadow-xl transition-colors cursor-pointer"
                title={isMuted ? '음소거 해제 (M)' : '음소거 (M)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Pause Toggle */}
              <button
                onClick={handlePause}
                className="p-2.5 bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-700/60 shadow-xl transition-colors cursor-pointer"
                title="일시정지 (P / ESC)"
              >
                {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Title Screen Modal */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-stone-900 border border-stone-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
            {/* Logo Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40 mb-4 border border-rose-400/30">
              <Gauge className="w-9 h-9 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white mb-1">
              DRIVE &amp; SURVIVAL
            </h1>
            <p className="text-amber-400 text-sm font-semibold tracking-wide font-display mb-4">
              드라이브 서바이벌 : 아포칼립스 하이웨이
            </p>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
              황량한 사막 도로 위에서 밀려오는 폭주족 차량들을 격파하고 생존하세요.
              차량 부착 무기는 <span className="text-amber-300 font-semibold">자동 공격</span>되며,
              부스터를 사용해 적들을 들이받아 분쇄할 수 있습니다!
            </p>

            {/* Victory Mission Target Banner */}
            <div className="w-full bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 text-center mb-3">
              <span className="flex items-center justify-center gap-1.5 text-amber-300 font-display font-bold text-xs">
                <Trophy className="w-4 h-4 text-amber-400" />
                승리 조건: 2분에 출현하는 대형 몬스터 트럭(보스) 처치!
              </span>
            </div>

            {/* Vehicle Evolution Overview */}
            <div className="w-full bg-stone-950/80 rounded-xl p-3 border border-stone-800 text-left text-xs mb-3">
              <div className="font-semibold text-amber-400 font-display mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> 레벨별 탈것(차량) 순차 진화
              </div>
              <div className="text-[11px] text-stone-300 leading-snug space-y-0.5 font-mono">
                <div><span className="text-rose-400 font-bold">Lv.1</span> 오토바이 (날렵하나 체력 낮음)</div>
                <div><span className="text-lime-400 font-bold">Lv.2</span> 경차 (균형 잡힌 소형 차량)</div>
                <div><span className="text-blue-400 font-bold">Lv.3</span> 승용차 (안정적 속도와 방어력)</div>
                <div><span className="text-emerald-400 font-bold">Lv.4</span> SUV (묵직한 체력, 밀쳐내기 강화)</div>
                <div><span className="text-amber-400 font-bold">Lv.5+</span> 스포츠카 (최고 속도, 무기 극대화)</div>
              </div>
            </div>

            {/* Key Controls Overview */}
            <div className="w-full bg-stone-950/70 rounded-xl p-4 border border-stone-800 text-left text-xs mb-6 space-y-2">
              <div className="flex items-center justify-between text-stone-300">
                <span className="font-semibold text-stone-400">가속 / 후진 / 조향</span>
                <span className="font-mono bg-stone-800 px-2 py-0.5 rounded text-amber-300">W A S D / 방향키</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="font-semibold text-stone-400">니트로 부스터 돌진</span>
                <span className="font-mono bg-stone-800 px-2 py-0.5 rounded text-cyan-300">SPACE / SHIFT</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="font-semibold text-stone-400">무기 공격 방식</span>
                <span className="text-emerald-400 font-semibold">자동 사격 &amp; 자동 조준</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span className="font-semibold text-stone-400">일시정지 / 사운드</span>
                <span className="font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-300">ESC / M 키</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold font-display text-base tracking-wider shadow-lg shadow-rose-900/30 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              생존 드라이브 시작
            </button>
          </div>
        </div>
      )}

      {/* 4. Level-Up Upgrade Selection Modal */}
      {gameState === 'LEVEL_UP' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-stone-900/95 border border-amber-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-display tracking-widest uppercase mb-1">
                LEVEL UP!
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                차량 업그레이드 선택
              </h2>
              <p className="text-stone-400 text-xs mt-1">
                장착할 무기 또는 추가 성능을 선택하세요 (숫자키 1, 2, 3으로 빠른 선택)
              </p>
            </div>

            {/* Vehicle Evolution Notification Banner */}
            {evolutionInfo && (
              <div className="mb-4 bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-amber-500/20 border border-amber-400/60 rounded-xl p-3 flex items-center gap-3 shadow-lg">
                <div className="p-2.5 rounded-lg bg-amber-500 text-stone-950 font-display font-extrabold text-xs shrink-0 shadow-md">
                  진화 완료!
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                    <span className="text-amber-300">[{evolutionInfo.badge}]</span>
                    <span>{evolutionInfo.name}</span>
                  </div>
                  <div className="text-xs text-stone-300 truncate">
                    {evolutionInfo.description} (내구도 즉시 회복!)
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {levelUpOptions.map((opt, idx) => {
                const getIcon = () => {
                  switch (opt.iconType) {
                    case 'turret':
                      return <Crosshair className="w-6 h-6 text-amber-400" />;
                    case 'saw':
                      return <Disc className="w-6 h-6 text-sky-400" />;
                    case 'oil':
                      return <Droplet className="w-6 h-6 text-orange-400" />;
                    case 'missile':
                      return <Rocket className="w-6 h-6 text-rose-400" />;
                    case 'shield':
                      return <Shield className="w-6 h-6 text-emerald-400" />;
                    case 'engine':
                      return <Gauge className="w-6 h-6 text-cyan-400" />;
                    case 'nitro':
                      return <Zap className="w-6 h-6 text-yellow-400" />;
                    case 'magnet':
                      return <RotateCcw className="w-6 h-6 text-purple-400" />;
                    default:
                      return <Flame className="w-6 h-6 text-amber-400" />;
                  }
                };

                return (
                  <button
                    key={opt.id + idx}
                    onClick={() => handleSelectUpgrade(opt)}
                    className="relative group bg-stone-950/80 hover:bg-stone-800/90 border border-stone-700/80 hover:border-amber-400/80 rounded-xl p-4 text-left flex flex-col justify-between transition-all duration-150 transform hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                  >
                    <div>
                      {/* Top Header & Key Shortcut */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 group-hover:border-amber-500/40">
                          {getIcon()}
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-500 group-hover:text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                          [{idx + 1}]
                        </span>
                      </div>

                      {/* Title & Category Badge */}
                      <div className="mb-2">
                        <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-amber-400/90 mb-0.5">
                          {opt.subtitle}
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300">
                          {opt.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-stone-300 text-xs leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    {/* Footer Progress */}
                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>{opt.category === 'weapon' ? '무기 슬롯' : '엔진 개조'}</span>
                      <span className="text-amber-400 font-semibold">장착하기 &rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Paused Modal */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-sm w-full bg-stone-900 border border-stone-700 rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-bold font-display text-white mb-2">일시 정지</h2>
            <p className="text-stone-400 text-xs mb-6">게임이 멈춰있습니다. 준비가 되면 재개하세요.</p>

            <div className="space-y-3">
              <button
                onClick={handlePause}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-display text-sm tracking-wider shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                계속하기 (Resume)
              </button>
              <button
                onClick={handleRestart}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                처음부터 다시하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-stone-900 border border-rose-600/50 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
              <Skull className="w-9 h-9" />
            </div>

            <h2 className="text-3xl font-black font-display text-white tracking-wide mb-1">
              GAME OVER
            </h2>
            <p className="text-rose-400 text-xs font-semibold uppercase tracking-wider font-display mb-6">
              차량이 완전히 파괴되었습니다
            </p>

            {/* Score Summary Grid */}
            <div className="grid grid-cols-2 gap-3 bg-stone-950/80 p-4 rounded-xl border border-stone-800 mb-6 text-left">
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">버틴 시간</div>
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                  {formatTime(hudData.gameTime)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">적 처치 수</div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {hudData.kills} 마리
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">최종 레벨</div>
                <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                  Lv. {hudData.level}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">수집한 부품</div>
                <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {hudData.scrap} 개
                </div>
              </div>
            </div>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold font-display text-base tracking-wider shadow-lg shadow-rose-950/50 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              다시 도전하기
            </button>
          </div>
        </div>
      )}

      {/* 6.5. Victory Screen Modal (2분 보스 격파 승리!) */}
      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-300">
          <div className="max-w-md w-full bg-stone-900 border border-amber-500/60 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            {/* Ambient golden glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-950 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30 border border-yellow-200">
              <Trophy className="w-11 h-11" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-display tracking-widest uppercase mb-1">
              MISSION ACCOMPLISHED!
            </div>

            <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2">
              VICTORY!
            </h2>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider font-display mb-6">
              2분 보스 대형 몬스터 트럭 격파 완료 · 사막 고속도로 탈출 성공!
            </p>

            {/* Score Summary Grid */}
            <div className="grid grid-cols-2 gap-3 bg-stone-950/80 p-4 rounded-xl border border-stone-800 mb-6 text-left">
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">탈출 시간</div>
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                  {formatTime(hudData.gameTime)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">적 격파 수</div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {hudData.kills} 마리
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">최종 달성 레벨</div>
                <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                  Lv. {hudData.level}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 font-display uppercase tracking-wider">수집 부품</div>
                <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {hudData.scrap} 개
                </div>
              </div>
            </div>

            {/* Victory Restart Button */}
            <button
              onClick={handleRestart}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold font-display text-base tracking-wider shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              새로운 게임 시작하기
            </button>
          </div>
        </div>
      )}

      {/* 7. On-Screen Touch Controls for Mobile / Tablets */}
      {gameState === 'PLAYING' && (
        <div className="sm:hidden absolute inset-x-0 bottom-4 px-6 flex items-end justify-between pointer-events-none z-20">
          {/* Virtual Steering D-Pad */}
          <div className="grid grid-cols-3 gap-2 pointer-events-auto w-36">
            <div />
            <button
              onPointerDown={() => { if (engineRef.current) engineRef.current.keys.ArrowUp = true; }}
              onPointerUp={() => { if (engineRef.current) engineRef.current.keys.ArrowUp = false; }}
              onPointerLeave={() => { if (engineRef.current) engineRef.current.keys.ArrowUp = false; }}
              className="h-12 bg-stone-900/80 active:bg-amber-500/40 border border-stone-700 rounded-xl text-stone-200 font-bold flex items-center justify-center text-sm"
            >
              ▲
            </button>
            <div />
            <button
              onPointerDown={() => { if (engineRef.current) engineRef.current.keys.ArrowLeft = true; }}
              onPointerUp={() => { if (engineRef.current) engineRef.current.keys.ArrowLeft = false; }}
              onPointerLeave={() => { if (engineRef.current) engineRef.current.keys.ArrowLeft = false; }}
              className="h-12 bg-stone-900/80 active:bg-amber-500/40 border border-stone-700 rounded-xl text-stone-200 font-bold flex items-center justify-center text-sm"
            >
              ◀
            </button>
            <button
              onPointerDown={() => { if (engineRef.current) engineRef.current.keys.ArrowDown = true; }}
              onPointerUp={() => { if (engineRef.current) engineRef.current.keys.ArrowDown = false; }}
              onPointerLeave={() => { if (engineRef.current) engineRef.current.keys.ArrowDown = false; }}
              className="h-12 bg-stone-900/80 active:bg-amber-500/40 border border-stone-700 rounded-xl text-stone-200 font-bold flex items-center justify-center text-sm"
            >
              ▼
            </button>
            <button
              onPointerDown={() => { if (engineRef.current) engineRef.current.keys.ArrowRight = true; }}
              onPointerUp={() => { if (engineRef.current) engineRef.current.keys.ArrowRight = false; }}
              onPointerLeave={() => { if (engineRef.current) engineRef.current.keys.ArrowRight = false; }}
              className="h-12 bg-stone-900/80 active:bg-amber-500/40 border border-stone-700 rounded-xl text-stone-200 font-bold flex items-center justify-center text-sm"
            >
              ▶
            </button>
          </div>

          {/* Big Boost Button */}
          <button
            onPointerDown={() => { if (engineRef.current) engineRef.current.touchBoost = true; }}
            onPointerUp={() => { if (engineRef.current) engineRef.current.touchBoost = false; }}
            onPointerLeave={() => { if (engineRef.current) engineRef.current.touchBoost = false; }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 active:scale-95 border-2 border-white/40 shadow-xl flex flex-col items-center justify-center text-white pointer-events-auto"
          >
            <Zap className="w-7 h-7 fill-current" />
            <span className="text-[10px] font-bold font-display uppercase tracking-wider">부스터</span>
          </button>
        </div>
      )}
    </div>
  );
}
