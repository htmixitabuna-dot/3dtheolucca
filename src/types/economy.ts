/**
 * Tipos e Interfaces do Sistema de Economia, Esmeralda Store,
 * Inventário Categorizado, Construções e Painel Administrativo.
 */

export type CurrencyType = 'gold' | 'diamonds' | 'emeralds';

export interface PlayerWallet {
  gold: number;        // Moeda gratuita obtida pelo mapa, trabalhos e missões
  diamonds: number;    // Moeda especial obtida em locais secretos e missões
  emeralds: number;    // Moeda premium obtida em missões raras / loja administrativa
}

export interface EconomyTransaction {
  id: string;
  timestamp: number;
  type: 'earn' | 'spend' | 'refund' | 'admin_grant';
  currency: CurrencyType;
  amount: number;
  balanceAfter: number;
  description: string;
  itemId?: string;
}

export type StoreCategory = 
  | 'destaques'
  | 'personagem' 
  | 'roupas'
  | 'construcao' 
  | 'garagem' 
  | 'utilitarios' 
  | 'decoracao' 
  | 'exclusivos';

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  category: StoreCategory;
  rarity?: 'comum' | 'raro' | 'epico' | 'lendario';
  allowedCurrencies: CurrencyType[];
  prices: Partial<Record<CurrencyType, number>>;
  minLevel: number;
  isConsumable: boolean;
  isPermanent: boolean;
  modelType?: string;
  icon: string;
  image?: string;
  subItems?: { name: string; icon: string; part: string }[];
  footprint?: {
    width: number;
    depth: number;
    height: number;
  };
  customizationData?: any;
}

export type InventoryCategory = 
  | 'personagem' 
  | 'construcao' 
  | 'garagem' 
  | 'utilitarios' 
  | 'decoracao';

export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: InventoryCategory;
  quantity: number;
  isEquipped?: boolean;
  isPlaced?: boolean;
  modelType?: string;
  icon: string;
  footprint?: {
    width: number;
    depth: number;
    height: number;
  };
  customizationData?: any;
  acquiredAt: number;
}

export interface PlacedBuilding {
  id: string;
  inventoryItemId: string;
  productId: string;
  name: string;
  modelType: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  footprint: {
    width: number;
    depth: number;
    height: number;
  };
  placedAt: number;
}

export interface AdminPackage {
  id: string;
  name: string;
  emeraldsAmount: number;
  bonusEmeralds: number;
  priceBrl: number;
  active: boolean;
}
