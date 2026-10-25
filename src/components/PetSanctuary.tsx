import { useState, useEffect } from 'react';
import { 
  Heart, Sparkles, Utensils, Bath, Moon, ShoppingBag, 
  Shirt, RefreshCw, Star, Award, ShieldCheck, ChevronRight,
  Smile, Flame, Check
} from 'lucide-react';
import { 
  PET_CATALOG, PetDefinition, PetState, 
  getStoredPetState, savePetState 
} from '@/lib/pet-system';
import { SHOP_CATALOG, ShopItem } from '@/lib/pet-shop-catalog';
import { soundFx } from '@/lib/sound-atmosphere';
import { useCouple } from '@/lib/couple-context';
import { toast } from 'sonner';

export function PetSanctuary() {
  const { couple } = useCouple();
  const [petState, setPetState] = useState<PetState>(getStoredPetState);
  const [activeTab, setActiveTab] = useState<'room' | 'pet_picker' | 'shop' | 'wardrobe'>('room');
  const [shopCategory, setShopCategory] = useState<'food' | 'toy' | 'furniture' | 'outfit'>('food');
  const [isPetting, setIsPetting] = useState(false);
  const [isBathing, setIsBathing] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(petState.customName);

  // Sync state with storage
  useEffect(() => {
    savePetState(petState);
  }, [petState]);

  const currentPetDef: PetDefinition = 
    PET_CATALOG.find((p) => p.id === petState.petId) || PET_CATALOG[0];

  // Actions
  const handlePet = () => {
    setIsPetting(true);
    soundFx.playChime(1.2);
    setPetState((prev) => {
      const nextHappy = Math.min(100, prev.happiness + 10);
      const nextXp = prev.xp + 15;
      const levelUp = nextXp >= prev.level * 100;
      return {
        ...prev,
        happiness: nextHappy,
        xp: levelUp ? 0 : nextXp,
        level: levelUp ? prev.level + 1 : prev.level,
        coins: prev.coins + 5,
      };
    });
    setTimeout(() => setIsPetting(false), 1200);
    toast.success(`¡A ${petState.customName} le encantan sus caricias! (+5 monedas)`);
  };

  const handleFeed = () => {
    // Check if has food in inventory
    const foodItem = SHOP_CATALOG.find(
      (item) => item.category === 'food' && petState.inventory.includes(item.id)
    );

    if (!foodItem) {
      toast.info('No tienes comida en tu bolsa. ¡Ve a la tienda a comprarle delicias!');
      setActiveTab('shop');
      setShopCategory('food');
      return;
    }

    soundFx.playCrunch();
    setPetState((prev) => {
      const remainingInventory = [...prev.inventory];
      const index = remainingInventory.indexOf(foodItem.id);
      if (index > -1) remainingInventory.splice(index, 1);

      return {
        ...prev,
        hunger: Math.min(100, prev.hunger + foodItem.statBoost.amount),
        happiness: Math.min(100, prev.happiness + 15),
        inventory: remainingInventory,
        xp: prev.xp + 20,
      };
    });
    toast.success(`¡Le diste ${foodItem.name} a ${petState.customName}!`);
  };

  const handleBath = () => {
    setIsBathing(true);
    soundFx.playChime(0.9);
    setPetState((prev) => ({
      ...prev,
      hygiene: 100,
      happiness: Math.min(100, prev.happiness + 10),
      coins: prev.coins + 10,
    }));
    setTimeout(() => {
      setIsBathing(false);
      toast.success(`¡Baño de burbujas completado! ${petState.customName} quedó reluciente ✨`);
    }, 1500);
  };

  const handleSleep = () => {
    setIsSleeping(!isSleeping);
    soundFx.playChime(0.8);
    if (!isSleeping) {
      setPetState((prev) => ({
        ...prev,
        energy: 100,
        happiness: Math.min(100, prev.happiness + 15),
      }));
      toast.success(`${petState.customName} está durmiendo plácidamente bajo su manta... 🌙`);
    }
  };

  const handleBuy = (item: ShopItem) => {
    if (petState.coins < item.price) {
      toast.error(`Te faltan ${item.price - petState.coins} monedas de amor. ¡Gánalas jugando juntos!`);
      return;
    }

    soundFx.playChime(1.4);
    setPetState((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
      inventory: [...prev.inventory, item.id],
      happiness: Math.min(100, prev.happiness + 10),
    }));
    toast.success(`¡Compraste ${item.name}! Ya está en su inventario.`);
  };

  const handleSelectPet = (pet: PetDefinition) => {
    soundFx.playChime(1.3);
    setPetState((prev) => ({
      ...prev,
      petId: pet.id,
      customName: pet.name,
    }));
    setNameInput(pet.name);
    setActiveTab('room');
    toast.success(`¡Adoptaron a ${pet.name} (${pet.species}) como su nueva mascota! 💕`);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setPetState((prev) => ({ ...prev, customName: nameInput.trim() }));
      setIsEditingName(false);
      toast.success(`Nuevo nombre guardado: ${nameInput.trim()}`);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Barra superior de monedas y nivel */}
      <div className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 dark:bg-stone-900/70 p-3 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-sm">
            Lv.{petState.level}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-sm font-semibold text-foreground">
                {petState.customName}
              </span>
              <span className="text-[11px] text-muted-foreground font-sans">
                ({currentPetDef.species})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (petState.xp / (petState.level * 100)) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">
                {petState.xp}/{petState.level * 100} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-300 font-sans font-semibold text-xs border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{petState.coins} monedas</span>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'shop' ? 'room' : 'shop')}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Tienda de la Mascota"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navegación de pestañas secundarias */}
      <div className="flex gap-1.5 rounded-2xl bg-muted/50 p-1 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('room')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-serif text-xs font-medium transition-all ${
            activeTab === 'room'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Hogar & Cuidados
        </button>
        <button
          onClick={() => setActiveTab('pet_picker')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-serif text-xs font-medium transition-all ${
            activeTab === 'pet_picker'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Elegir Mascota (12)
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-serif text-xs font-medium transition-all ${
            activeTab === 'shop'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Gran Tienda (30+)
        </button>
      </div>

      {/* VISTA 1: HABITACIÓN & CUIDADOS */}
      {activeTab === 'room' && (
        <div className="space-y-4">
          {/* Escenario de la habitación con atmósfera */}
          <div className={`relative overflow-hidden rounded-3xl border border-white/60 dark:border-stone-800 shadow-xl p-6 text-center transition-all duration-700 min-h-[320px] flex flex-col justify-between ${
            isSleeping 
              ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-stone-950 text-white' 
              : 'bg-gradient-to-b from-amber-50/80 via-rose-50/50 to-orange-50/80 dark:from-stone-900 dark:to-stone-950'
          }`}>
            {/* Detalles decorativos de la habitación */}
            <div className="absolute top-3 left-4 text-xs font-serif italic text-muted-foreground/80 flex items-center gap-1">
              <span>Hogar de {couple.partner1} & {couple.partner2}</span>
            </div>

            {/* Selector de nombre rápido */}
            <div className="pt-2">
              {isEditingName ? (
                <div className="inline-flex items-center gap-2 bg-card/90 rounded-full px-3 py-1 border border-border shadow-sm">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-transparent font-serif text-sm font-semibold text-foreground focus:outline-none w-28 text-center"
                    maxLength={16}
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveName} 
                    className="text-primary hover:scale-110"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
                  title="Haz clic para cambiar el nombre"
                >
                  {petState.customName} ✏️
                </button>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPetDef.tagline}
              </p>
            </div>

            {/* Avatar central interactivo de la mascota */}
            <div className="relative my-6 flex flex-col items-center justify-center">
              {/* Efecto de burbujas de baño */}
              {isBathing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce text-2xl">
                  🫧 🧼 🫧 🛁 🫧
                </div>
              )}

              {/* Efecto de caricias */}
              {isPetting && (
                <div className="absolute -top-6 flex gap-2 text-rose-500 animate-pulse text-xl pointer-events-none">
                  💖 💕 💓 ✨
                </div>
              )}

              {/* Efecto de sueño */}
              {isSleeping && (
                <div className="absolute -top-4 right-1/4 text-indigo-300 font-serif italic text-lg animate-pulse">
                  Zzz... 🌙
                </div>
              )}

              {/* Personaje visual grande */}
              <button
                onClick={handlePet}
                className={`relative group transform transition-all duration-300 focus:outline-none ${
                  isPetting ? 'scale-110 rotate-3' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-white/90 to-amber-100/80 dark:from-stone-800 dark:to-stone-700 shadow-2xl border-4 border-white/80 dark:border-stone-600">
                  <span className="text-7xl select-none filter drop-shadow-md">
                    {currentPetDef.emoji}
                  </span>
                </div>
                <span className="absolute -bottom-2 bg-primary/90 text-primary-foreground text-[10px] font-sans font-medium px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  ¡Acaríciame!
                </span>
              </button>
            </div>

            {/* Barras de estadísticas vitales */}
            <div className="grid grid-cols-4 gap-2 bg-card/60 dark:bg-card/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/40 dark:border-stone-800">
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 font-sans">
                  <Heart className="w-2.5 h-2.5 text-rose-500" /> Amor
                </span>
                <span className="font-serif font-bold text-xs text-foreground">
                  {petState.happiness}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 font-sans">
                  <Utensils className="w-2.5 h-2.5 text-amber-500" /> Hambre
                </span>
                <span className="font-serif font-bold text-xs text-foreground">
                  {petState.hunger}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 font-sans">
                  <Bath className="w-2.5 h-2.5 text-cyan-500" /> Higiene
                </span>
                <span className="font-serif font-bold text-xs text-foreground">
                  {petState.hygiene}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 font-sans">
                  <Moon className="w-2.5 h-2.5 text-indigo-400" /> Sueño
                </span>
                <span className="font-serif font-bold text-xs text-foreground">
                  {petState.energy}%
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción directa */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handlePet}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-rose-200/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shadow-sm active:scale-95"
            >
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-serif font-medium text-foreground">Acariciar</span>
            </button>
            <button
              onClick={handleFeed}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-amber-200/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all shadow-sm active:scale-95"
            >
              <Utensils className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-serif font-medium text-foreground">Alimentar</span>
            </button>
            <button
              onClick={handleBath}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-cyan-200/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all shadow-sm active:scale-95"
            >
              <Bath className="w-5 h-5 text-cyan-500" />
              <span className="text-xs font-serif font-medium text-foreground">Bañar</span>
            </button>
            <button
              onClick={handleSleep}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all shadow-sm active:scale-95 ${
                isSleeping 
                  ? 'bg-indigo-900 border-indigo-700 text-white' 
                  : 'bg-card border-indigo-200/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-foreground'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-serif font-medium">
                {isSleeping ? 'Despertar' : 'Dormir'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA 2: SELECTOR DE 12 MASCOTAS */}
      {activeTab === 'pet_picker' && (
        <div className="space-y-3">
          <div className="text-center pb-2">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Elige a su Compañero de Vida
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              12 adorables mascotas para criar, mimar y acompañar su amor diario.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PET_CATALOG.map((pet) => {
              const isSelected = pet.id === petState.petId;
              return (
                <div
                  key={pet.id}
                  onClick={() => handleSelectPet(pet)}
                  className={`relative p-4 rounded-3xl border text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-sm ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30'
                      : 'border-white/60 dark:border-stone-800 bg-card/80 hover:bg-card'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-primary text-primary-foreground p-1 text-[10px]">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className="text-5xl block mb-2">{pet.emoji}</span>
                  <h3 className="font-serif font-bold text-base text-foreground">
                    {pet.name}
                  </h3>
                  <p className="text-[11px] font-sans font-medium text-primary">
                    {pet.species}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                    {pet.tagline}
                  </p>
                  <button className="mt-3 w-full py-1 rounded-xl bg-card border border-border text-[11px] font-serif font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    {isSelected ? 'Mascota Actual' : 'Adoptar Juntos'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: GRAN TIENDA EXPANDIDA */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Boutique del Amor
              </h2>
              <p className="text-xs text-muted-foreground">
                30+ delicias, muebles de mansión y accesorios para consentir a su mascota.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-300 font-semibold text-xs border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{petState.coins} monedas</span>
            </div>
          </div>

          {/* Categorías de la tienda */}
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-muted/60 p-1">
            <button
              onClick={() => setShopCategory('food')}
              className={`py-1.5 rounded-xl font-serif text-xs transition-all ${
                shopCategory === 'food' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              🍓 Delicias
            </button>
            <button
              onClick={() => setShopCategory('toy')}
              className={`py-1.5 rounded-xl font-serif text-xs transition-all ${
                shopCategory === 'toy' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              🧶 Juguetes
            </button>
            <button
              onClick={() => setShopCategory('furniture')}
              className={`py-1.5 rounded-xl font-serif text-xs transition-all ${
                shopCategory === 'furniture' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              🛋️ Muebles
            </button>
            <button
              onClick={() => setShopCategory('outfit')}
              className={`py-1.5 rounded-xl font-serif text-xs transition-all ${
                shopCategory === 'outfit' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              👑 Realeza
            </button>
          </div>

          {/* Lista de artículos de la categoría seleccionada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHOP_CATALOG.filter((item) => item.category === shopCategory).map((item) => {
              const alreadyOwned = petState.inventory.includes(item.id);
              const canAfford = petState.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl border border-white/60 dark:border-stone-800 bg-card/90 backdrop-blur-md shadow-sm flex items-start gap-3.5"
                >
                  <span className="text-4xl shrink-0 p-2 rounded-2xl bg-muted/50">
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-semibold text-sm text-foreground truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                    <span className="inline-block mt-1 font-sans text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.benefit}
                    </span>
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="font-serif font-bold text-amber-600 dark:text-amber-400 text-xs">
                        💰 {item.price} monedas
                      </span>
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={alreadyOwned && item.category !== 'food'}
                        className={`px-3 py-1 rounded-xl text-xs font-serif font-medium transition-all ${
                          alreadyOwned && item.category !== 'food'
                            ? 'bg-muted text-muted-foreground cursor-default'
                            : canAfford
                            ? 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-sm'
                            : 'bg-muted text-muted-foreground opacity-60'
                        }`}
                      >
                        {alreadyOwned && item.category !== 'food' ? 'En bolsa' : 'Comprar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
