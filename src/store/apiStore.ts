import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Transaction, WalletState, BusinessInfo, StoreData, MarketplaceStats, DeFiPosition } from '../types';
import { authAPI, storesAPI, productsAPI, transactionsAPI, cartAPI, defiAPI, marketplaceAPI } from '../utils/api';
import toast from 'react-hot-toast';

interface ApiAppState {
  // Authentication
  isAuthenticated: boolean;
  authToken: string | null;
  currentUser: any | null;
  
  // Loading states to prevent duplicate API calls
  loadingStates: {
    products: boolean;
    cart: boolean;
    transactions: boolean;
    defiPositions: boolean;
    auth: boolean;
  };
  
  // Current Store (based on connected wallet)
  currentStore: StoreData | null;
  setCurrentStore: (store: StoreData) => void;
  
  // All Stores (marketplace data)
  allStores: StoreData[];
  addStore: (store: StoreData) => void;
  updateStore: (storeId: string, updates: Partial<StoreData>) => void;
  loadAllStores: () => Promise<void>;
  
  // Marketplace Stats
  marketplaceStats: MarketplaceStats;
  updateMarketplaceStats: () => void;
  
  // Products (for current store)
  products: Product[];
  addProduct: (productData: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  loadProducts: (storeId: string) => Promise<void>;
  
  // Cart (for current store)
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  loadCart: (storeId: string) => Promise<void>;
  syncCartToDatabase: () => Promise<void>;
  updateCartItemPrice: (productId: string, unitPrice: number) => Promise<void>;
  
  // Transactions (for current store)
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => Promise<Transaction>;
  loadTransactions: (storeId: string) => Promise<void>;
  
  // DeFi Positions (for current store)
  defiPositions: DeFiPosition[];
  addDefiPosition: (position: DeFiPosition) => void;
  updateDefiPosition: (poolId: string, updates: Partial<DeFiPosition>) => void;
  removeDefiPosition: (poolId: string) => void;
  loadDefiPositions: (storeId: string) => Promise<void>;
  
  // Wallet
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
  
  // Business Info (for current store)
  businessInfo: BusinessInfo;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  updateBusinessInfoAndPersist: (info: Partial<BusinessInfo>) => Promise<boolean>;
  
  // UI State
  currentView: 'pos' | 'products' | 'history' | 'settings' | 'defi' | 'marketplace' | 'wallet-test' | 'simple-wallet-test' | 'simple-test' | 'simple-test-debug' | 'simple-test-safe' | 'simple-test-robust' | 'simple-test-final' | 'disconnect-test';
  setCurrentView: (view: 'pos' | 'products' | 'history' | 'settings' | 'defi' | 'marketplace' | 'wallet-test' | 'simple-wallet-test' | 'simple-test' | 'simple-test-debug' | 'simple-test-safe' | 'simple-test-robust' | 'simple-test-final' | 'disconnect-test') => void;
  
  // Store Management
  initializeStore: (walletAddress: string) => Promise<void>;
  switchStore: (storeId: string) => Promise<void>;
  
  // Authentication Actions
  initializeAuth: () => Promise<boolean>;
  login: (walletAddress: string) => Promise<boolean>;
  logout: () => void;
  register: (walletAddress: string, userData?: any) => Promise<boolean>;
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
  products: [],
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
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(obj)) {
      const date = new Date(obj);
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

export const useApiStore = create<ApiAppState>()(
  persist(
    (set, get) => ({
      // Authentication
      isAuthenticated: false,
      authToken: null,
      currentUser: null,

      // Loading states
      loadingStates: {
        products: false,
        cart: false,
        transactions: false,
        defiPositions: false,
        auth: false,
      },
      
      // Initialize authentication state from localStorage
      initializeAuth: async () => {
        const state = get();
        if (state.loadingStates.auth) {
          console.log('Auth is already initializing, skipping duplicate call');
          return state.isAuthenticated;
        }

        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            set((state) => ({
              loadingStates: { ...state.loadingStates, auth: true }
            }));
            
            console.log('Found auth token in localStorage, verifying...');
            // Verify token with backend
            const response = await authAPI.verifyToken();
            const { user } = response.data;
            
            console.log('Token verified successfully, user:', user);
            
            set({ 
              isAuthenticated: true, 
              authToken: token, 
              currentUser: user 
            });
            
            // Check if we already have a currentStore from persistence
            const currentState = get();
            if (currentState.currentStore && currentState.currentStore.walletAddress === user.walletAddress) {
              console.log('Current store already exists from persistence, loading fresh data...');
              // Load fresh data from backend even if store exists in persistence
              try {
                await get().loadProducts(user.walletAddress);
                await get().loadCart(user.walletAddress);
                await get().loadTransactions(user.walletAddress);
                await get().loadDefiPositions(user.walletAddress);
                await get().updateMarketplaceStats();
              } catch (error) {
                console.error('Failed to load fresh data during auth restoration:', error);
              }
              return true;
            }
            
            // Initialize store if user has stores
            if (user.stores && user.stores.length > 0) {
              console.log('User has stores, initializing store...');
              await get().initializeStore(user.walletAddress);
              
              // Also update marketplace stats to ensure all data is loaded
              try {
                await get().updateMarketplaceStats();
              } catch (error) {
                console.error('Failed to update marketplace stats during auth restoration:', error);
              }
            } else {
              console.log('User has no stores, creating default store...');
              // Create default store if user has no stores
              const defaultStore = createDefaultStore(user.walletAddress);
              try {
                await storesAPI.create({
                  walletAddress: user.walletAddress,
                  name: defaultStore.businessInfo.name,
                  address: defaultStore.businessInfo.address,
                  phone: defaultStore.businessInfo.phone,
                  currency: defaultStore.businessInfo.currency,
                  // Map frontend language value to backend value
                  language: defaultStore.businessInfo.language === 'id' ? 'INDONESIAN' : 'ENGLISH',
                });
                console.log('Default store created during auth restoration');
                
                // Initialize the newly created store
                await get().initializeStore(user.walletAddress);
              } catch (storeError) {
                console.error('Failed to create default store during auth restoration:', storeError);
                // Set default store locally if backend creation fails
                set({ 
                  currentStore: defaultStore,
                  businessInfo: defaultStore.businessInfo 
                });
              }
            }
            
            console.log('Authentication restored from localStorage successfully');
            return true;
          } catch (error) {
            console.error('Failed to restore authentication:', error);
            localStorage.removeItem('authToken');
            set({ 
              isAuthenticated: false, 
              authToken: null, 
              currentUser: null,
              currentStore: null,
              businessInfo: createDefaultBusinessInfo(''),
              products: [],
              transactions: [],
              defiPositions: [],
              cart: [],
              allStores: [],
              marketplaceStats: {
                totalStores: 0,
                totalTransactions: 0,
                totalVolume: 0,
                totalDefiValue: 0,
                activeStores: 0,
              }
            });
            return false;
          } finally {
            set((state) => ({
              loadingStates: { ...state.loadingStates, auth: false }
            }));
          }
        }
        console.log('No auth token found in localStorage');
        return false;
      },
      
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
      updateMarketplaceStats: async () => {
        try {
          console.log('Updating marketplace stats...');
          const response = await marketplaceAPI.getStats();
          console.log('Marketplace stats response:', response.data);
          set({ marketplaceStats: response.data.stats });
          
          // Also load all stores when updating marketplace stats
          await get().loadAllStores();
        } catch (error) {
          console.error('Failed to update marketplace stats:', error);
        }
      },
      
      loadAllStores: async () => {
        try {
          console.log('Loading all stores from marketplace...');
          const response = await marketplaceAPI.getStores();
          console.log('All stores response:', response.data);
          const backendStores = response.data.stores || [];
          
          // Transform backend store data to match frontend StoreData interface
          const transformedStores = backendStores.map((backendStore: any) => ({
            storeId: backendStore.storeId,
            walletAddress: backendStore.walletAddress,
            businessInfo: {
              name: backendStore.name,
              address: backendStore.address || '',
              phone: backendStore.phone || '',
              whatsappNumber: backendStore.whatsappNumber,
              telegramBotToken: backendStore.telegramBotToken,
              currency: backendStore.currency,
              // Map backend language values to frontend values
              language: (backendStore.language === 'INDONESIAN' ? 'id' : 
                       backendStore.language === 'ENGLISH' ? 'en' : 'id') as 'id' | 'en',
              cryptoWalletAddress: backendStore.walletAddress,
              storeId: backendStore.storeId,
            },
            products: backendStore.products || [],
            transactions: backendStore.transactions || [],
            defiPositions: backendStore.defiPositions || [],
            totalEarnings: backendStore.totalEarnings || 0,
            totalDefiValue: backendStore.totalDefiValue || 0,
            createdAt: new Date(backendStore.createdAt),
            lastActive: new Date(backendStore.lastActive),
          }));
          
          console.log('Transformed stores:', transformedStores);
          set({ allStores: transformedStores });
        } catch (error) {
          console.error('Failed to load all stores:', error);
        }
      },
      
      // Products
      products: [],
      addProduct: async (productData: Omit<Product, 'id'>) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Creating product for store:', state.currentStore.walletAddress);
          console.log('Product data:', productData);
          console.log('Current store data:', state.currentStore);
          console.log('Authentication status:', state.isAuthenticated);

          // Call backend API to create product
          console.log('Calling productsAPI.create with:', {
            storeId: state.currentStore.walletAddress,
            productData: productData
          });
          
          const response = await productsAPI.create(state.currentStore.walletAddress, productData);
          console.log('API response received:', response);
          const newProduct = response.data.product;

          console.log('Product created successfully:', newProduct);

          // Update local state
          set((state) => ({
            products: [...state.products, newProduct],
          }));

          toast.success('Product created successfully');
          return newProduct;
        } catch (error: any) {
          console.error('Failed to create product:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
          });
          toast.error('Failed to create product');
          throw error;
        }
      },
      updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Updating product:', id);
          console.log('Update data:', updates);

