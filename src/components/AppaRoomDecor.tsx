import React, { useState } from 'react';

/**
 * High-End 2.5D Architectural Room Diorama & Furniture System for Appa
 * Professional AAA Mobile Game Level Quality (Pou HD / Animal Crossing / Monument Valley aesthetic)
 * Handcrafted volumetric SVG with radial lighting, ambient occlusion, textures, and specular reflections.
 */

// ==========================================
// 1. PISO DE PARQUET EN ESPIGA (HERRINGBONE)
// ==========================================
export function LuxuryHerringboneFloor({ isNight = false }: { isNight?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[40%] overflow-hidden pointer-events-none z-0">
      <svg
        viewBox="0 0 600 160"
        preserveAspectRatio="none"
        className="w-full h-full"
        role="img"
        aria-label="Piso de parquet de roble satinado"
      >
        <defs>
          {/* Degradado general de perspectiva y sombra de contacto contra la pared */}
          <linearGradient id="floor-perspective" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#0c0e18' : '#3E2312'} stopOpacity="0.85" />
            <stop offset="8%" stopColor={isNight ? '#151724' : '#5E381E'} />
            <stop offset="35%" stopColor={isNight ? '#1E2132' : '#8A532B'} />
            <stop offset="70%" stopColor={isNight ? '#25293E' : '#A46838'} />
            <stop offset="100%" stopColor={isNight ? '#181B29' : '#7D4721'} />
          </linearGradient>

          {/* Brillo satinado tipo barniz reflejado en el parquet */}
          <radialGradient id="floor-satin-light" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isNight ? '0.04' : '0.18'} />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Vetas de tablones de roble individuales */}
          <linearGradient id="plank-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#2A2E44' : '#9C6235'} />
            <stop offset="100%" stopColor={isNight ? '#1A1C2C' : '#6E3F1D'} />
          </linearGradient>
          <linearGradient id="plank-b" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#323752' : '#B07342'} />
            <stop offset="100%" stopColor={isNight ? '#202334' : '#7D4721'} />
          </linearGradient>
          <linearGradient id="plank-c" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#24283B' : '#8F582E'} />
            <stop offset="100%" stopColor={isNight ? '#161826' : '#5E3416'} />
          </linearGradient>
        </defs>

        {/* Base del suelo con perspectiva */}
        <rect x="0" y="0" width="600" height="160" fill="url(#floor-perspective)" />

        {/* Patrón geométrico de espiga (Herringbone) con perspectiva */}
        <g opacity={isNight ? '0.35' : '0.55'} stroke={isNight ? '#0F101A' : '#3E200C'} strokeWidth="1">
          {Array.from({ length: 16 }).map((_, col) => {
            const x = col * 40 - 20;
            return (
              <g key={col}>
                {/* Tablón inclinado a la derecha */}
                <polygon points={`${x},0 ${x + 36},36 ${x + 24},48 ${x - 12},12`} fill="url(#plank-a)" />
                <polygon points={`${x},48 ${x + 36},84 ${x + 24},96 ${x - 12},60`} fill="url(#plank-b)" />
                <polygon points={`${x},96 ${x + 36},132 ${x + 24},144 ${x - 12},108`} fill="url(#plank-c)" />
                <polygon points={`${x},144 ${x + 36},180 ${x + 24},192 ${x - 12},156`} fill="url(#plank-a)" />

                {/* Tablón inclinado a la izquierda formando la espiga */}
                <polygon points={`${x + 36},36 ${x + 72},0 ${x + 84},12 ${x + 48},48`} fill="url(#plank-b)" />
                <polygon points={`${x + 36},84 ${x + 72},48 ${x + 84},60 ${x + 48},96`} fill="url(#plank-c)" />
                <polygon points={`${x + 36},132 ${x + 72},96 ${x + 84},108 ${x + 48},144`} fill="url(#plank-a)" />
              </g>
            );
          })}
        </g>

        {/* Reflejo satinado en el centro del suelo */}
        <rect x="0" y="0" width="600" height="160" fill="url(#floor-satin-light)" />

        {/* Zócalo / Rodapié de madera moldurada en la unión de pared y suelo */}
        <rect x="0" y="0" width="600" height="7" fill={isNight ? '#161926' : '#573319'} />
        <rect x="0" y="7" width="600" height="3" fill={isNight ? '#0b0c13' : '#301A0B'} opacity="0.8" />
        <line x1="0" y1="1" x2="600" y2="1" stroke={isNight ? '#2A2E44' : '#8A532B'} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ==========================================
