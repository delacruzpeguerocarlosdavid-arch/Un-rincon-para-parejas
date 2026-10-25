/**
 * Configuración de Monetización y Pagos (Santuario Plus / SaaS)
 * Compatible con Stripe Checkout, Lemon Squeezy, Mercado Pago o PayPal
 * Cero costos fijos ($0 upfront)
 */

export interface PricingPlan {
  id: 'monthly' | 'annual' | 'lifetime';
  name: string;
  price: number;
  period: string;
  trialDays?: number;
  discountBadge?: string;
  paymentUrl?: string; // Stripe Payment Link URL
}

export const MONETIZATION_CONFIG = {
  // Puedes pegar tus enlaces directos de Stripe Payment Links o LemonSqueezy aquí:
  stripePaymentLinks: {
    monthly: import.meta.env.VITE_STRIPE_MONTHLY_LINK || '',
    annual: import.meta.env.VITE_STRIPE_ANNUAL_LINK || '',
    lifetime: import.meta.env.VITE_STRIPE_LIFETIME_LINK || '',
  },
  plans: [
    {
      id: 'monthly',
      name: 'Pase Mensual',
      price: 4.99,
      period: '/mes',
    },
    {
      id: 'annual',
      name: 'Pase Anual',
      price: 29.99,
      period: '/año',
      trialDays: 7,
      discountBadge: '50% Ahorro',
    },
    {
      id: 'lifetime',
      name: 'Amor Eterno',
      price: 49.99,
      period: 'pago único',
    },
  ] as PricingPlan[],
};

// Verifica si la sesión actual tiene estatus VIP activo
export function isVipMember(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('sanctuary_vip_status') === 'true';
  } catch {
    return false;
  }
}

// Activa o desactiva el estatus VIP
export function setVipStatus(active: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      localStorage.setItem('sanctuary_vip_status', 'true');
    } else {
      localStorage.removeItem('sanctuary_vip_status');
    }
    window.dispatchEvent(new Event('sanctuary_vip_change'));
  } catch {}
}
