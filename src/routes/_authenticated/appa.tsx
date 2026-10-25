import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/AppShell';
import { PetSanctuary } from '@/components/PetSanctuary';
import { useCouple } from '@/lib/couple-context';

export const Route = createFileRoute('/_authenticated/appa')({
  head: () => ({
    meta: [
      { title: 'Nuestra Mascota · Un Rincón Para Parejas' },
      { name: 'description', content: 'Adopten y cuiden a su mascota virtual compartida: 12 mascotas para elegir, delicias, juegos y tienda de accesorios.' },
      { property: 'og:title', content: 'Nuestra Mascota · Un Rincón Para Parejas' },
    ],
  }),
  component: MascotaPage,
});

function MascotaPage() {
  const { couple } = useCouple();

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Nuestra Mascota Virtual" 
        subtitle={`El fiel compañero de ${couple.partner1} y ${couple.partner2}. ¡Cuídenlo, aliméntenlo y consiéntanlo juntos!`} 
      />
      <PetSanctuary />
    </div>
  );
}
