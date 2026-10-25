import { useState, useEffect } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Crown, Sparkles, Check, X, ShieldCheck, Heart, BookOpen, Music, Lock, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MONETIZATION_CONFIG, isVipMember, setVipStatus } from '@/lib/monetization-config';

export function PremiumPassModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly' | 'lifetime'>('annual');
  const [isVipActive, setIsVipActive] = useState(false);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);

  useEffect(() => {
    setIsVipActive(isVipMember());

    // Escuchar cambios de estatus VIP
    const handleVipChange = () => setIsVipActive(isVipMember());
    window.addEventListener('sanctuary_vip_change', handleVipChange);

    // Detección automática de retorno exitoso de pasarela de pago (?payment=success)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        soundFx.playChime(1.5);
        setVipStatus(true);
        setIsVipActive(true);
        setShowSuccessNotice(true);
        setIsOpen(true);
        // Limpiar el parámetro de la URL sin recargar
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    return () => window.removeEventListener('sanctuary_vip_change', handleVipChange);
  }, []);

  function handleCheckout() {
    const paymentLink = MONETIZATION_CONFIG.stripePaymentLinks[selectedPlan];

    // Si Carlos ya configuró un enlace real de Stripe/LemonSqueezy, redirigir allí:
    if (paymentLink) {
      soundFx.playChime(1.2);
      window.location.href = paymentLink;
      return;
    }

    // Si aún no ha pegado el link de Stripe, activar modo VIP inmediato para pruebas:
    soundFx.playChime(1.4);
    setVipStatus(true);
    setIsVipActive(true);
    setShowSuccessNotice(true);
    setTimeout(() => {
      setShowSuccessNotice(false);
      setIsOpen(false);
    }, 2500);
  }

  const perks = [
    {
      icon: Crown,
      title: 'Appa Legendario & Armario Real',
      desc: 'Alas celestiales doradas, corona de diamantes, esmoquin de boda y auras exclusivas.',
    },
    {
      icon: Lock,
      title: 'Cápsulas del Tiempo Ilimitadas',
      desc: 'Notas de voz HD y cartas con cerradura temporal para abrir en aniversarios futuros.',
    },
    {
      icon: BookOpen,
      title: 'Libro de Nuestra Historia (PDF Imprimible)',
      desc: 'Exporta en 1 clic un fotolibro maquetado en alta resolución con todas sus memorias.',
    },
    {
      icon: Music,
      title: 'Estación de Radio Lo-Fi Romántica',
      desc: 'Generador continuo de lluvia, chimenea, río y piano para dormir o estudiar juntos.',
    },
    {
      icon: ShieldCheck,
      title: 'Bóveda Secreta con PIN de Pareja',
      desc: 'Protección privada máxima para sus secretos, fotos y cartas íntimas.',
    },
  ];

  return (
    <>
      {/* Botón VIP en la barra de navegación o cabecera */}
      <button
        onClick={() => {
          soundFx.playChime(1.2);
          setIsOpen(true);
        }}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif transition-all shadow-md active:scale-95 ${
          isVipActive
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-bold border border-amber-300 ring-2 ring-amber-300/40'
            : 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 hover:scale-105'
        }`}
      >
        <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        <span>{isVipActive ? 'Santuario VIP' : 'Pase de Amor'}</span>
        {!isVipActive && <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />}
      </button>

      {/* Modal de Membresía Comercial VIP */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md my-8 rounded-3xl bg-card border-2 border-amber-300/80 dark:border-amber-700/60 p-6 shadow-2xl space-y-6 text-foreground">
            {/* Botón cerrar */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Cabecera emotiva */}
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-xl shadow-amber-500/20">
                <Crown className="w-8 h-8 fill-amber-100" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                Santuario Plus
              </h2>
              <p className="font-serif italic text-xs text-muted-foreground max-w-xs mx-auto">
                El rincón más exclusivo para parejas. Su amor merece una experiencia sin límites ni interrupciones.
              </p>
            </div>

            {/* Lista de Beneficios */}
            <div className="space-y-3 py-1">
              {perks.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl bg-muted/30 border border-border/40">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-serif text-xs font-bold text-foreground">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tarjetas de Precios y Planes */}
            <div className="grid grid-cols-3 gap-2">
              {/* Plan Mensual */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                  selectedPlan === 'monthly'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-400/40'
                    : 'border-border/60 bg-card hover:bg-muted/40'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Mensual</span>
                <span className="font-serif text-lg font-bold my-1">$4.99</span>
                <span className="text-[9px] text-muted-foreground">/mes</span>
              </button>

              {/* Plan Anual (Destacado) */}
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`relative p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                  selectedPlan === 'annual'
                    ? 'border-amber-500 bg-gradient-to-b from-amber-500/20 to-amber-500/5 shadow-md ring-2 ring-amber-400/50'
                    : 'border-border/60 bg-card hover:bg-muted/40'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-mono text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  50% Ahorro
                </span>
                <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-300 font-bold">Anual</span>
                <span className="font-serif text-lg font-bold my-1 text-foreground">$29.99</span>
                <span className="text-[9px] text-muted-foreground">7 días gratis</span>
              </button>

              {/* Plan Eterno (Lifetime) */}
              <button
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                  selectedPlan === 'lifetime'
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-400/40'
                    : 'border-border/60 bg-card hover:bg-muted/40'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Amor Eterno</span>
                <span className="font-serif text-lg font-bold my-1">$49.99</span>
                <span className="text-[9px] text-muted-foreground">Pago único</span>
              </button>
            </div>

            {/* Botón de Activación / Suscripción */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleCheckout}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-white font-serif text-base font-bold shadow-lg shadow-amber-500/30 gap-2"
              >
                <Sparkles className="w-5 h-5 fill-white" />
                {isVipActive
                  ? 'Membresía VIP Activa'
                  : selectedPlan === 'annual'
                  ? 'Comenzar 7 días de prueba ($29.99/año)'
                  : selectedPlan === 'monthly'
                  ? 'Obtener Santuario Plus ($4.99/mes)'
                  : 'Pase Eterno de por Vida ($49.99)'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Garantía de satisfacción · Cancela en cualquier momento.
              </p>
            </div>

            {/* Mensaje de éxito al activar */}
            {showSuccessNotice && (
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 text-amber-950 dark:text-amber-100 text-xs text-center font-serif animate-in zoom-in-95">
                👑 ¡Membresía VIP de Amor activada con éxito para Carlos & Mimie!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
