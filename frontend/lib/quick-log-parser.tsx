import { TransactionType, DEFAULT_CATEGORIES, Account } from './types';

export interface ParsedTransaction {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    isValid: boolean;
    message: string;
    dateString?: string;
    accountId?: string;
}

const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
};

const categoryKeywords: Record<string, string[]> = {
    // Income
    'salary': ['salary', 'paycheck', 'pay', 'wage', 'income'],
    'bonus': ['bonus', 'gift', 'present', 'reward'],
    'freelance': ['freelance', 'gig', 'contract', 'project', 'consulting', 'side hustle'],
    'investment': ['investment', 'stock', 'crypto', 'dividend', 'interest', 'profit'],

    // Expense
    'food': ['food', 'dining', 'lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'cafe', 'grocery', 'groceries', 'snack', 'eat'],
    'transport': ['transport', 'taxi', 'uber', 'grab', 'bus', 'train', 'gas', 'car', 'fuel', 'fare', 'subway', 'parking'],
    'utilities': ['utilities', 'electricity', 'water', 'power', 'internet', 'wifi', 'bill', 'phone', 'electric'],
    'entertainment': ['entertainment', 'movie', 'game', 'gaming', 'cinema', 'concert', 'fun', 'party', 'ticket'],
    'healthcare': ['healthcare', 'doctor', 'medicine', 'hospital', 'dentist', 'clinic', 'pharmacy', 'health', 'medical'],
    'shopping': ['shopping', 'clothes', 'amazon', 'store', 'mall', 'buy', 'shoes', 'gadget'],
    'subscription': ['subscription', 'netflix', 'spotify', 'youtube', 'sub', 'membership'],
    'travel': ['travel', 'flight', 'hotel', 'vacation', 'trip', 'airbnb', 'booking']
};

/**
 * Parse quick-log transaction format
 * Expects: [+][value] [description]
 * - "50 food for lunch" -> Expense, $50, Food & Dining, Description: "food for lunch"
 * - "+100 freelance" -> Income, $100, Freelance, Description: "freelance"
 * - "50 food on June 1" -> Expense, $50, Food & Dining, Date: June 1, Description: "food"
 * - "100 from checking" -> Expense, $100, Other, Account: checking
 */
export function parseQuickLog(input: string, accounts: Account[] = []): ParsedTransaction {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            type: 'expense',
            amount: 0,
            category: 'other-expense',
            description: '',
            isValid: false,
            message: 'Please enter a transaction',
        };
    }

    // Match starting value (optional + sign, followed by positive number, followed by optional description)
    const match = trimmed.match(/^([+-]?)\s*([\d.]+)(?:\s+(.+))?$/);
    if (!match) {
        return {
            type: 'expense',
            amount: 0,
            category: 'other-expense',
            description: '',
            isValid: false,
            message: 'Format: [+][value] [description] (e.g., "50 food" or "+100 salary")',
        };
    }

    const [, sign, amountStr, descriptionRaw] = match;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
        return {
            type: 'expense',
            amount: 0,
            category: 'other-expense',
            description: '',
            isValid: false,
            message: 'Amount must be a positive number',
        };
    }

    if (amount > 1000000) {
        return {
            type: 'expense',
            amount: 0,
            category: 'other-expense',
            description: '',
            isValid: false,
            message: 'Amount seems too large. Please check the value.',
        };
    }

    const type: TransactionType = sign === '+' ? 'income' : 'expense';
    let descriptionText = descriptionRaw ? descriptionRaw.trim() : '';

    // 1. Detect and parse date (e.g. "Jun 1", "June 12", "1 Jun", "12 June")
    let dateString: string | undefined;
    const monthRegexStr = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    const format1 = new RegExp(`\\b(?:on\\s+|at\\s+)?(${monthRegexStr})\\s+(\\d{1,2})\\b`, 'i');
    const format2 = new RegExp(`\\b(?:on\\s+|at\\s+)?(\\d{1,2})\\s+(${monthRegexStr})\\b`, 'i');

    let month: number | undefined;
    let day: number | undefined;
    let matchedDateText = '';

    const match1 = descriptionText.match(format1);
    if (match1) {
        matchedDateText = match1[0];
        month = monthMap[match1[1].toLowerCase()];
        day = parseInt(match1[2], 10);
    } else {
        const match2 = descriptionText.match(format2);
        if (match2) {
            matchedDateText = match2[0];
            day = parseInt(match2[1], 10);
            month = monthMap[match2[2].toLowerCase()];
        }
    }

    if (month !== undefined && day !== undefined && !isNaN(day) && day >= 1 && day <= 31) {
        const currentYear = new Date().getFullYear();
        const parsedDate = new Date(currentYear, month, day);
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        dateString = `${yyyy}-${mm}-${dd}`;
        
        // Remove date substring from description
        descriptionText = descriptionText.replace(matchedDateText, '').replace(/\s+/g, ' ').trim();
    }

    // 2. Detect and parse account from description (e.g. "checking", "savings", "credit")
    let accountId: string | undefined;
    if (descriptionText && accounts.length > 0) {
        const descLower = descriptionText.toLowerCase();
        const matchedAccount = accounts.find(acc => {
            const nameLower = acc.name.toLowerCase();
            if (descLower.includes(nameLower)) return true;
            // Split account name into words and check if any key word (length >= 4) is in the description
            const words = nameLower.split(/\s+/).filter(w => w.length >= 4);
            return words.some(word => descLower.includes(word));
        });
        if (matchedAccount) {
            accountId = matchedAccount.id;
            // Determine which word/phrase was matched in the description
            const nameLower = matchedAccount.name.toLowerCase();
            const words = nameLower.split(/\s+/).filter(w => w.length >= 4);
            let matchPhrase = matchedAccount.name;
            for (const word of [nameLower, ...words]) {
                if (descLower.includes(word)) {
                    matchPhrase = word;
                    break;
                }
            }
            // Remove the matched account word/phrase (including potential preceding prepositions) from description
            const escapedPhrase = matchPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const accRegex = new RegExp(`\\b(?:on|from|to|using|in)?\\s*${escapedPhrase}\\b`, 'i');
            descriptionText = descriptionText.replace(accRegex, '').replace(/\s+/g, ' ').trim();
        }
    }

    // 3. Match category based on the cleaned description text
    let matchedCategoryId: string | null = null;
    const descLower = descriptionText.toLowerCase();

    // Check direct category ID or Name matches first
    const directMatch = DEFAULT_CATEGORIES.find(
        (cat) =>
            cat.type === type &&
            (descLower.includes(cat.id.toLowerCase()) ||
                descLower.includes(cat.name.toLowerCase()))
    );

    if (directMatch) {
        matchedCategoryId = directMatch.id;
    } else {
        // Search using custom keywords
        for (const [catId, keywords] of Object.entries(categoryKeywords)) {
            const cat = DEFAULT_CATEGORIES.find(c => c.id === catId);
            if (cat && cat.type === type) {
                if (keywords.some(keyword => descLower.includes(keyword))) {
                    matchedCategoryId = catId;
                    break;
                }
            }
        }
    }

    const category = matchedCategoryId || (type === 'income' ? 'other-income' : 'other-expense');
    const matchedCategory = DEFAULT_CATEGORIES.find(cat => cat.id === category);
    const categoryName = matchedCategory?.name || 'Other';

    const finalDescription = descriptionText || categoryName;

    // Build real-time preview message
    let message = `✓ ${type === 'income' ? '+' : '-'}$${amount.toFixed(2)} to ${categoryName}`;
    if (dateString) {
        const [y, m, d] = dateString.split('-').map(Number);
        const dateForDisplay = new Date(y, m - 1, d);
        const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        message += ` on ${dateForDisplay.toLocaleDateString('en-US', dateOptions)}`;
    }

    return {
        type,
        amount,
        category,
        description: finalDescription,
        isValid: true,
        message,
        dateString,
        accountId
    };
}

/**
 * Get format guide for user
 */
export function getFormatGuide(): string {
    return `Quick-Log Format Guide:
• "50 food for lunch on Jun 1" - $50 expense, Food category, June 1
• "+100 freelance on June 15" - $100 income, Freelance category, June 15
• "25 coffee" - $25 expense, Food category, current date
• "+500 salary from checking" - $500 income, Salary category, Checking account

Type '+' before the value for income. Unsigned values are expenses.
Supported categories are matched automatically from your description.`;
}