// 2. PAREDES ARQUITECTÓNICAS CON BOISERIE
// ==========================================
export function LuxuryRoomWall({
  room,
  isNight = false,
}: {
  room: 'sala' | 'cocina' | 'dormitorio' | 'bano';
  isNight?: boolean;
}) {
  // Paletas arquitectónicas de lujo por habitación
  const palettes = {
    sala: {
      top: isNight ? '#141724' : '#F2ECE4',
      bottom: isNight ? '#10121C' : '#E5DDD3',
      panel: isNight ? '#181C2B' : '#EFEAE0',
      mold: isNight ? '#0E1019' : '#D4C9BC',
      highlight: isNight ? '#2B314C' : '#FFFFFF',
    },
    cocina: {
      top: isNight ? '#191520' : '#FCE8E6',
      bottom: isNight ? '#13101A' : '#F7D6D3',
      panel: isNight ? '#211B2B' : '#FDF0EF',
      mold: isNight ? '#0E0C14' : '#ECC0BC',
      highlight: isNight ? '#352D45' : '#FFFFFF',
    },
    dormitorio: {
      top: isNight ? '#111528' : '#EAE6EE',
      bottom: isNight ? '#0D1020' : '#DCD6E3',
      panel: isNight ? '#161B33' : '#F3EFF7',
      mold: isNight ? '#090B17' : '#CCC4D5',
      highlight: isNight ? '#28315C' : '#FFFFFF',
    },
    bano: {
      top: isNight ? '#0F1A24' : '#E2F0EC',
      bottom: isNight ? '#0B131B' : '#D0E4DE',
      panel: isNight ? '#142330' : '#ECF7F3',
      mold: isNight ? '#080E14' : '#BDD6CE',
      highlight: isNight ? '#223B52' : '#FFFFFF',
    },
  };

  const p = palettes[room];

  return (
    <div className="absolute inset-0 h-[65%] overflow-hidden pointer-events-none z-0">
      <svg
        viewBox="0 0 600 240"
        preserveAspectRatio="none"
        className="w-full h-full"
        role="img"
        aria-label="Paredes con molduras boiserie"
      >
        <defs>
          <linearGradient id={`wall-grad-${room}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={p.top} />
            <stop offset="100%" stopColor={p.bottom} />
          </linearGradient>

          {/* Sombra ambiental de las esquinas (Ambient Occlusion) */}
          <linearGradient id="corner-shadow-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isNight ? '0.45' : '0.18'} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="corner-shadow-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isNight ? '0.45' : '0.18'} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Sombra bajo la cornisa superior del techo */}
          <linearGradient id="ceiling-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={isNight ? '0.5' : '0.2'} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fondo general de la pared */}
        <rect x="0" y="0" width="600" height="240" fill={`url(#wall-grad-${room})`} />

        {/* Molduras clásicas de pared francesa (Boiserie / Paneling) */}
        {room !== 'cocina' && room !== 'bano' && (
          <g opacity={isNight ? '0.4' : '0.85'}>
            {[18, 140, 260, 380, 500].map((xOffset, i) => (
              <g key={i}>
                {/* Panel superior */}
                <rect
                  x={xOffset}
                  y="24"
                  width="85"
                  height="95"
                  rx="4"
                  fill={p.panel}
                  stroke={p.mold}
                  strokeWidth="2"
                />
                <rect
                  x={xOffset + 6}
                  y="30"
                  width="73"
                  height="83"
                  rx="3"
                  fill="none"
                  stroke={p.highlight}
                  strokeWidth="1.2"
                  opacity="0.6"
                />

                {/* Panel inferior (dado de pared) */}
                <rect
                  x={xOffset}
                  y="136"
                  width="85"
                  height="72"
                  rx="4"
                  fill={p.panel}
                  stroke={p.mold}
                  strokeWidth="2"
                />
                <rect
                  x={xOffset + 6}
                  y="142"
                  width="73"
                  height="60"
                  rx="3"
                  fill="none"
                  stroke={p.highlight}
                  strokeWidth="1.2"
                  opacity="0.6"
                />
              </g>
            ))}
          </g>
        )}

        {/* En la cocina: Azulejos biselados tipo Metro (Subway Tiles) */}
        {room === 'cocina' && (
          <g opacity={isNight ? '0.25' : '0.55'} stroke={isNight ? '#0b0c14' : '#E8B4B0'} strokeWidth="1">
            {Array.from({ length: 9 }).map((_, r) => {
              const y = 30 + r * 22;
              const shift = (r % 2) * 24;
              return Array.from({ length: 14 }).map((__, c) => {
                const x = c * 48 - shift;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x}
                    y={y}
                    width="46"
                    height="20"
                    rx="2"
                    fill={isNight ? '#1E1828' : '#FFF5F4'}
                  />
                );
              });
            })}
          </g>
        )}

        {/* En el baño: Mármol blanco y azulejos con veta */}
        {room === 'bano' && (
          <g opacity={isNight ? '0.3' : '0.5'}>
            {Array.from({ length: 7 }).map((_, r) => {
              const y = 32 + r * 28;
              return (
                <line
                  key={r}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke={isNight ? '#0a121a' : '#C4DED7'}
                  strokeWidth="1.5"
                />
              );
            })}
            {Array.from({ length: 11 }).map((_, c) => {
              const x = c * 56;
              return (
                <line
                  key={c}
                  x1={x}
                  y1="32"
                  x2={x}
                  y2="230"
                  stroke={isNight ? '#0a121a' : '#C4DED7'}
                  strokeWidth="1.5"
                />
              );
            })}
          </g>
        )}

        {/* Sombra de la esquina izquierda (profundidad 3D) */}
        <rect x="0" y="0" width="55" height="240" fill="url(#corner-shadow-left)" />
        {/* Sombra de la esquina derecha (profundidad 3D) */}
        <rect x="545" y="0" width="55" height="240" fill="url(#corner-shadow-right)" />

        {/* Cornisa superior de techo con moldura */}
        <rect x="0" y="0" width="600" height="14" fill={isNight ? '#0E111D' : '#FFFFFF'} />
        <line x1="0" y1="14" x2="600" y2="14" stroke={isNight ? '#1B2035' : '#D1C7BA'} strokeWidth="2" />
        <rect x="0" y="14" width="600" height="22" fill="url(#ceiling-shadow)" />
      </svg>
    </div>
  );
}

