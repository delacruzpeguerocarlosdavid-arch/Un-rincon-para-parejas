import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppaSprite, type AppaMood } from '@/components/AppaSprite';
import { soundFx } from '@/lib/sound-atmosphere';
import { Heart, Sparkles } from 'lucide-react';

interface CrumbsParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
}

interface FoamBubble {
  id: number;
  x: number; // percentage within appa box
  y: number;
  size: number;
  alpha: number;
}

interface WaterDrop {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface BouncyBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

interface AppaPouInteractiveProps {
  mood: AppaMood;
  sleeping: boolean;
  hygiene: number;
  accessory?: string;
  bathTool?: 'soap' | 'rinse' | 'dry';
  activeRoom: string;
  draggedFood?: { id: string; emoji: string; x: number; y: number } | null;
  onFeedComplete?: (foodId: string) => void;
  onBatheComplete?: () => void;
  onPetCare?: () => void;
  className?: string;
}

export function AppaPouInteractive({
  mood,
  sleeping,
  hygiene,
  accessory,
  bathTool,
  activeRoom,
  draggedFood,
  onFeedComplete,
  onBatheComplete,
  onPetCare,
  className = '',
}: AppaPouInteractiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Eye-tracking state
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Squash & Stretch physics state
  const [squash, setSquash] = useState<{ scaleX: number; scaleY: number }>({ scaleX: 1, scaleY: 1 });
  const springRef = useRef<{ val: number; vel: number; target: number } | null>(null);

  // Feeding & biting state
  const [biteStage, setBiteStage] = useState<number>(0); // 0 = idle, 1 = bite 1, 2 = bite 2, 3 = swallowed
  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const [crumbs, setCrumbs] = useState<CrumbsParticle[]>([]);
  const isFeedingInProgress = useRef<boolean>(false);

  // Soap Foam & Water Shower state
  const [foam, setFoam] = useState<FoamBubble[]>([]);
  const [waterDrops, setWaterDrops] = useState<WaterDrop[]>([]);
  const isSoapDragging = useRef<boolean>(false);

  // Tickle detection
  const tickleTracker = useRef<{ lastX: number; lastTime: number; strokes: number }>({
    lastX: 0,
    lastTime: 0,
    strokes: 0,
  });
  const [isTickled, setIsTickled] = useState<boolean>(false);

  // Hearts & floating particle fx
  const [heartsFx, setHeartsFx] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  // Bouncing Ball Physics
  const [ball, setBall] = useState<BouncyBall>({
    x: 180,
    y: 220,
    vx: 0,
    vy: 0,
    radius: 18,
    active: activeRoom === 'sala',
  });
  const ballDragging = useRef<{ active: boolean; startX: number; startY: number } | null>(null);

  // Helper to spawn floating hearts
  const spawnHeart = useCallback((x: number, y: number, text = '💗') => {
    const id = Date.now() + Math.random();
    setHeartsFx(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setHeartsFx(prev => prev.filter(h => h.id !== id));
    }, 1200);
  }, []);

