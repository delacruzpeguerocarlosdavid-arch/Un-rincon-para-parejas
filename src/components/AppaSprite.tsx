/** 
 * High-Definition 3D Shaded Appa Vector Model (Pou-Level Realism)
 * Features:
 * - Spherical 3D volumetric shading with radial lighting gradients
 * - Specular highlights & glossy glass eyes with real-time eye-tracking
 * - 3D beveled Air Nomad arrow with ambient occlusion
 * - Textured striated horns with specular rim lighting
 * - Soft fur tufts on cheeks and neck
 * - Spring squash & stretch harmonic elasticity
 * - Anticipation mouth with tongue and throat depth
 * - Vector accessories mapped with exact proportions
 */

export type AppaMood = 'happy' | 'idle' | 'hungry' | 'tired' | 'sleep' | 'eating' | 'petted' | 'anticipating' | 'tickle';

export interface AppaSpriteProps {
  mood: AppaMood;
  className?: string;
  pupilOffset?: { x: number; y: number }; // -1 to 1
  squash?: { scaleX: number; scaleY: number };
  mouthOpen?: number; // 0 to 1
  accessory?: string;
}

export function AppaSprite({
  mood,
  className = '',
  pupilOffset = { x: 0, y: 0 },
  squash = { scaleX: 1, scaleY: 1 },
  mouthOpen = 0,
  accessory,
}: AppaSpriteProps) {
  const sleeping = mood === 'sleep';
  const eyesClosed = sleeping || mood === 'petted' || mood === 'tickle';
  const happyEyes = mood === 'happy' || mood === 'petted' || mood === 'tickle';
  const isAnticipating = mood === 'anticipating' || mouthOpen > 0.1;

  // Clamped pupil offsets with natural parabolic curve
  const px = Math.max(-1, Math.min(1, pupilOffset.x)) * 4.2;
  const py = Math.max(-1, Math.min(1, pupilOffset.y)) * 3.5;

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{
        transform: `scale(${squash.scaleX}, ${squash.scaleY})`,
        transformOrigin: '50% 92%',
        transition: 'transform 0.08s cubic-bezier(0.2, 0.8, 0.4, 1)',
      }}
    >
      <svg
        viewBox="0 0 260 210"
        className={`appa-svg appa-m-${mood} w-full h-full filter drop-shadow-xl`}
        role="img"
        aria-label="Appa 3D"
      >
        <defs>
          {/* Sombra ambiental bajo el cuerpo */}
          <radialGradient id="shadow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2A1B12" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#2A1B12" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2A1B12" stopOpacity="0" />
          </radialGradient>

          {/* Pelaje 3D del cuerpo (iluminado arriba a la izquierda, sombreado abajo) */}
          <radialGradient id="fur-body-grad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="35%" stopColor="#F6EFE3" />
            <stop offset="75%" stopColor="#E5D9C7" />
            <stop offset="100%" stopColor="#CEBFAB" />
          </radialGradient>

          {/* Pelaje 3D de la cabeza (esfera con volumen y luz natural) */}
          <radialGradient id="fur-head-grad" cx="42%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#F9F3EA" />
            <stop offset="70%" stopColor="#E9DDCB" />
            <stop offset="100%" stopColor="#D4C3AE" />
          </radialGradient>

          {/* Flecha azul nómada con bisel 3D */}
          <linearGradient id="arrow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#90B7DE" />
            <stop offset="50%" stopColor="#6C97C5" />
            <stop offset="100%" stopColor="#5078A5" />
          </linearGradient>

          {/* Cuernos de Appa 3D con textura estriada y brillo */}
          <linearGradient id="horn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A8A096" />
            <stop offset="30%" stopColor="#7C7369" />
            <stop offset="70%" stopColor="#554D44" />
            <stop offset="100%" stopColor="#3C352E" />
          </linearGradient>

          {/* Ojos brillantes tipo cristal / Pou */}
          <radialGradient id="eye-lens-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3D3025" />
            <stop offset="60%" stopColor="#1E1610" />
            <stop offset="100%" stopColor="#0F0A06" />
          </radialGradient>

          {/* Hocico 3D con luz superior */}
          <radialGradient id="snout-grad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#EDE1D1" />
            <stop offset="65%" stopColor="#DACBB7" />
            <stop offset="100%" stopColor="#BFAD97" />
          </radialGradient>

          {/* Nariz húmeda con brillo */}
          <linearGradient id="nose-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#877D74" />
            <stop offset="60%" stopColor="#5E554D" />
            <stop offset="100%" stopColor="#3F3730" />
          </linearGradient>

          {/* Garganta profunda para cuando come */}
          <radialGradient id="mouth-depth" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#6B1D30" />
            <stop offset="75%" stopColor="#3A0A17" />
            <stop offset="100%" stopColor="#1F040C" />
          </radialGradient>

          {/* Filtro de sombra suave para extremidades */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. SOMBRA FÍSICA PROYECTADA EN EL PISO */}
        <ellipse cx="130" cy="192" rx="92" ry="10" fill="url(#shadow-grad)" />

        {/* 2. COLA ANCHA Y ESPONJOSA CON PELAJE */}
        <g className="appa-tail" style={{ transformOrigin: '200px 130px' }}>
          {/* Sombra de la cola */}
          <ellipse cx="220" cy="132" rx="34" ry="22" fill="#B3A594" opacity="0.4" />
          {/* Cola principal con volumen */}
          <ellipse cx="218" cy="130" rx="33" ry="21" fill="url(#snout-grad)" />
          {/* Franjas características de la cola */}
          <path d="M198 120 Q220 134 238 120" stroke="#7A6F62" strokeWidth="2.5" fill="none" opacity="0.65" strokeLinecap="round" />
          <path d="M202 136 Q222 148 240 134" stroke="#7A6F62" strokeWidth="2.5" fill="none" opacity="0.65" strokeLinecap="round" />
        </g>

        {/* 3. PATAS TRASERAS CON PEZUÑAS 3D */}
        <g className="appa-leg appa-leg-b" filter="url(#soft-shadow)">
          <rect x="160" y="148" width="26" height="38" rx="12" fill="#D8CAB7" />
          {/* Pezuña redonda con luz */}
          <ellipse cx="173" cy="184" rx="15" ry="7" fill="url(#horn-grad)" />
          <ellipse cx="173" cy="182" rx="11" ry="3.5" fill="#A8A096" opacity="0.4" />
        </g>
        <g className="appa-leg appa-leg-a" filter="url(#soft-shadow)">
          <rect x="180" y="144" width="24" height="38" rx="12" fill="url(#fur-body-grad)" />
          <ellipse cx="192" cy="180" rx="14" ry="7" fill="url(#horn-grad)" />
          <ellipse cx="192" cy="178" rx="10" ry="3.5" fill="#A8A096" opacity="0.4" />
        </g>

        {/* 4. CUERPO VOLUMÉTRICO ESFÉRICO CON FLECHA DORSAL */}
        <g className="appa-body">
          {/* Masa corporal principal con degradé 3D */}
          <ellipse cx="145" cy="116" rx="78" ry="56" fill="url(#fur-body-grad)" />

          {/* Flecha dorsal azul que recorre su lomo */}
          <path
            d="M148 68 L188 74 L208 118 L184 106 Z"
            fill="url(#arrow-grad)"
            opacity="0.95"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))"
          />

          {/* Patas delanteras con volumen y pezuñas */}
          <g className="appa-leg appa-leg-a" filter="url(#soft-shadow)">
            <rect x="74" y="144" width="26" height="40" rx="12" fill="url(#fur-body-grad)" />
            <ellipse cx="87" cy="182" rx="15" ry="7.5" fill="url(#horn-grad)" />
            <ellipse cx="87" cy="180" rx="11" ry="4" fill="#A8A096" opacity="0.5" />
          </g>
          <g className="appa-leg appa-leg-b" filter="url(#soft-shadow)">
            <rect x="106" y="148" width="26" height="38" rx="12" fill="#D8CAB7" />
            <ellipse cx="119" cy="184" rx="15" ry="7" fill="url(#horn-grad)" />
            <ellipse cx="119" cy="182" rx="11" ry="3.5" fill="#A8A096" opacity="0.4" />
          </g>

          {/* 5. CABEZA 3D, CUERNOS, OREJAS Y CARITA */}
          <g className="appa-head" style={{ transformOrigin: '88px 108px' }}>
            {/* Cuerno izquierdo (curvo hacia adelante con volumen 3D) */}
            <g className="appa-horn-l" style={{ transformOrigin: '54px 58px' }}>
              <path
                d="M52 64 C32 46 36 24 50 16 C48 36 56 48 68 54 Z"
                fill="url(#horn-grad)"
                filter="drop-shadow(0 3px 4px rgba(0,0,0,0.25))"
              />
              {/* Estrías del cuerno */}
              <path d="M44 32 Q49 38 54 36" stroke="#2C251F" strokeWidth="1.5" opacity="0.5" />
              <path d="M48 44 Q54 50 60 48" stroke="#2C251F" strokeWidth="1.5" opacity="0.5" />
            </g>

            {/* Cuerno derecho */}
            <g style={{ transformOrigin: '128px 58px' }}>
              <path
                d="M124 62 C136 46 134 30 124 22 C142 30 146 52 136 70 Z"
                fill="url(#horn-grad)"
                filter="drop-shadow(0 3px 4px rgba(0,0,0,0.25))"
              />
              <path d="M130 36 Q134 42 128 46" stroke="#2C251F" strokeWidth="1.5" opacity="0.5" />
              <path d="M134 48 Q138 54 132 58" stroke="#2C251F" strokeWidth="1.5" opacity="0.5" />
            </g>

            {/* Cabeza principal esférica con iluminación radial */}
            <ellipse cx="88" cy="94" rx="64" ry="52" fill="url(#fur-head-grad)" filter="url(#soft-shadow)" />

            {/* Mechoncitos de pelo en los cachetes (efecto peluche esponjoso) */}
            <path d="M24 96 Q14 102 26 108 Q16 114 30 118" fill="url(#fur-head-grad)" />
            <path d="M148 98 Q158 104 146 110 Q156 116 142 120" fill="url(#fur-head-grad)" />

            {/* Flecha nómada en la frente de Appa con bisel 3D */}
            <path
              d="M72 46 L104 46 L102 68 L118 68 L88 98 L58 68 L74 68 Z"
              fill="url(#arrow-grad)"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            />
            {/* Brillo en el borde superior de la flecha */}
            <path
              d="M72 47 L104 47 L102 69"
              stroke="#B3D4F5"
              strokeWidth="1.5"
              fill="none"
              opacity="0.8"
            />

            {/* Orejita izquierda esponjosa y móvil */}
            <g className="appa-ear" style={{ transformOrigin: '32px 102px' }}>
              <ellipse cx="24" cy="102" rx="16" ry="10" fill="url(#fur-head-grad)" />
              <ellipse cx="24" cy="102" rx="9" ry="6" fill="#F8B4C4" />
              <ellipse cx="23" cy="101" rx="6" ry="4" fill="#E88B9E" opacity="0.7" />
            </g>

            {/* Orejita derecha */}
            <g className="appa-ear appa-ear-r" style={{ transformOrigin: '144px 108px' }}>
              <ellipse cx="150" cy="110" rx="15" ry="9" fill="url(#fur-head-grad)" />
              <ellipse cx="150" cy="110" rx="8" ry="5" fill="#F8B4C4" />
              <ellipse cx="149" cy="109" rx="5" ry="3.5" fill="#E88B9E" opacity="0.7" />
            </g>

            {/* Hocico 3D y contorno de mejillas */}
            <ellipse cx="85" cy="116" rx="48" ry="26" fill="url(#snout-grad)" />

            {/* Mejillas sonrosadas con gradiente cálido */}
            <ellipse
              cx="46"
              cy="120"
              rx={mood === 'tickle' ? 12 : 9}
              ry={mood === 'tickle' ? 8 : 6}
              fill="#F472B6"
              opacity={mood === 'tickle' ? 0.85 : 0.45}
              className="transition-all duration-300"
            />
            <ellipse
              cx="122"
              cy="122"
              rx={mood === 'tickle' ? 12 : 9}
              ry={mood === 'tickle' ? 8 : 6}
              fill="#F472B6"
              opacity={mood === 'tickle' ? 0.85 : 0.45}
              className="transition-all duration-300"
            />

            {/* OJOS VIVOS CON SEGUIMIENTO DE DEDO Y BRILLO CRISTALINO */}
            {eyesClosed ? (
              /* Ojos felices cerrados en arco sonriente con pestañitas */
              <g>
                <path
                  d={happyEyes && !sleeping ? 'M54 102 Q62 94 70 102' : 'M54 101 Q62 107 70 101'}
                  stroke="#38291F"
                  strokeWidth="3.6"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={happyEyes && !sleeping ? 'M108 106 Q116 98 124 106' : 'M108 105 Q116 111 124 105'}
                  stroke="#38291F"
                  strokeWidth="3.6"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <g className="appa-eyes">
                {/* Cuenca y esclerótica del ojo izquierdo */}
                <ellipse cx="62" cy="101" rx="9" ry="9" fill="#FFFDF8" filter="drop-shadow(inset 0 1px 2px rgba(0,0,0,0.3))" />
                {/* Pupila de cristal 3D con tracking real */}
                <circle
                  cx={62 + px}
                  cy={101 + py}
                  r={isAnticipating ? 7.8 : 6.8}
                  fill="url(#eye-lens-grad)"
                />
                {/* Reflejos de luz especular en el ojo (efecto húmedo / Pou) */}
                <circle cx={62 + px - 2.2} cy={101 + py - 2.2} r="2.8" fill="#FFFFFF" />
                <circle cx={62 + px + 2} cy={101 + py + 2} r="1.2" fill="#FFFFFF" opacity="0.8" />

                {/* Cuenca y esclerótica del ojo derecho */}
                <ellipse cx="116" cy="105" rx="9" ry="9" fill="#FFFDF8" filter="drop-shadow(inset 0 1px 2px rgba(0,0,0,0.3))" />
                <circle
                  cx={116 + px}
                  cy={105 + py}
                  r={isAnticipating ? 7.8 : 6.8}
                  fill="url(#eye-lens-grad)"
                />
                <circle cx={116 + px - 2.2} cy={105 + py - 2.2} r="2.8" fill="#FFFFFF" />
                <circle cx={116 + px + 2} cy={105 + py + 2} r="1.2" fill="#FFFFFF" opacity="0.8" />

                {/* Párpado cansado */}
                {mood === 'tired' && (
                  <>
                    <rect x="52" y="93" width="18" height="8" fill="#DACBB7" rx="2" />
                    <rect x="106" y="97" width="18" height="8" fill="#DACBB7" rx="2" />
                  </>
                )}
                {/* Cejitas tristes cuando tiene hambre */}
                {mood === 'hungry' && (
                  <>
                    <path d="M54 90 L70 94" stroke="#3D3025" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M124 94 L108 98" stroke="#3D3025" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
              </g>
            )}

            {/* Nariz 3D brillante de bisonte con orificios nasales */}
            <ellipse cx="88" cy="116" rx="19" ry="10" fill="url(#nose-grad)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))" />
            <ellipse cx="88" cy="114" rx="14" ry="4" fill="#A89F96" opacity="0.45" />
            <circle cx="81" cy="117" r="2.2" fill="#221C16" />
            <circle cx="95" cy="117" r="2.2" fill="#221C16" />

            {/* BOCA DINÁMICA: ANTICIPACIÓN CON LENGUA, COMER O SONRISA */}
            <g className="appa-mouth" style={{ transformOrigin: '88px 132px' }}>
              {isAnticipating ? (
                /* Boca abierta 3D esperando comida estilo Pou */
                <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))">
                  {/* Hueco oscuro de la garganta */}
                  <ellipse cx="88" cy={133 + mouthOpen * 4} rx={12 + mouthOpen * 7} ry={8 + mouthOpen * 9} fill="url(#mouth-depth)" />
                  {/* Lengua rosada */}
                  <ellipse cx="88" cy={137 + mouthOpen * 6} rx={8 + mouthOpen * 5} ry={5 + mouthOpen * 3} fill="#FB7185" />
                  {/* Brillo en la lengua */}
                  <ellipse cx="88" cy={136 + mouthOpen * 6} rx={4} ry={2} fill="#FDA4AF" opacity="0.8" />
                </g>
              ) : mood === 'eating' ? (
                /* Masticando con cachetes inflados */
                <g>
                  <ellipse cx="88" cy="133" rx="12" ry="9" fill="url(#mouth-depth)" />
                  <ellipse cx="88" cy="135" rx="8" ry="4" fill="#FB7185" />
                </g>
              ) : mood === 'hungry' ? (
                <path d="M74 136 Q88 126 102 136" stroke="#4A3D34" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              ) : sleeping ? (
                <ellipse cx="88" cy="133" rx="4" ry="3" fill="#B5485D" className="appa-snore" />
              ) : (
                /* Sonrisa cálida y feliz */
                <path
                  d={happyEyes ? 'M72 127 Q88 146 104 127' : 'M76 129 Q88 138 100 129'}
                  stroke="#4A3D34"
                  strokeWidth="2.8"
                  fill={happyEyes ? '#BE185D' : 'none'}
                  strokeLinecap="round"
                />
              )}
            </g>
          </g>
        </g>

        {/* 6. ACCESORIOS MONTADOS CON PRECISIÓN VECTORIAL */}
        {accessory === 'corona_margaritas' && (
          <g transform="translate(48, 22) scale(0.72)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))">
            <text fontSize="44">🌼</text>
            <text x="36" y="-8" fontSize="38">🌼</text>
            <text x="74" y="2" fontSize="42">🌼</text>
          </g>
        )}
        {accessory === 'corona_lirios' && (
          <g transform="translate(46, 18) scale(0.75)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))">
            <text fontSize="42">🌸</text>
            <text x="34" y="-8" fontSize="44">🌺</text>
            <text x="72" y="2" fontSize="42">🌸</text>
          </g>
        )}
        {accessory === 'sombrero_paja' && (
          <g transform="translate(56, 12) scale(1.18)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))">
            <text fontSize="48">👒</text>
          </g>
        )}
        {accessory === 'gorro_dormir' && (
          <g transform="translate(62, 16) scale(1.12)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.2))">
            <text fontSize="46">💤</text>
          </g>
        )}
        {accessory === 'corona' && (
          <g transform="translate(64, 10) scale(1.15)" filter="drop-shadow(0 3px 8px rgba(245,158,11,0.6))">
            <text fontSize="48">👑</text>
          </g>
        )}
        {accessory === 'gorro' && (
          <g transform="translate(60, 16) scale(1.12)">
            <text fontSize="46">🧢</text>
          </g>
        )}
        {accessory === 'mago' && (
          <g transform="translate(64, 6) scale(1.2)" filter="drop-shadow(0 4px 8px rgba(99,102,241,0.5))">
            <text fontSize="48">🎩</text>
          </g>
        )}
        {accessory === 'gafas_corazon' && (
          <g transform="translate(46, 92) scale(0.9)" filter="drop-shadow(0 2px 4px rgba(244,63,94,0.4))">
            <text fontSize="36">💖</text>
            <text x="44" y="4" fontSize="36">💖</text>
          </g>
        )}
        {accessory === 'gafas' && (
          <g transform="translate(50, 93) scale(1.15)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.4))">
            <text fontSize="40">🕶️</text>
          </g>
        )}
        {accessory === 'gafas_estudio' && (
          <g transform="translate(50, 93) scale(1.15)">
            <text fontSize="40">👓</text>
          </g>
        )}
        {accessory === 'curita' && (
          <g transform="translate(44, 114) scale(0.75) rotate(14)">
            <text fontSize="34">🩹</text>
          </g>
        )}
        {accessory === 'lazo' && (
          <g transform="translate(78, 142) scale(0.95)" filter="drop-shadow(0 2px 4px rgba(244,63,94,0.3))">
            <text fontSize="40">🎀</text>
          </g>
        )}
        {accessory === 'pajarita' && (
          <g transform="translate(80, 142) scale(0.95)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
            <text fontSize="38">🤵</text>
          </g>
        )}
        {accessory === 'bufanda' && (
          <g transform="translate(70, 138) scale(1.12)" filter="drop-shadow(0 3px 5px rgba(220,38,38,0.3))">
            <text fontSize="42">🧣</text>
          </g>
        )}
        {accessory === 'patito' && (
          <g transform="translate(78, 150) scale(1.12)" filter="drop-shadow(0 3px 6px rgba(234,179,8,0.4))">
            <text fontSize="44">🦆</text>
          </g>
        )}
        {accessory === 'mochila' && (
          <g transform="translate(175, 100) scale(0.92)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))">
            <text fontSize="38">🎒</text>
          </g>
        )}
        {accessory === 'capa' && (
          <g transform="translate(170, 96) scale(1.02)" filter="drop-shadow(0 4px 6px rgba(220,38,38,0.4))">
            <text fontSize="44">🦸</text>
          </g>
        )}
        {accessory === 'aureola' && (
          <g transform="translate(68, 0) scale(1.15)" filter="drop-shadow(0 0 10px rgba(253,224,71,0.9))">
            <text fontSize="48">😇</text>
          </g>
        )}
        {accessory === 'aura_estrellas' && (
          <g className="animate-pulse" filter="drop-shadow(0 0 6px rgba(253,224,71,0.8))">
            <text x="24" y="48" fontSize="24">✨</text>
            <text x="195" y="58" fontSize="28">⭐</text>
            <text x="16" y="142" fontSize="24">✨</text>
            <text x="210" y="148" fontSize="22">✨</text>
          </g>
        )}
        {accessory === 'aura_mariposas' && (
          <g className="animate-bounce" filter="drop-shadow(0 0 6px rgba(168,85,247,0.6))">
            <text x="22" y="40" fontSize="28">🦋</text>
            <text x="198" y="50" fontSize="30">🦋</text>
          </g>
        )}
      </svg>
    </div>
  );
}
