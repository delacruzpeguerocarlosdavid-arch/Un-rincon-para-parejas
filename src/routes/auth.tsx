import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Heart, Sparkles, User, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCouple } from '@/lib/couple-context';
import { PageHeader } from '@/components/AppShell';
import { soundFx } from '@/lib/sound-atmosphere';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Acceso a Nuestro Rincón · Un Rincón Para Parejas' },
      { name: 'description', content: 'Entra a tu santuario privado de pareja sin códigos ni complicaciones.' },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { couple, updateCouple } = useCouple();

  const [partner1, setPartner1] = useState(couple.partner1 || '');
  const [partner2, setPartner2] = useState(couple.partner2 || '');
  const [petName, setPetName] = useState(couple.petName || '');
  const [anniversary, setAnniversary] = useState(couple.anniversaryDate || '2024-02-14');

  const handleQuickEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner1.trim() || !partner2.trim()) {
      toast.error('Por favor escribe los nombres de ambos.');
      return;
    }

    soundFx.playChime(1.4);
    updateCouple({
      partner1: partner1.trim(),
      partner2: partner2.trim(),
      petName: petName.trim() || 'Mi Amor',
      anniversaryDate: anniversary,
    });

    toast.success(`¡Bienvenidos a su rincón, ${partner1.trim()} y ${partner2.trim()}! 💕`);
    void navigate({ to: '/' });
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      <div className="text-center">
        <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 mb-3 shadow-inner">
          <Heart className="h-7 w-7 fill-rose-500/20 text-rose-500" />
        </span>
        <PageHeader 
          title="Nuestro Acceso de Pareja" 
          subtitle="Sin correos que se pierden, sin contraseñas difíciles. Su amor directo y privado." 
        />
      </div>

      <form 
        onSubmit={handleQuickEntry}
        className="p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-stone-800 bg-card/95 shadow-xl backdrop-blur-md space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-border/50 pb-3 text-xs font-serif text-primary font-semibold">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Configuración Rápida de su Santuario</span>
        </div>

        <div>
          <label className="block text-xs font-serif font-medium text-muted-foreground mb-1">
            Tu Nombre o Apodo:
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={partner1}
              onChange={(e) => setPartner1(e.target.value)}
              placeholder="Ej: Carlos"
              className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2 text-sm font-serif text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-serif font-medium text-muted-foreground mb-1">
            El Nombre de tu Pareja:
          </label>
          <div className="relative">
            <Heart className="absolute left-3 top-2.5 h-4 w-4 text-rose-500" />
            <input
              type="text"
              required
              value={partner2}
              onChange={(e) => setPartner2(e.target.value)}
              placeholder="Ej: Marie"
              className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2 text-sm font-serif text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-serif font-medium text-muted-foreground mb-1">
              Apodo Especial:
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Ej: Mi cielo"
              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-serif text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-serif font-medium text-muted-foreground mb-1">
              Fecha de Aniversario:
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 text-white font-serif font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Entrar a Nuestro Rincón Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground pt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          100% privado en su dispositivo. Sin contraseñas ni correos.
        </p>
      </form>
    </div>
  );
}
