// frontend/src/utils/miden.ts
// Miden wallet integration for frontend

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
export const isChromeExtension = typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome?.runtime?.id;

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

// Check if Miden extension is available
export const isMidenExtensionAvailable = (): boolean => {
  // Method 1: Check if our injected wallet bridge is available
  if (typeof window !== 'undefined' && (window as any).midenWallet) {
    console.log('✅ Miden wallet bridge detected in window object');
    return true;
  }
  
  // Method 2: Check if chrome runtime is available (fallback)
  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime && (window as any).chrome?.runtime?.id) {
    console.log('✅ Chrome runtime detected, extension should be available');
    return true;
  }
  
  console.log('❌ No Miden extension detected');
  return false;
};

// Async version for checking extension availability with event listener
export const checkMidenExtensionAvailability = async (): Promise<boolean> => {
  // Method 1: Check if our injected wallet bridge is available
  if (typeof window !== 'undefined' && (window as any).midenWallet) {
    console.log('✅ Miden wallet bridge detected in window object');
    return true;
  }
  
  // Method 2: Check if chrome runtime is available
  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime && (window as any).chrome?.runtime?.id) {
    console.log('✅ Chrome runtime detected, extension should be available');
    return true;
  }
  
  // Method 3: Wait for midenWalletReady event
  if (typeof window !== 'undefined') {
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout waiting for midenWalletReady event');
        resolve(false);
      }, 3000); // Wait up to 3 seconds
      
      const listener = (event: CustomEvent) => {
        if (event.type === 'midenWalletReady') {
          console.log('🎉 midenWalletReady event received, extension available!');
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
  
  console.log('❌ No Miden extension detected');
  return false;
};

// Initialize Miden wallet
export const initializeMidenWallet = () => {
  if (!midenWalletInstance) {
    try {
      // Check if Miden extension is available
      if (isMidenExtensionAvailable()) {
        // Use the injected wallet bridge
        midenWalletInstance = {
          connect: async () => {
            // Connect via injected wallet bridge
            try {
              const response = await (window as any).midenWallet.connect();
              console.log('✅ Connected to Miden wallet via bridge:', response);
              return [response.address || 'miden1234567890abcdef'];
            } catch (error) {
              console.error('❌ Failed to connect via bridge:', error);
              throw error;
            }
          },
          disconnect: async () => {
            try {
              await (window as any).midenWallet.disconnect();
              console.log('✅ Miden Wallet disconnected via bridge');
            } catch (error) {
              console.error('❌ Failed to disconnect via bridge:', error);
            }
          },
          signTransaction: async (txn: any) => {
            // Sign transaction via injected wallet bridge
            try {
              const response = await (window as any).midenWallet.sendMessage({ 
                type: 'SIGN_MIDEN_TRANSACTION', 
                transaction: txn 
              });
              console.log('✅ Transaction signed via bridge:', response);
              return response.signedTransaction || response;
            } catch (error) {
              console.error('❌ Failed to sign transaction via bridge:', error);
              throw error;
            }
          }
        };
        console.log('✅ Miden Wallet extension initialized successfully via bridge');
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

// Connect to Miden wallet
export const connectMidenWallet = async (): Promise<string[]> => {
  try {
    console.log('🔌 Attempting to connect to Miden wallet...');
    
    // Check if extension is available
    if (!isMidenExtensionAvailable()) {
      throw new Error('Miden wallet extension not available');
    }
    
    // Use the injected wallet bridge
    if ((window as any).midenWallet) {
      console.log('✅ Using injected wallet bridge');
      const response = await (window as any).midenWallet.connect();
      console.log('✅ Connected to Miden wallet via bridge:', response);
      return [response.address || 'miden1234567890abcdef'];
    }
    
    // Fallback to direct chrome call (should not happen if bridge is working)
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime) {
      console.log('⚠️ Fallback to direct chrome call');
      const response = await (window as any).chrome.runtime.sendMessage({ type: 'CONNECT_MIDEN_WALLET' });
      if (response.success && response.wallet) {
        return [response.wallet.aliceMidenAddress];
      } else {
        throw new Error(response.error || 'Failed to connect to Miden wallet');
      }
    }
    
    throw new Error('No wallet connection method available');
  } catch (error) {
    console.error('❌ Failed to connect to Miden wallet:', error);
    throw error;
  }
};

// Disconnect from Miden wallet
export const disconnectMidenWallet = async (): Promise<void> => {
  try {
    console.log('🔌 Disconnecting from Miden wallet...');
    
    // Use the injected wallet bridge
    if ((window as any).midenWallet) {
      console.log('✅ Using injected wallet bridge');
      await (window as any).midenWallet.disconnect();
      console.log('✅ Disconnected from Miden wallet via bridge');
      return;
    }
    
    // Fallback to direct chrome call
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome?.runtime) {
      console.log('⚠️ Fallback to direct chrome call');
      await (window as any).chrome.runtime.sendMessage({ type: 'DISCONNECT_MIDEN_WALLET' });
      console.log('✅ Miden Wallet disconnected via chrome');
    }
    
    // Clear local storage
    localStorage.removeItem('midenWallet');
    console.log('✅ Local wallet storage cleared');
  } catch (error) {
    console.error('❌ Failed to disconnect from Miden wallet:', error);
    throw error;
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
  if (isMidenExtensionAvailable() && chrome.storage?.local) {
    // Use Chrome extension storage
    await chrome.storage.local.set({
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
  if (isMidenExtensionAvailable() && chrome.storage?.local) {
    // Use Chrome extension storage
    try {
      const result = await chrome.storage.local.get([WALLET_STORAGE_KEY, CONNECTION_STATUS_KEY]);
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
  if (isMidenExtensionAvailable() && chrome.storage?.local) {
    // Use Chrome extension storage
    await chrome.storage.local.remove([WALLET_STORAGE_KEY, CONNECTION_STATUS_KEY]);
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
      const response = await chrome.runtime.sendMessage({
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
      const response = await chrome.runtime.sendMessage({
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
      const response = await chrome.runtime.sendMessage({ type: 'RECONNECT_MIDEN_WALLET' });
      
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
    const response = await chrome.runtime.sendMessage({
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
    if (isMidenExtensionAvailable()) {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_REAL_TIME_BALANCE',
        address
      });

      if (response.success && response.balance !== undefined) {
        return Number(response.balance);
      } else {
        throw new Error(response.error || 'Failed to get real-time balance');
      }
    } else {
      throw new Error('Miden wallet extension not detected');
    }
  } catch (error) {
    console.error('Failed to get real-time balance:', error);
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
      const response = await chrome.runtime.sendMessage({
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
      const response = await chrome.runtime.sendMessage({
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