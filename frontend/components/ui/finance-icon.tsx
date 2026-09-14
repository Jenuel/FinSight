'use client';

import React from 'react';
import { 
  Building2, 
  Landmark, 
  PiggyBank, 
  CreditCard, 
  Banknote, 
  Wallet, 
  Briefcase, 
  Shield, 
  TrendingUp, 
  Home, 
  Coins, 
  Key, 
  Utensils, 
  Car, 
  Zap, 
  Film, 
  HeartPulse, 
  ShoppingBag, 
  Smartphone, 
  Plane, 
  Receipt, 
  Laptop, 
  Sparkles, 
  Tag, 
  Award, 
  ArrowDownLeft, 
  ArrowUpRight,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Custom High-Res Vector SVG Logos for PH Banks, Digital Banks, and Wallets ---

export function GCashLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#005CE6" />
      <path 
        d="M15.5 8.2C14.5 7.3 13.2 6.8 11.8 6.8C8.6 6.8 6 9.4 6 12.5C6 15.6 8.6 18.2 11.8 18.2C14.8 18.2 17.2 15.9 17.5 13H11.5V11H19.5C19.7 11.7 19.8 12.4 19.8 13.2C19.8 17.4 16.2 20.2 11.8 20.2C7.2 20.2 3.8 16.8 3.8 12.5C3.8 8.2 7.2 4.8 11.8 4.8C14 4.8 16 5.6 17.5 7L15.5 8.2Z" 
        fill="white" 
      />
    </svg>
  );
}

export function MayaLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#00D084" />
      <path d="M5.5 17.5V6.5L12 13.5L18.5 6.5V17.5" stroke="#080B11" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WiseLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#163300" />
      <path d="M5 14L8.5 7H17L12.8 14H18.5L10.5 20.5L12 14H5Z" fill="#9FE870" />
    </svg>
  );
}

export function GrabPayLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#00B14F" />
      <path d="M6.5 13.5C6.5 10 9 7.5 12.5 7.5C15 7.5 17 8.8 17.5 10.5H14C13.5 9.8 12.5 9.5 11.8 9.5C10 9.5 8.8 11 8.8 13C8.8 15 10 16.5 12 16.5C13.2 16.5 14 15.8 14.5 14.8H12V13H17V17C15.8 18.2 14 19 12 19C8.5 19 6.5 16.5 6.5 13.5Z" fill="white" />
    </svg>
  );
}

export function PayPalLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#003087" />
      <path d="M7 17.5L9.5 5.5H14C16.5 5.5 18 6.8 17.5 9C17 11.5 15 13 13 13H10.5L9.5 17.5H7Z" fill="#0079C1" />
      <path d="M9.5 17.5L11.5 8H15C17.2 8 18.5 9.2 18 11.2C17.5 13.5 15.8 14.8 14 14.8H12L11 19.5H8.5L9.5 17.5Z" fill="#00457C" opacity="0.85" />
    </svg>
  );
}

export function ShopeePayLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#EE4D2D" />
      <path d="M8 8.5C8 6.5 9.8 5 12 5C14.2 5 16 6.5 16 8.5V9.5H8V8.5Z" stroke="white" strokeWidth="1.8" />
      <path d="M6 9H18L17 19H7L6 9Z" fill="white" />
      <path d="M13.5 12.5C13.2 12.2 12.7 12 12.2 12C11.3 12 10.8 12.5 10.8 13.1C10.8 14.2 13.8 13.8 13.8 15.4C13.8 16.3 13 17 12 17C11.2 17 10.5 16.6 10.2 16.1" stroke="#EE4D2D" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CoinsPHLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#0052CC" />
      <circle cx="12" cy="12" r="6.5" fill="#FFC82E" />
      <path d="M14 10C13.5 9.2 12.8 8.8 12 8.8C10.5 8.8 9.5 10 9.5 12C9.5 14 10.5 15.2 12 15.2C12.8 15.2 13.5 14.8 14 14" stroke="#0052CC" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GoTymeLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#00D2C4" />
      <path d="M6 14C6 9.5 9 6.5 13.5 6.5C16.5 6.5 18 8 18 10C18 13 15 14.5 12 14.5C9 14.5 7.5 16 7.5 17.5" stroke="#062B2E" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="15.5" cy="16.5" r="1.8" fill="#062B2E" />
    </svg>
  );
}

export function TonikLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#8000FF" />
      <path d="M6 7.5H18M12 7.5V17.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="16.5" cy="15.5" r="2" fill="#00FFC2" />
    </svg>
  );
}

export function SeaBankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF5722" />
      <path d="M16 8.5C15 7.5 13.5 7 12 7C9.5 7 8 8.5 8 10C8 13 16 12 16 15C16 16.8 14.2 18 12 18C10 18 8.5 17.2 7.5 16" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BDOLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#003882" />
      <text x="12" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">BDO</text>
      <rect x="4.5" y="17.5" width="15" height="1.8" rx="0.9" fill="#FFC82E" />
    </svg>
  );
}

export function BPILogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#B81D24" />
      <path d="M12 4.5L18.5 7.5V12.5C18.5 16.5 15.5 19.5 12 20.5C8.5 19.5 5.5 16.5 5.5 12.5V7.5L12 4.5Z" fill="#99151B" stroke="#F5A623" strokeWidth="0.8" />
      <text x="12" y="14.5" textAnchor="middle" fill="#FFFFFF" fontSize="7.2" fontWeight="900" fontFamily="sans-serif">BPI</text>
    </svg>
  );
}

export function MetrobankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#002D62" />
      <path d="M6 16L10 8L14 16L18 8" stroke="#F37023" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="1.5" fill="#F37023" />
    </svg>
  );
}

