import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BookHeart, LogIn } from 'lucide-react';
import { membershipOptions } from '@/lib/message-bank';
import { Button } from '@/components/ui/button';
export function AccountLink() {
  const { data } = useQuery(membershipOptions);
  return <div className="mb-3 flex justify-end"><Button asChild variant="ghost" size="sm"><Link to={data ? '/espacio' : '/auth'}>{data ? <BookHeart /> : <LogIn />}{data ? 'Nuestro espacio' : 'Entrar'}</Link></Button></div>;
}