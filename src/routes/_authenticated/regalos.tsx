import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeviGifts } from '@/components/LeviGifts';

export const Route = createFileRoute('/_authenticated/regalos')({
  head: () => ({
    meta: [
      { title: 'Regalos de Levi · Un lugar para nosotros dos' },
      { name: 'description', content: 'Detalles sobrios, distinguidos y especiales inspirados en Levi Ackerman.' },
      { property: 'og:title', content: 'Regalos de Honor y Devoción' },
      { property: 'og:description', content: 'Obsequios mutuos para consentirnos con elegancia.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: RegalosPage,
});

function RegalosPage() {
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="mb-1">
        <Link to="/espacio">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Nuestro espacio
        </Link>
      </Button>
      <LeviGifts />
    </div>
  );
}
