import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { AppaSprite } from '@/components/AppaSprite';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Mic, Square, Play, Pause, Send, Flower2, Heart, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface RiverBoat {
  id: string;
  sender: 'carlos' | 'mimie';
  content: string;
  color: string;
  x: number; // percentage along river 0 to 100
  y: number; // vertical sway in river
  createdAt: string;
  read: boolean;
}

export interface WhisperVoiceNote {
  id: string;
  sender: 'carlos' | 'mimie';
  audioBase64: string;
  durationSec: number;
  createdAt: string;
  played: boolean;
}

interface FlowerStem {
  id: number;
  type: 'margarita' | 'lirio';
  x: number; // 5% to 95%
  baseY: number; // 40% to 75%
  height: number;
  sway: number;
  bloomStage: number; // 0 to 1
  hasDew: boolean;
  dewY: number;
}

interface RiverRipple {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface FloatingPetal {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  color: string;
  size: number;
}

interface RiverMeadowSceneProps {
  equippedAccessory?: string;
  currentUser?: 'carlos' | 'mimie';
}

export function RiverMeadowScene({
  equippedAccessory,
  currentUser = 'carlos',
}: RiverMeadowSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Time & Dominican Sky
  const hour = Number(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Santo_Domingo',
      hour: 'numeric',
      hour12: false,
    }),
  );
  const isNight = hour < 6 || hour >= 19;
  const isSunset = hour >= 17 && hour < 19;

  // Stems & Meadow State
  const [stems, setStems] = useState<FlowerStem[]>(() => {
    // Generate 14 alternating daisies and lilies
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      type: i % 2 === 0 ? 'margarita' : 'lirio',
      x: 6 + i * 6.5 + (Math.random() - 0.5) * 2,
      baseY: 52 + (i % 3) * 6,
      height: 70 + Math.random() * 35,
      sway: 0,
      bloomStage: 1,
      hasDew: true,
      dewY: 0,
    }));
  });

  // River & Ripples
  const [ripples, setRipples] = useState<RiverRipple[]>([]);
  const [petals, setPetals] = useState<FloatingPetal[]>([]);

  // Paper Boats in the River
  const [boats, setBoats] = useState<RiverBoat[]>(() => {
    const saved = localStorage.getItem('un_lugar_river_boats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'initial_boat',
        sender: 'carlos',
        content: 'Este río lleva todo nuestro amor hacia el mar infinito, Mimie. Te amo.',
        color: '#fbcfe8',
        x: 35,
        y: 84,
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];
  });

  // Whisper Seashell State
  const [whisper, setWhisper] = useState<WhisperVoiceNote | null>(() => {
    const saved = localStorage.getItem('un_lugar_whisper_note');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  // Boat Writing Dialog State
  const [isBoatModalOpen, setIsBoatModalOpen] = useState(false);
  const [newBoatText, setNewBoatText] = useState('');
  const [newBoatColor, setNewBoatColor] = useState('#ffffff');
  const [selectedBoatToRead, setSelectedBoatToRead] = useState<RiverBoat | null>(null);

  // Whisper Audio Recording State
  const [isWhisperModalOpen, setIsWhisperModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Appa walking by the river outdoor toggle
  const [showAppaOutdoor, setShowAppaOutdoor] = useState(true);
  const [appaOutdoorX, setAppaOutdoorX] = useState(50);

  // Persist boats in localStorage
  useEffect(() => {
    localStorage.setItem('un_lugar_river_boats', JSON.stringify(boats));
  }, [boats]);

  // Persist whisper in localStorage
  useEffect(() => {
    if (whisper) {
      localStorage.setItem('un_lugar_whisper_note', JSON.stringify(whisper));
    }
  }, [whisper]);

  // 1. WATER & PETAL ANIMATION LOOP
  useEffect(() => {
    const interval = setInterval(() => {
      // Advance boats along the river current
      setBoats(prevBoats =>
        prevBoats.map(b => {
          let nextX = b.x + 0.12; // slow gentle drift
          if (nextX > 94) nextX = 5; // loop gently
          return {
            ...b,
            x: nextX,
            y: 83 + Math.sin(Date.now() / 800 + b.x) * 2.5,
          };
        }),
      );

      // Expand & fade ripples
      setRipples(prev =>
        prev
          .map(r => ({
            ...r,
            radius: r.radius + 1.2,
            alpha: r.alpha - 0.02,
          }))
          .filter(r => r.alpha > 0.05),
      );

      // Drift petals in wind
      setPetals(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            rot: p.rot + 2.5,
          }))
          .filter(p => p.x < 110 && p.y < 100),
      );

      // Natural gentle wind sway for stems
      setStems(prev =>
        prev.map(s => ({
          ...s,
          sway: s.sway * 0.92 + Math.sin(Date.now() / 1000 + s.x) * 0.8,
        })),
      );
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // 2. INTERACTIVE TOUCH / SWIPE ON FLOWERS (Spring bending)
  const handlePointerOverFlower = (id: number) => {
    soundFx.playChime(1.25);
    setStems(prev =>
      prev.map(s => (s.id === id ? { ...s, sway: (Math.random() - 0.5) * 16 } : s)),
    );

    // Spawn 2 floating petals
    const stem = stems.find(s => s.id === id);
    if (stem) {
      const isDaisy = stem.type === 'margarita';
      const newPetals: FloatingPetal[] = [
        {
          id: Math.random(),
          x: stem.x,
          y: stem.baseY - stem.height * 0.25,
          vx: 0.6 + Math.random() * 0.8,
          vy: 0.2 + (Math.random() - 0.5) * 0.6,
          rot: Math.random() * 360,
          color: isDaisy ? '#FEF08A' : '#FBCFE8',
          size: 7 + Math.random() * 5,
        },
      ];
      setPetals(p => [...p.slice(-25), ...newPetals]);
    }
  };

  // 3. TOUCHING WATER CREATES RIPPLES
  const handleRiverClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (clickY >= 72) {
      soundFx.playPlop(540 + Math.random() * 120);
      setRipples(prev => [
        ...prev.slice(-10),
        {
          id: Date.now() + Math.random(),
          x: clickX,
          y: clickY,
          radius: 6,
          maxRadius: 42,
          alpha: 0.85,
        },
      ]);
    }
  };

  // 4. TOUCHING MORNING DEW
  const handleDewClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playPlop(880);
    setStems(prev =>
      prev.map(s => (s.id === id ? { ...s, hasDew: false } : s)),
    );
    // Dew drop re-accumulates after 15 seconds
    setTimeout(() => {
      setStems(prev =>
        prev.map(s => (s.id === id ? { ...s, hasDew: true } : s)),
      );
    }, 15000);
  };

  // 5. LAUNCHING A PAPER BOAT
  const launchPaperBoat = () => {
    if (!newBoatText.trim()) return;

    soundFx.playPaperFold();
    soundFx.playPlop(500);

    const newBoat: RiverBoat = {
      id: `boat_${Date.now()}`,
      sender: currentUser,
      content: newBoatText.trim(),
      color: newBoatColor,
      x: 10,
      y: 84,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setBoats(prev => [...prev, newBoat]);
    setNewBoatText('');
    setIsBoatModalOpen(false);
  };

  // 6. RECORDING VOICE WHISPER IN SEASHELL
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const note: WhisperVoiceNote = {
            id: `whisper_${Date.now()}`,
            sender: currentUser,
            audioBase64: base64,
            durationSec: recordingSeconds,
            createdAt: new Date().toISOString(),
            played: false,
          };
          setWhisper(note);
          soundFx.playChime(1.3);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch {
      alert('Por favor permite acceso al micrófono para grabar un susurro de amor.');
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Timer for recording seconds
  useEffect(() => {
    let t: number;
    if (isRecording) {
      t = window.setInterval(() => {
        setRecordingSeconds(s => {
          if (s >= 30) {
            stopWhisperRecording();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isRecording]);

  // Play audio whisper from seashell
  const playWhisperAudio = () => {
    if (!whisper) return;
    soundFx.playPlop(620);

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(whisper.audioBase64);
    audioElementRef.current = audio;
    setIsPlayingAudio(true);

    audio.onended = () => {
      setIsPlayingAudio(false);
      setWhisper(prev => (prev ? { ...prev, played: true } : null));
    };

    void audio.play();
  };

  return (
    <div className="relative select-none rounded-3xl overflow-hidden border border-emerald-950/20 shadow-2xl bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-900/60 dark:from-slate-950 dark:via-emerald-950/60 dark:to-stone-950">
      {/* 1. CIELO Y ATMÓSFERA */}
      <div
        className="relative h-[420px] w-full overflow-hidden cursor-pointer"
        onClick={handleRiverClick}
        ref={containerRef}
      >
        {/* Degradado de cielo con ciclo horario */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isNight
              ? 'bg-gradient-to-b from-[#0b1021] via-[#1a233a] to-[#1c2e26]'
              : isSunset
              ? 'bg-gradient-to-b from-[#f97316]/70 via-[#ec4899]/40 to-[#047857]/40'
              : 'bg-gradient-to-b from-[#7dd3fc]/80 via-[#bae6fd]/40 to-[#d1fae5]/50'
          }`}
        />

        {/* Astro: Sol o Luna */}
        <div
          className="absolute right-8 top-6 text-4xl filter drop-shadow-[0_0_16px_rgba(253,224,71,0.8)] pointer-events-none transition-transform duration-700 animate-pulse"
        >
          {isNight ? '🌙' : isSunset ? '🌇' : '☀️'}
        </div>

        {/* Estrellas o luciérnagas nocturnas */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute top-10 left-16 text-xs text-amber-200 animate-ping">✨</span>
            <span className="absolute top-16 left-48 text-xs text-amber-100 animate-pulse delay-700">⭐</span>
            <span className="absolute top-8 right-32 text-xs text-amber-200 animate-ping delay-500">✨</span>
            <span className="absolute top-24 right-16 text-xs text-amber-100 animate-pulse delay-1000">⭐</span>
          </div>
        )}

        {/* Rayos de sol translúcidos de día */}
        {!isNight && (
          <div
            className="absolute -top-12 -left-12 w-96 h-96 opacity-35 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(254, 240, 138, 0.45) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Colinas lejanas en degradé botánico */}
        <div
          className="absolute bottom-[44%] inset-x-0 h-32 rounded-[50%_50%_0_0] bg-gradient-to-b from-emerald-600/40 via-emerald-700/60 to-transparent pointer-events-none filter blur-[1px]"
        />

        {/* Pradera verde vibrante */}
        <div
          className="absolute bottom-0 inset-x-0 h-[48%] bg-gradient-to-b from-[#15803d] via-[#166534] to-[#14532d] shadow-inner"
        />

        {/* 2. EL CAMPO MIXTO: MARGARITAS & LIRIOS */}
        <div className="absolute inset-0 pointer-events-none">
          {stems.map(stem => {
            const isDaisy = stem.type === 'margarita';
            const swayDeg = stem.sway;

            return (
              <div
                key={stem.id}
                style={{
                  left: `${stem.x}%`,
                  bottom: `${100 - stem.baseY}%`,
                  transformOrigin: '50% 100%',
                  transform: `rotate(${swayDeg}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="absolute flex flex-col items-center pointer-events-auto cursor-pointer group"
                onPointerOver={() => handlePointerOverFlower(stem.id)}
                onClick={() => handlePointerOverFlower(stem.id)}
              >
                {/* Cabeza de la flor (Margarita o Lirio) */}
                <div className="relative group-hover:scale-115 transition-transform duration-200">
                  {isDaisy ? (
                    /* Margarita: pétalos blancos y botón dorado */
                    <div className="relative flex items-center justify-center filter drop-shadow">
                      <span className="text-3xl select-none">🌼</span>
                      {/* Gotita de rocío táctil en pétalo */}
                      {stem.hasDew && (
                        <button
                          onClick={e => handleDewClick(stem.id, e)}
                          title="Toca para deslizar el rocío"
                          className="absolute -top-1 right-0 w-2.5 h-2.5 rounded-full bg-cyan-100/90 shadow-[0_0_6px_cyan] animate-pulse hover:scale-125"
                        />
                      )}
                    </div>
                  ) : (
                    /* Lirio elegante rosa/blanco */
                    <div className="relative flex items-center justify-center filter drop-shadow">
                      <span className="text-3xl select-none">🌸</span>
                      {stem.hasDew && (
                        <button
                          onClick={e => handleDewClick(stem.id, e)}
                          title="Toca para deslizar el rocío"
                          className="absolute -top-1 left-0 w-2.5 h-2.5 rounded-full bg-cyan-100/90 shadow-[0_0_6px_cyan] animate-pulse hover:scale-125"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Tallo orgánico flexible */}
                <div
                  style={{ height: `${stem.height * 0.45}px` }}
                  className="w-1 bg-gradient-to-b from-[#4ade80] to-[#15803d] rounded-full -mt-1 shadow-sm"
                >
                  {/* Pequeña hojita en el tallo */}
                  <div className="w-2.5 h-1.5 bg-emerald-400 rounded-full rotate-45 -ml-1 mt-2 shadow-xs" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pétalos y polen flotando con el viento */}
        {petals.map(p => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.7}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rot}deg)`,
            }}
            className="absolute rounded-[50%_0] pointer-events-none opacity-85 shadow-sm"
          />
        ))}

        {/* 3. EL RÍO CRISTALINO */}
        <div
          className="absolute bottom-0 inset-x-0 h-[28%] bg-gradient-to-b from-cyan-600/70 via-sky-600/85 to-blue-800/90 border-t-2 border-cyan-200/40 shadow-inner overflow-hidden"
        >
          {/* Ondulaciones superficiales de agua en movimiento */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent animate-pulse" />

          {/* Ondas concéntricas de toque en el agua */}
          {ripples.map(r => (
            <div
              key={r.id}
              style={{
                left: `${r.x}%`,
                top: `${r.y - 72}%`,
                width: `${r.radius * 2}px`,
                height: `${r.radius}px`,
                opacity: r.alpha,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-100/90 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            />
          ))}

          {/* Piedritas de río para cruzar */}
          <div className="absolute left-[12%] bottom-3 text-lg opacity-85 select-none filter drop-shadow">🪨</div>
          <div className="absolute left-[28%] bottom-6 text-xl opacity-80 select-none filter drop-shadow">🪨</div>
          <div className="absolute left-[76%] bottom-4 text-lg opacity-85 select-none filter drop-shadow">🪨</div>

          {/* Barquitos de papel navegando por la corriente */}
          {boats.map(boat => (
            <div
              key={boat.id}
              onClick={e => {
                e.stopPropagation();
                soundFx.playPaperFold();
                setSelectedBoatToRead(boat);
              }}
              style={{
                left: `${boat.x}%`,
                top: `${boat.y - 72}%`,
              }}
              title="Toca para desdoblar la carta de este barquito"
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform hover:scale-125 active:scale-95 filter drop-shadow-lg"
            >
              <div className="relative flex flex-col items-center">
                <span className="text-3xl animate-bounce" style={{ color: boat.color }}>
                  ⛵
                </span>
                {!boat.read && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                )}
                <span className="text-[9px] font-serif font-bold text-white/90 bg-black/40 px-1.5 rounded-full -mt-1 backdrop-blur-xs">
                  {boat.sender === 'carlos' ? 'Carlos' : 'Mimie'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 4. LA CARACOLA DE LOS SUSURROS (En la orilla de arena) */}
        <div
          onClick={e => {
            e.stopPropagation();
            soundFx.playChime(1.2);
            setIsWhisperModalOpen(true);
          }}
          className="absolute left-6 bottom-[26%] z-30 cursor-pointer group flex flex-col items-center transition-transform hover:scale-115 active:scale-90"
          title="La Caracola de los Susurros: toca para escuchar o grabar notas de voz"
        >
          <div className="relative">
            <span className="text-4xl filter drop-shadow-lg inline-block group-hover:rotate-12 transition-transform">
              🐚
            </span>
            {whisper && !whisper.played && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md animate-ping" />
            )}
            {isPlayingAudio && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-rose-500 font-bold animate-bounce">
                🎵
              </span>
            )}
          </div>
          <span className="mt-0.5 rounded-full bg-card/85 border border-white/60 px-2 py-0.5 font-serif text-[10px] font-bold text-foreground shadow-sm backdrop-blur-xs">
            {whisper && !whisper.played ? '¡Susurro nuevo!' : 'Caracola'}
          </span>
        </div>

        {/* 5. APPA DE PASEO AL AIRE LIBRE */}
        {showAppaOutdoor && (
          <div
            style={{ left: `${appaOutdoorX}%`, bottom: '26%' }}
            className="absolute -translate-x-1/2 z-20 pointer-events-auto cursor-grab active:cursor-grabbing transition-all duration-700"
            onClick={e => {
              e.stopPropagation();
              soundFx.playGiggle();
              setAppaOutdoorX(prev => (prev === 50 ? 68 : prev === 68 ? 32 : 50));
            }}
            title="Appa paseando en el río: tócalo para que camine"
          >
            <AppaSprite
              mood="happy"
              accessory={equippedAccessory}
              className="w-32 h-32 filter drop-shadow-xl"
            />
          </div>
        )}
      </div>

      {/* BARRA DE HERRAMIENTAS DEL VALLE */}
      <div className="p-3 bg-card/90 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs font-serif">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Flower2 className="w-4 h-4 text-emerald-500" />
          <span>Margaritas & Lirios · Valle de Amor</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para doblar barquito */}
          <Button
            size="sm"
            onClick={() => setIsBoatModalOpen(true)}
            className="rounded-xl h-8 px-3 text-xs bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <span>⛵ Doblar barquito</span>
          </Button>

          {/* Botón para alternar paseo de Appa */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              soundFx.playChime(1.1);
              setShowAppaOutdoor(prev => !prev);
            }}
            className="rounded-xl h-8 px-2.5 text-xs flex items-center gap-1"
          >
            <span>🐾 {showAppaOutdoor ? 'Appa afuera' : 'Llamar a Appa'}</span>
          </Button>
        </div>
      </div>

      {/* MODAL: DOBLAR Y LANZAR BARQUITO DE PAPEL */}
      <Dialog open={isBoatModalOpen} onOpenChange={setIsBoatModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-5 border border-cyan-200 dark:border-cyan-900 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <span>⛵</span>
              <span>Lanzar un barquito al río</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escribe un mensaje de amor o deseo que flotará por el agua hasta que tu pareja lo rescate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Textarea
              placeholder="Escribe tu mensaje con amor..."
              value={newBoatText}
              onChange={e => setNewBoatText(e.target.value)}
              className="min-h-[90px] font-serif text-sm rounded-2xl resize-none"
            />

            {/* Selector de color del barquito */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Color del papel:</span>
              <div className="flex gap-2">
                {[
                  { color: '#ffffff', label: 'Blanco' },
                  { color: '#fbcfe8', label: 'Rosa' },
                  { color: '#fef08a', label: 'Dorado' },
                  { color: '#bae6fd', label: 'Cielo' },
                ].map(c => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setNewBoatColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-full border border-black/20 shadow-xs transition-transform ${
                      newBoatColor === c.color ? 'scale-125 ring-2 ring-primary ring-offset-1' : ''
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={launchPaperBoat}
              disabled={!newBoatText.trim()}
              className="w-full rounded-2xl h-10 font-serif text-sm bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Soltar al agua</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: LEER CARTA DE UN BARQUITO DE PAPEL */}
      <Dialog
        open={Boolean(selectedBoatToRead)}
        onOpenChange={open => !open && setSelectedBoatToRead(null)}
      >
        <DialogContent className="max-w-sm rounded-3xl p-6 border-2 border-amber-200 dark:border-amber-900 bg-amber-50/95 dark:bg-stone-900/95 backdrop-blur-xl">
          {selectedBoatToRead && (
            <div className="space-y-4 text-center">
              <span className="text-4xl inline-block animate-bounce">⛵</span>
              <h3 className="font-serif text-xl font-bold text-amber-950 dark:text-amber-200">
                Mensaje rescatado del río
              </h3>
              <p className="font-serif text-base italic leading-relaxed text-stone-800 dark:text-stone-200 p-4 rounded-2xl bg-white/70 dark:bg-stone-950/70 border border-amber-200/50 shadow-inner">
                «{selectedBoatToRead.content}»
              </p>
              <p className="text-[11px] font-sans text-muted-foreground">
                Escrito con amor por {selectedBoatToRead.sender === 'carlos' ? 'Carlos' : 'Mimie'}
              </p>
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => {
                  soundFx.playChime(1.1);
                  setBoats(prev =>
                    prev.map(b => (b.id === selectedBoatToRead.id ? { ...b, read: true } : b)),
                  );
                  setSelectedBoatToRead(null);
                }}
              >
                Volver a guardarlo en el río
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: LA CARACOLA DE LOS SUSURROS */}
      <Dialog open={isWhisperModalOpen} onOpenChange={setIsWhisperModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 border border-rose-200 dark:border-rose-950 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center justify-center gap-2">
              <span>🐚</span>
              <span>La Caracola de los Susurros</span>
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Graba notas de voz susurradas que quedan grabadas para siempre en la orilla del río.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3 text-center">
            {/* Si ya hay un susurro guardado */}
            {whisper ? (
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 space-y-2">
                <p className="font-serif text-sm font-semibold text-rose-900 dark:text-rose-200">
                  {whisper.sender === 'carlos' ? 'Carlos' : 'Mimie'} te dejó un susurro
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={playWhisperAudio}
                    className="rounded-full w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white shadow-lg flex items-center justify-center text-xl"
                  >
                    {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isPlayingAudio ? 'Reproduciendo con el río...' : 'Toca para escuchar al oído'}
                </p>
              </div>
            ) : (
              <p className="font-serif text-sm text-muted-foreground italic">
                Aún no hay ningún susurro en la caracola. ¡Sé el primero en grabar uno!
              </p>
            )}

            {/* Grabadora de micrófono */}
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs font-semibold mb-2">Grabar nuevo susurro (máx 30 seg):</p>
              {!isRecording ? (
                <Button
                  onClick={startWhisperRecording}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Empezar a grabar</span>
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-rose-500 font-bold font-mono animate-pulse">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span>00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30</span>
                  </div>
                  <Button
                    onClick={stopWhisperRecording}
                    variant="destructive"
                    className="w-full rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Detener y guardar en la caracola</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
