export interface PetDefinition {
  id: string;
  name: string;
  species: string;
  emoji: string;
  avatarUrl?: string;
  tagline: string;
  personality: string;
  favoriteFood: string;
  primaryColor: string;
  secondaryColor: string;
  soundType: 'meow' | 'bark' | 'chirp' | 'purr' | 'squeak' | 'hum';
}

export const PET_CATALOG: PetDefinition[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'Gatito Calicó',
    emoji: '🐱',
    tagline: 'Amoroso, mimoso y le encanta ronronear en su regazo.',
    personality: 'Cariñoso & Observador',
    favoriteFood: 'Tazón de leche cremosa y salmón fresco',
    primaryColor: '#FBBF24',
    secondaryColor: '#FEF3C7',
    soundType: 'purr',
  },
  {
    id: 'shiba',
    name: 'Haru',
    species: 'Cachorrito Shiba Inu',
    emoji: '🐶',
    tagline: 'Fiel, siempre alegre de verlos y con energía contagiosa.',
    personality: 'Leal & Juguetón',
    favoriteFood: 'Galletitas horneadas con forma de huesito',
    primaryColor: '#F97316',
    secondaryColor: '#FFEDD5',
    soundType: 'bark',
  },
  {
    id: 'kuma',
    name: 'Kuma',
    species: 'Osito de Felpa',
    emoji: '🐻',
    tagline: 'El rey de los abrazos suaves en noches de frío.',
    personality: 'Protector & Dulce',
    favoriteFood: 'Tostada de pan brioche con miel dorada',
    primaryColor: '#B45309',
    secondaryColor: '#FDE68A',
    soundType: 'hum',
  },
  {
    id: 'copo',
    name: 'Copo',
    species: 'Conejito Blanco',
    emoji: '🐰',
    tagline: 'Orejitas inquietas que saltan de felicidad cuando están juntos.',
    personality: 'Curioso & Tierno',
    favoriteFood: 'Fresas silvestres y hojas de menta fresca',
    primaryColor: '#EC4899',
    secondaryColor: '#FCE7F3',
    soundType: 'squeak',
  },
  {
    id: 'kitsune',
    name: 'Canela',
    species: 'Zorrito de Otoño',
    emoji: '🦊',
    tagline: 'Espíritu libre con cola esponjosa y ojos brillantes.',
    personality: 'Astuto & Afectuoso',
    favoriteFood: 'Bayas de bosque y pastel de manzana caliente',
    primaryColor: '#EA580C',
    secondaryColor: '#FFEDD5',
    soundType: 'chirp',
  },
  {
    id: 'bambu',
    name: 'Bambú',
    species: 'Pandita Bebé',
    emoji: '🐼',
    tagline: 'Rueda de un lado a otro y ama las siestas compartidas.',
    personality: 'Tranquilo & Glotón',
    favoriteFood: 'Brotes tiernos de bambú dulce',
    primaryColor: '#1F2937',
    secondaryColor: '#F3F4F6',
    soundType: 'hum',
  },
  {
    id: 'pingu',
    name: 'Pipo',
    species: 'Pingüinito Polar',
    emoji: '🐧',
    tagline: 'Camina dando pasitos tiernos y siempre busca su compañía.',
    personality: 'Elegante & Travieso',
    favoriteFood: 'Pescadito ártico y cubitos de hielo de frutas',
    primaryColor: '#0EA5E9',
    secondaryColor: '#E0F2FE',
    soundType: 'chirp',
  },
  {
    id: 'koko',
    name: 'Koko',
    species: 'Koalita de las Nubes',
    emoji: '🐨',
    tagline: 'Dormir abrazado a ustedes es su mayor pasatiempo.',
    personality: 'Sereno & Soñador',
    favoriteFood: 'Hojas tiernas de eucalipto con rocío matutino',
    primaryColor: '#6B7280',
    secondaryColor: '#F3F4F6',
    soundType: 'hum',
  },
  {
    id: 'ludo',
    name: 'Ludo',
    species: 'Nutria Enamorada',
    emoji: '🦦',
    tagline: 'Se toma de las patitas para no separarse jamás en la corriente.',
    personality: 'Romántico & Alegre',
    favoriteFood: 'Cerezas dulces y almejitas de río',
    primaryColor: '#78350F',
    secondaryColor: '#FEF3C7',
    soundType: 'squeak',
  },
  {
    id: 'pompon',
    name: 'Pompón',
    species: 'Hámster Redondito',
    emoji: '🐹',
    tagline: 'Guarda pedacitos de amor en sus mejillas infladas.',
    personality: 'Divertido & Activo',
    favoriteFood: 'Semillitas de girasol y nueces caramelizadas',
    primaryColor: '#D97706',
    secondaryColor: '#FEF3C7',
    soundType: 'squeak',
  },
  {
    id: 'apolo',
    name: 'Apolo',
    species: 'Golden Retriever',
    emoji: '🐕',
    tagline: 'Mueve la cola sin parar cada vez que abren la aplicación.',
    personality: 'Devoto & Noble',
    favoriteFood: 'Trozo de queso gouda y bocaditos de carne tierna',
    primaryColor: '#CA8A04',
    secondaryColor: '#FEF08A',
    soundType: 'bark',
  },
  {
    id: 'spike',
    name: 'Spike',
    species: 'Erizito Dulce',
    emoji: '🦔',
    tagline: 'Espinitas suaves cuando recibe caricias de su pareja favorita.',
    personality: 'Sensible & Hogareño',
    favoriteFood: 'Manzanas asadas con canela y miel',
    primaryColor: '#854D0E',
    secondaryColor: '#FEF3C7',
    soundType: 'chirp',
  },
];

export interface PetState {
  petId: string;
  customName: string;
  happiness: number; // 0 - 100
  hunger: number;    // 0 - 100 (100 = full)
  hygiene: number;   // 0 - 100
  energy: number;    // 0 - 100
  level: number;
  xp: number;
  coins: number;
  currentOutfit: string;
  currentRoomTheme: string;
  inventory: string[];
}

const STORAGE_KEY = 'rincon_pet_state_v2';

export const DEFAULT_PET_STATE: PetState = {
  petId: 'mochi',
  customName: 'Mochi',
  happiness: 90,
  hunger: 85,
  hygiene: 95,
  energy: 88,
  level: 3,
  xp: 140,
  coins: 450,
  currentOutfit: 'default',
  currentRoomTheme: 'french_salon',
  inventory: ['food_strawberry', 'toy_ball', 'furn_fireplace'],
};

export function getStoredPetState(): PetState {
  if (typeof window === 'undefined') return DEFAULT_PET_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PET_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PET_STATE, ...parsed };
  } catch {
    return DEFAULT_PET_STATE;
  }
}

export function savePetState(state: PetState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
