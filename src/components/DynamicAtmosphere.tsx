import { useEffect, useRef, useState } from 'react';

type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

function getDominicanTimeOfDay(): { timeOfDay: TimeOfDay; hour: number; greeting: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santo_Domingo',
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);

    if (hour >= 6 && hour < 9) {
      return { timeOfDay: 'dawn', hour, greeting: 'Hermoso amanecer, mi amor' };
    } else if (hour >= 9 && hour < 17) {
      return { timeOfDay: 'day', hour, greeting: 'Buenos días, mi cielo' };
    } else if (hour >= 17 && hour < 19) {
      return { timeOfDay: 'sunset', hour, greeting: 'Buenas tardes, mi vida' };
    } else {
      return { timeOfDay: 'night', hour, greeting: 'Buenas noches, mi amor' };
    }
  } catch {
    return { timeOfDay: 'day', hour: 12, greeting: 'Buenos días, mi amor' };
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
  type: 'petal' | 'sparkle' | 'firefly';
}

export function DynamicAtmosphere() {
  const [{ timeOfDay, greeting }, setTimeInfo] = useState(getDominicanTimeOfDay);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(getDominicanTimeOfDay());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Canvas para pétalos, luciérnagas y estela de toques
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const maxAmbient = timeOfDay === 'night' ? 24 : 16;

    // Crear partículas ambientales según la hora
    for (let i = 0; i < maxAmbient; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 + (timeOfDay === 'night' ? 0.2 : 0.8),
        vy: Math.random() * 0.7 + 0.3,
        size: Math.random() * 6 + 4,
        alpha: Math.random() * 0.6 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        color: timeOfDay === 'night' ? '#fef08a' : '#fbcfe8',
        type: timeOfDay === 'night' && Math.random() > 0.4 ? 'firefly' : 'petal',
      });
    }

    // Estela táctil al mover el dedo o cursor
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX === undefined || clientY === undefined) return;

      for (let i = 0; i < 2; i++) {
        particles.push({
          x: clientX + (Math.random() - 0.5) * 12,
          y: clientY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          size: Math.random() * 4 + 2,
          alpha: 0.9,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.08,
          color: '#fb7185',
          type: 'sparkle',
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.type === 'sparkle') {
          p.alpha -= dt * 0.8;
          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }
        } else {
          // Re-circular partículas ambientales
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) {
            p.x = -20;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.type === 'petal') {
          // Dibujar pétalo suave en forma elíptica orgánica
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'firefly') {
          // Luciérnaga con resplandor suave
          const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 2);
          glow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
          glow.addColorStop(0.5, 'rgba(250, 204, 21, 0.4)');
          glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Chispita / estrella de toque
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [timeOfDay]);

  // Estilos de fondo según la hora dominicana
  const bgStyles: Record<TimeOfDay, string> = {
    dawn: 'from-[#FDF6ED] via-[#FCEAE6] to-[#F5E6E8]',
    day: 'from-[#FAF6F0] via-[#F7EFF2] to-[#F3E8EC]',
    sunset: 'from-[#FDE8DF] via-[#F7D6D0] to-[#E9CAD4]',
    night: 'from-[#1a1824] via-[#211e30] to-[#161420]',
  };

  const isNight = timeOfDay === 'night';

  return (
    <>
      {/* Fondo de atmósfera dinámico */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-1000 z-0 bg-gradient-to-b ${bgStyles[timeOfDay]}`}
        aria-hidden="true"
      >
        {/* En la noche: estrellas sutiles fijas y luna */}
        {isNight && (
          <div className="absolute inset-0 overflow-hidden opacity-60">
            <div className="absolute top-10 right-12 w-14 h-14 rounded-full bg-amber-100/20 blur-md shadow-[0_0_40px_rgba(254,240,138,0.4)]"></div>
            <div className="absolute top-12 right-14 text-3xl select-none filter drop-shadow-[0_0_8px_rgba(254,240,138,0.8)]">
              🌙
            </div>
            {/* Pequeñas estrellas titilantes */}
            <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-amber-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-rose-200 rounded-full animate-pulse opacity-80"></div>
            <div className="absolute top-1/6 left-2/3 w-1 h-1 bg-white rounded-full animate-pulse opacity-60"></div>
            <div className="absolute top-1/2 left-1/10 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-50"></div>
          </div>
        )}
      </div>

      {/* Canvas interactivo para la brisa de pétalos y destellos */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-1"
        style={{ mixBlendMode: isNight ? 'screen' : 'multiply' }}
        aria-hidden="true"
      />
    </>
  );
}

export function useAtmosphereGreeting() {
  const [info, setInfo] = useState(getDominicanTimeOfDay);
  useEffect(() => {
    const timer = setInterval(() => setInfo(getDominicanTimeOfDay()), 60000);
    return () => clearInterval(timer);
  }, []);
  return info;
}
