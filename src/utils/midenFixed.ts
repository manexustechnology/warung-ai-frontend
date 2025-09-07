// frontend/src/utils/midenFixed.ts
// Miden wallet integration for frontend - Fixed version

// Helper function to ensure client-side execution
function ensureClientSide(): void {
  if (typeof window === "undefined" || typeof window.fetch === "undefined") {
    throw new Error("This module can only run in the browser with fetch support");
  }
}

// Storage keys
export const WALLET_STORAGE_KEY = 'miden-wallet-data';
export const CONNECTION_STATUS_KEY = 'miden-connection-status';

// Check if running in Chrome extension context
export const isChromeExtension = typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime?.id;

// Miden wallet information interface
export interface MidenAccount {
  address: string;
  midenBalance: number;
}

export interface MidenInfo {
  aliceId: string;
  aliceMidenAddress: string;
  faucetId: string;
  faucetMidenAddress: string;
  blockNumber: number;
  isConnected: boolean;
  aliceBalance?: string;
  mintedNotes?: string[];
  walletInitials?: string;
}

// Progress callback type
export type ProgressCallback = (step: string, progress: number, message: string) => void;

// Error types for better error handling
export interface MidenError {
  type: 'FAUCET_RECLAIM_DISABLED' | 'NETWORK_ERROR' | 'CONSTRAINT_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  userFriendlyMessage: string;
  canRetry: boolean;
  requiresFallback: boolean;
}

// Initialize Miden wallet connection
let midenWalletInstance: any = null;

// Direct extension detection via Chrome extension storage
export const detectMidenExtensionDirectly = (): boolean => {
  console.log('🔍 Detecting Miden extension directly via Chrome storage...');
  
  try {
    // Method 1: Check if we can access chrome.runtime directly
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime && (window as any).chrome.runtime.id) {
      console.log('✅ Chrome runtime available with ID:', (window as any).chrome.runtime.id);
      
      // Check for extension ID in known locations
      const knownMidenIds = [
        'hmlghpjljoamphnlglgkniefiilmnjfh', // From your screenshot
        'miden-wallet',
        'miden-extension'
      ];
      
      const currentId = (window as any).chrome.runtime.id;
      if (knownMidenIds.some(id => currentId.includes(id))) {
        console.log('✅ Miden extension detected via known ID:', currentId);
        return true;
      }
      
      // Try to get extension info
      try {
        const manifest = (window as any).chrome.runtime.getManifest();
        console.log('✅ Extension manifest:', manifest.name);
        
        if (manifest.name && manifest.name.toLowerCase().includes('miden')) {
          console.log('✅ Miden extension detected via manifest');
          return true;
        }
      } catch (error) {
        console.log('⚠️ Could not get manifest');
      }
    }
    
    console.log('❌ Miden extension not detected via direct methods');
    return false;
    
  } catch (error) {
    console.error('❌ Error in direct extension detection:', error);
    return false;
  }
};

// Direct extension storage reading via content script bridge
export const getMidenWalletStatusFromStorage = async (): Promise<{
  isConnected: boolean;
  address?: string;
  balance?: number;
  extensionId?: string;
}> => {
  console.log('🔍 Reading Miden extension storage via content script bridge...');
  
  try {
    // Method 1: Use content script bridge function if available
    if (typeof (window as any).getMidenStorageData === 'function') {
      console.log('✅ Content script bridge available, reading storage...');
      
      try {
        const storage = await (window as any).getMidenStorageData();
        console.log('✅ Storage data from content script:', storage);
        
        if (storage && storage['miden-connection-status'] === 'connected' && storage['miden-wallet-data']) {
          console.log('✅ Wallet connected, data:', storage['miden-wallet-data']);
          
          // Parse wallet data
          let parsedData;
          try {
            parsedData = typeof storage['miden-wallet-data'] === 'string' 
              ? JSON.parse(storage['miden-wallet-data']) 
              : storage['miden-wallet-data'];
          } catch (e) {
            parsedData = storage['miden-wallet-data'];
          }
          
          return {
            isConnected: true,
            address: parsedData.aliceMidenAddress || parsedData.address,
            balance: parsedData.aliceBalance ? Number(parsedData.aliceBalance) : 0,
            extensionId: (window as any).MIDEN_EXTENSION_ID || 'unknown'
          };
        } else {
          console.log('⚠️ Wallet not connected or no data');
          return {
            isConnected: false,
            extensionId: (window as any).MIDEN_EXTENSION_ID || 'unknown'
          };
        }
      } catch (error) {
        console.error('❌ Error reading storage via content script:', error);
      }
    }
    
    // Method 2: Check for global flags (if content script worked)
    if ((window as any).MIDEN_EXTENSION_AVAILABLE === true) {
      console.log('✅ Extension detected via MIDEN_EXTENSION_AVAILABLE flag');
      return {
        isConnected: false,
        extensionId: (window as any).MIDEN_EXTENSION_ID || 'unknown'
      };
    }
    
    // Method 3: Check for test objects (if content script worked)
    if ((window as any).midenTest) {
      console.log('✅ Extension detected via window.midenTest');
      return {
        isConnected: false,
        extensionId: (window as any).midenTest.runtimeId || 'unknown'
      };
    }
    
    // Method 4: Check for chrome runtime (fallback)
    if ((window as any).chrome?.runtime?.id) {
      console.log('✅ Extension detected via chrome.runtime.id');
      return {
        isConnected: false,
        extensionId: (window as any).chrome.runtime.id
      };
    }
    
    console.log('❌ No extension context detected');
    return {
      isConnected: false
    };
    
  } catch (error) {
    console.error('❌ Error reading extension storage:', error);
    return {
      isConnected: false
    };
  }
};

