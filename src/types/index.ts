export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  buyPrice?: number;
  category: string;
  image?: string;
  stock: number;
  barcode?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
  unitPrice?: number;
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: Product; // Optional product data for receipt display
}

export interface Customer {
  name?: string;
  phone?: string;
  email?: string;
  preferredNotification: 'whatsapp' | 'telegram';
}

export interface CardInfo {
  cardType: string;
  lastFourDigits: string;
  cardHolderName: string;
  expiryDate: string;
}

export interface Transaction {
  id: string;
  timestamp: Date; // Payment timestamp
  items: TransactionItem[]; // Changed from CartItem[] to TransactionItem[]
  total: number;
  paymentMethod: 'cash' | 'card' | 'crypto';
  paymentStatus: 'pending' | 'completed' | 'failed';
  customer?: Customer;
  txHash?: string; // For crypto payments
  receiptSent: boolean;
  change?: number; // For cash payments
  cryptoCurrency?: 'MIDEN'; // For crypto payments
  cryptoAmount?: number; // Amount in crypto
  cardInfo?: CardInfo; // For card payments
  storeId?: string; // Store identifier
  createdAt?: Date; // Optional: record creation time
  updatedAt?: Date; // Optional: record update time
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  balance: {
    miden: number;
  };
  provider?: 'miden';
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  telegramBotToken?: string;
  currency: 'IDR' | 'USD';
  language: 'id' | 'en';
  cryptoWalletAddress?: string; // Merchant's wallet address for receiving crypto
  storeId?: string; // Unique store identifier based on wallet
}

// Miden Finance DeFi Types
export interface DeFiPool {
  id: string;
  name: string;
  asset: string;
  apy: number;
  totalDeposited: number;
  userDeposited: number;
  isActive: boolean;
}

export interface DeFiPosition {
  poolId: string;
  amount: number;
  value: number;
  rewards: number;
  timestamp: Date;
  txHash?: string;
}

export interface StoreData {
  storeId: string;
  walletAddress: string;
  businessInfo: BusinessInfo;
  products: Product[];
  transactions: Transaction[];
  defiPositions: DeFiPosition[];
  totalEarnings: number;
  totalDefiValue: number;
  createdAt: Date;
  lastActive: Date;
}

export interface MarketplaceStats {
  totalStores: number;
  totalTransactions: number;
  totalVolume: number;
  totalDefiValue: number;
  activeStores: number;
}