  // 1. POINTER MOVE & EYE TRACKING
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (sleeping || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const faceCenterX = rect.left + rect.width * 0.42;
    const faceCenterY = rect.top + rect.height * 0.48;

    const dx = clientX - faceCenterX;
    const dy = clientY - faceCenterY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(1, Math.hypot(dx, dy) / 160);

    setPupilOffset({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
    });

    // Tickle speed detection on belly
    const now = Date.now();
    const deltaX = Math.abs(clientX - tickleTracker.current.lastX);
    const deltaTime = now - tickleTracker.current.lastTime;

    if (deltaTime < 100 && deltaX > 15) {
      // Fast swipe
      tickleTracker.current.strokes += 1;
      if (tickleTracker.current.strokes > 5) {
        setIsTickled(true);
        soundFx.playGiggle();
        spawnHeart(faceCenterX - rect.left, faceCenterY - rect.top, '🥰');
        tickleTracker.current.strokes = 0;
        setTimeout(() => setIsTickled(false), 1600);
      }
    } else if (deltaTime > 250) {
      tickleTracker.current.strokes = 0;
    }

    tickleTracker.current.lastX = clientX;
    tickleTracker.current.lastTime = now;

    // Soap drawing mode in Bathroom
    if (isSoapDragging.current && activeRoom === 'bano' && bathTool === 'soap') {
      const pctX = ((clientX - rect.left) / rect.width) * 100;
      const pctY = ((clientY - rect.top) / rect.height) * 100;
      if (pctX >= 20 && pctX <= 80 && pctY >= 30 && pctY <= 85) {
        if (Math.random() > 0.4) {
          soundFx.playPlop(700 + Math.random() * 200);
          setFoam(prev => [
            ...prev.slice(-35),
            {
              id: Date.now() + Math.random(),
              x: pctX + (Math.random() - 0.5) * 8,
              y: pctY + (Math.random() - 0.5) * 8,
              size: 16 + Math.random() * 16,
              alpha: 0.9,
            },
          ]);
        }
      }
    }
  }, [sleeping, activeRoom, bathTool, spawnHeart]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  // 2. FOOD PROXIMITY & MOUTH ANTICIPATION
  useEffect(() => {
    if (!draggedFood || !containerRef.current || sleeping || isFeedingInProgress.current) {
      setMouthOpen(0);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouthX = rect.left + rect.width * 0.42;
    const mouthY = rect.top + rect.height * 0.58;

    const dist = Math.hypot(draggedFood.x - mouthX, draggedFood.y - mouthY);

    if (dist < 140) {
      const openAmount = Math.max(0, Math.min(1, (140 - dist) / 100));
      setMouthOpen(openAmount);
      // Look directly at the food!
      const angle = Math.atan2(draggedFood.y - mouthY, draggedFood.x - mouthX);
      setPupilOffset({
        x: Math.cos(angle) * 0.9,
        y: Math.sin(angle) * 0.9,
      });

      // If food is right on mouth, trigger bite sequence
      if (dist < 38 && !isFeedingInProgress.current) {
        isFeedingInProgress.current = true;
        triggerBiteSequence(draggedFood.id);
      }
    } else {
      setMouthOpen(0);
    }
  }, [draggedFood, sleeping]);

  const triggerBiteSequence = (foodId: string) => {
    setBiteStage(1);
    soundFx.playCrunch();
    spawnCrumbs(4);
    setSquash({ scaleX: 1.08, scaleY: 0.94 });

    setTimeout(() => {
      setBiteStage(2);
      soundFx.playCrunch();
      spawnCrumbs(5);
      setSquash({ scaleX: 0.94, scaleY: 1.06 });

      setTimeout(() => {
        setBiteStage(3);
        soundFx.playPlop(520);
        soundFx.playChime(1.2);
        spawnHeart(110, 80, '¡Ñam! 😋');
        setSquash({ scaleX: 1.05, scaleY: 0.96 });

        setTimeout(() => {
          setBiteStage(0);
          setMouthOpen(0);
          isFeedingInProgress.current = false;
          onFeedComplete?.(foodId);
          setSquash({ scaleX: 1, scaleY: 1 });
        }, 600);
      }, 350);
    }, 350);
  };

  const spawnCrumbs = (count: number) => {
    const newCrumbs: CrumbsParticle[] = Array.from({ length: count }, () => ({
      id: Math.random(),
      x: 100 + (Math.random() - 0.5) * 20,
      y: 130 + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 5,
      vy: -(Math.random() * 3 + 1),
      color: ['#ea580c', '#f59e0b', '#fbbf24', '#d97706'][Math.floor(Math.random() * 4)]!,
      size: 4 + Math.random() * 4,
      rotation: Math.random() * 360,
    }));
    setCrumbs(prev => [...prev, ...newCrumbs]);
  };

  // Animate falling crumbs with gravity
  useEffect(() => {
    if (crumbs.length === 0) return;
    const interval = setInterval(() => {
      setCrumbs(prev =>
        prev
          .map(c => ({
            ...c,
            x: c.x + c.vx,
            y: c.y + c.vy,
            vy: c.vy + 0.45, // gravity
            rotation: c.rotation + 8,
          }))
          .filter(c => c.y < 230),
      );
    }, 24);
    return () => clearInterval(interval);
  }, [crumbs.length]);

  // 3. SQUASH & STRETCH SPRING PHYSICS LOOP
  const handlePointerDown = () => {
    if (sleeping) return;
    soundFx.playBoing();
    // Squish downward
    setSquash({ scaleX: 1.12, scaleY: 0.88 });
    isSoapDragging.current = true;
    onPetCare?.();
  };

  const handlePointerUp = () => {
    isSoapDragging.current = false;
    if (sleeping) return;

    // Trigger elastic harmonic spring wobble
    let time = 0;
    const springInterval = setInterval(() => {
      time += 0.22;
      const decay = Math.exp(-time * 1.8);
      const wobble = Math.sin(time * 6) * 0.14 * decay;

      if (decay < 0.02) {
        clearInterval(springInterval);
        setSquash({ scaleX: 1, scaleY: 1 });
      } else {
        setSquash({
          scaleX: 1 - wobble,
          scaleY: 1 + wobble,
        });
      }
    }, 20);
  };

  // 4. SHOWER WATER & FOAM CLEANING
  const handleShowerSpray = (e: React.PointerEvent) => {
    if (activeRoom !== 'bano' || bathTool !== 'rinse') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    soundFx.playPlop(800 + Math.random() * 300);

    // Remove foam bubbles near touch point
    const touchX = ((e.clientX - rect.left) / rect.width) * 100;
    const touchY = ((e.clientY - rect.top) / rect.height) * 100;

    setFoam(prev =>
      prev.filter(b => {
        const d = Math.hypot(b.x - touchX, b.y - touchY);
        return d > 16;
      }),
    );

    // Spawn falling water splash particles
    const drops = Array.from({ length: 4 }, () => ({
      id: Math.random(),
      x: touchX + (Math.random() - 0.5) * 12,
      y: touchY,
      speed: 4 + Math.random() * 4,
    }));
    setWaterDrops(prev => [...prev, ...drops]);

    if (foam.length <= 2 && foam.length > 0) {
      soundFx.playChime(1.3);
      spawnHeart(110, 80, '✨ ¡Limpio y brillante! ✨');
      onBatheComplete?.();
    }
  };

  // 5. BOUNCY BALL PHYSICS
  useEffect(() => {
    if (activeRoom !== 'sala') return;

    const loop = setInterval(() => {
      if (ballDragging.current?.active) return;

      setBall(b => {
        let vx = b.vx * 0.985; // friction
        let vy = b.vy + 0.45; // gravity
        let x = b.x + vx;
        let y = b.y + vy;

        // Floor collision
        if (y > 220) {
          y = 220;
          vy = -vy * 0.72; // bounce restitution
          if (Math.abs(vy) > 1.2) {
            soundFx.playBoing();
          }
        }
        // Left wall
        if (x < 24) {
          x = 24;
          vx = -vx * 0.75;
          soundFx.playBoing();
        }
        // Right wall
        if (x > 290) {
          x = 290;
          vx = -vx * 0.75;
          soundFx.playBoing();
        }

        return { ...b, x, y, vx, vy };
      });
    }, 20);

    return () => clearInterval(loop);
  }, [activeRoom]);

  const kickBall = (e: React.PointerEvent) => {
    e.stopPropagation();
    soundFx.playBoing();
    const throwVx = (Math.random() - 0.5) * 12;
    const throwVy = -(8 + Math.random() * 6);
    setBall(b => ({ ...b, vx: throwVx, vy: throwVy }));
    spawnHeart(ball.x, ball.y, '⚽');
  };

  const currentMood: AppaMood = isTickled
    ? 'tickle'
    : mouthOpen > 0.1
    ? 'anticipating'
    : biteStage > 0
    ? 'eating'
    : mood;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handleShowerSpray}
      className={`relative w-64 h-64 select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center ${className}`}
    >
      {/* Sprite principal con seguimiento de ojos y elasticidad */}
      <AppaSprite
        mood={currentMood}
        pupilOffset={pupilOffset}
        squash={squash}
        mouthOpen={mouthOpen}
        accessory={accessory}
        className={isTickled ? 'appa-wiggle' : ''}
      />