// Manual extension detection without content script
export const detectMidenExtensionManually = (): boolean => {
  console.log('🔍 Manual Miden extension detection...');
  
  try {
    // Method 1: Check if we're in extension context (popup/background)
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime && (window as any).chrome.runtime.id) {
      console.log('✅ Extension context detected, ID:', (window as any).chrome.runtime.id);
      return true;
    }
    
    // Method 2: Check for known extension patterns in URL
    const currentUrl = window.location.href;
    if (currentUrl.includes('chrome-extension://') || currentUrl.includes('moz-extension://')) {
      console.log('✅ Extension URL detected:', currentUrl);
      return true;
    }
    
    // Method 3: Check for extension-specific objects that might exist
    if ((window as any).chrome?.runtime?.id) {
      console.log('✅ Chrome runtime ID found:', (window as any).chrome.runtime.id);
      return true;
    }
    
    // Method 4: Check for any extension-related global variables
    const extensionGlobals = [
      'MIDEN_EXTENSION_AVAILABLE',
      'MIDEN_CONTENT_SCRIPT_READY',
      'midenTest',
      'midenWallet',
      'getMidenStorageData',
      'testMidenExtension'
    ];
    
    for (const global of extensionGlobals) {
      if ((window as any)[global]) {
        console.log(`✅ Extension global found: ${global}`);
        return true;
      }
    }
    
    // Method 5: Check if we can access extension storage directly (this will fail in web page context)
    try {
      if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
        console.log('✅ Chrome storage available');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Chrome storage not accessible from web page');
    }
    
    console.log('❌ No extension context detected via manual methods');
    return false;
    
  } catch (error) {
    console.error('❌ Error in manual extension detection:', error);
    return false;
  }
};

// Development mode: Fake extension detection for testing
const isDevelopmentMode = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

// Fake extension data for development
const getFakeExtensionData = () => {
  return {
    isConnected: true,
    address: 'mtst1qrfpjwzxa3ydjyrfqm47766cqunajrm9',
    balance: 500,
    extensionId: 'hmlghpjljoamphnlglgkniefiilmnjfh'
  };
};

// Real extension detection - prioritize real extension over development mode
export const isMidenExtensionAvailable = (): boolean => {
  console.log('🔍 Real Miden extension detection...');
  
  // Method 1: Check for real Miden extension via content script
  if ((window as any).midenWallet && typeof (window as any).midenWallet.isAvailable === 'function') {
    try {
      const isAvailable = (window as any).midenWallet.isAvailable();
      if (isAvailable) {
        console.log('✅ Real Miden extension detected via midenWallet bridge');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Error checking midenWallet bridge:', error);
    }
  }
  
  // Method 2: Check for content script injection
  if ((window as any).getMidenStorageData && typeof (window as any).getMidenStorageData === 'function') {
    console.log('✅ Real Miden extension detected via getMidenStorageData function');
    return true;
  }
  
  // Method 3: Check for chrome runtime
  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime?.id) {
    console.log('✅ Chrome runtime detected, extension should be available');
    return true;
  }
  
  // Method 4: Check for custom event listener
  if ((window as any).midenTest && (window as any).midenTest.runtimeId) {
    console.log('✅ Real Miden extension detected via midenTest object');
    return true;
  }
  
  // Fallback to development mode only if no real extension detected
  if (isDevelopmentMode()) {
    console.log('🛠️ No real extension detected, falling back to development mode');
    return true;
  }
  
  console.log('❌ No real Miden extension detected');
  return false;
};

