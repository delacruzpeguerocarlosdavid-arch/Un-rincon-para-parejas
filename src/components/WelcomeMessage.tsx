import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { membershipOptions, spaceStatusOptions } from '@/lib/message-bank';
import { correspondenceOptions, welcomeText } from '@/lib/correspondence';

export function WelcomeMessage() {
  const member = useQuery(membershipOptions);
  const status = useQuery({ ...spaceStatusOptions, enabled: Boolean(member.data) });
  const words = useQuery({ ...correspondenceOptions, enabled: Boolean(member.data) });
  const admin = status.data?.members.find(p => p.role === 'admin');
  const welcome = welcomeText(words.data?.texts ?? [], admin?.user_id);
  if (!member.data || !welcome) return null;
  return <section aria-label="Bienvenida de Carlito" className="border-y border-border py-5">
    <div className="mb-3 flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /><h2 className="text-3xl">{welcome.title}</h2></div>
    <p className="whitespace-pre-wrap break-words font-serif text-xl leading-relaxed">{welcome.content}</p>
    <p className="mt-3 text-sm text-muted-foreground">Para Mimie · De Carlito</p>
    <div className="mt-2 flex flex-wrap gap-2"><Button asChild variant="link" className="px-0"><Link to="/sentimientos"><Heart />Cómo me siento</Link></Button><Button asChild variant="link" className="px-0"><Link to="/conversacion"><Mail />Escribirle a Carlito</Link></Button></div>
  </section>;
}