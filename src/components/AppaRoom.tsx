import { useState, useEffect, type ReactNode } from 'react';
import { furnitureCatalog, type Room } from '@/lib/appa-home';
import { soundFx } from '@/lib/sound-atmosphere';
import { Heart } from 'lucide-react';
import { useCouple } from '@/lib/couple-context';
import {
  LuxuryRoomWall,
  LuxuryHerringboneFloor,
  LuxuryCeilingLamp,
  LuxuryArchWindow,
  LuxurySofa,
  LuxuryBed,
  LuxuryBathtub,
  LuxuryKitchenCounter,
  LuxuryMonsteraPlant,
  CatalogRug,
  CatalogPlant,
  CatalogPicture,
  CatalogLamp,
  CatalogPlacedSofa,
} from './AppaRoomDecor';

export type PlacedFurniture = {
  item: string;
  room: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  flipped?: boolean | null;
  variant?: string | null;
};

export type HouseNote = {
  id: string;
  room: string;
  content: string;
  author_id: string;
  read_at: string | null;
};

interface AppaRoomProps {
  room: Room;
  sleeping: boolean;
  furniture: PlacedFurniture[];
  notes?: HouseNote[];
  onFloorClick?: (pctX: number) => void;
  onNoteClick?: (note: HouseNote) => void;
  onFurnitureClick?: (item: string) => void;
  children: ReactNode;
}