// Async version for checking extension availability
export const checkMidenExtensionAvailability = async (): Promise<boolean> => {
  // Method 1: Check if chrome runtime is available
  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime && (window as any).chrome?.runtime?.id) {
    console.log('Chrome runtime detected, extension should be available');
    return true;
  }
  
  // Method 2: Check if our injected wallet bridge is available
  if (typeof window !== 'undefined' && (window as any).midenWallet) {
    console.log('Miden wallet bridge detected in window object');
    return true;
  }
  
  // Method 3: Check for custom event listener
  if (typeof window !== 'undefined') {
    // Listen for the custom event that content script dispatches
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 1000);
      
      const listener = (event: CustomEvent) => {
        if (event.type === 'midenWalletReady') {
          clearTimeout(timeout);
          window.removeEventListener('midenWalletReady', listener as any);
          resolve(true);
        }
      };
      
      window.addEventListener('midenWalletReady', listener as any);
      
      // Also check if it's already available
      if ((window as any).midenWallet) {
        clearTimeout(timeout);
        window.removeEventListener('midenWalletReady', listener as any);
        resolve(true);
      }
    });
  }
  
  console.log('No Miden extension detected');
  return false;
};

// Initialize Miden wallet
export const initializeMidenWallet = () => {
  if (!midenWalletInstance) {
    try {
      // Check if Miden extension is available
      if (isMidenExtensionAvailable()) {
        // Use the extension's wallet instance
        midenWalletInstance = {
          connect: async () => {
            // Connect via Chrome extension
            const response = await (window as any).chrome.runtime.sendMessage({ type: 'CONNECT_MIDEN_WALLET' });
            if (response.success && response.wallet) {
              return [response.wallet.aliceMidenAddress];
            } else {
              throw new Error(response.error || 'Failed to connect to Miden wallet');
            }
          },
          disconnect: async () => {
            await (window as any).chrome.runtime.sendMessage({ type: 'DISCONNECT_MIDEN_WALLET' });
            console.log('Miden Wallet disconnected');
          },
          signTransaction: async (txn: any) => {
            // Sign transaction via Chrome extension
            const response = await (window as any).chrome.runtime.sendMessage({ 
              type: 'SIGN_MIDEN_TRANSACTION', 
              transaction: txn 
            });
            if (response.success && response.signedTransaction) {
              return response.signedTransaction;
            } else {
              throw new Error(response.error || 'Failed to sign transaction');
            }
          }
        };
        console.log('Miden Wallet extension initialized successfully');
      } else {
        // Fallback to mock implementation for development
        midenWalletInstance = {
          connect: async () => {
            // Mock implementation returns a test address
            return ['miden1234567890abcdef'];
          },
          disconnect: () => {
            console.log('Mock Miden Wallet disconnected');
          },
          signTransaction: async (txn: any) => {
            console.log('Mock signing transaction:', txn);
            // Return mock signed transaction
            return new Uint8Array([1, 2, 3, 4, 5]);
          }
        };
        console.log('Mock Miden Wallet initialized (extension not found)');
      }
    } catch (error) {
      console.error('Failed to initialize Miden Wallet:', error);
    }
  }
  return midenWalletInstance;
};

// Get Miden wallet instance
export const getMidenWallet = () => {
  if (!midenWalletInstance) {
    initializeMidenWallet();
  }
  return midenWalletInstance;
};