          // Call backend API to update product
          const response = await productsAPI.update(id, updates);
          const updatedProduct = response.data.product;

          console.log('Product updated successfully:', updatedProduct);

          // Update local state
          set((state) => ({
            products: state.products.map((product) =>
              product.id === id ? updatedProduct : product
            ),
          }));

          toast.success('Product updated successfully');
          return updatedProduct;
        } catch (error: any) {
          console.error('Failed to update product:', error);
          toast.error('Failed to update product');
          throw error;
        }
      },
      deleteProduct: async (id: string) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Deleting product:', id);

          // Call backend API to delete product
          await productsAPI.delete(id);

          console.log('Product deleted successfully');

          // Update local state
          set((state) => ({
            products: state.products.filter((product) => product.id !== id),
          }));

          toast.success('Product deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete product:', error);
          toast.error('Failed to delete product');
          throw error;
        }
      },
      loadProducts: async (storeId: string) => {
        const state = get();
        if (state.loadingStates.products) {
          console.log('Products are already loading, skipping duplicate call');
          return;
        }

        try {
          set((state) => ({
            loadingStates: { ...state.loadingStates, products: true }
          }));
          
          console.log('Loading products for store:', storeId);
          const response = await productsAPI.getByStore(storeId);
          console.log('Products loaded successfully, count:', response.data.products?.length || 0);
          
          set({ products: response.data.products || [] });
        } catch (error: any) {
          console.error('Failed to load products:', error);
          if (error.response?.status !== 429) { // Don't show toast for rate limit errors
            toast.error('Failed to load products');
          }
        } finally {
          set((state) => ({
            loadingStates: { ...state.loadingStates, products: false }
          }));
        }
      },
      
      // Cart
      cart: [],
      addToCart: async (product: Product, quantity = 1) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Adding product to cart (localStorage only):', {
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            quantity: quantity
          });

          // Check if product already exists in cart
          const existingItemIndex = state.cart.findIndex(item => item.product.id === product.id);
          
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedCart = [...state.cart];
            const existingItem = updatedCart[existingItemIndex];
            const effectivePrice = Number(existingItem.unitPrice ?? product.price);
            const newQuantity = existingItem.quantity + quantity;
            const newSubtotal = effectivePrice * newQuantity;
            
            updatedCart[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              subtotal: newSubtotal
            };
            
            set({ cart: updatedCart });
          } else {
            // Add new item to cart
            const newCartItem: CartItem = {
              id: `local_${Date.now()}_${Math.random()}`, // Generate local ID
              product: product,
              quantity: quantity,
              subtotal: Number(product.price) * quantity,
              unitPrice: Number(product.price)
            };
            
            set({ cart: [...state.cart, newCartItem] });
          }

          console.log('Product added to cart successfully (localStorage)');
          toast.success('Product added to cart');
        } catch (error: any) {
          console.error('Failed to add product to cart:', error);
          toast.error('Failed to add product to cart');
          throw error;
        }
      },
      updateCartItem: async (productId: string, quantity: number) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Updating cart item (localStorage only):', productId, 'quantity:', quantity);

          const updatedCart = state.cart.map(item => {
            if (item.product.id === productId) {
              const effectivePrice = Number(item.unitPrice ?? item.product.price);
              const newSubtotal = effectivePrice * quantity;
              return {
                ...item,
                quantity: quantity,
                subtotal: newSubtotal
              };
            }
            return item;
          });

          set({ cart: updatedCart });

          console.log('Cart item updated successfully (localStorage)');
          toast.success('Cart updated');
        } catch (error: any) {
          console.error('Failed to update cart item:', error);
          toast.error('Failed to update cart item');
          throw error;
        }
      },
      updateCartItemPrice: async (productId: string, unitPrice: number) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Updating cart item price (localStorage only):', productId, 'unitPrice:', unitPrice);

          const updatedCart = state.cart.map(item => {
            if (item.product.id === productId) {
              const effectivePrice = Math.max(0, Number(unitPrice));
              const newSubtotal = effectivePrice * item.quantity;
              return {
                ...item,
                unitPrice: effectivePrice,
                subtotal: newSubtotal
              };
            }
            return item;
          });

          set({ cart: updatedCart });

          console.log('Cart item price updated successfully (localStorage)');
          toast.success('Price updated');
        } catch (error: any) {
          console.error('Failed to update cart item price:', error);
          toast.error('Failed to update price');
          throw error;
        }
      },
      removeFromCart: async (productId: string) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Removing product from cart (localStorage only):', productId);

          const updatedCart = state.cart.filter(item => item.product.id !== productId);
          set({ cart: updatedCart });

          console.log('Product removed from cart successfully (localStorage)');
          toast.success('Product removed from cart');
        } catch (error: any) {
          console.error('Failed to remove product from cart:', error);
          toast.error('Failed to remove product from cart');
          throw error;
        }
      },
      clearCart: async () => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Clearing cart (localStorage only)');

          set({ cart: [] });

          console.log('Cart cleared successfully (localStorage)');
          toast.success('Cart cleared');
        } catch (error: any) {
          console.error('Failed to clear cart:', error);
          toast.error('Failed to clear cart');
          throw error;
        }
      },
      // Helper function to sync cart to database (called during confirm payment)
      syncCartToDatabase: async () => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Syncing cart to database before transaction');

          // Clear existing cart in database first
          try {
            await cartAPI.clear(state.currentStore.walletAddress);
          } catch (error) {
            console.log('No existing cart to clear or error clearing:', error);
          }

          // Add all current cart items to database
          for (const item of state.cart) {
            await cartAPI.addItem(state.currentStore.walletAddress, {
              productId: item.product.id,
              quantity: item.quantity,
            });
          }

          console.log('Cart synced to database successfully');
        } catch (error: any) {
          console.error('Failed to sync cart to database:', error);
          // Don't throw error here, just log it
        }
      },
      getCartTotal: () => {
        const state = get();
        console.log('Calculating cart total. Cart items:', state.cart.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          subtotal: item.subtotal,
          productPrice: item.product.price
        })));
        
        const total = state.cart.reduce((total, item) => {
          const itemSubtotal = Number(item.subtotal) || 0;
          const currentTotal = Number(total) || 0;
          console.log(`Adding ${itemSubtotal} to total ${currentTotal}`);
          return currentTotal + itemSubtotal;
        }, 0);
        
        console.log('Final cart total:', total);
        return total;
      },
      loadCart: async (storeId: string) => {
        const state = get();
        if (state.loadingStates.cart) {
          console.log('Cart is already loading, skipping duplicate call');
          return;
        }

        try {
          set((state) => ({
            loadingStates: { ...state.loadingStates, cart: true }
          }));
          
          // Since we're using localStorage only, we don't need to load from database
          // Cart data is already persisted in Zustand store
          console.log('Cart loaded from localStorage, items:', state.cart.length);
          
          // Don't set cart here since it's already in state
        } catch (error: any) {
          console.error('Failed to load cart:', error);
          if (error.response?.status !== 429) {
            toast.error('Failed to load cart');
          }
        } finally {
          set((state) => ({
            loadingStates: { ...state.loadingStates, cart: false }
          }));
        }
      },
      
      // Transactions
      transactions: [],
      addTransaction: async (transactionData: Omit<Transaction, 'id'>) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }

          console.log('Creating transaction for store:', state.currentStore.walletAddress);
          console.log('Transaction data:', transactionData);
          console.log('Current store data:', state.currentStore);
          console.log('Authentication status:', state.isAuthenticated);

          // Call backend API to create transaction
          console.log('Calling transactionsAPI.create with:', {
            storeId: state.currentStore.walletAddress,
            transactionData: transactionData
          });
          
          // Map frontend enums (lowercase) to backend enums (UPPERCASE)
          const backendPayload: any = {
            ...transactionData,
            paymentMethod: transactionData.paymentMethod?.toString().toUpperCase(),
            paymentStatus: transactionData.paymentStatus?.toString().toUpperCase(),
            customer: transactionData.customer
              ? {
                  ...transactionData.customer,
                  preferredNotification: transactionData.customer.preferredNotification
                    ? transactionData.customer.preferredNotification.toString().toUpperCase()
                    : undefined,
                }
              : undefined,
          };

          const response = await transactionsAPI.create(state.currentStore.walletAddress, backendPayload);
          console.log('API response received:', response);
          const newTransaction = response.data.transaction;

          console.log('Transaction created successfully:', newTransaction);

          // Transform timestamp strings to Date objects and ensure cryptoAmount is a number for the new transaction
          const transformedTransaction = {
            ...newTransaction,
            timestamp: new Date(newTransaction.timestamp),
            createdAt: new Date(newTransaction.createdAt),
            updatedAt: new Date(newTransaction.updatedAt),
            cryptoAmount: newTransaction.cryptoAmount ? Number(newTransaction.cryptoAmount) : undefined,
            cardInfo: newTransaction.cardType || newTransaction.lastFourDigits || newTransaction.cardHolderName || newTransaction.expiryDate ? {
              cardType: newTransaction.cardType || '',
              lastFourDigits: newTransaction.lastFourDigits || '',
              cardHolderName: newTransaction.cardHolderName || '',
              expiryDate: newTransaction.expiryDate || '',
            } : undefined,
          };

          // Update local state
          set((state) => ({
            transactions: [transformedTransaction, ...state.transactions],
          }));

          toast.success('Transaction completed successfully');
          return transformedTransaction;
        } catch (error: any) {
          console.error('Failed to create transaction:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
          });
          toast.error('Failed to create transaction');
          throw error;
        }
      },
      loadTransactions: async (storeId: string) => {
        const state = get();
        if (state.loadingStates.transactions) {
          console.log('Transactions are already loading, skipping duplicate call');
          return;
        }

        try {
          set((state) => ({
            loadingStates: { ...state.loadingStates, transactions: true }
          }));
          
          const response = await transactionsAPI.getByStore(storeId);
          console.log('Transactions loaded successfully, count:', response.data.transactions?.length || 0);
          
          // Transform timestamp strings to Date objects and ensure cryptoAmount is a number
          const transactions = (response.data.transactions || []).map((transaction: any) => {
            let timestamp, createdAt, updatedAt;
            
            try {
              timestamp = new Date(transaction.timestamp);
              if (isNaN(timestamp.getTime())) {
                timestamp = new Date(); // Fallback to current date
              }
            } catch (error) {
              timestamp = new Date(); // Fallback to current date
            }
            
            try {
              createdAt = new Date(transaction.createdAt);
              if (isNaN(createdAt.getTime())) {
                createdAt = new Date();
              }
            } catch (error) {
              createdAt = new Date();
            }
            
            try {
              updatedAt = new Date(transaction.updatedAt);
              if (isNaN(updatedAt.getTime())) {
                updatedAt = new Date();
              }
            } catch (error) {
              updatedAt = new Date();
            }
            
            // Ensure cryptoAmount is a number
            let cryptoAmount = transaction.cryptoAmount;
            if (cryptoAmount !== null && cryptoAmount !== undefined) {
              cryptoAmount = typeof cryptoAmount === 'string' ? parseFloat(cryptoAmount) : Number(cryptoAmount);
              if (isNaN(cryptoAmount)) {
                cryptoAmount = 0;
              }
            }
            
            // Handle cardInfo
            let cardInfo = undefined;
            if (transaction.cardType || transaction.lastFourDigits || transaction.cardHolderName || transaction.expiryDate) {
              cardInfo = {
                cardType: transaction.cardType || '',
                lastFourDigits: transaction.lastFourDigits || '',
                cardHolderName: transaction.cardHolderName || '',
                expiryDate: transaction.expiryDate || '',
              };
            }
            
            return {
              ...transaction,
              timestamp,
              createdAt,
              updatedAt,
              cryptoAmount,
              cardInfo,
            };
          });
          
          set({ transactions });
        } catch (error: any) {
          console.error('Failed to load transactions:', error);
          if (error.response?.status !== 429) {
            toast.error('Failed to load transactions');
          }
        } finally {
          set((state) => ({
            loadingStates: { ...state.loadingStates, transactions: false }
          }));
        }
      },
      
      // DeFi Positions
      defiPositions: [],
      addDefiPosition: (position) => set((state) => ({
        defiPositions: [...state.defiPositions, position],
      })),
      updateDefiPosition: (poolId, updates) => set((state) => ({
        defiPositions: state.defiPositions.map((position) =>
          position.poolId === poolId ? { ...position, ...updates } : position
        ),
      })),
      removeDefiPosition: (poolId) => set((state) => ({
        defiPositions: state.defiPositions.filter((position) => position.poolId !== poolId),
      })),
      loadDefiPositions: async (storeId: string) => {
        const state = get();
        if (state.loadingStates.defiPositions) {
          console.log('DeFi positions are already loading, skipping duplicate call');
          return;
        }

        try {
          set((state) => ({
            loadingStates: { ...state.loadingStates, defiPositions: true }
          }));
          
          const response = await defiAPI.getPositions(storeId);
          console.log('DeFi positions loaded successfully, count:', response.data?.length || 0);
          set({ defiPositions: response.data || [] });
        } catch (error: any) {
          console.error('Failed to load DeFi positions:', error);
          if (error.response?.status !== 429) {
            toast.error('Failed to load DeFi positions');
          }
          // Initialize as empty array on error
          set({ defiPositions: [] });
        } finally {
          set((state) => ({
            loadingStates: { ...state.loadingStates, defiPositions: false }
          }));
        }
      },
      
      // Wallet
      wallet: {
        isConnected: false,
        address: '',
        balance: { miden: 0 }, // Updated to use Miden balance
      },
      setWallet: (wallet) => set({ wallet }),
      
      // Business Info
      businessInfo: createDefaultBusinessInfo(''),
      updateBusinessInfo: (info) => set((state) => ({
        businessInfo: { ...state.businessInfo, ...info },
      })),
      
      // Update business info and persist to backend
      updateBusinessInfoAndPersist: async (info: Partial<BusinessInfo>) => {
        try {
          const state = get();
          if (!state.currentStore || !state.isAuthenticated) {
            throw new Error('No store or not authenticated');
          }
          
          console.log('Updating business info for store:', state.currentStore.walletAddress);
          console.log('Current store data:', state.currentStore);
          console.log('Update data (info):', info);
          console.log('Current businessInfo:', state.businessInfo);
          
          // Update local state first
          set((state) => ({
            businessInfo: { ...state.businessInfo, ...info },
          }));
          
          // Transform frontend businessInfo to backend store format
          const storeUpdateData: any = {};
          
          // Only include fields that are defined and not empty
          if (info.name !== undefined && info.name !== null && info.name.trim() !== '') {
            storeUpdateData.name = info.name;
          }
          if (info.address !== undefined && info.address !== null) {
            storeUpdateData.address = info.address;
          }
          if (info.phone !== undefined && info.phone !== null) {
            storeUpdateData.phone = info.phone;
          }
          if (info.whatsappNumber !== undefined && info.whatsappNumber !== null) {
            storeUpdateData.whatsappNumber = info.whatsappNumber;
          }
          if (info.telegramBotToken !== undefined && info.telegramBotToken !== null) {
            storeUpdateData.telegramBotToken = info.telegramBotToken;
          }
          if (info.currency !== undefined && info.currency !== null) {
            storeUpdateData.currency = info.currency;
          }
          if (info.language !== undefined && info.language !== null) {
            // Map frontend language values to backend values
            const languageMap: { [key: string]: string } = {
              'id': 'INDONESIAN',
              'en': 'ENGLISH'
            };
            storeUpdateData.language = languageMap[info.language] || info.language;
          }
          
          console.log('Sending update to backend with data:', storeUpdateData);
          console.log('Using wallet address as identifier:', state.currentStore.walletAddress);
          
          // Send update to backend using wallet address as identifier
          const response = await storesAPI.update(state.currentStore.walletAddress, storeUpdateData);
          console.log('Store updated successfully:', response.data);
          
          // Also update currentStore to keep it in sync
          set((state) => ({
            currentStore: state.currentStore ? {
              ...state.currentStore,
              businessInfo: { ...state.currentStore.businessInfo, ...info }
            } : null
          }));
          
          return true;
        } catch (error: any) {
          console.error('Failed to update business info:', error);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
          });
          throw error;
        }
      },
      
      // UI State
      currentView: 'pos',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Store Management
      initializeStore: async (walletAddress: string) => {
        try {
          console.log('Initializing store for wallet:', walletAddress);
          // Try to get existing store by wallet address
          const response = await storesAPI.getById(walletAddress);
          const backendStore = response.data.store;
          
          console.log('Backend store data received:', backendStore);
          
          // Transform backend store data to match frontend StoreData interface
          const storeData = {
            storeId: backendStore.storeId, // Use storeId field (same as wallet address)
            walletAddress: backendStore.walletAddress,
            businessInfo: {
              name: backendStore.name,
              address: backendStore.address || '',
              phone: backendStore.phone || '',
              whatsappNumber: backendStore.whatsappNumber,
              telegramBotToken: backendStore.telegramBotToken,
              currency: backendStore.currency,
              // Map backend language values to frontend values
              language: (backendStore.language === 'INDONESIAN' ? 'id' : 
                       backendStore.language === 'ENGLISH' ? 'en' : 'id') as 'id' | 'en',
              cryptoWalletAddress: backendStore.walletAddress,
              storeId: backendStore.storeId, // Use storeId field (same as wallet address)
            },
            products: backendStore.products || [],
            transactions: backendStore.transactions || [],
            defiPositions: backendStore.defiPositions || [],
            totalEarnings: 0, // Will be calculated from transactions
            totalDefiValue: 0, // Will be calculated from defiPositions
            createdAt: new Date(backendStore.createdAt),
            lastActive: new Date(backendStore.lastActive),
          };
          
          console.log('Transformed store data:', storeData);
          
          // Load related data
          await get().loadProducts(walletAddress);
          await get().loadTransactions(walletAddress);
          await get().loadDefiPositions(walletAddress);
          await get().loadCart(walletAddress);
          
          set({ 
            currentStore: storeData,
            businessInfo: storeData.businessInfo 
          });
          
          console.log('Store initialization completed');
        } catch (error) {
          console.log('Store not found in initializeStore, this should not happen if login flow is correct');
          console.error('InitializeStore error:', error);
          // Fallback to local store only
          const defaultStore = createDefaultStore(walletAddress);
          set({ 
            currentStore: defaultStore,
            businessInfo: defaultStore.businessInfo 
          });
          console.log('Fallback to default store');
        }
      },
      
      switchStore: async (storeId: string) => {
        try {
          await get().initializeStore(storeId);
        } catch (error) {
          console.error('Failed to switch store:', error);
          toast.error('Failed to switch store');
        }
      },
      
      // Authentication Actions
      login: async (walletAddress: string) => {
        try {
          console.log('Starting login process for wallet:', walletAddress);
          const response = await authAPI.login({ walletAddress });
          const { token, user } = response.data;
          
          console.log('Login response received:', { token: !!token, user: !!user });
          
          localStorage.setItem('authToken', token);
          set({ 
            isAuthenticated: true, 
            authToken: token, 
            currentUser: user 
          });
          
          console.log('Authentication state set, checking stores...');
          
          // Check if user has stores, if not create default store
          if (!user.stores || user.stores.length === 0) {
            console.log('User has no stores, creating default store');
            const defaultStore = createDefaultStore(walletAddress);
            try {
              await storesAPI.create({
                walletAddress,
                name: defaultStore.businessInfo.name,
                address: defaultStore.businessInfo.address,
                phone: defaultStore.businessInfo.phone,
                currency: defaultStore.businessInfo.currency,
                // Map frontend language value to backend value
                language: defaultStore.businessInfo.language === 'id' ? 'INDONESIAN' : 'ENGLISH',
              });
              console.log('Default store created successfully');
            } catch (storeError) {
              console.error('Failed to create store:', storeError);
            }
            set({ 
              currentStore: defaultStore,
              businessInfo: defaultStore.businessInfo 
            });
            console.log('Default store set in state');
          } else {
            // User has stores, initialize with first store
            console.log('User has stores, initializing store...');
            await get().initializeStore(walletAddress);
            console.log('Store initialized');
          }
          
          // Load marketplace data
          try {
            await get().updateMarketplaceStats();
            console.log('Marketplace stats updated after login');
          } catch (error) {
            console.error('Failed to update marketplace stats after login:', error);
          }
          
          console.log('Login process completed successfully');
          toast.success('Login successful');
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          toast.error('Login failed');
          return false;
        }
      },
      
      logout: () => {
        // Clear localStorage
        localStorage.removeItem('authToken');
        
        // Clear all state
        set({ 
          isAuthenticated: false, 
          authToken: null, 
          currentUser: null,
          currentStore: null,
          businessInfo: createDefaultBusinessInfo(''),
          products: [],
          transactions: [],
          defiPositions: [],
          cart: [],
          allStores: [],
          marketplaceStats: {
            totalStores: 0,
            totalTransactions: 0,
            totalVolume: 0,
            totalDefiValue: 0,
            activeStores: 0,
          }
        });
        
        // Clear wallet state
        set((state) => ({
          wallet: {
            isConnected: false,
            address: undefined,
            balance: { miden: 0 },
            provider: undefined
          }
        }));
        
        toast.success('Logged out successfully');
      },
      
      register: async (walletAddress: string, userData?: any) => {
        try {
          const response = await authAPI.register({ 
            walletAddress, 
            ...userData 
          });
          const { token, user } = response.data;
          
          localStorage.setItem('authToken', token);
          set({ 
            isAuthenticated: true, 
            authToken: token, 
            currentUser: user 
          });
          
          // Create default store
          const defaultStore = createDefaultStore(walletAddress);
          try {
            await storesAPI.create({
              walletAddress,
              name: defaultStore.businessInfo.name,
              address: defaultStore.businessInfo.address,
              phone: defaultStore.businessInfo.phone,
              currency: defaultStore.businessInfo.currency,
              // Map frontend language value to backend value
              language: defaultStore.businessInfo.language === 'id' ? 'INDONESIAN' : 'ENGLISH',
            });
            console.log('Store created successfully during registration');
          } catch (storeError) {
            console.error('Failed to create store during registration:', storeError);
          }
          
          set({ 
            currentStore: defaultStore,
            businessInfo: defaultStore.businessInfo 
          });
          toast.success('Registration successful');
          return true;
        } catch (error) {
          console.error('Registration failed:', error);
          toast.error('Registration failed');
          return false;
        }
      },
    }),
    {
      name: 'warungchain-api-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
        currentUser: state.currentUser,
        currentStore: state.currentStore,
        wallet: state.wallet,
        currentView: state.currentView,
        businessInfo: state.businessInfo,
        allStores: state.allStores,
        marketplaceStats: state.marketplaceStats,
        cart: state.cart, // Add cart to persistence
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.currentStore = reviveDates(state.currentStore);
          state.products = reviveDates(state.products);
          state.transactions = reviveDates(state.transactions);
          state.defiPositions = reviveDates(state.defiPositions);
          state.cart = reviveDates(state.cart);
          state.allStores = reviveDates(state.allStores);
        }
      },
    }
  )
);