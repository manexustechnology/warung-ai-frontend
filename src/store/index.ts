import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Transaction, WalletState, BusinessInfo, StoreData, MarketplaceStats, DeFiPosition } from '../types';

interface AppState {
  // Current Store (based on connected wallet)
  currentStore: StoreData | null;
  setCurrentStore: (store: StoreData) => void;
  
  // All Stores (marketplace data)
  allStores: StoreData[];
  addStore: (store: StoreData) => void;
  updateStore: (storeId: string, updates: Partial<StoreData>) => void;
  
  // Marketplace Stats
  marketplaceStats: MarketplaceStats;
  updateMarketplaceStats: () => void;
  
  // Products (for current store)
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Cart (for current store)
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // Transactions (for current store)
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  
  // DeFi Positions (for current store)
  defiPositions: DeFiPosition[];
  addDefiPosition: (position: DeFiPosition) => void;
  updateDefiPosition: (poolId: string, updates: Partial<DeFiPosition>) => void;
  removeDefiPosition: (poolId: string) => void;
  
  // Wallet
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
  
  // Business Info (for current store)
  businessInfo: BusinessInfo;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  
  // UI State
  currentView: 'pos' | 'products' | 'history' | 'settings' | 'defi' | 'marketplace';
  setCurrentView: (view: 'pos' | 'products' | 'history' | 'settings' | 'defi' | 'marketplace') => void;
  
  // Store Management
  initializeStore: (walletAddress: string) => void;
  switchStore: (storeId: string) => void;
}

const createDefaultBusinessInfo = (walletAddress: string): BusinessInfo => ({
  name: `Store ${walletAddress.slice(0, 8)}`,
  address: 'Please update your store address',
  phone: 'Please update your phone number',
  currency: 'IDR',
  language: 'id',
  cryptoWalletAddress: walletAddress,
  storeId: walletAddress,
});

const createDefaultStore = (walletAddress: string): StoreData => ({
  storeId: walletAddress,
  walletAddress,
  businessInfo: createDefaultBusinessInfo(walletAddress),
  products: [
    {
      id: '1',
      name: 'Beras 5kg',
      nameEn: 'Rice 5kg',
      price: 65000,
      category: 'Sembako',
      stock: 50,
    },
    {
      id: '2',
      name: 'Minyak Goreng 1L',
      nameEn: 'Cooking Oil 1L',
      price: 18000,
      category: 'Sembako',
      stock: 30,
    },
    {
      id: '3',
      name: 'Gula Pasir 1kg',
      nameEn: 'Sugar 1kg',
      price: 14000,
      category: 'Sembako',
      stock: 25,
    },
    {
      id: '4',
      name: 'Indomie Goreng',
      nameEn: 'Indomie Fried Noodles',
      price: 3500,
      category: 'Makanan',
      stock: 100,
    },
    {
      id: '5',
      name: 'Aqua 600ml',
      nameEn: 'Aqua Water 600ml',
      price: 3000,
      category: 'Minuman',
      stock: 80,
    },
  ],
  transactions: [],
  defiPositions: [],
  totalEarnings: 0,
  totalDefiValue: 0,
  createdAt: new Date(),
  lastActive: new Date(),
});