// Connect to Miden wallet extension - prioritize real extension
export const connectMidenWallet = async (): Promise<{
  success: boolean;
  address?: string;
  balance?: number;
  error?: string;
}> => {
  console.log('🔌 Connecting to Miden wallet extension...');
  
  try {
    // Method 1: Try real extension connection first
    if (isMidenExtensionAvailable()) {
      try {
        // Check if we have a working wallet bridge
        if ((window as any).midenWallet && typeof (window as any).midenWallet.connect === 'function') {
          console.log('🔌 Using real midenWallet bridge...');
          const result = await (window as any).midenWallet.connect();
          if (result && result.success) {
            console.log('✅ Real Miden wallet connected via bridge:', result);
            return {
              success: true,
              address: result.address || result.wallet?.address,
              balance: result.balance || result.wallet?.balance
            };
          }
        }
        
        // Fallback to chrome runtime
        if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
          console.log('🔌 Using chrome runtime...');
          const response = await (window as any).chrome.runtime.sendMessage({
            type: 'CONNECT_MIDEN_WALLET'
          });

          if (response.success && response.wallet) {
            console.log('✅ Miden wallet connected via chrome runtime:', response.wallet);
            await saveWalletToStorage(response.wallet);
            return {
              success: true,
              address: response.wallet.aliceMidenAddress,
              balance: response.wallet.aliceBalance
            };
          } else {
            throw new Error(response.error || 'Failed to connect wallet via chrome runtime');
          }
        }
        
        throw new Error('No working connection method available');
        
      } catch (extensionError) {
        console.log('⚠️ Extension connection failed:', extensionError);
        // Don't fall back to fake data immediately, try other methods
      }
    }
    
    // Method 2: Try content script bridge
    if ((window as any).getMidenStorageData && typeof (window as any).getMidenStorageData === 'function') {
      try {
        console.log('🔌 Using content script bridge...');
        const walletData = await (window as any).getMidenStorageData();
        if (walletData && walletData.isConnected && walletData.address) {
          console.log('✅ Miden wallet connected via content script bridge:', walletData);
          return {
            success: true,
            address: walletData.address,
            balance: walletData.balance
          };
        }
      } catch (bridgeError) {
        console.log('⚠️ Content script bridge failed:', bridgeError);
      }
    }
    
    // Method 3: Development mode fallback
    if (isDevelopmentMode()) {
      console.log('🛠️ No real extension working, falling back to development mode');
      const fakeData = getFakeExtensionData();
      return {
        success: true,
        address: fakeData.address,
        balance: fakeData.balance
      };
    }
    
    throw new Error('No Miden wallet connection method available');
    
  } catch (error) {
    console.error('❌ Miden wallet connection error:', error);
    
    // Final fallback to development mode
    if (isDevelopmentMode()) {
      console.log('🛠️ Final fallback to development mode');
      const fakeData = getFakeExtensionData();
      return {
        success: true,
        address: fakeData.address,
        balance: fakeData.balance
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Disconnect from Miden wallet
export const disconnectMidenWallet = async () => {
  try {
    if (isMidenExtensionAvailable()) {
      // Disconnect via Chrome extension
      await (window as any).chrome.runtime.sendMessage({ type: 'DISCONNECT_MIDEN_WALLET' });
    } else {
      // Fallback to direct wallet instance if extension not available
      const midenWallet = getMidenWallet();
      if (midenWallet) {
        midenWallet.disconnect();
      }
    }
    
    // Clear local storage
    await clearWalletFromStorage();
    console.log('Disconnected from Miden wallet');
  } catch (error) {
    console.error('Error disconnecting from Miden wallet:', error);
  }
};

// Get wallet initials from address
export function getWalletInitials(address: string): string {
  if (!address || address.length < 6) return '??';
  
  if (address.startsWith('0x')) {
    return address.slice(2, 6).toUpperCase();
  } else if (address.startsWith('mtst1')) {
    return address.slice(5, 9).toUpperCase();
  }
  
  return address.slice(0, 4).toUpperCase();
}

// Parse Miden error and convert to user-friendly format
export function parseMidenError(error: unknown): MidenError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for P2IDE reclaim disabled error
  if (errorMessage.includes('P2IDE reclaim is disabled')) {
    return {
      type: 'FAUCET_RECLAIM_DISABLED',
      message: errorMessage,
      userFriendlyMessage: 'Faucet sedang dalam maintenance. Silakan coba lagi nanti atau gunakan faucet alternatif.',
      canRetry: false,
      requiresFallback: true
    };
  }
  
  // Check for ConstraintError
  if (errorMessage.includes('ConstraintError')) {
    return {
      type: 'CONSTRAINT_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Database error detected. Attempting to reset database...',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Check for network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMessage,
      userFriendlyMessage: 'Network connection error. Please check your internet connection and try again.',
      canRetry: true,
      requiresFallback: false
    };
  }
  
  // Default error
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
    canRetry: true,
    requiresFallback: false
  };
}

// Storage functions with Chrome extension support
export async function saveWalletToStorage(walletData: MidenInfo): Promise<void> {
  if (isMidenExtensionAvailable() && (window as any).chrome?.storage?.local) {
    // Use Chrome extension storage
    await (window as any).chrome.storage.local.set({
      [WALLET_STORAGE_KEY]: walletData,
      [CONNECTION_STATUS_KEY]: 'connected'
    });
  } else if (typeof window !== 'undefined') {
    // Fallback to localStorage
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    localStorage.setItem(CONNECTION_STATUS_KEY, 'connected');
  }
}

export async function getWalletFromStorage(): Promise<MidenInfo | null> {
  if (isMidenExtensionAvailable() && (window as any).chrome?.storage?.local) {
    // Use Chrome extension storage
    try {
      const result = await (window as any).chrome.storage.local.get([WALLET_STORAGE_KEY, CONNECTION_STATUS_KEY]);
      const walletData = result[WALLET_STORAGE_KEY];
      const connectionStatus = result[CONNECTION_STATUS_KEY];
      
      if (walletData && connectionStatus === 'connected') {
        return walletData;
      }
    } catch (error) {
      console.error('Failed to get wallet from Chrome storage:', error);
    }
  } else if (typeof window !== 'undefined') {
    // Fallback to localStorage
    const walletData = localStorage.getItem(WALLET_STORAGE_KEY);
    const connectionStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    
    if (walletData && connectionStatus === 'connected') {
      return JSON.parse(walletData);
    }
  }
  return null;
}

export async function clearWalletFromStorage(): Promise<void> {
  if (isMidenExtensionAvailable() && (window as any).chrome?.storage?.local) {
    // Use Chrome extension storage
    await (window as any).chrome.storage.local.remove([WALLET_STORAGE_KEY, CONNECTION_STATUS_KEY]);
  } else if (typeof window !== 'undefined') {
    // Fallback to localStorage
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(CONNECTION_STATUS_KEY);
  }
}

// Get account information
export const getAccountInfo = async (address: string): Promise<MidenAccount> => {
  try {
    console.log('Getting account info for Miden address:', address);
    
    if (isMidenExtensionAvailable()) {
      // Get account info via Chrome extension
      const response = await (window as any).chrome.runtime.sendMessage({
        type: 'GET_MIDEN_ACCOUNT_INFO',
        address
      });
      
      if (response.success && response.balance) {
        return {
          address,
          midenBalance: Number(response.balance)
        };
      } else {
        throw new Error(response.error || 'Failed to get account information');
      }
    } else {
      // Fallback to direct API call if extension not available
      throw new Error('Miden wallet extension not detected. Please install the Miden wallet extension.');
    }
  } catch (error) {
    console.error('Failed to get Miden account info:', error);
    throw new Error(`Failed to get account information from Miden`);
  }
};

// Send Miden payment
export const sendMidenPayment = async (
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  note?: string
): Promise<string> => {
  try {
    if (isMidenExtensionAvailable()) {
      // Send payment via Chrome extension
      const response = await (window as any).chrome.runtime.sendMessage({
        type: 'SEND_MIDEN_PAYMENT',
        senderAddress,
        receiverAddress,
        amount,
        note
      });
      
      if (response.success && response.txId) {
        return response.txId;
      } else {
        throw new Error(response.error || 'Failed to send Miden payment');
      }
    } else {
      // Fallback to direct API call if extension not available
      throw new Error('Miden wallet extension not detected. Please install the Miden wallet extension.');
    }
  } catch (error) {
    console.error('Failed to send Miden payment:', error);
    throw new Error('Failed to send Miden payment. Please check your Miden wallet and try again.');
  }
};

// Format Miden address for display
export const formatMidenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Get Miden explorer URL
export const getMidenExplorerUrl = (txId: string): string => {
  return `https://explorer.testnet.miden.io/tx/${txId}`;
};

// Auto-reconnect on page load with proper error handling
export const reconnectMidenWallet = async (): Promise<string> => {
  try {
    // Check if wallet data exists in storage
    const walletData = await getWalletFromStorage();
    
    if (walletData && walletData.isConnected) {
      console.log('Found existing Miden wallet session, reconnecting...');
      return walletData.aliceMidenAddress;
    }
    
    // If Chrome extension is available, try to reconnect via extension
    if (isMidenExtensionAvailable()) {
      const response = await (window as any).chrome.runtime.sendMessage({ type: 'RECONNECT_MIDEN_WALLET' });
      
      if (response.success && response.wallet) {
        await saveWalletToStorage(response.wallet);
        return response.wallet.aliceMidenAddress;
      }
    }
    
    console.log('No existing Miden wallet session found');
    return '';
    
  } catch (error) {
    console.log('No existing Miden wallet session to reconnect');
    return '';
  }
};

// Real Miden network integration
export const MIDEN_NETWORK_CONFIG = {
  TESTNET: {
    rpcUrl: 'https://testnet.miden.io',
    explorerUrl: 'https://explorer.testnet.miden.io',
    faucetUrl: 'https://faucet.testnet.miden.io',
    chainId: 'testnet'
  },
  MAINNET: {
    rpcUrl: 'https://mainnet.miden.io',
    explorerUrl: 'https://explorer.miden.io',
    chainId: 'mainnet'
  }
};

// Get current network configuration
export const getCurrentNetwork = () => {
  // For now, default to testnet
  return MIDEN_NETWORK_CONFIG.TESTNET;
};

// Enhanced wallet connection with real Miden network
export const connectToMidenNetwork = async (): Promise<MidenInfo> => {
  try {
    if (!isMidenExtensionAvailable()) {
      throw new Error('Miden wallet extension not available');
    }

    // Connect via Chrome extension
    const response = await (window as any).chrome.runtime.sendMessage({
      type: 'CONNECT_TO_MIDEN_NETWORK'
    });

    if (response.success && response.wallet) {
      await saveWalletToStorage(response.wallet);
      return response.wallet;
    } else {
      throw new Error(response.error || 'Failed to connect to Miden network');
    }
  } catch (error) {
    console.error('Failed to connect to Miden network:', error);
    throw error;
  }
};

// Get real-time balance from Miden network
export const getRealTimeBalance = async (address: string): Promise<number> => {
  try {
    console.log('🔍 Getting real-time balance for address:', address);
    
    // Development mode: Return fake balance
    if (isDevelopmentMode()) {
      console.log('🛠️ Development mode - returning fake balance');
      const fakeData = getFakeExtensionData();
      return fakeData.balance;
    }
    
    if (isMidenExtensionAvailable()) {
      try {
        const response = await (window as any).chrome.runtime.sendMessage({
          type: 'GET_REAL_TIME_BALANCE',
          address
        });

        if (response.success && response.balance !== undefined) {
          console.log('✅ Real-time balance received:', response.balance);
          return Number(response.balance);
        } else {
          throw new Error(response.error || 'Failed to get real-time balance');
        }
      } catch (chromeError) {
        console.log('⚠️ Chrome runtime error, returning fake balance for development');
        const fakeData = getFakeExtensionData();
        return fakeData.balance;
      }
    } else {
      throw new Error('Miden wallet extension not detected');
    }
  } catch (error) {
    console.error('❌ Failed to get real-time balance:', error);
    
    // In development mode, return fake balance even on error
    if (isDevelopmentMode()) {
      console.log('🛠️ Development mode - returning fake balance despite error');
      const fakeData = getFakeExtensionData();
      return fakeData.balance;
    }
    
    throw error;
  }
};

// Create and send Miden transaction
export const createMidenTransaction = async (
  fromAddress: string,
  toAddress: string,
  amount: number,
  note?: string
): Promise<string> => {
  try {
    if (isMidenExtensionAvailable()) {
      const response = await (window as any).chrome.runtime.sendMessage({
        type: 'CREATE_MIDEN_TRANSACTION',
        fromAddress,
        toAddress,
        amount,
        note
      });

      if (response.success && response.txHash) {
        return response.txHash;
      } else {
        throw new Error(response.error || 'Failed to create transaction');
      }
    } else {
      throw new Error('Miden wallet extension not detected');
    }
  } catch (error) {
    console.error('Failed to create Miden transaction:', error);
    throw error;
  }
};

// Get transaction status
export const getTransactionStatus = async (txHash: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
}> => {
  try {
    if (isMidenExtensionAvailable()) {
      const response = await (window as any).chrome.runtime.sendMessage({
        type: 'GET_TRANSACTION_STATUS',
        txHash
      });

      if (response.success && response.status) {
        return response.status;
      } else {
        throw new Error(response.error || 'Failed to get transaction status');
      }
    } else {
      throw new Error('Miden wallet extension not detected');
    }
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw error;
  }
};

// ===== SIMPLIFIED CONTENT SCRIPT TEST FUNCTIONS =====
// These functions test the isolated simplified content script

// Test simplified content script detection
export const testSimpleContentScript = (): boolean => {
  console.log('🧪 Testing Simplified Content Script...');
  
  try {
    // Check for simple namespace objects
    const simpleObjects = [
      'MIDEN_SIMPLE_READY',
      'MIDEN_SIMPLE_EXTENSION_ID',
      'midenSimpleWallet',
      'getSimpleStorageData',
      'testSimpleExtension'
    ];
    
    console.log('🔍 Checking simple objects...');
    let foundObjects = 0;
    
    for (const obj of simpleObjects) {
      const exists = (window as any)[obj];
      console.log(`🔍 ${obj}:`, exists ? '✅ Found' : '❌ Not found', typeof exists);
      if (exists) {
        foundObjects++;
        console.log(`✅ Simple object found: ${obj}`, exists);
      }
    }
    
    // Also check for any window properties that start with MIDEN_SIMPLE
    console.log('🔍 Checking for MIDEN_SIMPLE_* properties...');
    const windowKeys = Object.keys(window);
    const simpleKeys = windowKeys.filter(key => key.startsWith('MIDEN_SIMPLE'));
    console.log('🔍 MIDEN_SIMPLE_* keys found:', simpleKeys);
    
    // Check if objects were injected via message listener
    console.log('🔍 Simple objects injected via message listener:', simpleObjectsInjected);
    
    if (foundObjects > 0) {
      console.log(`✅ Simple content script detected: ${foundObjects} objects found`);
      return true;
    }
    
    console.log('❌ No simple content script objects found');
    console.log('🔍 Available window keys:', windowKeys.slice(0, 20)); // Show first 20 keys
    return false;
    
  } catch (error) {
    console.error('❌ Error testing simple content script:', error);
    return false;
  }
};

// Test simplified wallet bridge
export const testSimpleWalletBridge = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  console.log('🧪 Testing Simplified Wallet Bridge...');
  
  try {
    if (!(window as any).midenSimpleWallet) {
      return {
        success: false,
        error: 'midenSimpleWallet not available'
      };
    }
    
    // Test basic functions
    const bridge = (window as any).midenSimpleWallet;
    
    // Test isAvailable
    const isAvailable = bridge.isAvailable();
    console.log('✅ Simple bridge isAvailable:', isAvailable);
    
    // Test getStorage
    if (typeof bridge.getStorage === 'function') {
      try {
        const storage = await bridge.getStorage();
        console.log('✅ Simple bridge getStorage:', storage);
      } catch (error) {
        console.log('⚠️ Simple bridge getStorage error:', error);
      }
    }
    
    // Test test function
    if (typeof bridge.test === 'function') {
      const testResult = bridge.test();
      console.log('✅ Simple bridge test:', testResult);
    }
    
    return {
      success: true,
      data: {
        isAvailable,
        extensionId: bridge.extensionId,
        functions: Object.keys(bridge)
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing simple wallet bridge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Test simplified content script connection
export const testSimpleConnection = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  console.log('🧪 Testing Simplified Connection...');
  
  try {
    if (!(window as any).midenSimpleWallet) {
      return {
        success: false,
        error: 'midenSimpleWallet not available'
      };
    }
    
    const bridge = (window as any).midenSimpleWallet;
    
    // Test connect
    if (typeof bridge.connect === 'function') {
      try {
        const connectResult = await bridge.connect();
        console.log('✅ Simple bridge connect:', connectResult);
        
        return {
          success: true,
          data: {
            connect: connectResult,
            extensionId: bridge.extensionId
          }
        };
      } catch (error) {
        console.log('⚠️ Simple bridge connect error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    } else {
      return {
        success: false,
        error: 'connect function not available'
      };
    }
    
  } catch (error) {
    console.error('❌ Error testing simple connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Comprehensive test of both systems
export const testBothSystems = async (): Promise<{
  original: boolean;
  simple: boolean;
  simpleBridge: any;
  simpleConnection: any;
}> => {
  console.log('🧪 Testing Both Systems (Original + Simple)...');
  
  const result = {
    original: false,
    simple: false,
    simpleBridge: null as any,
    simpleConnection: null as any
  };
  
  // Test original system
  result.original = isMidenExtensionAvailable();
  console.log('✅ Original system available:', result.original);
  
  // Wait a bit for content scripts to fully load
  console.log('⏳ Waiting for content scripts to load...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test simple system
  result.simple = testSimpleContentScript();
  console.log('✅ Simple system available:', result.simple);
  
  if (result.simple) {
    // Test simple bridge
    result.simpleBridge = await testSimpleWalletBridge();
    console.log('✅ Simple bridge test:', result.simpleBridge);
    
    // Test simple connection
    result.simpleConnection = await testSimpleConnection();
    console.log('✅ Simple connection test:', result.simpleConnection);
  }
  
  return result;
};

// Setup message listener for simple data injection
let simpleObjectsInjected = false;
let lastMessageTime = 0;
const MESSAGE_DEBOUNCE_MS = 100; // 100ms debounce

export const setupSimpleMessageListener = (): void => {
  console.log('🔧 Setting up simple message listener...');
  
  window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    
    // Handle simple data injection
    if (event.data.type === 'MIDEN_SIMPLE_INJECT_DATA') {
      // Debounce to prevent rapid-fire messages
      const now = Date.now();
      if (now - lastMessageTime < MESSAGE_DEBOUNCE_MS) {
        console.log('🔧 Debouncing rapid message, ignoring...');
        return;
      }
      lastMessageTime = now;
      
      console.log('🔧 Received simple data from content script:', event.data.data);
      
      try {
        // Inject data to window
        const data = event.data.data;
        
        (window as any).MIDEN_SIMPLE_READY = data.MIDEN_SIMPLE_READY;
        (window as any).MIDEN_SIMPLE_EXTENSION_ID = data.MIDEN_SIMPLE_EXTENSION_ID;
        
        // Create simple wallet bridge with functions
        (window as any).midenSimpleWallet = {
          extensionId: data.extensionId,
          isAvailable: function() {
            const available = data.extensionId !== null && data.extensionId !== undefined;
            console.log('🔍 midenSimpleWallet.isAvailable() called:', { 
              extensionId: data.extensionId, 
              available 
            });
            return available;
          },
          getStorage: function() {
            return this.sendMessage({ type: 'GET_STORAGE' });
          },
          test: function() {
            return this.sendMessage({ type: 'TEST' });
          },
          sendMessage: function(message: any) {
            return new Promise((resolve, reject) => {
              // Check if extension is still available
              if (!this.isAvailable()) {
                reject(new Error('Extension context invalidated or not available'));
                return;
              }
              
              const id = Date.now() + Math.random();
              
              const listener = (event: MessageEvent) => {
                if (event.data.type === `MIDEN_SIMPLE_RESPONSE_${message.type}` && event.data.id === id) {
                  window.removeEventListener('message', listener);
                  if (event.data.error) {
                    // Handle specific error types
                    if (event.data.error.includes('Extension context invalidated')) {
                      reject(new Error('Extension context invalidated - please reload the page'));
                    } else {
                      reject(new Error(event.data.error));
                    }
                  } else {
                    resolve(event.data.response);
                  }
                }
              };
              
              window.addEventListener('message', listener);
              
              try {
                window.postMessage({
                  ...message,
                  type: `MIDEN_SIMPLE_${message.type}`,
                  id: id
                }, '*');
              } catch (error) {
                window.removeEventListener('message', listener);
                reject(new Error('Failed to send message: ' + error.message));
                return;
              }
              
              setTimeout(() => {
                window.removeEventListener('message', listener);
                reject(new Error('Simple request timeout'));
              }, 3000); // Reduced timeout to 3 seconds
            });
          },
          connect: function() {
            return this.sendMessage({ type: 'CONNECT' });
          },
          disconnect: function() {
            return this.sendMessage({ type: 'DISCONNECT' });
          },
          getInfo: function() {
            return this.sendMessage({ type: 'GET_INFO' });
          },
          getBalance: function(address: string) {
            return this.sendMessage({ 
              type: 'GET_BALANCE', 
              address: address 
            });
          }
        };
        
        // Create global functions
        (window as any).getSimpleStorageData = function() {
          return (window as any).midenSimpleWallet.getStorage();
        };
        
        (window as any).testSimpleExtension = function() {
          return {
            extensionId: data.extensionId,
            chromeAvailable: typeof chrome !== 'undefined',
            timestamp: new Date().toISOString()
          };
        };
        
        simpleObjectsInjected = true;
        
        console.log('✅ Simple objects created in main window');
        console.log('🔍 MIDEN_SIMPLE_READY:', (window as any).MIDEN_SIMPLE_READY);
        console.log('🔍 midenSimpleWallet:', (window as any).midenSimpleWallet);
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('midenSimpleReady', {
          detail: { 
            available: true,
            timestamp: new Date().toISOString(),
            extensionId: data.MIDEN_SIMPLE_EXTENSION_ID,
            namespace: 'SIMPLE'
          }
        }));
        
      } catch (error) {
        console.error('❌ Failed to create simple objects:', error);
      }
    }
  });
  
  console.log('✅ Simple message listener setup complete');
};

// Initialize message listener on module load
setupSimpleMessageListener();

// Manual test function for debugging
export const manualTestSimple = (): void => {
  console.log('🔧 MANUAL SIMPLE TEST - Checking all objects...');
  
  // Check all window properties
  const windowKeys = Object.keys(window);
  console.log('🔍 All window keys:', windowKeys);
  
  // Check for any Miden-related properties
  const midenKeys = windowKeys.filter(key => 
    key.toLowerCase().includes('miden') || 
    key.includes('MIDEN') ||
    key.includes('Simple')
  );
  console.log('🔍 Miden-related keys:', midenKeys);
  
  // Check specific objects
  console.log('🔍 MIDEN_SIMPLE_READY:', (window as any).MIDEN_SIMPLE_READY);
  console.log('🔍 MIDEN_SIMPLE_EXTENSION_ID:', (window as any).MIDEN_SIMPLE_EXTENSION_ID);
  console.log('🔍 midenSimpleWallet:', (window as any).midenSimpleWallet);
  console.log('🔍 getSimpleStorageData:', (window as any).getSimpleStorageData);
  console.log('🔍 testSimpleExtension:', (window as any).testSimpleExtension);
  
  // Check if midenSimpleWallet has methods
  if ((window as any).midenSimpleWallet) {
    const bridge = (window as any).midenSimpleWallet;
    console.log('🔍 midenSimpleWallet methods:', Object.keys(bridge));
    console.log('🔍 midenSimpleWallet.isAvailable():', bridge.isAvailable());
  }
  
  // Check for events
  console.log('🔍 Checking for midenSimpleReady event...');
  window.addEventListener('midenSimpleReady', (event) => {
    console.log('✅ midenSimpleReady event received:', event);
  });
};