// ==========================================
// 3. LÁMPARA COLGANTE DE TECHO (INTERACTIVA)
// ==========================================
export function LuxuryCeilingLamp({
  isNight = false,
  isLampOn = true,
  onToggle,
}: {
  isNight?: boolean;
  isLampOn?: boolean;
  onToggle?: () => void;
}) {
  return (
    <>
      {/* Cono de luz cálida proyectado por la lámpara */}
      {isLampOn && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[340px] pointer-events-none z-1"
          style={{
            background: isNight
              ? 'radial-gradient(ellipse at 50% 12%, rgba(254, 240, 138, 0.28) 0%, rgba(251, 191, 36, 0.12) 40%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 12%, rgba(255, 253, 235, 0.35) 0%, rgba(253, 230, 138, 0.1) 45%, transparent 75%)',
          }}
        />
      )}

      {/* Lámpara colgante Art Déco de latón dorado */}
      <div
        onClick={onToggle}
        title="Toca para encender/apagar la luz"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-28 cursor-pointer select-none z-10 transition-transform active:scale-95"
      >
        <svg viewBox="0 0 64 110" className="w-full h-full filter drop-shadow-md">
          <defs>
            <linearGradient id="brass-rod" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="50%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="shade-glass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isLampOn ? '#FEF08A' : '#E2E8F0'} />
              <stop offset="60%" stopColor={isLampOn ? '#FBBF24' : '#CBD5E1'} />
              <stop offset="100%" stopColor={isLampOn ? '#F59E0B' : '#94A3B8'} />
            </linearGradient>
          </defs>

          {/* Plafón de fijación al techo */}
          <rect x="26" y="0" width="12" height="6" rx="2" fill="url(#brass-rod)" />

          {/* Varilla de latón */}
          <line x1="32" y1="6" x2="32" y2="46" stroke="url(#brass-rod)" strokeWidth="3" />

          {/* Cúpula de latón superior */}
          <path d="M22 46 C22 40, 42 40, 42 46 Z" fill="url(#brass-rod)" />

          {/* Pantalla acampanada de vidrio opalino */}
          <path
            d="M24 48 C16 66, 8 76, 4 82 C20 86, 44 86, 60 82 C56 76, 48 66, 40 48 Z"
            fill="url(#shade-glass)"
            stroke="#F59E0B"
            strokeWidth="1.2"
          />

          {/* Bombilla interior incandescente / resplandor */}
          {isLampOn && (
            <>
              <ellipse cx="32" cy="80" rx="14" ry="7" fill="#FFFFFF" opacity="0.9" filter="drop-shadow(0 0 8px #FDE047)" />
              <circle cx="32" cy="78" r="5" fill="#FFFBEB" />
            </>
          )}

          {/* Detalle de borla decorativa inferior */}
          <circle cx="32" cy="86" r="2.5" fill="url(#brass-rod)" />
        </svg>
      </div>
    </>
  );
}

