import { useState } from 'react';
import { useCouple } from '@/lib/couple-context';
import { soundFx } from '@/lib/sound-atmosphere';
import { Heart, Sparkles, Calendar, Share2, Check, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CoupleOnboardingModal({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const { couple, updateCouple } = useCouple();
  const [isOpen, setIsOpen] = useState(forceOpen || !couple.isCustomized);
  const [step, setStep] = useState(1);

  const [partner1, setPartner1] = useState(couple.partner1 || '');
  const [partner2, setPartner2] = useState(couple.partner2 || '');
  const [anniversary, setAnniversary] = useState(couple.anniversaryDate || '2023-11-20');
  const [petName, setPetName] = useState(couple.petName || 'Appa');
  const [copied, setCopied] = useState(false);

  function handleNext() {
    soundFx.playChime(1.1);
    setStep(s => s + 1);
  }

  function handleFinish() {
    soundFx.playChime(1.4);
    updateCouple({
      partner1: partner1.trim() || 'Carlos',
      partner2: partner2.trim() || 'Mimie',
      anniversaryDate: anniversary,
      petName: petName.trim() || 'Appa',
      isCustomized: true,
    });
    setStep(4);
  }

  function handleShareWhatsApp() {
    soundFx.playChime(1.2);
    const message = encodeURIComponent(
      `¡Amor! Creé nuestro santuario privado en "Un Rincón Para Parejas" 🤍✨ Entra aquí para conectarte conmigo y cuidar juntos a ${petName}: ${window.location.origin}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  function handleCopyInvite() {
    soundFx.playChime(1.1);
    const text = `¡Amor! Creé nuestro santuario privado en "Un Rincón Para Parejas" 🤍✨ Código secreto: ${couple.coupleCode}\n${window.location.origin}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-8 rounded-3xl bg-card border-2 border-rose-300/70 dark:border-rose-900/50 p-6 shadow-2xl space-y-6 text-foreground">
        {onClose && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Paso 1: Nombres de la Pareja */}
        {step === 1 && (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500">
              <Heart className="w-8 h-8 fill-rose-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Bienvenidos a Un Rincón Para Parejas
            </h2>
            <p className="text-xs text-muted-foreground">
              Vamos a crear su espacio privado para dos. ¿Cómo se llaman ustedes?
            </p>

            <div className="space-y-3 text-left pt-2">
              <div>
                <label className="block text-xs font-serif font-semibold text-foreground mb-1">
                  Tu nombre o apodo cariñoso
                </label>
                <input
                  type="text"
                  value={partner1}
                  onChange={e => setPartner1(e.target.value)}
                  placeholder="Ej: Carlos"
                  className="w-full text-sm p-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-foreground mb-1">
                  El nombre o apodo de tu pareja
                </label>
                <input
                  type="text"
                  value={partner2}
                  onChange={e => setPartner2(e.target.value)}
                  placeholder="Ej: Mimie"
                  className="w-full text-sm p-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none font-serif"
                />
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!partner1.trim() || !partner2.trim()}
              className="w-full h-11 rounded-2xl font-serif text-sm font-bold gap-2 mt-2"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Paso 2: Fecha de Aniversario */}
        {step === 2 && (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              ¿Cuándo comenzó su amor?
            </h2>
            <p className="text-xs text-muted-foreground">
              Esta fecha encenderá su contador de amor en vivo de días, horas y segundos juntos.
            </p>

            <div className="pt-2 text-left">
              <label className="block text-xs font-serif font-semibold text-foreground mb-1">
                Fecha de inicio de relación / aniversario
              </label>
              <input
                type="date"
                value={anniversary}
                onChange={e => setAnniversary(e.target.value)}
                className="w-full text-sm p-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none font-serif"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-2xl font-serif">
                Atrás
              </Button>
              <Button onClick={handleNext} className="flex-1 rounded-2xl font-serif font-bold gap-2">
                Siguiente <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Mascota Virtual */}
        {step === 3 && (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="text-4xl">🐾</div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Su Mascota Compartida
            </h2>
            <p className="text-xs text-muted-foreground">
              Cuidarán juntos a una tierna mascota virtual que reacciona a sus caricias y come cuando la alimentan.
            </p>

            <div className="pt-2 text-left">
              <label className="block text-xs font-serif font-semibold text-foreground mb-1">
                ¿Qué nombre quieren ponerle?
              </label>
              <input
                type="text"
                value={petName}
                onChange={e => setPetName(e.target.value)}
                placeholder="Appa"
                className="w-full text-sm p-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none font-serif"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-2xl font-serif">
                Atrás
              </Button>
              <Button onClick={handleFinish} className="flex-1 rounded-2xl font-serif font-bold gap-2">
                Crear Nuestro Rincón <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 4: ¡Listo! Compartir con tu pareja */}
        {step === 4 && (
          <div className="space-y-4 text-center animate-in zoom-in-95">
            <span className="text-4xl block">✨🕊️</span>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              ¡El Rincón de {partner1} & {partner2} está listo!
            </h2>
            <p className="text-xs text-muted-foreground">
              Invita a {partner2} para que se conecte a su santuario privado y comiencen a cuidarse juntos.
            </p>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                Su código secreto de vinculación
              </span>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                {couple.coupleCode}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-serif font-bold shadow-lg shadow-emerald-500/20 gap-2"
              >
                <Share2 className="w-4 h-4" />
                Invitar a {partner2} por WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyInvite}
                className="w-full h-10 rounded-2xl font-serif text-xs gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Sparkles className="w-4 h-4" />}
                {copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace privado'}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="font-serif text-xs text-muted-foreground"
            >
              Entrar a nuestro rincón ahora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
