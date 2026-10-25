import { Link } from '@tanstack/react-router';
import { Heart, Sparkles } from 'lucide-react';
import { useCouple } from '@/lib/couple-context';

export function AccountLink() {
  const { couple, isCustomized } = useCouple();

  return (
    <div className="mb-2 flex items-center justify-between text-xs">
      <Link 
        to="/espacio" 
        className="flex items-center gap-1.5 rounded-full bg-card/80 border border-border/50 px-3 py-1 font-serif text-muted-foreground hover:text-foreground transition-all shadow-sm"
      >
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
        <span>{couple.partner1} & {couple.partner2}</span>
      </Link>

      <Link 
        to="/auth" 
        className="flex items-center gap-1 text-[11px] font-serif text-muted-foreground hover:text-primary transition-colors"
      >
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>{isCustomized ? 'Ajustes' : 'Configurar'}</span>
      </Link>
    </div>
  );
}