// ==========================================
// 4. VENTANA COLONIAL DE ARCO CON CIELO VIVO
// ==========================================
export function LuxuryArchWindow({
  isNight = false,
  isSunset = false,
}: {
  isNight?: boolean;
  isSunset?: boolean;
}) {
  const [curtainsOpen, setCurtainsOpen] = useState(true);

  return (
    <div
      onClick={() => setCurtainsOpen(!curtainsOpen)}
      title="Toca para correr las cortinas de lino"
      className="absolute top-5 left-6 w-24 h-36 select-none cursor-pointer filter drop-shadow-xl z-2"
    >
      <svg viewBox="0 0 100 144" className="w-full h-full" role="img" aria-label="Ventana de arco con paisaje">
        <defs>
          {/* Degradado del cielo exterior dinámico */}
          <linearGradient id="outdoor-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            {isNight ? (
              <>
                <stop offset="0%" stopColor="#0B132B" />
                <stop offset="50%" stopColor="#1C2541" />
                <stop offset="100%" stopColor="#3A506B" />
              </>
            ) : isSunset ? (
              <>
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </>
            )}
          </linearGradient>

          {/* Marco exterior de madera laqueada en blanco */}
          <linearGradient id="window-frame-wood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Brillo de vidrio */}
          <linearGradient id="glass-specular" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Repisa y moldura exterior de la ventana */}
        <rect x="2" y="134" width="96" height="8" rx="2" fill="url(#window-frame-wood)" stroke="#94A3B8" strokeWidth="1" />

        {/* Marco de arco colonial */}
        <path
          d="M8 134 L8 48 C8 16, 92 16, 92 48 L92 134 Z"
          fill="url(#window-frame-wood)"
          stroke="#94A3B8"
          strokeWidth="2.5"
        />

        {/* Vidrio con el cielo de afuera */}
        <path
          d="M15 132 L15 48 C15 25, 85 25, 85 48 L85 132 Z"
          fill="url(#outdoor-sky)"
        />

        {/* Paisaje exterior: Montañas lejanas con bruma */}
        <path
          d="M15 110 Q40 96 60 106 Q80 114 85 108 L85 132 L15 132 Z"
          fill={isNight ? '#090e1e' : '#A7F3D0'}
          opacity={isNight ? '0.7' : '0.4'}
        />

        {/* Astro en la ventana (Sol o Luna brillante con estrellas) */}
        {isNight ? (
          <g>
            <circle cx="34" cy="46" r="1" fill="#FFFFFF" opacity="0.9" />
            <circle cx="68" cy="40" r="1.2" fill="#FFFFFF" opacity="0.8" />
            <circle cx="76" cy="62" r="0.8" fill="#FFFFFF" opacity="0.7" />
            <circle cx="28" cy="74" r="1" fill="#FFFFFF" opacity="0.9" />
            {/* Luna creciente dorada */}
            <path
              d="M52 40 A10 10 0 0 0 62 58 A12 12 0 1 1 52 40"
              fill="#FEF08A"
              filter="drop-shadow(0 0 5px #FDE047)"
            />
          </g>
        ) : (
          <g>
            {/* Sol radiante */}
            <circle cx="50" cy="46" r="9" fill="#FDE047" filter="drop-shadow(0 0 8px #F59E0B)" />
            {/* Nube blanca esponjosa flotante */}
            <path
              d="M26 68 Q34 60 42 66 Q52 62 58 68 Q64 74 58 78 L26 78 Z"
              fill="#FFFFFF"
              opacity="0.85"
            />
          </g>
        )}

        {/* Reflejo diagonal en el cristal de la ventana */}
        <polygon points="15,48 40,48 15,110" fill="url(#glass-specular)" />
        <polygon points="50,48 75,48 15,132 15,120" fill="url(#glass-specular)" />

        {/* Parteluces de madera que dividen los cristales */}
        <line x1="50" y1="26" x2="50" y2="132" stroke="url(#window-frame-wood)" strokeWidth="3.5" />
        <line x1="15" y1="62" x2="85" y2="62" stroke="url(#window-frame-wood)" strokeWidth="2.5" />
        <line x1="15" y1="96" x2="85" y2="96" stroke="url(#window-frame-wood)" strokeWidth="2.5" />

        {/* Barra superior de las cortinas con remates de latón */}
        <rect x="0" y="20" width="100" height="4" rx="1.5" fill="#D97706" />
        <circle cx="2" cy="22" r="3" fill="#F59E0B" />
        <circle cx="98" cy="22" r="3" fill="#F59E0B" />

        {/* Cortinas de lino translúcido con caídas suaves */}
        <g opacity="0.85" style={{ transition: 'transform 0.4s ease' }}>
          {/* Cortina izquierda */}
          <path
            d={
              curtainsOpen
                ? 'M4 24 Q18 36 12 78 Q18 116 8 136 L4 136 Z'
                : 'M4 24 Q30 36 26 78 Q32 116 28 136 L4 136 Z'
            }
            fill="#FEF3C7"
            stroke="#FDE68A"
            strokeWidth="1"
          />
          {/* Cortina derecha */}
          <path
            d={
              curtainsOpen
                ? 'M96 24 Q82 36 88 78 Q82 116 92 136 L96 136 Z'
                : 'M96 24 Q70 36 74 78 Q68 116 72 136 L96 136 Z'
            }
            fill="#FEF3C7"
            stroke="#FDE68A"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// 5. SOFÁ CHESTERFIELD DE TERCIOPELO (SALA)
