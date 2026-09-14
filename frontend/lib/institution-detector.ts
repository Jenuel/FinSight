export interface FinancialInstitution {
  id: string;
  name: string;
  shortName: string;
  category: 'ph-bank' | 'digital-bank' | 'wallet';
  defaultType: 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet';
  brandColor: string;
  keywords: string[];
}

export const FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  // --- E-Wallets & Global Services ---
  {
    id: 'gcash',
    name: 'GCash',
    shortName: 'GCash',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#005ce6',
    keywords: ['gcash', 'g-cash', 'g cash', 'mynt'],
  },
  {
    id: 'maya',
    name: 'Maya Wallet',
    shortName: 'Maya',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#00d084',
    keywords: ['maya', 'paymaya', 'pay maya', 'maya wallet'],
  },
  {
    id: 'wise',
    name: 'Wise',
    shortName: 'Wise',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#9fe870',
    keywords: ['wise', 'transferwise', 'transfer wise', 'wise wallet', 'wise card'],
  },
  {
    id: 'grabpay',
    name: 'GrabPay',
    shortName: 'GrabPay',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#00b14f',
    keywords: ['grabpay', 'grab pay', 'grab wallet', 'grab'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    shortName: 'PayPal',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#003087',
    keywords: ['paypal', 'pay pal'],
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#ee4d2d',
    keywords: ['shopeepay', 'shopee pay', 'shopee wallet', 'shopee'],
  },
  {
    id: 'coinsph',
    name: 'Coins.ph',
    shortName: 'Coins.ph',
    category: 'wallet',
    defaultType: 'ewallet',
    brandColor: '#0052cc',
    keywords: ['coins.ph', 'coinsph', 'coins ph'],
  },

  // --- Digital Banks (Neobanks) ---
  {
    id: 'gotyme',
    name: 'GoTyme Bank',
    shortName: 'GoTyme',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#00d2c4',
    keywords: ['gotyme', 'go tyme', 'tyme', 'tyme bank'],
  },
  {
    id: 'tonik',
    name: 'Tonik Bank',
    shortName: 'Tonik',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#8000ff',
    keywords: ['tonik', 'tonik bank', 'tonik stash'],
  },
  {
    id: 'seabank',
    name: 'SeaBank Philippines',
    shortName: 'SeaBank',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#ff5722',
    keywords: ['seabank', 'sea bank', 'shopee bank'],
  },
  {
    id: 'maya-bank',
    name: 'Maya Bank (Savings)',
    shortName: 'Maya Bank',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#00a86b',
    keywords: ['maya bank', 'maya savings', 'mayabank'],
  },
  {
    id: 'cimb',
    name: 'CIMB Bank Philippines',
    shortName: 'CIMB',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#ed1c24',
    keywords: ['cimb', 'cimb bank', 'g-save', 'gsave'],
  },
  {
    id: 'uno',
    name: 'UNO Digital Bank',
    shortName: 'UNO Bank',
    category: 'digital-bank',
    defaultType: 'savings',
    brandColor: '#ff6b00',
    keywords: ['uno', 'uno bank', 'uno digital'],
  },

  // --- Major Philippine Universal & Commercial Banks ---
  {
    id: 'bdo',
    name: 'BDO Unibank',
    shortName: 'BDO',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#003882',
    keywords: ['bdo', 'banco de oro', 'bdo unibank', 'bdo network'],
  },
  {
    id: 'bpi',
    name: 'Bank of the Philippine Islands',
    shortName: 'BPI',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#b81d24',
    keywords: ['bpi', 'bank of the philippine islands', 'bpi family'],
  },
  {
    id: 'metrobank',
    name: 'Metrobank',
    shortName: 'Metrobank',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#002d62',
    keywords: ['metrobank', 'metro bank', 'mbtc'],
  },
  {
    id: 'unionbank',
    name: 'UnionBank of the Philippines',
    shortName: 'UnionBank',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#f37023',
    keywords: ['unionbank', 'union bank', 'ubp'],
  },
  {
    id: 'securitybank',
    name: 'Security Bank',
    shortName: 'Security Bank',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#00843d',
    keywords: ['security bank', 'securitybank', 'secbank'],
  },
  {
    id: 'rcbc',
    name: 'RCBC',
    shortName: 'RCBC',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#004b87',
    keywords: ['rcbc', 'rizal commercial', 'rcbc diskartech', 'diskartech'],
  },
  {
    id: 'landbank',
    name: 'Land Bank of the Philippines',
    shortName: 'Landbank',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#006837',
    keywords: ['landbank', 'land bank', 'lbp'],
  },
  {
    id: 'pnb',
    name: 'Philippine National Bank',
    shortName: 'PNB',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#002b66',
    keywords: ['pnb', 'philippine national bank'],
  },
  {
    id: 'chinabank',
    name: 'China Banking Corporation',
    shortName: 'China Bank',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#be1e2d',
    keywords: ['china bank', 'chinabank', 'cbc'],
  },
  {
    id: 'eastwest',
    name: 'EastWest Bank',
    shortName: 'EastWest',
    category: 'ph-bank',
    defaultType: 'checking',
    brandColor: '#6c2d82',
    keywords: ['eastwest', 'east west', 'eastwest bank'],
  },
];

