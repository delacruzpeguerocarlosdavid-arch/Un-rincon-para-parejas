import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Mail, Send, Heart, Sparkles, Feather, Clock, 
  Trash2, Eye, Lock, CheckCircle2, ChevronDown 
} from "lucide-react";
import { useCouple } from "@/lib/couple-context";
import { soundFx } from "@/lib/sound-atmosphere";
import { toast } from "sonner";

export const Route = createFileRoute("/mensajes")({
  head: () => ({
    meta: [
      { title: "Buzón de Amor · Cartas entre dos" },
      { name: "description", content: "Un espacio sagrado para escribirnos cartas de amor, selladas con cera y guardadas para siempre." },
    ],
  }),
  component: MensajesBuzon,
});

export interface LoveLetter {
  id: string;
  sender: string;
  recipient: string;
  title: string;
  content: string;
  tag: string;
  waxColor: 'ruby' | 'gold' | 'emerald' | 'sapphire';
  paperTheme: 'parchment' | 'rose_silk' | 'starry' | 'linen';
  createdAt: string;
  isRead: boolean;
}

const STORAGE_KEY = 'rincon_love_letters_v1';

export function MensajesBuzon() {
  const { couple } = useCouple();
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);

  // Form state
  const [sender, setSender] = useState<string>(couple.partner1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("Carta de Amor");
  const [waxColor, setWaxColor] = useState<LoveLetter['waxColor']>('ruby');
  const [paperTheme, setPaperTheme] = useState<LoveLetter['paperTheme']>('parchment');

  // Load letters from storage or initialize with romantic starters
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLetters(JSON.parse(raw));
      } else {
        const initialStarters: LoveLetter[] = [
          {
            id: 'starter-1',
            sender: couple.partner1,
            recipient: couple.partner2,
            title: 'Para cuando me extrañes mucho',
            content: `Mi amor, si estás leyendo esto y no estoy a tu lado, cierra los ojos por un instante y siente mis brazos abrazándote fuerte. Cada latido mío te pertenece, y no hay distancia en este mundo que pueda apagar lo que siento por ti. Te amo con todo mi ser.`,
            tag: 'Para cuando me extrañes',
            waxColor: 'ruby',
            paperTheme: 'rose_silk',
            createdAt: 'Hoy · 09:30 AM',
            isRead: true,
          },
          {
            id: 'starter-2',
            sender: couple.partner2,
            recipient: couple.partner1,
            title: 'Gracias por ser mi paz en días difíciles',
            content: `Gracias por tu paciencia infinita, por tus abrazos que curan todo y por recordarme siempre el valor de lo que tenemos. Eres mi refugio favorito y el regalo más hermoso que Dios puso en mi vida.`,
            tag: 'Agradecimiento',
            waxColor: 'gold',
            paperTheme: 'parchment',
            createdAt: 'Ayer · 08:15 PM',
            isRead: false,
          },
        ];
        setLetters(initialStarters);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStarters));
      }
    } catch {
      // fallback
    }
  }, [couple.partner1, couple.partner2]);

  const saveLetters = (newLetters: LoveLetter[]) => {
    setLetters(newLetters);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLetters));
    } catch {
      // ignore
    }
  };

  const recipient = sender === couple.partner1 ? couple.partner2 : couple.partner1;

  const handleSendLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) {
      toast.error('Por favor escribe un título y el mensaje de tu carta.');
      return;
    }

    soundFx.playChime(1.3);
    const newLetter: LoveLetter = {
      id: `letter-${Date.now()}`,
      sender,
      recipient,
      title: title.trim(),
      content: content.trim(),
      tag,
      waxColor,
      paperTheme,
      createdAt: 'Hace un momento',
      isRead: false,
    };

    saveLetters([newLetter, ...letters]);
    setIsWriting(false);
    setTitle('');
    setContent('');
    toast.success(`¡Carta sellada con cera y enviada para ${recipient}! 💌`);
  };

  const handleOpenLetter = (letter: LoveLetter) => {
    soundFx.playCrunch();
    setSelectedLetter(letter);
    if (!letter.isRead) {
      const updated = letters.map((l) => l.id === letter.id ? { ...l, isRead: true } : l);
      saveLetters(updated);
    }
  };

  const handleDeleteLetter = (id: string) => {
    const updated = letters.filter((l) => l.id !== id);
    saveLetters(updated);
    setSelectedLetter(null);
    toast.info('Carta archivada.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera del Buzón */}
      <header className="text-center pt-2">
        <span className="font-serif text-sm italic tracking-widest text-primary/90 flex items-center justify-center gap-1.5">
          <Feather className="w-4 h-4 text-rose-500" />
          Correspondencia Sagrada
        </span>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          Buzón de Amor
        </h1>
        <p className="mt-1 font-sans text-xs text-muted-foreground">
          Palabras eternas escritas entre {couple.partner1} y {couple.partner2}.
        </p>
      </header>

      {/* Botón principal para escribir carta */}
      {!isWriting && (
        <button
          onClick={() => {
            soundFx.playChime(1.1);
            setIsWriting(true);
          }}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 text-white font-serif font-medium text-base shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2.5"
        >
          <Mail className="w-5 h-5" />
          <span>Escribir una Nueva Carta de Amor</span>
          <Sparkles className="w-4 h-4 text-amber-200" />
        </button>
      )}

      {/* FORMULARIO PARA ESCRIBIR CARTA */}
      {isWriting && (
        <form 
          onSubmit={handleSendLetter}
          className="p-6 rounded-3xl border border-rose-200/60 dark:border-rose-900/40 bg-card/95 shadow-xl backdrop-blur-md space-y-4 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <h3 className="font-serif font-semibold text-lg text-foreground flex items-center gap-2">
              <Feather className="w-4 h-4 text-rose-500" />
              Nueva Carta Romántica
            </h3>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-sans"
            >
              Cancelar
            </button>
          </div>

          {/* Selector de remitente y destinatario */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                De: (Autor)
              </label>
              <select
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background/80 px-3 py-2 text-xs font-serif text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value={couple.partner1}>{couple.partner1}</option>
                <option value={couple.partner2}>{couple.partner2}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Para: (Destinatario)
              </label>
              <div className="rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-xs font-serif text-foreground font-semibold">
                {recipient}
              </div>
            </div>
          </div>

          {/* Ocasión / Categoría */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Ocasión de la Carta:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Carta de Amor',
                'Para cuando me extrañes',
                'Para un día difícil',
                'Aniversario',
                'Buenas Noches',
                'Agradecimiento'
              ].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTag(t)}
                  className={`py-1 px-2.5 rounded-xl text-[11px] font-serif transition-all ${
                    tag === t 
                      ? 'bg-rose-500 text-white font-medium shadow-sm' 
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Título de la carta */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Título o Asunto:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Lo que sentí cuando te vi por primera vez..."
              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-serif text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              maxLength={80}
            />
          </div>

          {/* Contenido manuscrito */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Contenido de tu carta:
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Escribe desde lo más profundo de tu corazón..."
              className="w-full rounded-2xl border border-border bg-background p-3 text-sm font-serif leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Color del Sello de Cera */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Color del Sello de Cera Real:
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'ruby', name: 'Rubí Pasión', bg: 'bg-rose-700' },
                { id: 'gold', name: 'Oro Imperial', bg: 'bg-amber-500' },
                { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-700' },
                { id: 'sapphire', name: 'Zafiro Noche', bg: 'bg-indigo-700' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setWaxColor(c.id as LoveLetter['waxColor'])}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full border text-[11px] font-serif transition-all ${
                    waxColor === c.id ? 'ring-2 ring-primary border-primary shadow-sm font-semibold' : 'border-border'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shadow-inner`} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-serif font-semibold text-sm shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Sellar y Depositar en el Buzón</span>
          </button>
        </form>
      )}

      {/* BANDEJA DE CARTAS EXISTENTES */}
      <div className="space-y-3">
        <h3 className="font-serif font-semibold text-lg text-foreground px-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span>Cartas Guardadas ({letters.length})</span>
        </h3>

        {letters.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-dashed border-border bg-card/40 p-6">
            <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-serif text-base text-foreground">El buzón está esperando su primera carta</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escríbele unas palabras que le alegren el día.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {letters.map((letter) => {
              const waxClass = 
                letter.waxColor === 'gold' ? 'bg-amber-500 shadow-amber-500/30' :
                letter.waxColor === 'emerald' ? 'bg-emerald-700 shadow-emerald-700/30' :
                letter.waxColor === 'sapphire' ? 'bg-indigo-700 shadow-indigo-700/30' :
                'bg-rose-700 shadow-rose-700/30';

              return (
                <div
                  key={letter.id}
                  onClick={() => handleOpenLetter(letter)}
                  className={`group relative overflow-hidden rounded-3xl border p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
                    letter.isRead
                      ? 'border-white/60 dark:border-stone-800 bg-card/85 backdrop-blur-md'
                      : 'border-rose-300/80 bg-gradient-to-r from-rose-50/70 to-pink-50/70 dark:from-rose-950/20 dark:to-pink-950/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Sello de cera 3D */}
                    <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white font-serif font-bold text-sm shadow-md transition-transform group-hover:scale-105 ${waxClass}`}>
                      <span>💌</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-foreground truncate">
                          {letter.title}
                        </span>
                        {!letter.isRead && (
                          <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-wider">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-serif italic mt-0.5">
                        De: <span className="font-semibold text-foreground">{letter.sender}</span> para <span className="font-semibold text-foreground">{letter.recipient}</span> · {letter.createdAt}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Abrir ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL / VISOR DE CARTA MANUSCRITA */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-amber-100/50 to-orange-50 dark:from-stone-900 dark:to-stone-950 p-6 sm:p-8 shadow-2xl text-stone-800 dark:text-stone-100 animate-in zoom-in-95 duration-200">
            {/* Cinta decorativa superior */}
            <div className="flex items-center justify-between border-b border-amber-200/50 pb-3">
              <span className="rounded-full bg-amber-200/50 dark:bg-amber-900/40 px-3 py-1 font-serif text-xs font-semibold text-amber-900 dark:text-amber-200">
                {selectedLetter.tag}
              </span>
              <span className="text-xs font-sans text-stone-500 dark:text-stone-400">
                {selectedLetter.createdAt}
              </span>
            </div>

            {/* Remitente y Destinatario */}
            <div className="mt-4 font-serif text-xs italic text-stone-600 dark:text-stone-400">
              De <span className="font-semibold text-stone-900 dark:text-white">{selectedLetter.sender}</span> con todo mi amor para <span className="font-semibold text-stone-900 dark:text-white">{selectedLetter.recipient}</span>:
            </div>

            <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              {selectedLetter.title}
            </h2>

            {/* Texto de la carta */}
            <div className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-amber-200/40 max-h-60 overflow-y-auto">
              <p className="font-serif text-base sm:text-lg leading-relaxed whitespace-pre-wrap selection:bg-rose-200">
                {selectedLetter.content}
              </p>
            </div>

            {/* Firma */}
            <div className="mt-4 text-right font-serif italic text-sm text-stone-700 dark:text-stone-300">
              Siempre tuyo(a), <br />
              <span className="font-semibold text-base not-italic text-stone-900 dark:text-white">
                {selectedLetter.sender}
              </span>
            </div>

            {/* Botones de acción del modal */}
            <div className="mt-6 flex items-center justify-between pt-3 border-t border-amber-200/50">
              <button
                onClick={() => handleDeleteLetter(selectedLetter.id)}
                className="text-xs text-rose-500 hover:text-rose-700 font-serif flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archivar carta</span>
              </button>
              <button
                onClick={() => setSelectedLetter(null)}
                className="px-5 py-2 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-serif font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Cerrar carta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
