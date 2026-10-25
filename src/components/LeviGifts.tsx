import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Package, Send, Sparkles, CheckCheck, X, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useStage3, Gate, Notice } from '@/components/Stage3Parts';
import { LEVI_GIFT_CATALOG, giftsOptions, type CoupleGift, type GiftDefinition } from '@/lib/gifts';
import { formatDate } from '@/lib/correspondence';

export function LeviGifts() {
  const ctx = useStage3();
  const qc = useQueryClient();
  const q = useQuery({ ...giftsOptions, enabled: Boolean(ctx.member.data) });
  
  const [tab, setTab] = useState<'received' | 'send' | 'sent'>('received');
  const [selectedCatalog, setSelectedCatalog] = useState<GiftDefinition>(LEVI_GIFT_CATALOG[0]!);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [inspectGift, setInspectGift] = useState<CoupleGift | null>(null);
  const [unboxing, setUnboxing] = useState(false);

  const uid = ctx.uid;
  const data = q.data;
  const received = (data?.gifts ?? []).filter(g => g.recipient_id === uid);
  const sent = (data?.gifts ?? []).filter(g => g.sender_id === uid);

  const getProfileName = (id: string) => {
    const p = data?.profiles.find(x => x.id === id);
    return p?.nickname || p?.display_name || 'Alguien especial';
  };

  const getGiftDef = (giftId: string) => {
    return LEVI_GIFT_CATALOG.find(x => x.id === giftId) || LEVI_GIFT_CATALOG[0]!;
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !selectedCatalog) return;
    setBusy(true);
    setNotice('');
    try {
      const giftTitle = title.trim() || selectedCatalog.name;
      const { error } = await supabase.rpc('send_couple_gift', {
        p_gift_id: selectedCatalog.id,
        p_title: giftTitle,
        p_message: message.trim(),
      });
      if (error) throw error;
      setTitle('');
      setMessage('');
      setNotice('Regalo enviado con distinción y solemnidad. Tu pareja lo recibirá.');
      setTab('sent');
      await qc.invalidateQueries({ queryKey: ['gifts'] });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No pudimos entregar el regalo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen(gift: CoupleGift) {
    setInspectGift(gift);
    if (!gift.opened_at) {
      setUnboxing(true);
      try {
        const { error } = await supabase.rpc('open_couple_gift', { p_gift_id: gift.id });
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ['gifts'] });
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setUnboxing(false), 900);
      }
    }
  }

  return (
    <Gate member={ctx.member} query={q}>
      <Notice text={notice} />

      {/* Header temático de Levi Ackerman */}
      <section className="relative overflow-hidden rounded-xl border border-zinc-700 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-5 text-zinc-100 shadow-xl">
        <div className="absolute right-3 top-3 opacity-15 text-7xl select-none font-serif">⚔️</div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 font-mono">
          <ShieldCheck className="h-4 w-4" />
          <span>Experiencia Especial · Levi</span>
        </div>
        <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight text-white">
          Regalos de Honor & Devoción
        </h2>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-400">
          Inspirados en la sobriedad, disciplina y el afecto más leal. Detalles exclusivos pensados para perdurar.
        </p>

        {/* Selector de pestañas sobrio */}
        <div className="mt-5 flex gap-1 border-t border-zinc-800 pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTab('received')}
            className={`text-xs ${tab === 'received' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
          >
            <Package className="mr-1.5 h-3.5 w-3.5" />
            Recibidos ({received.length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTab('send')}
            className={`text-xs ${tab === 'send' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
          >
            <Gift className="mr-1.5 h-3.5 w-3.5" />
            Enviar obsequio
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTab('sent')}
            className={`text-xs ${tab === 'sent' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Enviados ({sent.length})
          </Button>
        </div>
      </section>

      {/* Pestaña: REGALOS RECIBIDOS */}
      {tab === 'received' && (
        <div className="mt-4 space-y-3">
          {!received.length ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-card p-8 text-center text-muted-foreground">
              <Gift className="mx-auto mb-2 h-8 w-8 text-zinc-400" strokeWidth={1.2} />
              <p className="font-serif text-xl text-foreground">Tu casillero de regalos está sereno</p>
              <p className="mt-1 text-xs">Cuando tu pareja te envíe un detalle con este sello, lo encontrarás aquí.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {received.map(g => {
                const def = getGiftDef(g.gift_id);
                const isNew = !g.opened_at;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleOpen(g)}
                    className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                      isNew
                        ? 'border-emerald-500/60 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white shadow-md'
                        : 'border-border bg-card hover:border-zinc-400'
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl shadow-inner">
                      {def.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-mono tracking-wider text-emerald-400 uppercase">
                          {def.tag}
                        </span>
                        {isNew && (
                          <span className="animate-pulse rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <h4 className="truncate font-serif text-lg font-semibold leading-snug">
                        {g.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        De {getProfileName(g.sender_id)} · {formatDate(g.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: ENVIAR OBSEQUIO */}
      {tab === 'send' && (
        <form onSubmit={handleSend} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h3 className="font-serif text-xl font-medium">Selecciona un detalle distinguido</h3>
            <p className="text-xs text-muted-foreground">Piezas sobrias de alta calidad para consentir a tu pareja.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LEVI_GIFT_CATALOG.map(item => {
              const active = selectedCatalog.id === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSelectedCatalog(item);
                    if (!title) setTitle(item.name);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                    active
                      ? 'border-zinc-800 bg-zinc-900 text-white shadow-sm ring-2 ring-emerald-500/50'
                      : 'border-border bg-background hover:border-zinc-400'
                  }`}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="line-clamp-1 text-xs font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{item.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Tarjeta de previsualización seleccionada */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3.5 text-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedCatalog.emoji}</span>
              <div>
                <p className="text-sm font-semibold">{selectedCatalog.name}</p>
                <p className="text-xs text-emerald-400 font-mono">{selectedCatalog.subtitle}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">{selectedCatalog.description}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground">Título o dedicatoria corta</label>
              <input
                type="text"
                maxLength={120}
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={selectedCatalog.name}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Mensaje personal para tu pareja</label>
              <textarea
                rows={3}
                maxLength={2000}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Unas palabras que acompañen este obsequio…"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full bg-zinc-900 text-white hover:bg-black">
            <Send className="mr-1.5 h-4 w-4" />
            {busy ? 'Entregando obsequio…' : `Enviar ${selectedCatalog.name}`}
          </Button>
        </form>
      )}

      {/* Pestaña: REGALOS ENVIADOS */}
      {tab === 'sent' && (
        <div className="mt-4 space-y-3">
          {!sent.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aún no has enviado obsequios especiales.</p>
          ) : (
            <ul className="space-y-2">
              {sent.map(g => {
                const def = getGiftDef(g.gift_id);
                return (
                  <li key={g.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{def.emoji}</span>
                      <div>
                        <h5 className="font-serif text-base font-medium">{g.title}</h5>
                        <p className="text-xs text-muted-foreground">
                          Para {getProfileName(g.recipient_id)} · {formatDate(g.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {g.opened_at ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCheck className="h-3.5 w-3.5" /> Abierto
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Por abrir</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modal especial de Unboxing / Apertura de Regalo de Levi */}
      {inspectGift && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setInspectGift(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {unboxing ? (
              <div className="py-12 text-center space-y-3">
                <span className="inline-block animate-bounce text-6xl">🎁</span>
                <p className="font-mono text-xs text-emerald-400 tracking-widest uppercase">
                  Desempacando con esmero…
                </p>
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <span className="inline-block text-6xl drop-shadow-md">
                    {getGiftDef(inspectGift.gift_id).emoji}
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    {getGiftDef(inspectGift.gift_id).tag}
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-white">
                    {inspectGift.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {getGiftDef(inspectGift.gift_id).subtitle}
                  </p>
                </div>

                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3.5 text-xs text-zinc-300 leading-relaxed">
                  {getGiftDef(inspectGift.gift_id).description}
                </div>

                {inspectGift.message && (
                  <div className="mt-3 rounded-lg border border-zinc-800 bg-black/50 p-4">
                    <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Mensaje de {getProfileName(inspectGift.sender_id)}:
                    </p>
                    <p className="mt-1 font-serif text-base italic text-zinc-200 leading-relaxed">
                      «{inspectGift.message}»
                    </p>
                  </div>
                )}

                <div className="mt-5 text-center">
                  <p className="text-[11px] text-zinc-500">
                    Entregado el {formatDate(inspectGift.created_at)}
                  </p>
                  <Button
                    onClick={() => setInspectGift(null)}
                    className="mt-3 w-full bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    Guardar en mis recuerdos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Gate>
  );
}