      {/* Burbujas de espuma físicas que se pegan a Appa */}
      {foam.map(b => (
        <div
          key={b.id}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.alpha,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 border border-cyan-100 shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none animate-in fade-in zoom-in duration-150 flex items-center justify-center text-[10px]"
        >
          🫧
        </div>
      ))}

      {/* Gotas de lluvia del chorro de la ducha */}
      {waterDrops.map(d => (
        <div
          key={d.id}
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          className="absolute pointer-events-none text-cyan-300 font-bold animate-ping text-xs"
        >
          💧
        </div>
      ))}

      {/* Migajas que caen con gravedad al morder comida */}
      {crumbs.map(c => (
        <div
          key={c.id}
          style={{
            left: `${c.x}px`,
            top: `${c.y}px`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            transform: `rotate(${c.rotation}deg)`,
          }}
          className="absolute rounded-sm pointer-events-none shadow-sm"
        />
      ))}

      {/* Pelota con física en la sala */}
      {activeRoom === 'sala' && (
        <div
          onPointerDown={kickBall}
          style={{
            left: `${ball.x}px`,
            top: `${ball.y}px`,
            width: `${ball.radius * 2}px`,
            height: `${ball.radius * 2}px`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-20 flex items-center justify-center transition-transform active:scale-90 hover:scale-110 filter drop-shadow-md select-none text-2xl"
          title="Toca para patear la pelota"
        >
          ⚽
        </div>
      )}

      {/* Efectos de corazones flotantes */}
      {heartsFx.map(h => (
        <div
          key={h.id}
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 animate-in fade-in zoom-in duration-300 text-sm font-serif font-bold text-rose-500 bg-white/90 dark:bg-stone-900/90 px-2 py-0.5 rounded-full shadow-lg border border-rose-200/50 flex items-center gap-1"
        >
          <Heart className="w-3.5 h-3.5 fill-rose-400" />
          <span>{h.text}</span>
        </div>
      ))}
    </div>
  );
}
