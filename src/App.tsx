import React, { useRef, useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Move,
  Gamepad2,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Joystick } from './components/Joystick';
import { ScoreBoard } from './components/ScoreBoard';
import { GameOverModal } from './components/GameOverModal';
import { DIFFICULTY_SETTINGS, Position, ControlMode } from './types';
import { playSound, setMuted, getMuted } from './utils/audio';

export default function App() {
  // --- Game State (Reactive for UI) ---
  const [scoreState, setScoreState] = useState<number>(0);
  const [highScoreState, setHighScoreState] = useState<number>(0);
  const [lengthState, setLengthState] = useState<number>(1);
  const [speedState, setSpeedState] = useState<string>('2.2');
  const [livesState, setLivesState] = useState<number>(3);

  const [controlMode, setControlMode] = useState<ControlMode>('buttons');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [isPausedState, setIsPausedState] = useState<boolean>(false);
  const [isDeadState, setIsDeadState] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => getMuted());
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // --- Game Engine Refs (Stable for high-frequency game loop) ---
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const foodsRef = useRef<Position[]>([]);
  const dxRef = useRef<number>(0);
  const dyRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const difficultyRef = useRef<number>(3);
  const isPausedRef = useRef<boolean>(false);
  const isDeadRef = useRef<boolean>(false);
  const turnLockRef = useRef<boolean>(false);
  const gameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeedRef = useRef<string>('0.0');
  const previousSnakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const lastTickTimeRef = useRef<number>(performance.now());
  const tickDurationRef = useRef<number>(200);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const box = 20;

  // --- Core Math Helpers ---
  const getSpeedInfo = () => {
    const baseSpeed = DIFFICULTY_SETTINGS[difficultyRef.current].speed;
    const foodEaten = snakeRef.current.length - 1;
    const speedBonus = Math.floor(foodEaten / 5) * 20;
    const currentInterval = Math.max(baseSpeed - speedBonus, 100);
    const formattedSpeed = (1000 / currentInterval).toFixed(1);
    return { interval: currentInterval, formattedSpeed };
  };

  const generateFoods = () => {
    const count = Math.floor(Math.random() * 3) + 1;
    const tempFoods: Position[] = [];
    for (let i = 0; i < count; i++) {
      let newFood: Position;
      let attempts = 0;
      do {
        newFood = {
          x: Math.floor(Math.random() * 20),
          y: Math.floor(Math.random() * 20)
        };
        attempts++;
      } while (
        (snakeRef.current.some(s => s.x === newFood.x && s.y === newFood.y) ||
          tempFoods.some(f => f.x === newFood.x && f.y === newFood.y)) &&
        attempts < 100
      );
      tempFoods.push(newFood);
    }
    foodsRef.current = tempFoods;
  };

  // --- Drawing Handler ---
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const gameTick = () => {
    if (isPausedRef.current || isDeadRef.current) return;
    turnLockRef.current = false;

    // Save previous state for interpolation
    previousSnakeRef.current = snakeRef.current.map(s => ({ ...s }));

    let head = {
      x: snakeRef.current[0].x + dxRef.current,
      y: snakeRef.current[0].y + dyRef.current
    };

    if (dxRef.current !== 0 || dyRef.current !== 0) {
      playSound('step');

      // Boundary / self collision detection
      if (
        head.x < 0 ||
        head.x >= 20 ||
        head.y < 0 ||
        head.y >= 20 ||
        snakeRef.current.some(s => s.x === head.x && s.y === head.y)
      ) {
        handleDeath();
        return;
      }

      snakeRef.current.unshift(head);

      // Check if food eaten
      const eatenIndex = foodsRef.current.findIndex(f => f.x === head.x && f.y === head.y);
      if (eatenIndex !== -1) {
        const scoreGain = DIFFICULTY_SETTINGS[difficultyRef.current].scoreValue;
        scoreRef.current += scoreGain;
        setScoreState(scoreRef.current);
        playSound('eat');

        foodsRef.current.splice(eatenIndex, 1);
        setLengthState(snakeRef.current.length);

        if (foodsRef.current.length === 0) {
          generateFoods();
        }
      } else {
        snakeRef.current.pop();
      }
    }

    lastTickTimeRef.current = performance.now();
    const speedInfo = getSpeedInfo();
    tickDurationRef.current = speedInfo.interval;

    if (lastSpeedRef.current !== speedInfo.formattedSpeed) {
      lastSpeedRef.current = speedInfo.formattedSpeed;
      setSpeedState(speedInfo.formattedSpeed);
    }

    gameTimeoutRef.current = setTimeout(gameTick, speedInfo.interval);
  };

  // --- High-FPS Smooth Render Loop ---
  useEffect(() => {
    let animationFrameId: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 1. Draw Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 400);

      // 2. Draw Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(i * box, 0);
        ctx.lineTo(i * box, 400);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * box);
        ctx.lineTo(400, i * box);
        ctx.stroke();
      }

      // 3. Draw Foods
      foodsRef.current.forEach(food => {
        const centerX = food.x * box + box / 2;
        const centerY = food.y * box + box / 2;
        const radius = box / 2 - 1.5;

        const grad = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, radius);
        grad.addColorStop(0, '#f43f5e'); // Rose-500
        grad.addColorStop(1, '#9f1239'); // Rose-800

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight sheen
        ctx.fillStyle = '#ffe4e6';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Calculate interpolation progress (0 to 1)
      let progress = 1;
      if (hasStarted && !isPausedRef.current && !isDeadRef.current) {
        if (dxRef.current !== 0 || dyRef.current !== 0) {
          const elapsed = time - lastTickTimeRef.current;
          progress = Math.min(elapsed / tickDurationRef.current, 1);
        }
      }

      // 5. Draw Snake with smooth interpolation
      snakeRef.current.forEach((segment, index) => {
        const isHead = index === 0;
        const pad = 1.5;

        // Fetch corresponding previous segment
        let prevSegment = previousSnakeRef.current[index];
        if (!prevSegment) {
          // If snake grew, start interpolation from previous tail segment
          prevSegment = previousSnakeRef.current[previousSnakeRef.current.length - 1] || segment;
        }

        // Interpolate grid coordinate
        const interpX = prevSegment.x + (segment.x - prevSegment.x) * progress;
        const interpY = prevSegment.y + (segment.y - prevSegment.y) * progress;

        const x = interpX * box + pad;
        const y = interpY * box + pad;
        const size = box - pad * 2;

        if (isHead) {
          const grad = ctx.createLinearGradient(x, y, x + size, y + size);
          grad.addColorStop(0, '#10b981'); // Emerald 500
          grad.addColorStop(1, '#059669'); // Emerald 600
          ctx.fillStyle = grad;
        } else {
          const grad = ctx.createLinearGradient(x, y, x + size, y + size);
          grad.addColorStop(0, '#06b6d4'); // Cyan 500
          grad.addColorStop(1, '#0891b2'); // Cyan 600
          ctx.fillStyle = grad;
        }

        drawRoundedRect(ctx, x, y, size, size, 5);
        ctx.fill();

        // Eyes on head
        if (isHead) {
          ctx.fillStyle = '#ffffff';
          let eye1 = { x: 0, y: 0 };
          let eye2 = { x: 0, y: 0 };

          if (dxRef.current === 0 && dyRef.current === -1) {
            // UP
            eye1 = { x: x + 4, y: y + 4 };
            eye2 = { x: x + size - 6, y: y + 4 };
          } else if (dxRef.current === 0 && dyRef.current === 1) {
            // DOWN
            eye1 = { x: x + 4, y: y + size - 6 };
            eye2 = { x: x + size - 6, y: y + size - 6 };
          } else if (dxRef.current === -1 && dyRef.current === 0) {
            // LEFT
            eye1 = { x: x + 4, y: y + 4 };
            eye2 = { x: x + 4, y: y + size - 6 };
          } else {
            // RIGHT / Default
            eye1 = { x: x + size - 6, y: y + 4 };
            eye2 = { x: x + size - 6, y: y + size - 6 };
          }

          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, 2.5, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, 1, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasStarted]);

  // --- Control Trigger ---
  const moveSnake = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (isPausedRef.current || isDeadRef.current) return;
    if (turnLockRef.current) return;

    let changed = false;
    if (direction === 'up' && dyRef.current !== 1) {
      dxRef.current = 0;
      dyRef.current = -1;
      changed = true;
    } else if (direction === 'down' && dyRef.current !== -1) {
      dxRef.current = 0;
      dyRef.current = 1;
      changed = true;
    } else if (direction === 'left' && dxRef.current !== 1) {
      dxRef.current = -1;
      dyRef.current = 0;
      changed = true;
    } else if (direction === 'right' && dxRef.current !== -1) {
      dxRef.current = 1;
      dyRef.current = 0;
      changed = true;
    }

    if (changed) {
      playSound('click');
      turnLockRef.current = true;
      setHasStarted(true);
    }
  };

  // --- Pause & Death ---
  const togglePause = () => {
    if (isDeadRef.current) return;
    playSound('click');

    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsPausedState(false);
      const speedInfo = getSpeedInfo();
      gameTimeoutRef.current = setTimeout(gameTick, speedInfo.interval);
    } else {
      isPausedRef.current = true;
      setIsPausedState(true);
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
    }
  };

  const handleDeath = () => {
    playSound('die');
    isDeadRef.current = true;
    setIsDeadState(true);

    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
    }

    const currentScore = scoreRef.current;
    if (currentScore > highScoreState) {
      localStorage.setItem('snake_high_score', currentScore.toString());
      setHighScoreState(currentScore);
    }
  };

  const handleRevive = () => {
    if (livesRef.current > 0) {
      livesRef.current -= 1;
      setLivesState(livesRef.current);

      snakeRef.current = [{ x: 10, y: 10 }];
      previousSnakeRef.current = [{ x: 10, y: 10 }];
      lastTickTimeRef.current = performance.now();
      dxRef.current = 0;
      dyRef.current = 0;
      turnLockRef.current = false;
      isDeadRef.current = false;
      setIsDeadState(false);
      setHasStarted(false);

      setLengthState(1);
      generateFoods();
      playSound('click');

      const speedInfo = getSpeedInfo();
      gameTimeoutRef.current = setTimeout(gameTick, speedInfo.interval);
    }
  };

  const handleRestart = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    previousSnakeRef.current = [{ x: 10, y: 10 }];
    lastTickTimeRef.current = performance.now();
    dxRef.current = 0;
    dyRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = 3;
    isPausedRef.current = false;
    turnLockRef.current = false;
    isDeadRef.current = false;

    setScoreState(0);
    setLivesState(3);
    setLengthState(1);
    setIsPausedState(false);
    setIsDeadState(false);
    setHasStarted(false);

    generateFoods();
    playSound('click');

    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
    }
    const speedInfo = getSpeedInfo();
    gameTimeoutRef.current = setTimeout(gameTick, speedInfo.interval);
  };

  // --- Setting Hooks ---
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    playSound('click');
    setDifficulty(val);
    difficultyRef.current = val;

    if (!isPausedRef.current && !isDeadRef.current && (dxRef.current !== 0 || dyRef.current !== 0)) {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
      const speedInfo = getSpeedInfo();
      gameTimeoutRef.current = setTimeout(gameTick, speedInfo.interval);
    }
  };

  const handleMuteToggle = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    setMuted(nextVal);
    playSound('click');
  };

  // --- Touch Swipe Detection on Canvas ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (controlMode !== 'swipe') return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (controlMode !== 'swipe') return;
    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (Math.max(Math.abs(diffX), Math.abs(diffY)) > 30) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) moveSnake('right');
        else moveSnake('left');
      } else {
        if (diffY > 0) moveSnake('down');
        else moveSnake('up');
      }
    }
  };

  // --- Listeners Setup ---
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake_high_score');
    if (savedHighScore) {
      setHighScoreState(parseInt(savedHighScore, 10));
    }

    handleRestart();

    return () => {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        moveSnake('up');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        moveSnake('down');
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        moveSnake('left');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        moveSnake('right');
      } else if (key === ' ' || key === 'p') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [controlMode, difficulty]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white font-sans flex flex-col items-center justify-start md:justify-center pt-4 pb-32 md:py-8 px-3 sm:px-4 overflow-x-hidden select-none overflow-y-auto">
      {/* Background Orbs */}
      <div className="fixed w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-3xl -top-20 -left-10 pointer-events-none"></div>
      <div className="fixed w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-3xl -bottom-20 -right-10 pointer-events-none"></div>

      {/* Main Glass Card Wrapper */}
      <div className="w-full max-w-md md:max-w-4xl landscape:max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl relative flex flex-col md:flex-row landscape:flex-row gap-4 md:gap-8 items-center md:items-stretch landscape:items-stretch transition-all duration-300">
        
        {/* Left Column: Control Center */}
        <div className="w-full flex flex-col gap-4 justify-between md:w-1/2 landscape:w-1/2">
          <div className="flex flex-col gap-4">
            {/* Header Title & Audio Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white">多功能極簡貪食蛇</h1>
                  <p className="text-[10px] text-slate-400 font-medium">多模式操作自選版</p>
                </div>
              </div>

              <button
                id="btn-mute-toggle"
                onClick={handleMuteToggle}
                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl border border-slate-700/50 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title={isMuted ? '取消靜音' : '靜音'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Dynamic Statistics Display */}
            <ScoreBoard
              score={scoreState}
              highScore={highScoreState}
              length={lengthState}
              speed={speedState}
              lives={livesState}
            />

            {/* Settings Selectors & Main Controls */}
            <div className="grid grid-cols-3 gap-2 items-center">
              {/* Controls Selector */}
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3 text-cyan-400" /> 操作
                </label>
                <select
                  id="select-ctrl-mode"
                  value={controlMode}
                  onChange={(e) => {
                    playSound('click');
                    setControlMode(e.target.value as ControlMode);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="buttons">🎮 虛擬按鍵</option>
                  <option value="swipe">📱 螢幕滑動</option>
                  <option value="joystick">🕹️ 虛擬搖桿</option>
                </select>
              </div>

              {/* Difficulty Selector */}
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-indigo-400" /> 等級
                </label>
                <select
                  id="select-difficulty"
                  value={difficulty}
                  onChange={handleDifficultyChange}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="1">等級 1 (慢速)</option>
                  <option value="2">等級 2 (輕鬆)</option>
                  <option value="3">等級 3 (標準)</option>
                  <option value="4">等級 4 (快速)</option>
                  <option value="5">等級 5 (極速)</option>
                </select>
              </div>

              {/* Pause / Play Trigger Button */}
              <div className="flex flex-col justify-end h-full">
                <button
                  id="btn-pause-play"
                  onClick={togglePause}
                  disabled={isDeadState}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all active:scale-95 shadow-md ${
                    isPausedState
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30 shadow-emerald-500/5'
                      : 'bg-rose-600/20 text-rose-400 border-rose-500/30 hover:bg-rose-600/30 shadow-rose-500/5'
                  }`}
                >
                  {isPausedState ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>繼續</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>暫停</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Useful Tips for Landscape/Desktop Layout */}
          <div className="hidden md:flex landscape:flex flex-col gap-2 p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1">💡 專業操作秘訣</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>吃掉越多的飼料，蛇身行進的速度會隨之微幅增加！</li>
              <li>支援電腦鍵盤，使用 <kbd className="bg-slate-800 px-1 rounded text-cyan-400 border border-slate-700 font-mono text-[9px]">W A S D</kbd> 或方向鍵操作。</li>
              <li>按下 <kbd className="bg-slate-800 px-1 rounded text-indigo-400 border border-slate-700 font-mono text-[9px]">Space 空白鍵</kbd> 或 <kbd className="bg-slate-800 px-1 rounded text-indigo-400 border border-slate-700 font-mono text-[9px]">P</kbd> 可以隨時暫停。</li>
              <li>生命值大於 0 時，撞壁或自撞皆可消耗生命「原位復活」！</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Active Gameplay Area */}
        <div className="w-full md:w-1/2 landscape:w-1/2 flex flex-col gap-4 items-center justify-center">
          {/* Gaming Stage Area */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-none relative bg-slate-950 p-1.5 border-2 border-slate-800 rounded-3xl shadow-inner shadow-black group overflow-hidden touch-none"
          >
            <canvas
              ref={canvasRef}
              width="400"
              height="400"
              className="w-full aspect-square rounded-2xl block border border-slate-900/50"
            />

            {/* Start Guide Overlay */}
            {!hasStarted && !isDeadState && !isPausedState && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center rounded-2xl">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 animate-bounce">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">準備開始挑戰</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                    {controlMode === 'swipe'
                      ? '在螢幕上往上下左右滑動以朝對應方向出發！'
                      : '按下方向鍵、WASD，或下方的控制器按鍵開始移動！'}
                  </p>
                </div>
              </div>
            )}

            {/* Paused Overlay */}
            {isPausedState && !isDeadState && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-2xl">
                <span className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/30 text-indigo-400 animate-pulse">
                  <Pause className="w-6 h-6 fill-current" />
                </span>
                <h3 className="font-black text-base tracking-widest text-indigo-400">遊戲暫停中</h3>
              </div>
            )}
          </div>

          {/* Interactive Controller Boards */}
          <div className="min-h-[120px] w-full flex items-center justify-center relative touch-none">
            {controlMode === 'buttons' && (
              <div className="grid grid-cols-3 gap-2 w-48 mx-auto touch-none">
                {/* Row 1 */}
                <div></div>
                <button
                  id="btn-move-up"
                  onClick={() => moveSnake('up')}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    moveSnake('up');
                  }}
                  className="w-14 h-14 bg-indigo-600/95 active:bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg active:translate-y-0.5 transition-all active:shadow-sm shadow-indigo-900/30 border border-indigo-500/30 cursor-pointer"
                  title="向上"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div></div>

                {/* Row 2 */}
                <button
                  id="btn-move-left"
                  onClick={() => moveSnake('left')}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    moveSnake('left');
                  }}
                  className="w-14 h-14 bg-indigo-600/95 active:bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg active:translate-y-0.5 transition-all active:shadow-sm shadow-indigo-900/30 border border-indigo-500/30 cursor-pointer"
                  title="向左"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  id="btn-move-down"
                  onClick={() => moveSnake('down')}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    moveSnake('down');
                  }}
                  className="w-14 h-14 bg-indigo-600/95 active:bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg active:translate-y-0.5 transition-all active:shadow-sm shadow-indigo-900/30 border border-indigo-500/30 cursor-pointer"
                  title="向下"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
                <button
                  id="btn-move-right"
                  onClick={() => moveSnake('right')}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    moveSnake('right');
                  }}
                  className="w-14 h-14 bg-indigo-600/95 active:bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg active:translate-y-0.5 transition-all active:shadow-sm shadow-indigo-900/30 border border-indigo-500/30 cursor-pointer"
                  title="向右"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {controlMode === 'swipe' && (
              <div className="text-slate-400 text-xs text-center border border-dashed border-slate-800 p-4 rounded-2xl max-w-sm mx-auto flex flex-col items-center gap-2 bg-slate-900/20">
                <Move className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span>📱 請在上方「遊戲畫面上滑動」控制方向</span>
                <span className="text-[10px] text-slate-500">(支援全螢幕/鍵盤 Arrow 與 WASD 操控)</span>
              </div>
            )}

            {controlMode === 'joystick' && (
              <Joystick onMove={moveSnake} active={!isPausedState && !isDeadState} />
            )}
          </div>
        </div>

      </div>

      {/* Popups & Dialogs overlay */}
      <GameOverModal
        isOpen={isDeadState}
        lives={livesState}
        score={scoreState}
        length={lengthState}
        onRevive={handleRevive}
        onRestart={handleRestart}
      />
    </div>
  );
}
