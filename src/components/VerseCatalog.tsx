import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { field } from '@/components/Stage3Parts';
import { searchVerses, verseCategories, type VerseCategory } from '@/lib/bible-verses';

export function VerseCatalog() {
  const [category, setCategory] = useState<VerseCategory | 'Todos'>('Todos');
  const [search, setSearch] = useState('');
  const list = searchVerses(category, search);
  return <section aria-label="Catálogo de versículos" className="space-y-4">
    <header><h2 className="flex items-center gap-2 text-3xl"><BookOpen className="h-5 w-5 text-primary" />Palabras de vida</h2><p className="mt-1 text-xs text-muted-foreground">Nueva Traducción Viviente (NTV) · 90 versículos · Palabras de paz y amor</p></header>
    <div className="flex flex-wrap gap-2" aria-label="Categorías de versículos">{(['Todos', ...verseCategories] as const).map(c => <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</Button>)}</div>
    <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${field} pl-9`} aria-label="Buscar versículos" placeholder="Buscar palabras o una cita…" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <p className="text-xs text-muted-foreground" role="status">{list.length} {list.length === 1 ? 'versículo' : 'versículos'}</p>
    {!list.length ? <p className="py-8 text-center font-serif text-xl text-muted-foreground">No hay versículos que coincidan.</p> : <ul className="space-y-4">{list.map(v => <li key={`${v.category}:${v.reference}`} className="border-l-2 border-primary/40 pl-4"><p className="text-xs text-muted-foreground">{v.category}</p><blockquote className="mt-1 break-words font-serif text-xl leading-relaxed">{v.text}</blockquote><p className="mt-2 text-sm text-primary">{v.reference}</p></li>)}</ul>}
    <p className="inline-block text-xs text-muted-foreground">Santa Biblia, Nueva Traducción Viviente (NTV) © Tyndale House Foundation</p>
  </section>;
}