export interface AccountDetectionResult {
  detected: boolean;
  institution?: FinancialInstitution;
  suggestedType?: 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet';
  suggestedIcon?: string;
  suggestedColor?: string;
  reason?: string;
}

export function detectAccountDetails(nameInput: string): AccountDetectionResult {
  if (!nameInput || !nameInput.trim()) {
    return { detected: false };
  }

  const clean = nameInput.trim().toLowerCase();

  // 1. Detect explicit account type from keywords
  let explicitType: 'checking' | 'savings' | 'credit' | 'cash' | 'ewallet' | null = null;
  
  if (/\b(credit|cc|visa|mastercard|platinum|gold card|titanium|cashback)\b/i.test(clean)) {
    explicitType = 'credit';
  } else if (/\b(savings|stash|time deposit|deposit|hysa|interest|goals)\b/i.test(clean)) {
    explicitType = 'savings';
  } else if (/\b(checking|current|payroll|cheque|debit)\b/i.test(clean)) {
    explicitType = 'checking';
  } else if (/\b(wallet|ewallet|e-wallet|digital wallet)\b/i.test(clean)) {
    explicitType = 'ewallet';
  } else if (/\b(cash|petty cash|pocket|cash on hand|vault)\b/i.test(clean)) {
    explicitType = 'cash';
  }

  // 2. Detect Financial Institution
  let matchedInstitution: FinancialInstitution | undefined = undefined;

  for (const inst of FINANCIAL_INSTITUTIONS) {
    for (const kw of inst.keywords) {
      // Word boundary or containment check
      const regex = new RegExp(`(^|\\s|[^a-z0-9])${kw.replace('.', '\\.')}($|\\s|[^a-z0-9])`, 'i');
      if (regex.test(clean) || clean.includes(kw)) {
        matchedInstitution = inst;
        break;
      }
    }
    if (matchedInstitution) break;
  }

  // 3. Synthesize result
  if (matchedInstitution) {
    const finalType = explicitType || matchedInstitution.defaultType;
    return {
      detected: true,
      institution: matchedInstitution,
      suggestedType: finalType,
      suggestedIcon: matchedInstitution.id,
      suggestedColor: matchedInstitution.brandColor,
      reason: `Matched ${matchedInstitution.name} (${finalType.toUpperCase()})`,
    };
  }

  if (explicitType) {
    let iconForType = 'bank';
    if (explicitType === 'savings') iconForType = 'savings';
    if (explicitType === 'credit') iconForType = 'card';
    if (explicitType === 'cash') iconForType = 'cash';
    if (explicitType === 'ewallet') iconForType = 'wallet';

    return {
      detected: true,
      suggestedType: explicitType,
      suggestedIcon: iconForType,
      reason: `Detected account type: ${explicitType.toUpperCase()}`,
    };
  }

  return { detected: false };
}
