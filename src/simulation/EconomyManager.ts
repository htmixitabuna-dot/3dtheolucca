import { 
  CurrencyType, 
  PlayerWallet, 
  EconomyTransaction, 
  StoreProduct, 
  StoreCategory, 
  InventoryItem, 
  InventoryCategory, 
  AdminPackage 
} from '../types/economy';

// Catálogo padrão de produtos da Esmeralda Store (Estilo Free Fire)
const DEFAULT_STORE_PRODUCTS: StoreProduct[] = [
  // 1. PRODUTOS EM DESTAQUE (FREE FIRE HIGHLIGHTS)
  {
    id: 'prod_conjunto_esportivo',
    name: 'Conjunto Esportivo Black Crown',
    description: 'Estilo clássico e atitude para você dominar a cidade! Regata hoodie preta com coroa real, bermuda street e tênis esportivo bicolor.',
    category: 'destaques',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 250, diamonds: 50, emeralds: 60 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🎽',
    subItems: [
      { name: 'Regata Sport Hoodie', icon: '🎽', part: 'Tronco' },
      { name: 'Bermuda Streetwear', icon: '🩳', part: 'Pernas' },
      { name: 'Tênis Esportivo Bicolor', icon: '👟', part: 'Pés' }
    ],
    customizationData: { 
      shirtColor: '#18181b', 
      pantsColor: '#18181b', 
      shoeColor: '#09090b', 
      shirtDecal: 'crown', 
      hasCap: false, 
      hasGlasses: true, 
      glassesColor: '#09090b' 
    },
  },
  {
    id: 'prod_conjunto_neon_lime',
    name: 'Conjunto Neon Lime Street',
    description: 'Visual vibrante verde neon de alta velocidade! Regata com raio luminoso, bermuda escura e sneakers fluorescentes.',
    category: 'destaques',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 380, diamonds: 85, emeralds: 70 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '⚡',
    subItems: [
      { name: 'Regata Neon Pulse', icon: '🎽', part: 'Tronco' },
      { name: 'Bermuda Cyber Black', icon: '🩳', part: 'Pernas' },
      { name: 'Sneakers Neon Glow', icon: '👟', part: 'Pés' }
    ],
    customizationData: { 
      shirtColor: '#84cc16', 
      pantsColor: '#0f172a', 
      shoeColor: '#a3e635', 
      shirtDecal: 'lightning', 
      hasCap: false, 
      hasGlasses: true, 
      glassesColor: '#4d7c0f' 
    },
  },
  {
    id: 'prod_conjunto_cyber_blue',
    name: 'Conjunto Cyber Samurai Azul',
    description: 'Armadura esportiva cibernética azul royal com detalhes em ciano reluzente e óculos de realidade aumentada.',
    category: 'destaques',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 420, diamonds: 95, emeralds: 85 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '💠',
    subItems: [
      { name: 'Colete Cyber Blue', icon: '🎽', part: 'Tronco' },
      { name: 'Calça Tática Ciano', icon: '👖', part: 'Pernas' },
      { name: 'Lentes Holográficas', icon: '🕶️', part: 'Rosto' }
    ],
    customizationData: { 
      shirtColor: '#0284c7', 
      pantsColor: '#0f172a', 
      shoeColor: '#06b6d4', 
      shirtDecal: 'diamond', 
      hasCap: false, 
      hasGlasses: true, 
      glassesColor: '#0ea5e9' 
    },
  },
  {
    id: 'prod_conjunto_fire_red',
    name: 'Conjunto Dragão de Fogo',
    description: 'Conjunto incandescente vermelho fúria com detalhes dourados e brasão flamejante no peito.',
    category: 'destaques',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 450, diamonds: 100, emeralds: 90 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🔥',
    subItems: [
      { name: 'Regata Dragon Flame', icon: '🎽', part: 'Tronco' },
      { name: 'Bermuda Fúria Rubra', icon: '🩳', part: 'Pernas' },
      { name: 'Sneakers Fire Boost', icon: '👟', part: 'Pés' }
    ],
    customizationData: { 
      shirtColor: '#dc2626', 
      pantsColor: '#7f1d1d', 
      shoeColor: '#f97316', 
      shirtDecal: 'fire', 
      hasCap: false, 
      hasGlasses: true, 
      glassesColor: '#991b1b' 
    },
  },
  {
    id: 'prod_conjunto_realeza_gold',
    name: 'Conjunto Ouro Imperial Real',
    description: 'Traje majestoso folheado a fios de ouro 24k com coroa reluzente e tênis imperial dos grandes mestres.',
    category: 'destaques',
    rarity: 'lendario',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 150, emeralds: 120 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👑',
    subItems: [
      { name: 'Túnica Ouro Nobre', icon: '🎽', part: 'Tronco' },
      { name: 'Calça Alva Real', icon: '👖', part: 'Pernas' },
      { name: 'Coroa Imperial Ouro', icon: '👑', part: 'Cabeça' }
    ],
    customizationData: { 
      shirtColor: '#f59e0b', 
      pantsColor: '#f8fafc', 
      shoeColor: '#fbbf24', 
      shirtDecal: 'crown', 
      hasCap: true,
      capColor: '#f59e0b',
      hasGlasses: true, 
      glassesColor: '#d97706' 
    },
  },
  {
    id: 'prod_jaqueta_urbana',
    name: 'Jaqueta Urbana Red Fire',
    description: 'Jaqueta esportiva streetstyle vermelha e preta de alta qualidade com acabamento de corrida.',
    category: 'roupas',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 350, diamonds: 80, emeralds: 75 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧥',
    subItems: [
      { name: 'Jaqueta Red Fire', icon: '🧥', part: 'Tronco' },
      { name: 'Calça Cargo Urbana', icon: '👖', part: 'Pernas' },
      { name: 'Tênis Sneaker Branco', icon: '👟', part: 'Pés' }
    ],
    customizationData: { shirtColor: '#dc2626', pantsColor: '#1e293b', shoeColor: '#f8fafc', shirtDecal: 'fire' },
  },
  {
    id: 'prod_jaqueta_shadow_black',
    name: 'Jaqueta Couro Shadow Black',
    description: 'Jaqueta em couro preto fosco com forro acolchoado e zíperes metálicos de corrida noturna.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 320, diamonds: 70, emeralds: 60 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧥',
    subItems: [
      { name: 'Jaqueta Couro Noturna', icon: '🧥', part: 'Tronco' },
      { name: 'Calça Jeans Rasgada', icon: '👖', part: 'Pernas' },
      { name: 'Botas Black Leather', icon: '🥾', part: 'Pés' }
    ],
    customizationData: { shirtColor: '#09090b', pantsColor: '#18181b', shoeColor: '#09090b', shirtDecal: 'skull' },
  },
  {
    id: 'prod_moletom_galaxy_purple',
    name: 'Moletom Galáxia Noturna',
    description: 'Moletom roxo cósmico com estampas estelares cintilantes e tecido térmico respirável.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 290, diamonds: 60, emeralds: 50 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🌌',
    subItems: [
      { name: 'Moletom Nebulosa', icon: '🧥', part: 'Tronco' },
      { name: 'Calça Street Dark', icon: '👖', part: 'Pernas' },
      { name: 'Tênis Roxo Neon', icon: '👟', part: 'Pés' }
    ],
    customizationData: { shirtColor: '#7e22ce', pantsColor: '#3b0764', shoeColor: '#a855f7', shirtDecal: 'star' },
  },
  {
    id: 'prod_moletom_camo_military',
    name: 'Moletom Tático Camuflado',
    description: 'Estampa camuflada militar verde e cinza com tecido reforçado à prova de vento.',
    category: 'roupas',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 210, diamonds: 40 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🪖',
    subItems: [
      { name: 'Moletom Camo Verde', icon: '🧥', part: 'Tronco' },
      { name: 'Calça Cargo Militar', icon: '👖', part: 'Pernas' },
      { name: 'Coturno Tático', icon: '🥾', part: 'Pés' }
    ],
    customizationData: { shirtColor: '#3f6212', pantsColor: '#1c1917', shoeColor: '#292524', shirtDecal: 'none' },
  },
  {
    id: 'prod_bone_premium',
    name: 'Boné Premium Crown Black',
    description: 'Boné preto com bordado de coroa da realeza urbana e aba curva anatômica.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 120, diamonds: 25, emeralds: 20 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧢',
    subItems: [
      { name: 'Boné Crown Black', icon: '🧢', part: 'Cabeça' },
      { name: 'Bordado Coroa Real', icon: '👑', part: 'Detalhe' },
      { name: 'Ajuste Anatômico', icon: '✨', part: 'Conforto' }
    ],
    customizationData: { hasCap: true, capColor: '#18181b', capStyle: 'forward' },
  },
  {
    id: 'prod_bone_gold_champion',
    name: 'Boné Dourado Campeão',
    description: 'Boné dourado reluzente exclusivo dos campeões da Cidade Real!',
    category: 'roupas',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 220, emeralds: 25 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧢',
    subItems: [
      { name: 'Aba Ouro Metálico', icon: '🧢', part: 'Aba' },
      { name: 'Brasão Vitória', icon: '⭐', part: 'Frente' }
    ],
    customizationData: { hasCap: true, capColor: '#f59e0b', capStyle: 'forward' },
  },
  {
    id: 'prod_bone_retro_blue',
    name: 'Boné Retrô Azul Royal',
    description: 'Boné clássico em sarja azul royal com bordado vintage.',
    category: 'roupas',
    rarity: 'comum',
    allowedCurrencies: ['gold'],
    prices: { gold: 60 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧢',
    customizationData: { hasCap: true, capColor: '#1d4ed8', capStyle: 'forward' },
  },
  {
    id: 'prod_bone_backward_black',
    name: 'Boné Aba Invertida Skater',
    description: 'Boné preto virado para trás no puro estilo skater urbano!',
    category: 'roupas',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 110, diamonds: 15 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🧢',
    customizationData: { hasCap: true, capColor: '#0f172a', capStyle: 'backward' },
  },
  {
    id: 'prod_oculos_style',
    name: 'Óculos Style Black Matte',
    description: 'Armação moderna escura para curtir o sol na cidade com máxima presença.',
    category: 'roupas',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 80, diamonds: 15, emeralds: 12 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🕶️',
    subItems: [
      { name: 'Lentes Polarizadas', icon: '🕶️', part: 'Rosto' },
      { name: 'Armação Black Matte', icon: '✨', part: 'Armação' },
      { name: 'Proteção Solar UV400', icon: '☀️', part: 'Lentes' }
    ],
    customizationData: { hasGlasses: true, glassesColor: '#09090b' },
  },
  {
    id: 'prod_oculos_cyber_neon',
    name: 'Óculos Cyberpunk Ciano Neon',
    description: 'Visor cibernético com HUD holográfico translúcido ciano brilhante.',
    category: 'roupas',
    rarity: 'lendario',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 35, emeralds: 30 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🥽',
    subItems: [
      { name: 'Lentes Holográficas', icon: '🥽', part: 'Lentes' },
      { name: 'Circuito Integrado', icon: '⚡', part: 'Haste' }
    ],
    customizationData: { hasGlasses: true, glassesColor: '#06b6d4' },
  },
  {
    id: 'prod_oculos_aviador_gold',
    name: 'Óculos Aviador Ouro Nobre',
    description: 'Clássico modelo aviador com armação dourada fina e lentes espelhadas âmbar.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 160, diamonds: 25 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🕶️',
    customizationData: { hasGlasses: true, glassesColor: '#f59e0b' },
  },
  {
    id: 'prod_tenis_fire_boost',
    name: 'Sneakers Fire Boost Chamas',
    description: 'Tênis esportivo vermelho vibrante com solado de alta absorção e faixas dinâmicas.',
    category: 'roupas',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 190, diamonds: 35, emeralds: 30 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👟',
    customizationData: { shoeColor: '#dc2626' },
  },
  {
    id: 'prod_tenis_cyber_led',
    name: 'Sneakers Cyber LED Ciano',
    description: 'Tênis futurista com iluminação de LED azul ciano contínua na entressola.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 175, diamonds: 30 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👟',
    customizationData: { shoeColor: '#06b6d4' },
  },
  {
    id: 'prod_tenis_sneaker_white',
    name: 'Sneaker Chunky Branco Alvo',
    description: 'O clássico sneaker branco streetwear que combina com qualquer conjunto.',
    category: 'roupas',
    rarity: 'raro',
    allowedCurrencies: ['gold'],
    prices: { gold: 90 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👟',
    customizationData: { shoeColor: '#f8fafc' },
  },
  {
    id: 'prod_headset_rgb_rainbow',
    name: 'Fone Gamer Rainbow RGB',
    description: 'Headset profissional com arco luminoso RGB e som espacial 7.1.',
    category: 'roupas',
    rarity: 'epico',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 30, emeralds: 25 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🎧',
    customizationData: { hasHeadphones: true, headphonesColor: '#a855f7' },
  },
  {
    id: 'prod_mochila_tatica_militar',
    name: 'Mochila Militar Camuflada',
    description: 'Mochila tática com múltiplos compartimentos e tecido balístico.',
    category: 'roupas',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 120, diamonds: 20 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🎒',
    customizationData: { hasBackpack: true, backpackColor: '#365314' },
  },
  {
    id: 'prod_mochila_cyber_hologram',
    name: 'Mochila Holográfica LED',
    description: 'Mochila futurista com painel de LED customizável nas costas.',
    category: 'roupas',
    rarity: 'lendario',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 40, emeralds: 35 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🎒',
    customizationData: { hasBackpack: true, backpackColor: '#06b6d4' },
  },

  // 2. GARAGEM (Carros, Motos e Veículos Esportivos)
  {
    id: 'prod_carro_esportivo_red',
    name: 'Carro Esportivo V12 Vermelho',
    description: 'Supercarro esportivo vermelho fúria com motor V12 turbo e suspensão aerodinâmica rebaixada.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 600, diamonds: 120, emeralds: 100 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏎️',
    subItems: [
      { name: 'Motor V12 Turbocharged', icon: '⚡', part: 'Motor' },
      { name: 'Pintura Vermelho Fúria', icon: '🎨', part: 'Carroceria' },
      { name: 'Rodas Aro 20 Forjadas', icon: '⚙️', part: 'Rodas' }
    ],
  },
  {
    id: 'prod_carro_esportivo_blue',
    name: 'Carro Esportivo V12 Azul Relâmpago',
    description: 'Supercarro com pintura azul metálica perolizada e aerofólio em fibra de carbono.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 620, diamonds: 125, emeralds: 105 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏎️',
    subItems: [
      { name: 'Pintura Azul Metálica', icon: '🎨', part: 'Carroceria' },
      { name: 'Aerofólio Carbono', icon: '🏁', part: 'Traseira' },
      { name: 'Pinças Freio Ciano', icon: '🛑', part: 'Freios' }
    ],
  },
  {
    id: 'prod_carro_esportivo_black',
    name: 'Carro Esportivo Black Phantom',
    description: 'Supercarro esportivo preto fosco com faróis de xênon e escape quádruplo esportivo.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 650, diamonds: 130, emeralds: 110 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏎️',
    subItems: [
      { name: 'Pintura Preto Fosco', icon: '🎨', part: 'Carroceria' },
      { name: 'Faróis Xênon LED', icon: '💡', part: 'Frente' },
      { name: 'Vidros Fumê G5', icon: '🪟', part: 'Vidros' }
    ],
  },
  {
    id: 'prod_carro_esportivo_gold',
    name: 'Supercarro Ouro Maciço 24k',
    description: 'Veículo de luxo extremo totalmente folheado a ouro 24k com interior em couro branco.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 160 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    icon: '👑',
    subItems: [
      { name: 'Banho de Ouro 24k', icon: '✨', part: 'Lataria' },
      { name: 'Bancos Couro Nobre', icon: '💺', part: 'Interior' }
    ],
  },
  {
    id: 'prod_moto_street_super',
    name: 'Moto Street 1000cc Vermelha',
    description: 'Supermoto esportiva vermelha de 1000cc para acelerar e rasgar o asfalto das avenidas.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 520, diamonds: 100, emeralds: 85 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏍️',
    subItems: [
      { name: 'Escapamento Esportivo', icon: '💨', part: 'Escape' },
      { name: 'Carenagem Aerodinâmica', icon: '🏁', part: 'Frente' },
      { name: 'Freios ABS de Competição', icon: '🛑', part: 'Segurança' }
    ],
  },
  {
    id: 'prod_moto_ninja_green',
    name: 'Moto Ninja SuperSport Verde',
    description: 'Motocicleta super esportiva verde perolizada com torque instantâneo para curvas precisas.',
    category: 'garagem',
    rarity: 'lendario',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 540, diamonds: 105, emeralds: 90 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏍️',
    subItems: [
      { name: 'Motor 4 Cilindros', icon: '⚡', part: 'Motor' },
      { name: 'Carenagem Verde Ninja', icon: '🎨', part: 'Visual' }
    ],
  },
  {
    id: 'prod_picape_monster_4x4',
    name: 'Picape Monster 4x4 Off-Road',
    description: 'Caminhonete robusta com tração nas 4 rodas, pneus lameiros aro 35 e suspensão elevada.',
    category: 'garagem',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 480, diamonds: 85 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🛻',
    subItems: [
      { name: 'Tração 4x4 Reduzida', icon: '⚙️', part: 'Transmissão' },
      { name: 'Pneus Fora de Estrada', icon: '🛞', part: 'Rodas' }
    ],
  },
  {
    id: 'prod_fusquinha_turbo_amarelo',
    name: 'Fusquinha Custom Turbo Amarelo',
    description: 'O clássico mais amado do Brasil customizado com motor boxer turbo e escapamento esportivo!',
    category: 'garagem',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 280, diamonds: 45 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🚗',
    subItems: [
      { name: 'Motor Boxer Turbo', icon: '⚡', part: 'Motor' },
      { name: 'Pintura Amarelo Sol', icon: '🎨', part: 'Carroceria' }
    ],
  },

  // 3. CONSTRUÇÃO (Casas, Mansões, Comércios e Lojas)
  {
    id: 'prod_casa_moderna_luxo',
    name: 'Casa Moderna com Varanda',
    description: 'Residência contemporânea de 2 andares com sacada, área de lazer e jardim privativo para colocar no seu terreno.',
    category: 'construcao',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 450, diamonds: 90, emeralds: 80 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'house_modern',
    icon: '🏡',
    footprint: { width: 6, depth: 6, height: 4.5 },
    subItems: [
      { name: 'Área Gourmet Externa', icon: '🍽️', part: 'Térreo' },
      { name: 'Piscina Panorâmica', icon: '🏊', part: 'Jardim' },
      { name: 'Garagem 2 Vagas', icon: '🚗', part: 'Entrada' }
    ],
  },
  {
    id: 'prod_mansao_resort_piscina',
    name: 'Mansão Resort com Piscina',
    description: 'Mansão espetacular com terraço panorâmico, piscina com iluminação LED e fachada envidraçada.',
    category: 'construcao',
    rarity: 'lendario',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 160, emeralds: 130 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    modelType: 'house_modern',
    icon: '🏰',
    footprint: { width: 8, depth: 8, height: 6 },
    subItems: [
      { name: 'Piscina Iluminada', icon: '🏊', part: 'Lazer' },
      { name: 'Mirante na Cobertura', icon: '🌆', part: 'Topo' }
    ],
  },
  {
    id: 'prod_bld_edificio_comercial',
    name: 'Edifício Comercial de Vidro',
    description: 'Prédio comercial moderno com fachada espelhada azul, loja no térreo e escritórios panorâmicos.',
    category: 'construcao',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds', 'emeralds'],
    prices: { gold: 550, diamonds: 110, emeralds: 95 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    modelType: 'building_apartments',
    icon: '🏢',
    footprint: { width: 7, depth: 6, height: 9 },
  },
  {
    id: 'prod_bld_lanchonete_hamburgueria',
    name: 'Hamburgueria do Bairro Neon',
    description: 'Lanchonete estilosa com letreiro luminoso neon, mesas na calçada e cozinha gourmet.',
    category: 'construcao',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 260, diamonds: 45 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'shop_market',
    icon: '🍔',
    footprint: { width: 5, depth: 5, height: 3.5 },
  },
  {
    id: 'prod_bld_oficina_tunagem',
    name: 'Centro de Customização & Garagem',
    description: 'Oficina mecânica profissional com elevadores hidráulicos e bancada de ferramentas.',
    category: 'construcao',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 380, diamonds: 65 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'garage_service',
    icon: '🔧',
    footprint: { width: 6, depth: 6, height: 4 },
  },
  {
    id: 'prod_bld_sobrado_colonial',
    name: 'Sobrado Colonial Charmoso',
    description: 'Sobrado clássico brasileiro com portas francesas, telhas cerâmicas e varanda florada.',
    category: 'construcao',
    rarity: 'raro',
    allowedCurrencies: ['gold'],
    prices: { gold: 310 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'house_modern',
    icon: '🏘️',
    footprint: { width: 5.5, depth: 5.5, height: 5 },
  },

  // 4. DECORAÇÃO (Iluminação, Parques, Monumentos e Flores)
  {
    id: 'prod_dec_park_bench_wood',
    name: 'Banco de Madeira Nobre',
    description: 'Banco ergonômico de praça em mogno tratado para descanso dos moradores.',
    category: 'decoracao',
    rarity: 'comum',
    allowedCurrencies: ['gold'],
    prices: { gold: 30 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'park_bench',
    icon: '🪑',
    footprint: { width: 2, depth: 1, height: 1 },
  },
  {
    id: 'prod_dec_park_bench_marble',
    name: 'Banco Imperial de Mármore',
    description: 'Banco nobre entalhado em mármore branco com detalhes dourados.',
    category: 'decoracao',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 75, diamonds: 10 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'park_bench',
    icon: '🪑',
    footprint: { width: 2.2, depth: 1, height: 1 },
  },
  {
    id: 'prod_dec_street_lamp_vintage',
    name: 'Poste Vintage Globo Quente',
    description: 'Poste de ferro fundido com iluminação quente clássica para calçadas.',
    category: 'decoracao',
    rarity: 'comum',
    allowedCurrencies: ['gold'],
    prices: { gold: 35 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'street_lamp',
    icon: '🏮',
    footprint: { width: 1.5, depth: 1.5, height: 4.5 },
  },
  {
    id: 'prod_dec_street_lamp_neon',
    name: 'Poste Futurista LED Duplo Ciano',
    description: 'Poste de alta tecnologia com lâmpadas duplas de LED ciano brilhante.',
    category: 'decoracao',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 65, diamonds: 8 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'street_lamp',
    icon: '💡',
    footprint: { width: 1.5, depth: 1.5, height: 5 },
  },
  {
    id: 'prod_dec_fountain_magical',
    name: 'Chafariz Luminoso Dançante',
    description: 'Grande fonte central de água com luzes subaquáticas coloridas.',
    category: 'decoracao',
    rarity: 'epico',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 120, diamonds: 18 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'fountain_small',
    icon: '⛲',
    footprint: { width: 4, depth: 4, height: 2.5 },
  },
  {
    id: 'prod_dec_arvore_ipe_amarelo',
    name: 'Árvore Ipê Amarelo Radiante',
    description: 'O famoso ipê amarelo brasileiro florido, trazendo luz para as ruas da cidade.',
    category: 'decoracao',
    rarity: 'raro',
    allowedCurrencies: ['gold'],
    prices: { gold: 50 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'tree_ornamental',
    icon: '🌳',
    footprint: { width: 3, depth: 3, height: 4.5 },
  },
  {
    id: 'prod_dec_arvore_cerejeira',
    name: 'Cerejeira Sakura Rosa',
    description: 'Bela árvore oriental com pétalas cor-de-rosa perfumadas.',
    category: 'decoracao',
    rarity: 'raro',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 60, diamonds: 6 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'tree_ornamental',
    icon: '🌸',
    footprint: { width: 3, depth: 3, height: 4.5 },
  },
  {
    id: 'prod_dec_palmeira_imperial',
    name: 'Palmeira Imperial Tropical',
    description: 'Palmeira imponente e esbelta ideal para avenidas e praças.',
    category: 'decoracao',
    rarity: 'comum',
    allowedCurrencies: ['gold'],
    prices: { gold: 40 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'tree_ornamental',
    icon: '🌴',
    footprint: { width: 2.5, depth: 2.5, height: 5.5 },
  },

  // 5. EXCLUSIVOS (Itens Raros, Trajes Especiais e Edições de Colecionador)
  {
    id: 'prod_exc_armadura_cyber',
    name: 'Exoesqueleto Cibernético Neon',
    description: 'Traje mecatrônico de alta tecnologia com proteção de titânio e circuitos fluorescentes.',
    category: 'exclusivos',
    rarity: 'lendario',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 85 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    icon: '🦾',
    customizationData: { 
      shirtColor: '#0f172a', 
      pantsColor: '#0284c7', 
      shoeColor: '#06b6d4', 
      shirtDecal: 'diamond', 
      hasGlasses: true, 
      glassesColor: '#06b6d4' 
    },
  },
  {
    id: 'prod_exc_traje_astronauta',
    name: 'Traje Espacial Apollo Lunar',
    description: 'Traje de astronauta branco com viseira dourada refletiva e insígnia da Cidade Real.',
    category: 'exclusivos',
    rarity: 'lendario',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 70 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    icon: '🧑‍🚀',
    customizationData: { 
      shirtColor: '#f8fafc', 
      pantsColor: '#f8fafc', 
      shoeColor: '#f8fafc', 
      shirtDecal: 'star', 
      hasGlasses: true, 
      glassesColor: '#f59e0b' 
    },
  },
  {
    id: 'prod_exc_carro_ouro_24k',
    name: 'Supercarro de Ouro Puro dos Campeões',
    description: 'Veículo blindado folheado a ouro maciço 24k com motor de competição e nitro duplo!',
    category: 'exclusivos',
    rarity: 'lendario',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 150 },
    minLevel: 3,
    isConsumable: false,
    isPermanent: true,
    icon: '👑',
  },
  {
    id: 'prod_exc_coroa_realeza_eterna',
    name: 'Coroa Imperial da Realeza',
    description: 'A joia suprema da Cidade Real incrustada com esmeraldas, rubis e diamantes eternos.',
    category: 'exclusivos',
    rarity: 'lendario',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 100 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👑',
    customizationData: { hasCap: true, capColor: '#f59e0b', capStyle: 'forward' },
  },
  {
    id: 'prod_skin_street_black',
    name: 'Conjunto Streetwear Radical',
    description: 'Camiseta preta flame com boné virado para trás e tênis branco.',
    category: 'personagem',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 95, emeralds: 8 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '👕',
    customizationData: { shirtColor: '#0f172a', shirtDecal: 'fire', capColor: '#0f172a', capStyle: 'backward', shoeColor: '#f8fafc' },
  },
  {
    id: 'prod_skin_gamer_headset',
    name: 'Fone Gamer Ciano Neon',
    description: 'Headset profissional com arco luminoso de alta tecnologia.',
    category: 'personagem',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 4, emeralds: 6 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    icon: '🎧',
    customizationData: { hasHeadphones: true, headphonesColor: '#06b6d4' },
  },
  {
    id: 'prod_skin_cool_sunglasses',
    name: 'Óculos de Sol Espelhados',
    description: 'Óculos escuros estilosos com lentes espelhadas que protegem do sol.',
    category: 'personagem',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 45, diamonds: 3 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🕶️',
    customizationData: { hasGlasses: true, glassesColor: '#0f172a' },
  },
  {
    id: 'prod_skin_tactical_pack',
    name: 'Mochila Tática Urbana',
    description: 'Mochila preta reforçada para guardar mais itens e brinquedos.',
    category: 'personagem',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 50, emeralds: 4 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🎒',
    customizationData: { hasBackpack: true, backpackColor: '#0f172a' },
  },

  // 2. CONSTRUÇÃO (Casas, comércios, edifícios residenciais)
  {
    id: 'prod_bld_house_modern',
    name: 'Casa Moderna com Varanda',
    description: 'Bela residência contemporânea com janelas panorâmicas e platibanda.',
    category: 'construcao',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 120, emeralds: 10 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'house_modern',
    icon: '🏡',
    footprint: { width: 6, depth: 6, height: 4.5 },
  },
  {
    id: 'prod_bld_shop_market',
    name: 'Mini-Mercado do Bairro',
    description: 'Estabelecimento comercial com vitrine iluminada e toldo colorido.',
    category: 'construcao',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 180, diamonds: 6 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    modelType: 'shop_market',
    icon: '🏪',
    footprint: { width: 6, depth: 5, height: 4 },
  },
  {
    id: 'prod_bld_building_apartments',
    name: 'Prédio Residencial 3 Andares',
    description: 'Edifício com sacadas e caixilharia de alumínio para a cidade.',
    category: 'construcao',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 320, emeralds: 25 },
    minLevel: 3,
    isConsumable: false,
    isPermanent: true,
    modelType: 'building_apartments',
    icon: '🏢',
    footprint: { width: 7, depth: 6, height: 9 },
  },
  {
    id: 'prod_bld_garage_service',
    name: 'Oficina Mecânica Avançada',
    description: 'Garagem de manutenção para carros e motos com porta industrial.',
    category: 'construcao',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 210, diamonds: 8 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    modelType: 'garage_service',
    icon: '🏭',
    footprint: { width: 6, depth: 5, height: 3.5 },
  },

  // 3. GARAGEM (Veículos e personalização)
  {
    id: 'prod_veh_car_red',
    name: 'Carro Turbo Vermelho',
    description: 'Veículo esportivo veloz para pilotar pelas avenidas da cidade.',
    category: 'garagem',
    allowedCurrencies: ['gold', 'emeralds'],
    prices: { gold: 150, emeralds: 12 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🏎️',
  },
  {
    id: 'prod_veh_moto_ninja',
    name: 'Moto Esportiva Ninja',
    description: 'Motocicleta leve e ágil ideal para manobras rápidas e entregas.',
    category: 'garagem',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 130, diamonds: 5 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    icon: '🏍️',
  },

  // 4. UTILITÁRIOS (Ferramentas e consumíveis)
  {
    id: 'prod_util_apple',
    name: 'Maçã Vermelha Refrescante',
    description: 'Alimento nutritivo. Restaura 100% da estamina imediatamente!',
    category: 'utilitarios',
    allowedCurrencies: ['gold'],
    prices: { gold: 5 },
    minLevel: 1,
    isConsumable: true,
    isPermanent: false,
    icon: '🍎',
  },
  {
    id: 'prod_util_juice',
    name: 'Suco Natural Geladinho',
    description: 'Mata a sede e recupera a energia durante as missões.',
    category: 'utilitarios',
    allowedCurrencies: ['gold'],
    prices: { gold: 8 },
    minLevel: 1,
    isConsumable: true,
    isPermanent: false,
    icon: '🧃',
  },
  {
    id: 'prod_util_wrench',
    name: 'Chave Inglesa de Mecânico',
    description: 'Ferramenta profissional de precisão para consertos na oficina.',
    category: 'utilitarios',
    allowedCurrencies: ['gold'],
    prices: { gold: 20 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    icon: '🔧',
  },

  // 5. DECORAÇÃO (Bancos, postes, monumentos, árvores)
  {
    id: 'prod_dec_park_bench',
    name: 'Banco de Praça Confortável',
    description: 'Banco de madeira nobre para descanso dos pedestres no bairro.',
    category: 'decoracao',
    allowedCurrencies: ['gold'],
    prices: { gold: 25 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'park_bench',
    icon: '🪑',
    footprint: { width: 2, depth: 1, height: 1 },
  },
  {
    id: 'prod_dec_street_lamp',
    name: 'Poste de Iluminação Vintage',
    description: 'Poste decorativo com globo de luz quente para as calçadas.',
    category: 'decoracao',
    allowedCurrencies: ['gold'],
    prices: { gold: 35 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'street_lamp',
    icon: '🏮',
    footprint: { width: 1.5, depth: 1.5, height: 4.5 },
  },
  {
    id: 'prod_dec_tree_ornamental',
    name: 'Árvore Ornamental Florida',
    description: 'Árvore estilizada com flores perfumadas para embelezar ruas.',
    category: 'decoracao',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 40, diamonds: 2 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'tree_ornamental',
    icon: '🌸',
    footprint: { width: 3, depth: 3, height: 4.5 },
  },
  {
    id: 'prod_dec_fountain_small',
    name: 'Chafariz de Praça Circular',
    description: 'Fonte decorativa de água para o centro das praças.',
    category: 'decoracao',
    allowedCurrencies: ['gold', 'diamonds'],
    prices: { gold: 90, diamonds: 4 },
    minLevel: 2,
    isConsumable: false,
    isPermanent: true,
    modelType: 'fountain_small',
    icon: '⛲',
    footprint: { width: 4, depth: 4, height: 2.5 },
  },
  {
    id: 'prod_dec_flower_planter',
    name: 'Jardineira com Flores Coloridas',
    description: 'Floreira retangular charmosa para colocar na frente de prédios.',
    category: 'decoracao',
    allowedCurrencies: ['gold'],
    prices: { gold: 15 },
    minLevel: 1,
    isConsumable: false,
    isPermanent: true,
    modelType: 'flower_planter',
    icon: '🌷',
    footprint: { width: 2.5, depth: 1, height: 0.8 },
  },
  {
    id: 'prod_dec_landmark_statue',
    name: 'Monumento Estelar dos Campeões',
    description: 'Escultura com estrela dourada sobre pedestal de mármore.',
    category: 'decoracao',
    allowedCurrencies: ['diamonds', 'emeralds'],
    prices: { diamonds: 6, emeralds: 15 },
    minLevel: 3,
    isConsumable: false,
    isPermanent: true,
    modelType: 'landmark_statue',
    icon: '🗿',
    footprint: { width: 3, depth: 3, height: 5 },
  },

  // 6. EXCLUSIVOS (Itens raros e pacotes de colecionador)
  {
    id: 'prod_exc_gold_car',
    name: 'Carro de Ouro Puro dos Campeões',
    description: 'Veículo blindado folheado a ouro 24k com ronco esportivo turbo!',
    category: 'exclusivos',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 50 },
    minLevel: 4,
    isConsumable: false,
    isPermanent: true,
    icon: '👑',
  },
  {
    id: 'prod_exc_astronaut_suit',
    name: 'Traje Espacial Futurista',
    description: 'Conjunto espacial completo com capacete translúcido e fone cibernético.',
    category: 'exclusivos',
    allowedCurrencies: ['emeralds'],
    prices: { emeralds: 35 },
    minLevel: 3,
    isConsumable: false,
    isPermanent: true,
    icon: '🚀',
    customizationData: { shirtColor: '#f8fafc', shirtDecal: 'diamond', shortsColor: '#0f172a', shoeColor: '#06b6d4', hasHeadphones: true, headphonesColor: '#38bdf8' },
  },
];

// Pacotes administrativos de Esmeraldas
const DEFAULT_ADMIN_PACKAGES: AdminPackage[] = [
  { id: 'pack_bronze', name: 'Bolsa de Esmeraldas', emeraldsAmount: 50, bonusEmeralds: 5, priceBrl: 9.90, active: true },
  { id: 'pack_silver', name: 'Baú de Esmeraldas', emeraldsAmount: 150, bonusEmeralds: 25, priceBrl: 24.90, active: true },
  { id: 'pack_gold', name: 'Cofre Real de Esmeraldas', emeraldsAmount: 400, bonusEmeralds: 100, priceBrl: 59.90, active: true },
  { id: 'pack_diamond', name: 'Montanha Imperial de Esmeraldas', emeraldsAmount: 1000, bonusEmeralds: 350, priceBrl: 129.90, active: true },
];

export class EconomyManager {
  private wallet: PlayerWallet = {
    gold: 150,
    diamonds: 8,
    emeralds: 25,
  };

  private transactions: EconomyTransaction[] = [];
  private products: StoreProduct[] = [];
  private inventory: InventoryItem[] = [];
  private packages: AdminPackage[] = [];
  private onWalletChangeCallbacks: ((wallet: PlayerWallet) => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;

    // 1. Carrega Carteira
    try {
      const savedWallet = localStorage.getItem('theo_lucca_wallet');
      if (savedWallet) {
        this.wallet = { ...this.wallet, ...JSON.parse(savedWallet) };
      }
    } catch {
      // fallback
    }

    // 2. Carrega Transações
    try {
      const savedTx = localStorage.getItem('theo_lucca_transactions');
      if (savedTx) {
        this.transactions = JSON.parse(savedTx);
      }
    } catch {
      // fallback
    }

    // 3. Carrega Catálogo de Produtos da Loja
    try {
      const savedCatalog = localStorage.getItem('theo_lucca_store_catalog');
      if (savedCatalog) {
        const loaded: StoreProduct[] = JSON.parse(savedCatalog);
        // Garante que novos produtos do DEFAULT_STORE_PRODUCTS sejam mesclados
        const loadedIds = new Set(loaded.map((p) => p.id));
        const missingDefaults = DEFAULT_STORE_PRODUCTS.filter((p) => !loadedIds.has(p.id));
        this.products = [...missingDefaults, ...loaded];
      } else {
        this.products = [...DEFAULT_STORE_PRODUCTS];
        this.saveProducts();
      }
    } catch {
      this.products = [...DEFAULT_STORE_PRODUCTS];
    }

    // 4. Carrega Inventário
    try {
      const savedInv = localStorage.getItem('theo_lucca_inventory');
      if (savedInv) {
        this.inventory = JSON.parse(savedInv);
      } else {
        // Itens iniciais gratuitos no inventário
        this.inventory = [
          {
            id: 'init_item_house',
            productId: 'prod_bld_house_modern',
            name: 'Casa Moderna com Varanda',
            description: 'Sua primeira residência para colocar na cidade!',
            category: 'construcao',
            quantity: 1,
            isPlaced: false,
            modelType: 'house_modern',
            icon: '🏡',
            footprint: { width: 6, depth: 6, height: 4.5 },
            acquiredAt: Date.now(),
          },
          {
            id: 'init_item_bench',
            productId: 'prod_dec_park_bench',
            name: 'Banco de Praça Confortável',
            description: 'Decoração para descanso dos pedestres.',
            category: 'decoracao',
            quantity: 2,
            isPlaced: false,
            modelType: 'park_bench',
            icon: '🪑',
            footprint: { width: 2, depth: 1, height: 1 },
            acquiredAt: Date.now(),
          },
          {
            id: 'init_item_lamp',
            productId: 'prod_dec_street_lamp',
            name: 'Poste de Iluminação Vintage',
            description: 'Iluminação decorativa.',
            category: 'decoracao',
            quantity: 2,
            isPlaced: false,
            modelType: 'street_lamp',
            icon: '🏮',
            footprint: { width: 1.5, depth: 1.5, height: 4.5 },
            acquiredAt: Date.now(),
          },
        ];
        this.saveInventory();
      }
    } catch {
      // fallback
    }

    // 5. Carrega Pacotes Administrativos
    try {
      const savedPkgs = localStorage.getItem('theo_lucca_admin_packages');
      if (savedPkgs) {
        this.packages = JSON.parse(savedPkgs);
      } else {
        this.packages = [...DEFAULT_ADMIN_PACKAGES];
        this.savePackages();
      }
    } catch {
      this.packages = [...DEFAULT_ADMIN_PACKAGES];
    }
  }

  private saveWallet() {
    try {
      localStorage.setItem('theo_lucca_wallet', JSON.stringify(this.wallet));
      this.onWalletChangeCallbacks.forEach((cb) => cb(this.wallet));
    } catch {}
  }

  private saveTransactions() {
    try {
      // Guarda até as últimas 300 transações no log
      const trimmed = this.transactions.slice(-300);
      localStorage.setItem('theo_lucca_transactions', JSON.stringify(trimmed));
    } catch {}
  }

  public saveProducts() {
    try {
      localStorage.setItem('theo_lucca_store_catalog', JSON.stringify(this.products));
    } catch {}
  }

  public saveInventory() {
    try {
      localStorage.setItem('theo_lucca_inventory', JSON.stringify(this.inventory));
    } catch {}
  }

  public savePackages() {
    try {
      localStorage.setItem('theo_lucca_admin_packages', JSON.stringify(this.packages));
    } catch {}
  }

  public onWalletChange(cb: (wallet: PlayerWallet) => void) {
    this.onWalletChangeCallbacks.push(cb);
  }

  public getWallet(): PlayerWallet {
    return { ...this.wallet };
  }

  public getTransactions(): EconomyTransaction[] {
    return [...this.transactions].reverse();
  }

  public getProducts(category?: StoreCategory): StoreProduct[] {
    if (!category) return [...this.products];
    if (category === 'destaques') {
      const explicit = this.products.filter((p) => p.category === 'destaques');
      // Adiciona também os itens icônicos da loja de destaque Free Fire
      const featuredIds = [
        'prod_conjunto_esportivo',
        'prod_jaqueta_urbana',
        'prod_bone_premium',
        'prod_oculos_style',
        'prod_casa_moderna_luxo',
        'prod_carro_esportivo_red',
        'prod_moto_street_super'
      ];
      const featuredItems = this.products.filter((p) => featuredIds.includes(p.id));
      const combined = [...explicit, ...featuredItems.filter(p => !explicit.some(e => e.id === p.id))];
      return combined.length > 0 ? combined : this.products.slice(0, 7);
    }
    return this.products.filter((p) => p.category === category);
  }

  public getProductById(id: string): StoreProduct | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getInventory(category?: InventoryCategory): InventoryItem[] {
    if (!category) return [...this.inventory];
    return this.inventory.filter((i) => i.category === category);
  }

  public getPackages(): AdminPackage[] {
    return [...this.packages];
  }

  /**
   * Adiciona fundos à carteira com registro estrito de auditoria
   */
  public addFunds(
    currency: CurrencyType,
    amount: number,
    description: string,
    type: 'earn' | 'refund' | 'admin_grant' = 'earn',
    itemId?: string
  ): boolean {
    if (amount <= 0 || isNaN(amount)) return false;

    this.wallet[currency] = Math.round((this.wallet[currency] + amount) * 100) / 100;

    const tx: EconomyTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      type,
      currency,
      amount,
      balanceAfter: this.wallet[currency],
      description,
      itemId,
    };

    this.transactions.push(tx);
    this.saveWallet();
    this.saveTransactions();
    return true;
  }

  /**
   * Retira fundos para compras (prevenção matemática contra saldo negativo)
   */
  public spendFunds(
    currency: CurrencyType,
    amount: number,
    description: string,
    itemId?: string
  ): boolean {
    if (amount <= 0 || isNaN(amount)) return false;
    if (this.wallet[currency] < amount) return false;

    this.wallet[currency] = Math.round((this.wallet[currency] - amount) * 100) / 100;

    const tx: EconomyTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      type: 'spend',
      currency,
      amount: -amount,
      balanceAfter: this.wallet[currency],
      description,
      itemId,
    };

    this.transactions.push(tx);
    this.saveWallet();
    this.saveTransactions();
    return true;
  }

  /**
   * Executa a compra de um produto na Esmeralda Store
   */
  public purchaseProduct(
    productId: string,
    chosenCurrency: CurrencyType,
    currentLevel = 1
  ): { success: boolean; message: string; item?: InventoryItem } {
    const product = this.getProductById(productId);
    if (!product) {
      return { success: false, message: 'Produto não encontrado na loja.' };
    }

    if (currentLevel < product.minLevel) {
      return { success: false, message: `Nível insuficiente! Requer Nível ${product.minLevel}.` };
    }

    if (!product.allowedCurrencies.includes(chosenCurrency)) {
      return { success: false, message: `Esta moeda (${chosenCurrency}) não é aceita para este produto.` };
    }

    const price = product.prices[chosenCurrency];
    if (price === undefined || price < 0) {
      return { success: false, message: 'Preço inválido para esta moeda.' };
    }

    if (this.wallet[chosenCurrency] < price) {
      const curNames = { gold: 'Ouro', diamonds: 'Diamantes', emeralds: 'Esmeraldas' };
      return { success: false, message: `Saldo insuficiente de ${curNames[chosenCurrency]}!` };
    }

    // Se for item permanente e o jogador já possui
    if (product.isPermanent) {
      const alreadyHas = this.inventory.some((i) => i.productId === product.id && i.quantity > 0);
      if (alreadyHas && product.category === 'personagem') {
        return { success: false, message: 'Você já possui este item exclusivo no inventário!' };
      }
    }

    // Efetua débito seguro
    const debited = this.spendFunds(
      chosenCurrency,
      price,
      `Compra na Esmeralda Store: ${product.name}`,
      product.id
    );

    if (!debited) {
      return { success: false, message: 'Falha ao processar pagamento seguro.' };
    }

    // Adiciona ao inventário
    let invCategory: InventoryCategory = 'utilitarios';
    if (product.category === 'personagem') invCategory = 'personagem';
    else if (product.category === 'construcao') invCategory = 'construcao';
    else if (product.category === 'garagem') invCategory = 'garagem';
    else if (product.category === 'decoracao') invCategory = 'decoracao';

    let invItem: InventoryItem;

    if (product.isConsumable) {
      // Se for consumível, acumula quantidade
      const existing = this.inventory.find((i) => i.productId === product.id);
      if (existing) {
        existing.quantity += 1;
        invItem = existing;
      } else {
        invItem = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          name: product.name,
          description: product.description,
          category: invCategory,
          quantity: 1,
          icon: product.icon,
          acquiredAt: Date.now(),
        };
        this.inventory.push(invItem);
      }
    } else {
      // Item permanente ou peça de construção
      invItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        name: product.name,
        description: product.description,
        category: invCategory,
        quantity: 1,
        isPlaced: false,
        modelType: product.modelType,
        icon: product.icon,
        footprint: product.footprint,
        customizationData: product.customizationData,
        acquiredAt: Date.now(),
      };
      this.inventory.push(invItem);
    }

    this.saveInventory();
    return {
      success: true,
      message: `Você adquiriu ${product.name}! O item foi adicionado ao seu inventário.`,
      item: invItem,
    };
  }

  /**
   * Consome um item utilitário
   */
  public consumeItem(itemId: string): { success: boolean; message: string } {
    const itemIndex = this.inventory.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      return { success: false, message: 'Item não encontrado no inventário.' };
    }

    const item = this.inventory[itemIndex];
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.inventory.splice(itemIndex, 1);
    }

    this.saveInventory();
    return { success: true, message: `Você usou ${item.name}!` };
  }

  /**
   * Atualiza ou cadastra produto (Painel Administrativo)
   */
  public upsertProduct(product: StoreProduct) {
    const idx = this.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.products[idx] = { ...product };
    } else {
      this.products.push({ ...product });
    }
    this.saveProducts();
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.saveProducts();
  }

  /**
   * Gestão de Pacotes de Esmeraldas (Painel Administrativo)
   */
  public upsertPackage(pkg: AdminPackage) {
    const idx = this.packages.findIndex((p) => p.id === pkg.id);
    if (idx >= 0) {
      this.packages[idx] = { ...pkg };
    } else {
      this.packages.push({ ...pkg });
    }
    this.savePackages();
  }

  public deletePackage(id: string) {
    this.packages = this.packages.filter((p) => p.id !== id);
    this.savePackages();
  }

  /**
   * Concede fundos pelo Painel Administrativo (com log)
   */
  public adminGrantFunds(currency: CurrencyType, amount: number, adminReason: string) {
    return this.addFunds(currency, amount, `Concessão Administrativa: ${adminReason}`, 'admin_grant');
  }

  /**
   * Define saldos diretamente (Painel Administrativo)
   */
  public adminSetWallet(newWallet: PlayerWallet, reason: string) {
    const old = { ...this.wallet };
    this.wallet = {
      gold: Math.max(0, newWallet.gold),
      diamonds: Math.max(0, newWallet.diamonds),
      emeralds: Math.max(0, newWallet.emeralds),
    };

    const tx: EconomyTransaction = {
      id: `tx_admin_${Date.now()}`,
      timestamp: Date.now(),
      type: 'admin_grant',
      currency: 'gold',
      amount: this.wallet.gold - old.gold,
      balanceAfter: this.wallet.gold,
      description: `Ajuste Administrativo de Saldo: ${reason}`,
    };
    this.transactions.push(tx);

    this.saveWallet();
    this.saveTransactions();
  }

  /**
   * Atualiza status de colocado/desmontado de um item de construção
   */
  public setItemPlacedStatus(inventoryItemId: string, isPlaced: boolean) {
    const item = this.inventory.find((i) => i.id === inventoryItemId);
    if (item) {
      item.isPlaced = isPlaced;
      this.saveInventory();
    }
  }
}

export const economyManager = new EconomyManager();