// ==========================================
export function LuxurySofa({ className = '' }: { className?: string }) {
  return (
    <div className={`relative filter drop-shadow-2xl select-none pointer-events-none ${className}`}>
      <svg viewBox="0 0 170 95" className="w-44 h-26" role="img" aria-label="Sofá Chesterfield de terciopelo">
        <defs>
          <linearGradient id="sofa-velvet-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BE185D" />
            <stop offset="35%" stopColor="#9D174D" />
            <stop offset="85%" stopColor="#831843" />
            <stop offset="100%" stopColor="#500724" />
          </linearGradient>
          <linearGradient id="sofa-cushion-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="25%" stopColor="#DB2777" />
            <stop offset="75%" stopColor="#BE185D" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
          <linearGradient id="turned-wood-leg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="45%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          {/* Sombra de contacto bajo el sofá */}
          <radialGradient id="sofa-ground-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sombra de contacto en el piso */}
        <ellipse cx="85" cy="89" rx="78" ry="6" fill="url(#sofa-ground-shadow)" />

        {/* Patas de madera torneada */}
        <polygon points="20,74 26,74 23,88 17,88" fill="url(#turned-wood-leg)" />
        <polygon points="144,74 150,74 153,88 147,88" fill="url(#turned-wood-leg)" />
        <polygon points="82,74 88,74 86,87 84,87" fill="url(#turned-wood-leg)" />

        {/* Respaldo curvado con acolchado capitoné */}
        <path
          d="M14 30 C14 12, 156 12, 156 30 C162 40, 162 64, 156 70 L14 70 C8 64, 8 40, 14 30 Z"
          fill="url(#sofa-velvet-dark)"
        />

        {/* Botones y rombos de costura capitoné */}
        <g opacity="0.65">
          <circle cx="36" cy="30" r="2.8" fill="#4C0519" />
          <circle cx="68" cy="30" r="2.8" fill="#4C0519" />
          <circle cx="102" cy="30" r="2.8" fill="#4C0519" />
          <circle cx="134" cy="30" r="2.8" fill="#4C0519" />
          <circle cx="52" cy="42" r="2.8" fill="#4C0519" />
          <circle cx="85" cy="42" r="2.8" fill="#4C0519" />
          <circle cx="118" cy="42" r="2.8" fill="#4C0519" />
          <path
            d="M36 30 L52 42 L68 30 L85 42 L102 30 L118 42 L134 30"
            stroke="#500724"
            strokeWidth="1.2"
            fill="none"
          />
        </g>

        {/* Reposabrazos enrollados acolchados */}
        <ellipse cx="16" cy="50" rx="11" ry="17" fill="url(#sofa-velvet-dark)" />
        <ellipse cx="154" cy="50" rx="11" ry="17" fill="url(#sofa-velvet-dark)" />
        {/* Espiral decorativa del reposabrazos */}
        <circle cx="16" cy="44" r="5" fill="#DB2777" opacity="0.6" />
        <circle cx="154" cy="44" r="5" fill="#DB2777" opacity="0.6" />

        {/* Cojines mullidos con costura y ribete */}
        <rect x="25" y="50" width="57" height="23" rx="7" fill="url(#sofa-cushion-gloss)" />
        <rect x="88" y="50" width="57" height="23" rx="7" fill="url(#sofa-cushion-gloss)" />
        <line x1="27" y1="60" x2="80" y2="60" stroke="#FCE7F3" strokeWidth="1" opacity="0.5" />
        <line x1="90" y1="60" x2="143" y2="60" stroke="#FCE7F3" strokeWidth="1" opacity="0.5" />

        {/* Cojín decorativo de seda dorado */}
        <g transform="translate(122, 42) rotate(12)">
          <rect x="0" y="0" width="22" height="22" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <circle cx="11" cy="11" r="2" fill="#78350F" />
        </g>
      </svg>
    </div>
  );
}