// Helper function to recursively convert date strings back to Date objects
const reviveDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string matches ISO date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(obj)) {
      const date = new Date(obj);
      // Verify it's a valid date
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = reviveDates(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current Store
      currentStore: null,
      setCurrentStore: (store) => set({ 
        currentStore: store,
        products: store.products,
        transactions: store.transactions,
        defiPositions: store.defiPositions,
        businessInfo: store.businessInfo,
      }),
      
      // All Stores
      allStores: [],
      addStore: (store) => set((state) => ({
        allStores: [...state.allStores, store],
      })),
      updateStore: (storeId, updates) => set((state) => ({
        allStores: state.allStores.map((store) =>
          store.storeId === storeId ? { ...store, ...updates, lastActive: new Date() } : store
        ),
        currentStore: state.currentStore?.storeId === storeId 
          ? { ...state.currentStore, ...updates, lastActive: new Date() }
          : state.currentStore,
      })),
      
      // Marketplace Stats
      marketplaceStats: {
        totalStores: 0,
        totalTransactions: 0,
        totalVolume: 0,
        totalDefiValue: 0,
        activeStores: 0,
      },
      updateMarketplaceStats: () => set((state) => {
        const stats = state.allStores.reduce((acc, store) => ({
          totalStores: acc.totalStores + 1,
          totalTransactions: acc.totalTransactions + store.transactions.length,
          totalVolume: acc.totalVolume + store.totalEarnings,
          totalDefiValue: acc.totalDefiValue + store.totalDefiValue,
          activeStores: acc.activeStores + (store.lastActive > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 1 : 0),
        }), {
          totalStores: 0,
          totalTransactions: 0,
          totalVolume: 0,
          totalDefiValue: 0,
          activeStores: 0,
        });
        
        return { marketplaceStats: stats };
      }),
      
      // Products
      products: [],
      addProduct: (product) => set((state) => {
        const newProducts = [...state.products, product];
        if (state.currentStore) {
          const updatedStore = { ...state.currentStore, products: newProducts };
          return {
            products: newProducts,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { products: newProducts };
      }),
      updateProduct: (id, updates) => set((state) => {
        const newProducts = state.products.map((p) => p.id === id ? { ...p, ...updates } : p);
        if (state.currentStore) {
          const updatedStore = { ...state.currentStore, products: newProducts };
          return {
            products: newProducts,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { products: newProducts };
      }),
      deleteProduct: (id) => set((state) => {
        const newProducts = state.products.filter((p) => p.id !== id);
        if (state.currentStore) {
          const updatedStore = { ...state.currentStore, products: newProducts };
          return {
            products: newProducts,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { products: newProducts };
      }),
      
      // Cart
      cart: [],
      addToCart: (product, quantity = 1) => set((state) => {
        const existingItem = state.cart.find((item) => item.product.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: (item.quantity + quantity) * product.price,
                  }
                : item
            ),
          };
        }
        return {
          cart: [
            ...state.cart,
            {
              product,
              quantity,
              subtotal: quantity * product.price,
            },
          ],
        };
      }),
      updateCartItem: (productId, quantity) => set((state) => ({
        cart: quantity === 0
          ? state.cart.filter((item) => item.product.id !== productId)
          : state.cart.map((item) =>
              item.product.id === productId
                ? {
                    ...item,
                    quantity,
                    subtotal: quantity * item.product.price,
                  }
                : item
            ),
      })),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId),
      })),
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.subtotal, 0);
      },
      
      // Transactions
      transactions: [],
      addTransaction: (transaction) => set((state) => {
        const newTransactions = [transaction, ...state.transactions];
        const newTotalEarnings = state.currentStore ? state.currentStore.totalEarnings + transaction.total : transaction.total;
        
        if (state.currentStore) {
          const updatedStore = { 
            ...state.currentStore, 
            transactions: newTransactions,
            totalEarnings: newTotalEarnings,
            lastActive: new Date(),
          };
          return {
            transactions: newTransactions,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { transactions: newTransactions };
      }),
      
      // DeFi Positions
      defiPositions: [],
      addDefiPosition: (position) => set((state) => {
        const newPositions = [...state.defiPositions, position];
        const newTotalDefiValue = newPositions.reduce((sum, pos) => sum + pos.value, 0);
        
        if (state.currentStore) {
          const updatedStore = { 
            ...state.currentStore, 
            defiPositions: newPositions,
            totalDefiValue: newTotalDefiValue,
            lastActive: new Date(),
          };
          return {
            defiPositions: newPositions,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { defiPositions: newPositions };
      }),
      updateDefiPosition: (poolId, updates) => set((state) => {
        const newPositions = state.defiPositions.map((pos) =>
          pos.poolId === poolId ? { ...pos, ...updates } : pos
        );
        const newTotalDefiValue = newPositions.reduce((sum, pos) => sum + pos.value, 0);
        
        if (state.currentStore) {
          const updatedStore = { 
            ...state.currentStore, 
            defiPositions: newPositions,
            totalDefiValue: newTotalDefiValue,
            lastActive: new Date(),
          };
          return {
            defiPositions: newPositions,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { defiPositions: newPositions };
      }),
      removeDefiPosition: (poolId) => set((state) => {
        const newPositions = state.defiPositions.filter((pos) => pos.poolId !== poolId);
        const newTotalDefiValue = newPositions.reduce((sum, pos) => sum + pos.value, 0);
        
        if (state.currentStore) {
          const updatedStore = { 
            ...state.currentStore, 
            defiPositions: newPositions,
            totalDefiValue: newTotalDefiValue,
            lastActive: new Date(),
          };
          return {
            defiPositions: newPositions,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { defiPositions: newPositions };
      }),
      
      // Wallet
      wallet: { connected: false },
      setWallet: (wallet) => set({ wallet }),
      
      // Business Info
      businessInfo: {
        name: 'WarungPay DeFi',
        address: 'Jl. Merdeka No. 123, Jakarta',
        phone: '+62812345678',
        currency: 'IDR',
        language: 'id',
      },
      updateBusinessInfo: (info) => set((state) => {
        const newBusinessInfo = { ...state.businessInfo, ...info };
        
        if (state.currentStore) {
          const updatedStore = { 
            ...state.currentStore, 
            businessInfo: newBusinessInfo,
            lastActive: new Date(),
          };
          return {
            businessInfo: newBusinessInfo,
            currentStore: updatedStore,
            allStores: state.allStores.map(store => 
              store.storeId === state.currentStore?.storeId ? updatedStore : store
            ),
          };
        }
        return { businessInfo: newBusinessInfo };
      }),
      
      // UI State
      currentView: 'marketplace',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Store Management
      initializeStore: (walletAddress) => set((state) => {
        // Check if store already exists
        const existingStore = state.allStores.find(store => store.storeId === walletAddress);
        
        if (existingStore) {
          // Switch to existing store
          return {
            currentStore: existingStore,
            products: existingStore.products,
            transactions: existingStore.transactions,
            defiPositions: existingStore.defiPositions,
            businessInfo: existingStore.businessInfo,
          };
        } else {
          // Create new store
          const newStore = createDefaultStore(walletAddress);
          return {
            allStores: [...state.allStores, newStore],
            currentStore: newStore,
            products: newStore.products,
            transactions: newStore.transactions,
            defiPositions: newStore.defiPositions,
            businessInfo: newStore.businessInfo,
          };
        }
      }),
      switchStore: (storeId) => set((state) => {
        const store = state.allStores.find(s => s.storeId === storeId);
        if (store) {
          return {
            currentStore: store,
            products: store.products,
            transactions: store.transactions,
            defiPositions: store.defiPositions,
            businessInfo: store.businessInfo,
          };
        }
        return state;
      }),
    }),
    {
      name: 'warung-defi-marketplace-storage',
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str);
          return reviveDates(parsed);
        } catch (error) {
          console.error('Failed to deserialize state:', error);
          return {};
        }
      },
    }
  )
);