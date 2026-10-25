import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BookHeart, Check, CheckCheck, ChevronLeft, Heart, Mail, MessageCircle, Pencil, Plus, Search, Send, StickyNote, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { membershipOptions, spaceStatusOptions } from '@/lib/message-bank';
import { correspondenceOptions, canEditText, canFavoriteText, folders, formatDate, searchTexts, type Kind, type Text } from '@/lib/correspondence';
import { partnerWords } from '@/lib/emotions';
import { canCompose, correspondenceSchema } from '@/lib/writing-validation';

const input = 'w-full rounded-md border border-input bg-card px-3 py-2 text-sm';

export function Correspondence({ library = false, initialFolder = '', partnerOnly = false }: { library?: boolean; initialFolder?: string; partnerOnly?: boolean }) {
  const member = useQuery(membershipOptions);
  const space = useQuery({ ...spaceStatusOptions, enabled: Boolean(member.data) });
  const query = useQuery({ ...correspondenceOptions, enabled: Boolean(member.data) });
  const qc = useQueryClient();
  const [mode, setMode] = useState<Kind>('chat');
  const [folder, setFolder] = useState<string>(initialFolder);
  const [filter, setFilter] = useState(partnerOnly ? 'partner' : 'all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Text | null>(null);
  const [draft, setDraft] = useState<{ id?: string; kind: Kind; title: string; content: string; folder: string; theme?: 'classic' | 'l_investigation'; scheduled_at?: string } | null>(null);
  const [chat, setChat] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const marked = useRef(new Set<string>());
  const uid = member.data?.user_id;
  const connected = (space.data?.members.length ?? 0) === 2;
  const data = query.data;

  useEffect(() => {
    if (!uid || !data || library || mode !== 'chat') return;
    const unread = data.texts.filter(t => t.kind === 'chat' && t.author_id !== uid && !data.reads.some(r => r.text_id === t.id && r.user_id === uid) && !marked.current.has(t.id));
    if (!unread.length) return;
    let active = true;
    async function markVisible() {
      if (document.visibilityState !== 'visible') return;
      for (const text of unread) {
        if (!active || marked.current.has(text.id)) continue;
        marked.current.add(text.id);
        try {
          const { error } = await supabase.rpc('mark_correspondence_read', { p_id: text.id });
          if (error) throw error;
        } catch { marked.current.delete(text.id); if (active) setNotice('No pudimos registrar la lectura.'); }
      }
      if (active) void qc.invalidateQueries({ queryKey: ['correspondence'] });
    }
    void markVisible();
    document.addEventListener('visibilitychange', markVisible);
    return () => { active = false; document.removeEventListener('visibilitychange', markVisible); };
  }, [uid, data, library, mode, qc]);

  useEffect(() => { if (!library && mode === 'chat') end.current?.scrollIntoView({ block: 'nearest' }); }, [data?.texts.length, library, mode]);

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setNotice('');
    try { const { error } = await action(); if (error) throw new Error(error.message); await qc.invalidateQueries({ queryKey: ['correspondence'] }); return true; }
    catch (error) { setNotice(error instanceof Error ? error.message : 'No pudimos guardar el cambio.'); return false; }
    finally { setBusy(false); }
  }
  async function sendChat(e: FormEvent) {
    e.preventDefault();
    if (!canCompose(uid, busy)) return;
    const parsed = correspondenceSchema.safeParse({ kind: 'chat', title: '', content: chat });
    if (!parsed.success) { setNotice(parsed.error.issues[0]?.message ?? 'Revisa tus palabras.'); return; }
    if (await run(() => supabase.rpc('save_correspondence', { p_kind: 'chat', p_title: '', p_content: parsed.data.content }))) setChat('');
  }
  async function saveDraft(e: FormEvent) {
    e.preventDefault(); if (!draft || !canCompose(uid, busy)) return;
    const parsed = correspondenceSchema.safeParse(draft);
    if (!parsed.success) { setNotice(parsed.error.issues[0]?.message ?? 'Revisa tus palabras.'); return; }
    if (await run(() => supabase.rpc('save_correspondence', {
      p_kind: parsed.data.kind,
      p_title: parsed.data.title,
      p_content: parsed.data.content,
      ...(draft.kind === 'library' && parsed.data.folder ? { p_folder: parsed.data.folder } : {}),
      ...(draft.id ? { p_id: draft.id } : {}),
      p_theme: draft.theme ?? (draft.kind === 'letter' ? 'l_investigation' : 'classic'),
      p_scheduled_at: draft.scheduled_at ? new Date(draft.scheduled_at).toISOString() : null,
    }))) {
      try { localStorage.removeItem(`draft_${draft.kind}`); } catch {}
      setDraft(null);
      setSelected(null);
    }
  }
  async function open(text: Text) {
    setSelected(text);
    if (text.author_id !== uid) await run(() => supabase.rpc('mark_correspondence_read', { p_id: text.id }));
  }

  const author = (text: Text) => { const profile = data?.profiles.find(p => p.id === text.author_id); return profile?.nickname || profile?.display_name || 'Sin nombre'; };
  const receipt = (text: Text) => data?.reads.find(r => r.text_id === text.id && r.user_id !== text.author_id);
  const favorite = (text: Text) => Boolean(data?.favorites.some(f => f.text_id === text.id && f.user_id === uid));
  let texts = (data?.texts ?? []).filter(t => library ? t.kind === 'library' : t.kind === mode);
  if (library) {
    if (filter === 'partner' && uid) texts = folder ? partnerWords(texts, uid, folder) : texts.filter(t => t.author_id !== uid);
    texts = searchTexts(texts, search).filter(t => (!folder || t.folder === folder) && (filter !== 'favorites' || favorite(t)) && (filter !== 'mine' || t.author_id === uid) && (filter !== 'recent' || data?.reads.some(r => r.text_id === t.id && r.user_id === uid)));
    texts.sort((a, b) => filter === 'recent' ? (data?.reads.find(r => r.text_id === b.id && r.user_id === uid)?.last_read_at ?? '').localeCompare(data?.reads.find(r => r.text_id === a.id && r.user_id === uid)?.last_read_at ?? '') : b.created_at.localeCompare(a.created_at));
  }

  return <div>
    <Button asChild variant="ghost" size="sm" className="mb-2"><Link to="/mensajes"><ChevronLeft />Nuestros mensajes</Link></Button>
    <PageHeader title={library ? 'Mis palabras para ti' : 'Entre nosotros'} subtitle={library ? 'Un rincón para cada emoción.' : 'Lo cotidiano, lo profundo y todo lo nuestro.'} />
    <div className="mb-5 flex flex-wrap gap-2"><Button asChild variant={library ? 'outline' : 'secondary'} size="sm"><Link to="/conversacion"><MessageCircle />Conversación</Link></Button><Button asChild variant={library ? 'secondary' : 'outline'} size="sm"><Link to="/palabras"><BookHeart />Mis palabras para ti</Link></Button></div>
    {member.isPending ? <p>Un momento…</p> : member.error ? <p role="alert">No pudimos comprobar tu acceso.</p> : !member.data ? <div className="py-8 text-center"><Heart className="mx-auto mb-3 text-primary" /><h2 className="text-2xl">Nos falta encontrarnos aquí</h2><Button asChild className="mt-4"><Link to="/espacio">Vincular nuestras cuentas</Link></Button></div> : <>
      {space.error ? <p role="alert">No pudimos comprobar la conexión. <Button variant="ghost" onClick={() => void space.refetch()}>Reintentar</Button></p> : !space.isPending && !connected && <div className="mb-5 border-y border-border py-4"><p className="text-sm">Esperando a la segunda cuenta.</p><Button asChild variant="link" className="px-0"><Link to="/espacio">Invitar a mi pareja</Link></Button></div>}
      {query.isPending ? <p>Un momento…</p> : query.error ? <div role="alert"><p>No pudimos cargar nuestras palabras.</p><Button onClick={() => void query.refetch()} variant="ghost">Reintentar</Button></div> : <>
        {!library && <div className="mb-4 flex gap-1 border-b border-border pb-2" role="tablist" aria-label="Tipo de mensaje">{([{ kind: 'chat', label: 'Chat', icon: MessageCircle }, { kind: 'letter', label: 'Cartas', icon: Mail }, { kind: 'note', label: 'Notas', icon: StickyNote }] as const).map(({ kind, label, icon: Icon }) => <Button key={kind} role="tab" aria-selected={mode === kind} variant={mode === kind ? 'secondary' : 'ghost'} size="sm" onClick={() => { setMode(kind); setSelected(null); }}><Icon />{label}</Button>)}</div>}
        {library && <div className="mb-5 space-y-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="Buscar por título o contenido" placeholder="Buscar palabras…" value={search} onChange={e => setSearch(e.target.value)} className={`${input} pl-9`} /></div>
          <select className={input} aria-label="Carpeta" value={folder} onChange={e => setFolder(e.target.value)}><option value="">Todas las carpetas</option>{folders.map(f => <option key={f}>{f}</option>)}</select>
          <select className={input} aria-label="Mostrar textos" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas nuestras palabras</option><option value="partner">Palabras de mi pareja</option><option value="mine">Mis textos</option><option value="favorites">Favoritos</option><option value="recent">Leídos recientemente</option></select>
        </div>}
        {(library || mode !== 'chat') && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              disabled={!canCompose(uid, busy)}
              onClick={() => {
                let saved = '';
                try { saved = localStorage.getItem(`draft_${mode}`) || ''; } catch {}
                setDraft({
                  kind: library ? 'library' : mode,
                  title: '',
                  content: saved,
                  folder: folder || folders[0],
                  theme: mode === 'letter' ? 'l_investigation' : 'classic',
                  scheduled_at: '',
                });
              }}
            >
              <Plus />
              {library ? 'Escribir palabras' : mode === 'letter' ? 'Escribir carta (Expediente L)' : 'Escribir nota'}
            </Button>
            {mode === 'letter' && (
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] text-blue-600">
                🔎 Estética L · Death Note activa
              </span>
            )}
          </div>
        )}
        {!library && mode === 'chat' ? <>
          <div className="max-h-[55vh] min-h-56 space-y-3 overflow-y-auto py-3" aria-label="Conversación" aria-live="polite">
            {!texts.length && <div className="py-12 text-center text-muted-foreground"><MessageCircle className="mx-auto mb-3 h-7 w-7" strokeWidth={1} /><p className="font-serif text-2xl">Aquí empieza nuestra conversación</p></div>}
            {texts.map(t => <article key={t.id} className={`max-w-[88%] rounded-lg border border-border p-3 ${t.author_id === uid ? 'ml-auto bg-accent/30' : 'mr-auto bg-card'}`}><p className="mb-1 text-xs text-muted-foreground">{author(t)}</p><p className="whitespace-pre-wrap break-words text-sm">{t.content}</p><div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-[10px] text-muted-foreground"><time dateTime={t.created_at}>{formatDate(t.created_at)}</time>{t.author_id === uid && <span className="flex items-center gap-1">{receipt(t) ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}{receipt(t) ? 'Leído' : 'Enviado'}</span>}</div></article>)}<div ref={end} />
          </div>
          <form onSubmit={sendChat} className="mt-3 flex items-end gap-2 border-t border-border pt-3"><textarea aria-label="Mensaje" placeholder="Algo que quiero decirte…" rows={2} maxLength={20000} value={chat} onChange={e => setChat(e.target.value)} disabled={!uid} className={`${input} min-w-0 resize-none`} /><Button size="icon" aria-label="Enviar mensaje" title="Enviar mensaje" disabled={!canCompose(uid, busy) || !chat.trim()}><Send /></Button></form>
        </> : <>
          {!texts.length && <div className="py-10 text-center"><BookHeart className="mx-auto mb-3 h-7 w-7 text-primary" strokeWidth={1} /><h2 className="text-2xl">{search || folder || filter !== 'all' ? 'Aún no hay palabras aquí' : library ? 'Palabras que esperan por nosotros' : mode === 'letter' ? 'Nuestra primera carta está por llegar' : 'Los pequeños detalles también cuentan'}</h2></div>}
          <ul className="space-y-3">
            {texts.map(t => {
              const isL = t.theme === 'l_investigation' && t.kind === 'letter';
              const isLocked = t.scheduled_at && new Date(t.scheduled_at).getTime() > Date.now();
              return isL ? (
                <li key={t.id} className="l-dossier-card rounded-xl p-4.5 shadow-md">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-700/60 pb-2">
                    <div className="min-w-0">
                      <span className="l-mono-tag text-blue-400">
                        EXPEDIENTE #{t.id.slice(0, 8).toUpperCase()} // CONFIDENCIAL
                      </span>
                      <h3 className="break-words font-serif text-2xl font-medium text-white">{t.title}</h3>
                    </div>
                    {isLocked ? (
                      <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        🔒 Sellado
                      </span>
                    ) : (
                      <span className="l-dossier-stamp px-1.5 py-0.5 text-[10px]">RESERVADO</span>
                    )}
                  </div>
                  <p className="mt-2.5 line-clamp-3 whitespace-pre-wrap break-words font-serif text-base text-zinc-300">
                    {isLocked && t.author_id !== uid ? 'Este expediente contiene palabras selladas hasta su fecha de apertura programada.' : t.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>Investigador: {author(t)} · {formatDate(t.created_at)}</span>
                    {t.scheduled_at && (
                      <span className="text-[11px] text-amber-300 font-mono">
                        Apertura: {formatDate(t.scheduled_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800 pt-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                      onClick={() => void open(t)}
                    >
                      Abrir expediente
                    </Button>
                    <span className="text-[11px] text-zinc-400">
                      {receipt(t) ? 'Leído' : t.author_id === uid ? 'Enviado' : 'Sin abrir'}
                    </span>
                  </div>
                </li>
              ) : (
                <li key={t.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{library ? t.folder : t.kind === 'letter' ? 'Carta clásica' : 'Nota'}</p>
                      <h2 className="break-words text-2xl">{t.title || 'Una nota para ti'}</h2>
                    </div>
                    {favorite(t) && <Heart className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words font-serif text-lg">{t.content}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{author(t)} · {formatDate(t.created_at)}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void open(t)}>Leer {t.kind === 'letter' ? 'carta' : 'texto'}</Button>
                    <span className="text-xs text-muted-foreground">{receipt(t) ? 'Leído' : t.author_id === uid ? 'Enviado' : 'Por leer'}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>}
      </>}
    </>}
    {notice && <p role="status" className="mt-4 break-words text-sm">{notice}</p>}
    {selected && uid && !draft && (
      <div role="dialog" aria-modal="true" aria-label={selected.title || 'Leer texto'} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
        {selected.theme === 'l_investigation' && selected.kind === 'letter' ? (
          <article className="l-seal-open max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-700/80 pb-3">
              <div>
                <span className="l-mono-tag text-blue-400">
                  EXPEDIENTE #{selected.id.slice(0, 8).toUpperCase()} // CLASIFICADO
                </span>
                <span className="ml-2.5 l-dossier-stamp px-2 py-0.5 text-[10px]">CASO RESERVADO</span>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar lectura" onClick={() => setSelected(null)} className="text-zinc-400 hover:text-white">
                <X />
              </Button>
            </div>
            <h2 className="mt-3.5 break-words font-serif text-3xl font-medium text-white">{selected.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
              <span>Remitente: {author(selected)}</span>
              <span>·</span>
              <span>Registro: {formatDate(selected.created_at)}</span>
            </div>
            {selected.scheduled_at && (
              <p className="mt-2 text-xs text-amber-300 font-mono">
                🕒 Fecha de apertura programada: {formatDate(selected.scheduled_at)}
              </p>
            )}
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
              <p className="whitespace-pre-wrap break-words font-serif text-lg leading-relaxed text-zinc-200">
                {selected.content}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>{receipt(selected) ? `Comprobado · ${formatDate(receipt(selected)?.first_read_at ?? selected.created_at)}` : 'Estado: Recibido'}</span>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => setSelected(null)}>
                Cerrar expediente
              </Button>
            </div>
          </article>
        ) : (
          <article className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-5">
            <div className="flex justify-end"><Button variant="ghost" size="icon" aria-label="Cerrar lectura" onClick={() => setSelected(null)}><X /></Button></div>
            <p className="text-xs text-muted-foreground">{selected.folder || (selected.kind === 'letter' ? 'Carta' : 'Nota')}</p>
            <h2 className="mb-4 break-words text-3xl">{selected.title || 'Una nota para ti'}</h2>
            <p className="whitespace-pre-wrap break-words font-serif text-xl leading-relaxed">{selected.content}</p>
            <p className="mt-5 text-xs text-muted-foreground">{author(selected)} · {formatDate(selected.created_at)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{receipt(selected) ? `Leído · ${formatDate(receipt(selected)?.first_read_at ?? selected.created_at)}` : 'Enviado'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {canFavoriteText(selected, uid) && <Button variant="outline" disabled={busy} onClick={() => void run(() => supabase.rpc('set_word_favorite', { p_id: selected.id, p_favorite: !favorite(selected) }))}><Heart className={favorite(selected) ? 'fill-primary text-primary' : ''} />{favorite(selected) ? 'Quitar favorito' : 'Guardar favorito'}</Button>}
              {canEditText(selected, uid) && <><Button variant="outline" disabled={busy} onClick={() => setDraft({ id: selected.id, kind: 'library', title: selected.title, content: selected.content, folder: selected.folder || folders[0] })}><Pencil />Editar</Button><Button variant="ghost" disabled={busy} onClick={async () => { if (window.confirm('¿Eliminar este texto?')) { if (await run(() => supabase.rpc('delete_library_text', { p_id: selected.id }))) setSelected(null); } }}><Trash2 />Eliminar</Button></>}
            </div>
            {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
          </article>
        )}
      </div>
    )}
    {draft && (
      <div role="dialog" aria-modal="true" aria-label={draft.id ? 'Editar texto' : 'Escribir texto'} className="fixed inset-0 z-40 flex items-center justify-center bg-background/95 p-4">
        <form onSubmit={saveDraft} className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">{draft.id ? 'Mis palabras' : draft.kind === 'letter' ? 'Una carta para ti' : draft.kind === 'note' ? 'Una pequeña nota' : 'Mis palabras para ti'}</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar editor" onClick={() => setDraft(null)}><X /></Button>
          </div>
          <label className="block text-sm">
            Título
            <input
              autoFocus
              className={`${input} mt-1`}
              required={draft.kind !== 'note'}
              maxLength={160}
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          {draft.kind === 'letter' && (
            <div className="space-y-3 rounded-lg border border-border bg-accent/20 p-3">
              <div>
                <label className="block text-xs font-mono text-muted-foreground">Estilo de carta</label>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={draft.theme === 'l_investigation' ? 'default' : 'outline'}
                    onClick={() => setDraft({ ...draft, theme: 'l_investigation' })}
                    className="text-xs"
                  >
                    🔎 Expediente L (Death Note)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={draft.theme === 'classic' ? 'default' : 'outline'}
                    onClick={() => setDraft({ ...draft, theme: 'classic' })}
                    className="text-xs"
                  >
                    ✉️ Clásica romántica
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground">
                  Programar fecha de apertura (Opcional)
                </label>
                <input
                  type="datetime-local"
                  className={`${input} mt-1 text-xs`}
                  value={draft.scheduled_at || ''}
                  onChange={e => setDraft({ ...draft, scheduled_at: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Si eliges una fecha, el contenido quedará sellado en el servidor hasta ese momento.
                </p>
              </div>
            </div>
          )}
          {draft.kind === 'library' && (
            <label className="block text-sm">Carpeta
              <select className={`${input} mt-1`} value={draft.folder} onChange={e => setDraft({ ...draft, folder: e.target.value })}>
                {folders.map(f => <option key={f}>{f}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm">Tus palabras
            <textarea
              required
              className={`${input} mt-1 min-h-56 font-serif text-lg`}
              maxLength={20000}
              value={draft.content}
              onChange={e => {
                setDraft({ ...draft, content: e.target.value });
                try { localStorage.setItem(`draft_${draft.kind}`, e.target.value); } catch {}
              }}
            />
          </label>
          <Button disabled={busy || !draft.content.trim() || (draft.kind !== 'note' && !draft.title.trim())}>
            <Send />{busy ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Enviar'}
          </Button>
          {notice && <p role="status" className="text-sm">{notice}</p>}
        </form>
      </div>
    )}
  </div>;
}