// ==========================================
// 6. CAMA DE MADERA CON EDREDÓN DE PLUMAS (DORMITORIO)
// ==========================================
export function LuxuryBed({ className = '' }: { className?: string }) {
  return (
    <div className={`relative filter drop-shadow-2xl select-none pointer-events-none ${className}`}>
      <svg viewBox="0 0 176 100" className="w-48 h-28" role="img" aria-label="Cama king con edredón de plumas">
        <defs>
          <linearGradient id="headboard-wood-3d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="45%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="bed-duvet-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0F9FF" />
            <stop offset="35%" stopColor="#BAE6FD" />
            <stop offset="80%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <radialGradient id="pillow-cloud" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>
        </defs>

        {/* Sombra proyectada en el suelo */}
        <ellipse cx="88" cy="94" rx="82" ry="6" fill="#000000" opacity="0.4" />

        {/* Patas de madera noble */}
        <rect x="14" y="74" width="9" height="20" rx="3" fill="#451A03" />
        <rect x="153" y="74" width="9" height="20" rx="3" fill="#451A03" />

        {/* Cabecero con moldura clásica y panel tapizado */}
        <path
          d="M12 56 L12 18 C12 10, 24 6, 88 6 C152 6, 164 10, 164 18 L164 56 Z"
          fill="url(#headboard-wood-3d)"
        />
        <rect x="20" y="14" width="136" height="38" rx="8" fill="#FCE7F3" opacity="0.88" />
        <path d="M26 26 L150 26 M26 38 L150 38" stroke="#F472B6" strokeWidth="1" opacity="0.45" />

        {/* Almohadas mullidas king size */}
        <ellipse cx="48" cy="44" rx="28" ry="13" fill="url(#pillow-cloud)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))" />
        <ellipse cx="128" cy="44" rx="28" ry="13" fill="url(#pillow-cloud)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))" />

        {/* Edredón de plumas voluminoso con pliegues realistas */}
        <path
          d="M14 52 C34 49, 142 49, 162 52 C168 58, 168 78, 162 82 C142 84, 34 84, 14 82 C8 78, 8 58, 14 52 Z"
          fill="url(#bed-duvet-grad)"
        />

        {/* Doblez de la sábana blanca impecable arriba */}
        <path
          d="M16 52 C34 48, 142 48, 160 52 L158 59 C142 55, 34 55, 18 59 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />

        {/* Manta tejida a los pies de la cama */}
        <path
          d="M16 72 C40 70, 136 70, 160 72 L159 82 C136 84, 40 84, 17 82 Z"
          fill="#F472B6"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

// ==========================================
// 7. BAÑERA VICTORIANA DE PATAS DE GARRA (BAÑO)
// ==========================================
export function LuxuryBathtub({ className = '' }: { className?: string }) {
  return (
    <div className={`relative filter drop-shadow-2xl select-none pointer-events-none ${className}`}>
      <svg viewBox="0 0 176 96" className="w-48 h-26" role="img" aria-label="Bañera victoriana de porcelana">
        <defs>
          <linearGradient id="tub-porcelain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="tub-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="tub-water" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="60%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Sombra en el suelo */}
        <ellipse cx="88" cy="90" rx="80" ry="6" fill="#000000" opacity="0.35" />

        {/* Patas de garra de león doradas de latón pulido */}
        <path d="M24 72 C20 80 18 86 26 89 C30 89 30 82 28 72 Z" fill="url(#tub-gold)" />
        <path d="M152 72 C156 80 158 86 150 89 C146 89 146 82 148 72 Z" fill="url(#tub-gold)" />

        {/* Grifo victoriano vintage dorado con caño cuello de cisne */}
        <g transform="translate(146, 8)">
          <path d="M0 26 L0 8 C0 2, -12 2, -12 6" stroke="url(#tub-gold)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="3" cy="18" r="3.5" fill="#D97706" />
          <circle cx="-5" cy="18" r="3.5" fill="#D97706" />
        </g>

        {/* Cuerpo curvo de porcelana blanca brillante */}
        <path
          d="M14 30 C10 30, 6 40, 10 52 C16 70, 32 76, 88 76 C144 76, 160 70, 166 52 C170 40, 166 30, 162 30 Z"
          fill="url(#tub-porcelain)"
        />

        {/* Borde exterior biselado */}
        <ellipse cx="88" cy="30" rx="76" ry="11" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

        {/* Agua turquesa templada */}
        <ellipse cx="88" cy="32" rx="68" ry="9" fill="url(#tub-water)" />

        {/* Burbujitas de jabón flotando */}
        <circle cx="50" cy="32" r="3.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="60" cy="30" r="5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="70" cy="33" r="2.8" fill="#FFFFFF" opacity="0.85" />
        <circle cx="122" cy="31" r="4.5" fill="#FFFFFF" opacity="0.85" />
        <circle cx="132" cy="33" r="3.2" fill="#FFFFFF" opacity="0.75" />

        {/* Reflejo brillante de luz en la porcelana */}
        <path d="M22 46 C28 60, 46 68, 88 68" stroke="#FFFFFF" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ==========================================
// 8. ENCIMERA DE MÁRMOL CON CAFETERA (COCINA)
// ==========================================
export function LuxuryKitchenCounter({ className = '' }: { className?: string }) {
  return (
    <div className={`relative filter drop-shadow-2xl select-none pointer-events-none ${className}`}>
      <svg viewBox="0 0 176 90" className="w-48 h-24" role="img" aria-label="Isla de cocina con encimera de mármol Carrara">
        <defs>
          <linearGradient id="marble-carrara" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F1F5F9" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="kitchen-cabinet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="40%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
        </defs>

        {/* Sombra en el suelo */}
        <ellipse cx="88" cy="86" rx="82" ry="5" fill="#000000" opacity="0.35" />

        {/* Cafetera italiana Bialetti moka con vapor */}
        <g transform="translate(136, 12)">
          <polygon points="6,24 16,24 18,14 4,14" fill="#94A3B8" />
          <polygon points="4,14 18,14 16,4 6,4" fill="#64748B" />
          <line x1="16" y1="8" x2="22" y2="18" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          {/* Volutas de vapor aromático */}
          <path d="M10 2 Q7 -4 13 -8 Q17 -12 11 -16" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.65" className="animate-pulse" />
        </g>

        {/* Tazón de frutas frescas */}
        <g transform="translate(32, 18)">
          <ellipse cx="14" cy="18" rx="15" ry="6" fill="#F59E0B" />
          <circle cx="8" cy="14" r="4.5" fill="#EF4444" />
          <circle cx="16" cy="13" r="5" fill="#22C55E" />
          <circle cx="21" cy="15" r="4" fill="#EAB308" />
        </g>

        {/* Encimera gruesa de mármol Carrara blanco con bisel */}
        <rect x="8" y="34" width="160" height="11" rx="3" fill="url(#marble-carrara)" stroke="#CBD5E1" strokeWidth="1" />
        {/* Veta gris del mármol */}
        <path d="M22 38 Q50 42 75 36 Q115 40 150 37" stroke="#94A3B8" strokeWidth="0.8" fill="none" opacity="0.5" />

        {/* Muebles inferiores con cuarterones y tiradores dorados */}
        <rect x="12" y="45" width="152" height="39" rx="4" fill="url(#kitchen-cabinet)" />
        {/* Puertas */}
        <rect x="16" y="49" width="44" height="31" rx="3" fill="#BE185D" opacity="0.3" stroke="#FCE7F3" strokeWidth="1" />
        <circle cx="53" cy="64" r="2.2" fill="#F59E0B" />

        <rect x="66" y="49" width="44" height="14" rx="2" fill="#BE185D" opacity="0.3" stroke="#FCE7F3" strokeWidth="1" />
        <rect x="66" y="66" width="44" height="14" rx="2" fill="#BE185D" opacity="0.3" stroke="#FCE7F3" strokeWidth="1" />
        <line x1="84" y1="56" x2="92" y2="56" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="84" y1="73" x2="92" y2="73" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="116" y="49" width="44" height="31" rx="3" fill="#BE185D" opacity="0.3" stroke="#FCE7F3" strokeWidth="1" />
        <circle cx="122" cy="64" r="2.2" fill="#F59E0B" />
      </svg>
    </div>
  );
}

// ==========================================
// 9. PLANTA MONSTERA EN MACETA DE CERÁMICA (SALA)
// ==========================================
export function LuxuryMonsteraPlant({ className = '' }: { className?: string }) {
  return (
    <div className={`relative filter drop-shadow-xl select-none pointer-events-none ${className}`}>
      <svg viewBox="0 0 74 100" className="w-18 h-24" role="img" aria-label="Planta Monstera Deliciosa">
        <defs>
          <linearGradient id="terracotta-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>
          <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
        </defs>

        {/* Maceta cónica con plato */}
        <polygon points="18,65 56,65 50,95 24,95" fill="url(#terracotta-grad)" />
        <ellipse cx="37" cy="65" rx="19" ry="5" fill="#9A3412" />
        <ellipse cx="37" cy="95" rx="15" ry="3" fill="#7C2D12" />

        {/* Hojas grandes de Monstera con recortes botánicos */}
        <path d="M37 63 Q26 42 12 38 C8 46, 20 56, 35 61 Z" fill="url(#leaf-grad)" />
        <path d="M37 60 Q50 38 62 34 C66 42, 56 54, 39 58 Z" fill="url(#leaf-grad)" />
        <path d="M37 58 Q37 24 37 10 C46 18, 44 38, 38 56 Z" fill="url(#leaf-grad)" />
        <path d="M37 60 Q22 48 22 28 C30 30, 34 44, 37 56 Z" fill="url(#leaf-grad)" />
      </svg>
    </div>
  );
}

// ========================================================
// 10. MUEBLES DEL CATÁLOGO COMPRADOS (REEMPLAZO DE EMOJIS)
// ========================================================

// A. Alfombras de felpa tejida (rug_rose, rug_sky)
export function CatalogRug({ tone = 'rose' }: { tone?: string }) {
  const isSky = tone === 'sky';
  const mainColor = isSky ? '#38BDF8' : '#F472B6';
  const lightColor = isSky ? '#E0F2FE' : '#FDF2F8';
  const darkColor = isSky ? '#0284C7' : '#DB2777';

  return (
    <div className="w-40 h-16 filter drop-shadow-md select-none pointer-events-none">
      <svg viewBox="0 0 160 64" className="w-full h-full">
        {/* Sombra de la alfombra */}
        <ellipse cx="80" cy="34" rx="76" ry="24" fill="#000000" opacity="0.25" />

        {/* Base de la alfombra con textura tejida */}
        <ellipse cx="80" cy="32" rx="74" ry="22" fill={mainColor} />
        <ellipse cx="80" cy="32" rx="66" ry="18" fill={lightColor} opacity="0.85" />
        <ellipse cx="80" cy="32" rx="54" ry="14" fill={mainColor} opacity="0.4" />

        {/* Flecos decorativos en los bordes */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`l-${i}`}
            x1={6 + i * 4}
            y1={30 + (i % 2) * 4}
            x2={3 + i * 4}
            y2={34 + (i % 2) * 4}
            stroke={darkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`r-${i}`}
            x1={108 + i * 4}
            y1={30 + (i % 2) * 4}
            x2={111 + i * 4}
            y2={34 + (i % 2) * 4}
            stroke={darkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}

// B. Plantas botánicas (plant_lily, plant_fern)
export function CatalogPlant({ type = 'plant_lily' }: { type?: string }) {
  const isFern = type === 'plant_fern';

  return (
    <div className="w-20 h-28 filter drop-shadow-lg select-none pointer-events-none">
      <svg viewBox="0 0 80 110" className="w-full h-full">
        <defs>
          <linearGradient id="pot-ceramic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* Maceta acanalada de cerámica blanca */}
        <polygon points="24,70 56,70 51,102 29,102" fill="url(#pot-ceramic)" />
        <ellipse cx="40" cy="70" rx="16" ry="4" fill="#CBD5E1" />

        {isFern ? (
          // Helecho frondoso
          <g>
            <path d="M40 70 Q25 45 12 40" stroke="#15803D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M40 70 Q55 45 68 40" stroke="#15803D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M40 70 Q40 35 40 16" stroke="#16A34A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="12" cy="40" r="4" fill="#4ADE80" />
            <circle cx="68" cy="40" r="4" fill="#4ADE80" />
            <circle cx="40" cy="16" r="4" fill="#86EFAC" />
          </g>
        ) : (
          // Lirios con pétalos en flor
          <g>
            <path d="M40 70 Q35 40 28 28" stroke="#16A34A" strokeWidth="2.5" fill="none" />
            <path d="M40 70 Q45 42 54 32" stroke="#16A34A" strokeWidth="2.5" fill="none" />
            {/* Flor 1 */}
            <circle cx="28" cy="26" r="8" fill="#FCE7F3" stroke="#F472B6" strokeWidth="1.2" />
            <circle cx="28" cy="26" r="3" fill="#FBBF24" />
            {/* Flor 2 */}
            <circle cx="54" cy="30" r="9" fill="#FCE7F3" stroke="#F472B6" strokeWidth="1.2" />
            <circle cx="54" cy="30" r="3.5" fill="#FBBF24" />
          </g>
        )}
      </svg>
    </div>
  );
}

// C. Cuadros decorativos enmarcados en oro (picture_heart, picture_moon)
export function CatalogPicture({ type = 'picture_heart' }: { type?: string }) {
  const isMoon = type === 'picture_moon';

  return (
    <div className="w-18 h-22 filter drop-shadow-lg select-none pointer-events-none">
      <svg viewBox="0 0 70 85" className="w-full h-full">
        {/* Marco barroco dorado con moldura */}
        <rect x="4" y="4" width="62" height="77" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
        <rect x="8" y="8" width="54" height="69" rx="2" fill="#FDE68A" />
        {/* Lienzo interior */}
        <rect x="12" y="12" width="46" height="61" fill={isMoon ? '#0F172A' : '#FFF1F2'} />

        {isMoon ? (
          // Cuadro de Luna llena sobre el mar
          <g>
            <circle cx="35" cy="32" r="11" fill="#FEF08A" filter="drop-shadow(0 0 4px #FDE047)" />
            <circle cx="31" cy="30" r="2" fill="#E2E8F0" opacity="0.4" />
            <path d="M12 56 Q35 52 58 56 L58 73 L12 73 Z" fill="#1E293B" />
          </g>
        ) : (
          // Cuadro con Corazón de amor entrelazado
          <g transform="translate(35, 42)">
            <path
              d="M0 6 C-12 -10, -22 6, 0 22 C22 6, 12 -10, 0 6 Z"
              fill="#E11D48"
              filter="drop-shadow(0 2px 4px rgba(225,29,72,0.3))"
            />
          </g>
        )}
        {/* Brillo en el cristal del cuadro */}
        <polygon points="12,12 32,12 12,32" fill="#FFFFFF" opacity="0.4" />
      </svg>
    </div>
  );
}

// D. Lámparas de pie o mesa (lamp_star, lamp_flower)
export function CatalogLamp({ type = 'lamp_star' }: { type?: string }) {
  const isFlower = type === 'lamp_flower';

  return (
    <div className="w-16 h-28 filter drop-shadow-md select-none pointer-events-none">
      <svg viewBox="0 0 60 100" className="w-full h-full">
        {/* Base de latón */}
        <ellipse cx="30" cy="94" rx="14" ry="4" fill="#D97706" stroke="#92400E" strokeWidth="1" />
        <line x1="30" y1="94" x2="30" y2="40" stroke="#F59E0B" strokeWidth="3" />

        {/* Pantalla de la lámpara */}
        {isFlower ? (
          // Lámpara con forma de flor tulipán
          <g>
            <path d="M18 42 C16 24, 44 24, 42 42 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1.5" />
            <ellipse cx="30" cy="42" rx="12" ry="4" fill="#FCE7F3" />
            <circle cx="30" cy="36" r="5" fill="#FEF08A" filter="drop-shadow(0 0 6px #FBBF24)" />
          </g>
        ) : (
          // Lámpara con pantalla cónica de estrella
          <g>
            <polygon points="16,42 44,42 38,20 22,20" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
            <circle cx="30" cy="34" r="5" fill="#FEF08A" filter="drop-shadow(0 0 6px #FBBF24)" />
          </g>
        )}
      </svg>
    </div>
  );
}

// E. Sofás colocados del catálogo (sofa_rose, sofa_sky)
export function CatalogPlacedSofa({ tone = 'rose' }: { tone?: string }) {
  const isSky = tone === 'sky';
  const mainColor = isSky ? '#0284C7' : '#BE185D';
  const cushionColor = isSky ? '#38BDF8' : '#F472B6';

  return (
    <div className="w-36 h-22 filter drop-shadow-xl select-none pointer-events-none">
      <svg viewBox="0 0 140 85" className="w-full h-full">
        {/* Patas */}
        <polygon points="16,66 22,66 19,80 14,80" fill="#78350F" />
        <polygon points="118,66 124,66 127,80 122,80" fill="#78350F" />

        {/* Respaldo */}
        <rect x="12" y="22" width="116" height="46" rx="10" fill={mainColor} />

        {/* Cojines */}
        <rect x="18" y="42" width="48" height="24" rx="6" fill={cushionColor} />
        <rect x="74" y="42" width="48" height="24" rx="6" fill={cushionColor} />
      </svg>
    </div>
  );
}