export function AppaRoom({
  room,
  sleeping,
  furniture,
  notes = [],
  onFloorClick,
  onNoteClick,
  onFurnitureClick,
  children,
}: AppaRoomProps) {
  const { couple } = useCouple();
  const roomNotes = notes.filter(n => n.room === room);
  const [currentThought, setCurrentThought] = useState<string | null>(null);
  const [heartsFx, setHeartsFx] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isLampOn, setIsLampOn] = useState(!sleeping);

  const thoughtsByRoom: Record<Room, string[]> = {
    sala: [
      '¡Qué rico piso para jugar!',
      `${couple.partner2}, te extraño mucho...`,
      `${couple.partner1} me prometió galletitas 🍪`,
      '¡Me encanta esta casa!',
    ],
    cocina: [
      'Mmm... ¿alguien va a cocinar?',
      'Tengo hambre de manzanitas 🍎',
      '¡Qué rico huele el café moka!',
      `¿Una merienda rica para los tres?`,
    ],
    dormitorio: [
      'Zzz... qué camita tan suave ☁️',
      'Un ratito más de siesta...',
      'Abrazos cálidos para hoy ❤️',
      'Soñando con volar por el cielo...',
    ],
    bano: [
      '¡Hora de la espuma y las burbujas! 🫧',
      'Quedé limpiecito y esponjoso ✨',
      'El agua calientita se siente tan bien...',
      '¡Miren qué limpio está todo!',
    ],
  };

  // Sincronizar lámpara al dormir o despertar
  useEffect(() => {
    setIsLampOn(!sleeping);
  }, [sleeping]);

  // Pensamientos periódicos de Appa
  useEffect(() => {
    if (sleeping) {
      setCurrentThought('Zzz... 💤');
      return;
    }

    const interval = setInterval(() => {
      const thoughts = thoughtsByRoom[room];
      const randomT = thoughts[Math.floor(Math.random() * thoughts.length)];
      setCurrentThought(randomT);
      setTimeout(() => setCurrentThought(null), 4500);
    }, 11000);

    return () => clearInterval(interval);
  }, [room, sleeping]);

  function handleRoomClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Si hace click en la zona de suelo (más del 50% hacia abajo)
    if (clickY >= 48 && onFloorClick) {
      const pctX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      onFloorClick(Math.max(15, Math.min(85, pctX)));
    }

    // Efecto de caricias y corazones
    soundFx.playChime(1.2);
    const newHeart = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setHeartsFx(h => [...h, newHeart]);
    setTimeout(() => {
      setHeartsFx(h => h.filter(item => item.id !== newHeart.id));
    }, 1200);
  }

  // Renderizador de muebles de lujo del catálogo
  function renderCatalogFurniture(item: (typeof furnitureCatalog)[number]) {
    switch (item.category) {
      case 'rug':
        return <CatalogRug tone={item.tone} />;
      case 'plant':
        return <CatalogPlant type={item.id} />;
      case 'picture':
        return <CatalogPicture type={item.id} />;
      case 'lamp':
        return <CatalogLamp type={item.id} />;
      case 'sofa':
        return <CatalogPlacedSofa tone={item.tone} />;
      default:
        return <span className="text-3xl drop-shadow-md">{item.emoji}</span>;
    }
  }

  return (
    <div
      onClick={handleRoomClick}
      className={`appa-room room-${room} ${sleeping ? 'room-night' : ''} relative select-none rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-200/50 dark:border-stone-800/60`}
      style={{ minHeight: '360px' }}
    >
      {/* 1. Pared arquitectónica con boiserie/azulejos */}
      <LuxuryRoomWall room={room} isNight={sleeping} />

      {/* 2. Suelo de parquet en espiga (Herringbone) de roble satinado */}
      <LuxuryHerringboneFloor isNight={sleeping} />

      {/* 3. Ventana colonial de arco con paisaje dinámico */}
      <LuxuryArchWindow isNight={sleeping} />

      {/* 4. Lámpara de techo Art Déco interactiva */}
      <LuxuryCeilingLamp
        isNight={sleeping}
        isLampOn={isLampOn}
        onToggle={() => {
          soundFx.playChime(1.3);
          setIsLampOn(!isLampOn);
        }}
      />

      {/* Haz de luz de la ventana con polvo dorado */}
      {!sleeping && isLampOn && (
        <div className="room-sunbeam pointer-events-none">
          {/* Motes de polvo dorado flotando en el rayo de luz */}
          <div className="absolute top-10 left-12 w-1.5 h-1.5 rounded-full bg-amber-200/80 animate-ping" />
          <div className="absolute top-24 left-24 w-1 h-1 rounded-full bg-yellow-100/90 animate-pulse" />
          <div className="absolute top-40 left-36 w-1.5 h-1.5 rounded-full bg-amber-100/70 animate-ping" />
        </div>
      )}

      {/* 5. Muebles arquitectónicos fijos por habitación (flanqueando a Appa) */}
      {room === 'sala' && (
        <>
          <LuxurySofa className="absolute bottom-6 right-6 z-2" />
          <LuxuryMonsteraPlant className="absolute bottom-12 right-1 z-3" />
        </>
      )}
      {room === 'dormitorio' && (
        <LuxuryBed className="absolute bottom-6 right-6 z-2" />
      )}
      {room === 'bano' && (
        <LuxuryBathtub className="absolute bottom-5 right-6 z-2" />
      )}
      {room === 'cocina' && (
        <LuxuryKitchenCounter className="absolute bottom-5 right-6 z-2" />
      )}

      {/* 6. Muebles comprados y colocados del catálogo */}
      {furniture
        .filter(f => f.room === room)
        .map(f => {
          const item = furnitureCatalog.find(i => i.id === f.item);
          if (!item) return null;
          const posX =
            f.pos_x ??
            (item.category === 'sofa'
              ? 72
              : item.category === 'plant'
              ? 86
              : item.category === 'lamp'
              ? 82
              : item.category === 'picture'
              ? 50
              : 50);
          const posY =
            f.pos_y ??
            (item.category === 'rug'
              ? 12
              : item.category === 'picture'
              ? 180
              : item.category === 'lamp'
              ? 60
              : 48);
          const isFlipped = f.flipped ?? false;

          return (
            <div
              key={f.item}
              title={`${item.label} (Toca para mover)`}
              aria-label={item.label}
              onClick={e => {
                e.stopPropagation();
                soundFx.playChime(1.1);
                onFurnitureClick?.(f.item);
              }}
              style={{
                left: `${posX}%`,
                bottom: `${posY}px`,
                transform: `translateX(-50%) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
                cursor: 'pointer',
                zIndex: item.category === 'rug' ? 1 : item.category === 'picture' ? 3 : 5,
              }}
              className="absolute transition-transform active:scale-95 hover:scale-105"
            >
              {renderCatalogFurniture(item)}
            </div>
          );
        })}

      {/* Globo de pensamiento de Appa */}
      {currentThought && (
        <div className="absolute top-12 right-12 z-20 max-w-[180px] bg-white/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 px-3.5 py-2 rounded-2xl shadow-2xl border border-rose-200/80 dark:border-rose-900/50 text-xs font-serif italic text-center animate-in fade-in zoom-in duration-300 backdrop-blur-sm">
          💭 {currentThought}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white dark:bg-stone-900 rotate-45 border-r border-b border-rose-200/80" />
        </div>
      )}

      {/* Corazones flotantes al hacer caricias en la habitación */}
      {heartsFx.map(h => (
        <div
          key={h.id}
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping text-rose-500"
        >
          <Heart className="w-6 h-6 fill-rose-400" />
        </div>
      ))}

      {/* Notas sorpresa (Post-its) dejadas en la habitación */}
      {roomNotes.map((note, index) => (
        <div
          key={note.id}
          onClick={e => {
            e.stopPropagation();
            soundFx.playChime(1.2);
            onNoteClick?.(note);
          }}
          style={{
            top: `${26 + index * 26}px`,
            left: `${20 + index * 20}%`,
          }}
          className={`room-postit animate-bounce ${!note.read_at ? 'ring-2 ring-primary ring-offset-1' : 'opacity-85'}`}
          title="Toca para leer esta nota sorpresa"
        >
          <div className="font-serif text-[11px] font-bold text-amber-950 line-clamp-2 leading-tight">
            📌 «{note.content}»
          </div>
          <span className="mt-0.5 block text-[9px] font-mono text-amber-800">
            {note.read_at ? '✓ Leída' : '¡Nueva nota!'}
          </span>
        </div>
      ))}

      {/* Appa vivo interactivo (Pou Physics, ojos, comida, baño) */}
      {children}
    </div>
  );
}
