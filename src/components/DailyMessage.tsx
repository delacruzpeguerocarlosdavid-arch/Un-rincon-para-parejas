import { useQuery } from '@tanstack/react-query';
import { dailyOptions, membershipOptions } from '@/lib/message-bank';
import { ScratchDailyCard } from '@/components/ScratchDailyCard';
import { useCouple } from '@/lib/couple-context';

const UNIVERSAL_DAILY_MESSAGES = [
  "Hoy quiero recordarte que eres mi lugar seguro en este mundo. En tus brazos todo encuentra su paz.",
  "Tu sonrisa tiene el poder inexplicable de transformar cualquier día difícil en un momento luminoso.",
  "Agradezco cada instante a tu lado: las grandes aventuras, pero sobre todo las risas cómplices en silencio.",
  "Si volviera a comenzar mi vida desde cero, te buscaría mucho antes para amarte más tiempo.",
  "Gracias por elegirme cada día, por tu paciencia infinita y por hacer que amarte sea lo más fácil del mundo.",
  "No hay distancia, cansancio ni rutina que pueda apagar lo que siento por ti. Mi corazón late a tu ritmo.",
  "Eres mi oración contestada, el sueño que no sabía que tenía y la realidad más bonita que vivo hoy.",
];

export function DailyMessage() {
  const member = useQuery(membershipOptions);
  const daily = useQuery({ ...dailyOptions, enabled: Boolean(member?.data) });
  const { couple } = useCouple();

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const fallbackMessage = UNIVERSAL_DAILY_MESSAGES[dayOfYear % UNIVERSAL_DAILY_MESSAGES.length];

  const content = daily.data?.content || fallbackMessage;
  const category = daily.data?.category || "Amor Incondicional";
  const day = daily.data?.day || (dayOfYear % 365) + 1;

  return (
    <ScratchDailyCard
      content={content}
      category={category}
      day={day}
      partnerName={couple.partner2}
    />
  );
}