export function UnionBankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#F37023" />
      <path d="M6 14.5V9.5C6 7.5 7.5 6 9.5 6C11.5 6 13 7.5 13 9.5V14.5C13 16.5 14.5 18 16.5 18C18.5 18 20 16.5 20 14.5V9.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function SecurityBankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#00843D" />
      <circle cx="9.5" cy="12" r="4.5" stroke="white" strokeWidth="2.5" />
      <circle cx="14.5" cy="12" r="4.5" stroke="#004B87" strokeWidth="2.5" />
    </svg>
  );
}

export function RCBCLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#004B87" />
      <path d="M12 6L17.5 12L12 18L6.5 12Z" fill="#FDB913" stroke="white" strokeWidth="1" />
    </svg>
  );
}

export function LandbankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#006837" />
      <circle cx="12" cy="12" r="7" stroke="#FDB913" strokeWidth="1.5" />
      <path d="M12 15V8M9.5 12C9.5 10 12 9 12 9C12 9 14.5 10 14.5 12C14.5 13.5 13 14 12 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CIMBLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#ED1C24" />
      <path d="M16 8L10 12L16 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PNBLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#002B66" />
      <path d="M5.5 8L12 5L18.5 8V13C18.5 17 12 19.5 12 19.5C12 19.5 5.5 17 5.5 13V8Z" fill="#003E92" stroke="#FDB913" strokeWidth="1" />
      <text x="12" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">PNB</text>
    </svg>
  );
}

export function ChinaBankLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#BE1E2D" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" stroke="white" strokeWidth="1.8" />
      <rect x="9.5" y="9.5" width="5" height="5" fill="#FFC82E" />
    </svg>
  );
}

export function EastWestLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#6C2D82" />
      <path d="M6.5 12H17.5M14 8.5L17.5 12L14 15.5" stroke="#78BE20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UNOLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF6B00" />
      <path d="M7 8V12.5C7 15.5 9.2 17.5 12 17.5C14.8 17.5 17 15.5 17 12.5V8" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Logo Registry for custom rendering
const INSTITUTION_LOGOS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  gcash: GCashLogo,
  maya: MayaLogo,
  'maya-bank': MayaLogo,
  wise: WiseLogo,
  grabpay: GrabPayLogo,
  paypal: PayPalLogo,
  shopeepay: ShopeePayLogo,
  coinsph: CoinsPHLogo,
  gotyme: GoTymeLogo,
  tonik: TonikLogo,
  seabank: SeaBankLogo,
  cimb: CIMBLogo,
  uno: UNOLogo,
  bdo: BDOLogo,
  bpi: BPILogo,
  metrobank: MetrobankLogo,
  unionbank: UnionBankLogo,
  securitybank: SecurityBankLogo,
  rcbc: RCBCLogo,
  landbank: LandbankLogo,
  pnb: PNBLogo,
  chinabank: ChinaBankLogo,
  eastwest: EastWestLogo,
};

// Map of category keys and emojis to minimalist Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  // Category IDs
  salary: Banknote,
  bonus: Award,
  freelance: Laptop,
  investment: TrendingUp,
  'other-income': ArrowDownLeft,
  food: Utensils,
  transport: Car,
  utilities: Zap,
  entertainment: Film,
  healthcare: HeartPulse,
  shopping: ShoppingBag,
  subscription: Smartphone,
  travel: Plane,
  'other-expense': Tag,

  // Account Types / IDs
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Banknote,
  ewallet: Wallet,

  // Named tokens & emoji fallbacks
  bank: Landmark,
  piggy: PiggyBank,
  card: CreditCard,
  vault: Landmark,
  crypto: Coins,
  briefcase: Briefcase,
  shield: Shield,
  home: Home,
  key: Key,

  // Emojis mapping gracefully to SVG line icons
  '🏦': Landmark,
  '💳': CreditCard,
  '🐷': PiggyBank,
  '💰': Banknote,
  '💵': Banknote,
  '📈': TrendingUp,
  '💼': Briefcase,
  '🛡️': Shield,
  '🚀': Sparkles,
  '🏠': Home,
  '🪙': Coins,
  '🔑': Key,
  '🍔': Utensils,
  '🚗': Car,
  '💡': Zap,
  '🎬': Film,
  '🏥': HeartPulse,
  '🛍️': ShoppingBag,
  '📱': Smartphone,
  '✈️': Plane,
  '📌': Tag,
  '🎁': Award,
  '💻': Laptop,
  '⭐': Sparkles,
};

// Standard general icon options
export const ACCOUNT_ICON_OPTIONS = [
  { id: 'bank', label: 'Bank', icon: Landmark },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'savings', label: 'Savings', icon: PiggyBank },
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'investment', label: 'Invest', icon: TrendingUp },
  { id: 'briefcase', label: 'Business', icon: Briefcase },
  { id: 'shield', label: 'Vault', icon: Shield },
  { id: 'home', label: 'Property', icon: Home },
  { id: 'crypto', label: 'Crypto', icon: Coins },
  { id: 'key', label: 'Security', icon: Key },
  { id: 'bonus', label: 'Reward', icon: Award },
];

export interface FinanceIconProps {
  id?: string;
  className?: string;
  size?: number;
}

export function FinanceIcon({ id = '', className, size = 18 }: FinanceIconProps) {
  const normalizedId = id.toLowerCase().trim();

  // If matched to a custom brand logo
  if (INSTITUTION_LOGOS[normalizedId]) {
    const LogoComponent = INSTITUTION_LOGOS[normalizedId];
    return <LogoComponent size={size} className={cn('shrink-0', className)} />;
  }

  // Fallback to standard Lucide icons
  const IconComponent = ICON_MAP[normalizedId] || ICON_MAP[id] || Tag;
  return <IconComponent size={size} className={cn('shrink-0 stroke-[1.8]', className)} />;
}
