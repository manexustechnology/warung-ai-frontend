import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Wallet, Settings, LogOut, User, Store, TrendingUp, ShoppingCart, Package, History, Zap, Bug, Shield, CheckCircle, Target, TestTube } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { shouldShowTestMenus } from '../../config/hideTestMenus';
import { 
  connectMidenWallet, 
  disconnectMidenWallet, 
  getWalletFromStorage, 
  reconnectMidenWallet,
  getRealTimeBalance,
  formatMidenAddress,
  getWalletInitials,
  isMidenExtensionAvailable,
  getMidenWalletStatusFromStorage
} from '../../utils/midenFixed';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {

  const { 
    currentView, 
    setCurrentView, 
    businessInfo, 
    wallet, 
    setWallet, 
    isAuthenticated,
    logout
  } = useApiStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isExtensionAvailable, setExtensionAvailable] = useState(false);

  // Check if Miden extension is available (ONLY for availability, NOT for auto-connection)
  const checkExtension = useCallback(async () => {
    console.log('🔍 Header: Checking extension availability only...');
    
    try {
      // Check if simplified content script is available
      if (typeof (window as any).midenSimpleWallet !== 'undefined') {
        console.log('✅ Header: Simplified content script detected');
        
        // Check if extension is available
        const isAvailable = (window as any).midenSimpleWallet.isAvailable();
        console.log('🔍 Header: Extension available:', isAvailable);
        
        if (isAvailable) {
          setExtensionAvailable(true);
          
          // Check if user has manually connected before
          const userConnected = localStorage.getItem('miden-user-connected');
          console.log('🔍 Header: User connection preference:', userConnected);
          
          if (userConnected === 'true') {
            // Only auto-connect if user has previously connected
            try {
              const storageData = await (window as any).midenSimpleWallet.getStorage();
              console.log('🔍 Header: Real wallet data from extension:', storageData);
              
              if (storageData.success && storageData.data) {
                const walletData = storageData.data['miden-wallet-data'];
                
                if (walletData && walletData.isConnected && walletData.aliceMidenAddress) {
                  const newWalletState = {
                    address: walletData.aliceMidenAddress,
                    isConnected: true,
                    balance: { miden: Number(walletData.aliceBalance || 0) }
                  };
                  
                  setWallet(newWalletState);
                  setWalletBalance(Number(walletData.aliceBalance || 0));
                  console.log('🔌 Header: Auto-reconnected wallet state:', newWalletState);
                  
                  // Auto-login when wallet is connected
                  if (!isAuthenticated) {
                    console.log('🔌 Header: Auto-login triggered for reconnected wallet:', walletData.aliceMidenAddress);
                    try {
                      const { login } = useApiStore.getState();
                      await login(walletData.aliceMidenAddress);
                      console.log('🔌 Header: Auto-login successful');
                    } catch (error) {
                      console.error('🔌 Header: Auto-login failed:', error);
                    }
                  }
                }
              }
            } catch (error) {
              console.log('🔍 Header: Could not get storage data yet:', error);
            }
          } else {
            console.log('🔍 Header: User has not connected before, waiting for manual connection');
          }
          
          return true;
        }
      }
      
      // Fallback to old method if simplified content script not available
      const isAvailable = isMidenExtensionAvailable();
      console.log('🔍 Header: Fallback extension check result:', isAvailable);
      setExtensionAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('❌ Header: Error checking extension:', error);
      setExtensionAvailable(false);
      return false;
    }
  }, [wallet.balance, setWallet, isAuthenticated]);

  // Check if Miden extension is available
  useEffect(() => {
    console.log('🔧 Header: Setting up extension detection...');
    
    // Initial check with delay to allow content script to inject
    setTimeout(() => {
      console.log('🔍 Header: Initial check after 500ms delay...');
      checkExtension();
    }, 500);
    
    // Check periodically - reduced frequency to prevent message flooding
    const interval = setInterval(() => {
      console.log('⏰ Header: Periodic check...');
      checkExtension();
    }, 30000); // Check every 30 seconds instead of 5
    
    return () => {
      console.log('🧹 Header: Cleaning up...');
      clearInterval(interval);
    };
  }, [checkExtension]);

  // Auto-reconnect wallet on component mount - SAFE TYPE HANDLING
  useEffect(() => {
    const reconnectWallet = async () => {
      try {
        const storedWallet = await getWalletFromStorage();
        if (storedWallet && storedWallet.isConnected) {
          const address = await reconnectMidenWallet();
        // SAFE TYPE CHECK: Ensure address is string before using
        if (address && typeof address === 'string') {
          const newWalletState = {
            address,
            isConnected: true,
            balance: { miden: Number(storedWallet.aliceBalance || 0) }
          };
          setWallet(newWalletState);
          console.log('🔌 Header: Wallet reconnected with state:', newWalletState);
            
            // Update balance with safe address
            await updateWalletBalance(address);
          } else {
            console.log('Reconnect returned invalid address type:', typeof address);
          }
        }
      } catch (error) {
        console.log('No existing wallet to reconnect');
      }
    };

    if (isExtensionAvailable) {
      reconnectWallet();
    }
  }, [isExtensionAvailable, setWallet]);

  // Update wallet balance periodically - SAFE PARAMETER HANDLING
  useEffect(() => {
    if (wallet.isConnected && wallet.address && typeof wallet.address === 'string') {
      const updateBalance = async () => {
        // SAFE PARAMETER CHECK: Ensure address is string before calling
        if (typeof wallet.address === 'string') {
          await updateWalletBalance(wallet.address);
        }
      };

      updateBalance();
      
      // Update balance every 30 seconds
      const interval = setInterval(updateBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet.isConnected, wallet.address]);

  const updateWalletBalance = async (address: string) => {
    try {
      // Use simplified content script for real balance
      if (typeof (window as any).midenSimpleWallet !== 'undefined') {
        const result = await (window as any).midenSimpleWallet.getBalance();
        console.log('🔌 Header: REAL balance result:', result);
        
        if (result.success && result.balance !== undefined) {
          const balance = Number(result.balance);
          setWalletBalance(balance);
          
          // Update store
          const updatedWalletState = {
            ...wallet,
            balance: { miden: balance }
          };
          setWallet(updatedWalletState);
          console.log('🔌 Header: REAL wallet balance updated:', updatedWalletState);
        }
      } else {
        // Fallback to old method
        const balance = await getRealTimeBalance(address);
        setWalletBalance(balance);
        
        // Update store
        const updatedWalletState = {
          ...wallet,
          balance: { miden: balance }
        };
        setWallet(updatedWalletState);
        console.log('🔌 Header: Wallet balance updated:', updatedWalletState);
      }
    } catch (error) {
      console.error('Failed to update wallet balance:', error);
    }
  };

  const handleConnect = async () => {
    if (!isExtensionAvailable) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Miden wallet extension tidak tersedia. Silakan install extension terlebih dahulu.'
          : 'Miden wallet extension not available. Please install the extension first.'
      );
      return;
    }

      setIsConnecting(true);
      try {
      console.log('🔌 Header: Starting web app connection to wallet...');
      
      // Cek apakah extension sudah terhubung
      if (typeof (window as any).midenSimpleWallet !== 'undefined') {
        try {
          const storageData = await (window as any).midenSimpleWallet.getStorage();
          console.log('🔌 Header: Extension storage data:', storageData);
          
          if (storageData.success && storageData.data) {
            const walletData = storageData.data['miden-wallet-data'];
            
            if (walletData && walletData.isConnected && walletData.aliceMidenAddress) {
              // Extension sudah terhubung, reconnect web app
              const newWalletState = {
                address: walletData.aliceMidenAddress,
            isConnected: true,
                balance: { miden: Number(walletData.aliceBalance || 0) }
              };
              
              console.log('🔌 Header: Reconnecting web app to existing wallet:', newWalletState);
              setWallet(newWalletState);
              setWalletBalance(Number(walletData.aliceBalance || 0));
              
              // Auto-login when wallet is connected
              if (!isAuthenticated) {
                console.log('🔌 Header: Auto-login triggered for reconnected wallet:', walletData.aliceMidenAddress);
                try {
                  const { login } = useApiStore.getState();
                  await login(walletData.aliceMidenAddress);
                  console.log('🔌 Header: Auto-login successful');
                } catch (error) {
                  console.error('🔌 Header: Auto-login failed:', error);
                }
              }
              
              // Save user connection preference
              localStorage.setItem('miden-user-connected', 'true');
              console.log('🔌 Header: User connection preference saved');
              
            toast.success(
              businessInfo.language === 'id' 
                  ? 'Web app berhasil terhubung ke wallet!'
                  : 'Web app successfully connected to wallet!'
            );
              return;
          }
        }
      } catch (error) {
          console.log('🔌 Header: Could not get storage data, trying direct connect:', error);
        }
        
        // Jika extension belum terhubung, coba connect
        const result = await (window as any).midenSimpleWallet.connect();
        console.log('🔌 Header: Extension connection result:', result);
        
        if (result.success && result.address) {
          const newWalletState = {
            address: result.address,
            isConnected: true,
            balance: { miden: result.balance || 0 }
          };
          
          console.log('🔌 Header: Setting new wallet state:', newWalletState);
          setWallet(newWalletState);
          setWalletBalance(result.balance || 0);
          
          // Auto-login when wallet is connected
          if (result.address && !isAuthenticated) {
            console.log('🔌 Header: Auto-login triggered for new wallet:', result.address);
            try {
              const { login } = useApiStore.getState();
              await login(result.address);
              console.log('🔌 Header: Auto-login successful');
            } catch (error) {
              console.error('🔌 Header: Auto-login failed:', error);
            }
          }
          
          // Save user connection preference
          localStorage.setItem('miden-user-connected', 'true');
          console.log('🔌 Header: User connection preference saved');
          
          toast.success(
            businessInfo.language === 'id' 
              ? 'Wallet berhasil terhubung!'
              : 'Wallet connected successfully!'
          );
        } else {
          throw new Error(result.error || 'Failed to connect wallet');
        }
      } else {
        // Fallback to old method
        const result = await connectMidenWallet();
        console.log('🔌 Header: Fallback connection result:', result);
        
        if (result.success && result.address) {
          const newWalletState = {
            address: result.address,
            isConnected: true,
            balance: { miden: result.balance || 0 }
          };
          
          setWallet(newWalletState);
          setWalletBalance(result.balance || 0);
          
          toast.success(
            businessInfo.language === 'id' 
              ? 'Wallet berhasil terhubung!'
              : 'Wallet connected successfully!'
          );
        } else {
          throw new Error(result.error || 'Failed to connect wallet');
        }
      }
    } catch (error) {
      console.error('❌ Header: Failed to connect wallet:', error);
      toast.error(
        businessInfo.language === 'id'
          ? 'Gagal menghubungkan wallet'
          : 'Failed to connect wallet'
      );
      } finally {
        setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    // Hanya disconnect di web app, TIDAK di Miden Wallet Extension
    console.log('🔌 Header: Disconnecting web app only (keeping extension connected)');
    
    // Clear wallet state di web app
    const disconnectedWalletState = {
      address: '',
      isConnected: false,
      balance: { miden: 0 }
    };
    
    setWallet(disconnectedWalletState);
    setWalletBalance(0);
    
    // Clear local storage untuk web app
    try {
      localStorage.removeItem('miden-wallet-connection');
      localStorage.removeItem('miden-wallet-data');
      localStorage.removeItem('miden-connection-status');
      localStorage.removeItem('miden-wallet-data');
      localStorage.removeItem('miden-user-connected'); // Remove user connection preference
      console.log('🔌 Header: Local storage cleared for web app');
    } catch (error) {
      console.log('🔌 Header: Could not clear local storage:', error);
    }
    
    // Clear Zustand store state
    try {
      const { setWallet: setStoreWallet } = useApiStore.getState();
      setStoreWallet(disconnectedWalletState);
      console.log('🔌 Header: Store state cleared');
    } catch (error) {
      console.log('🔌 Header: Could not clear store state:', error);
    }
    
    // Logout user dari web app
    try {
      const { logout } = useApiStore.getState();
      logout();
      console.log('🔌 Header: User logged out from web app');
    } catch (error) {
      console.log('🔌 Header: Could not logout user:', error);
    }
    
    console.log('🔌 Header: Web app completely disconnected (extension remains connected):', disconnectedWalletState);
    
    toast.success(
      businessInfo.language === 'id'
        ? 'Web app terputus dari wallet (Extension tetap terhubung)'
        : 'Web app disconnected from wallet (Extension remains connected)'
    );
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Check if test menus should be shown
  const showTestMenus = shouldShowTestMenus();
  console.log('🔧 Header: Test menus visibility:', showTestMenus);

  const navigationItems = [
    { id: 'pos', label: businessInfo.language === 'id' ? 'POS' : 'POS', icon: ShoppingCart },
    { id: 'marketplace', label: businessInfo.language === 'id' ? 'Marketplace' : 'Marketplace', icon: Store },
    { id: 'products', label: businessInfo.language === 'id' ? 'Produk' : 'Products', icon: Package },
    { id: 'defi', label: businessInfo.language === 'id' ? 'DeFi' : 'DeFi', icon: TrendingUp },
    { id: 'history', label: businessInfo.language === 'id' ? 'Riwayat' : 'History', icon: History },
    // Settings removed from main menu - only available in user dropdown
    // Test menus - HIDDEN by default, only shown in maintenance mode
    ...(showTestMenus ? [
      { id: 'simple-test', label: 'Simple Test', icon: Zap },
      { id: 'simple-test-debug', label: 'Debug Test', icon: Bug },
      { id: 'simple-test-safe', label: 'Safe Test', icon: Shield },
      { id: 'simple-test-robust', label: 'Robust Test', icon: CheckCircle },
      { id: 'simple-test-final', label: 'Final Test', icon: Target },
      { id: 'disconnect-test', label: 'Disconnect Test', icon: TestTube },
    ] : [])
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                {businessInfo.name || 'Warung AI'}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
              <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as 'pos' | 'products' | 'history' | 'defi' | 'marketplace' | 'wallet-test' | 'simple-wallet-test' | 'simple-test')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
              </button>
              );
            })}
          </nav>

          {/* Wallet Connection Status */}
          <div className="flex items-center space-x-4">
                         {/* Debug info - HIDDEN */}
             {false && process.env.NODE_ENV === 'development' && (
               <div className="text-xs text-gray-500">
                 Debug: {wallet.isConnected ? 'Connected' : 'Disconnected'} |
                 Addr: {wallet.address ? 'Yes' : 'No'} |
                 Balance: {typeof wallet.balance?.miden === 'number' ? wallet.balance.miden : 'N/A'}
               </div>
             )}
            
            {isExtensionAvailable ? (
              wallet.isConnected ? (
                <div className="flex items-center space-x-3">
                  {/* Wallet Address & Balance Display - SAFE RENDERING */}
                  <div className="flex items-center space-x-2">
                    {/* Wallet Address with full address on hover */}
                    <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full font-mono cursor-pointer hover:bg-gray-200 transition-colors relative group"
                         title={wallet.address || 'No address available'}
                         onClick={() => {
                           if (wallet.address && typeof wallet.address === 'string') {
                             navigator.clipboard.writeText(wallet.address);
                             toast.success('Wallet address copied!');
                           }
                         }}>
                      💳 {wallet.address && typeof wallet.address === 'string' && wallet.address.length > 10 ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'No Address'}
                      
                      {/* Full address tooltip */}
                      {wallet.address && typeof wallet.address === 'string' && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {wallet.address}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Balance - SAFE RENDERING */}
                    <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                      💰 {typeof wallet.balance?.miden === 'number' ? wallet.balance.miden : 0} MID
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    title="Disconnect web app only (Extension stays connected)"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                    🔌 Extension Ready
                  </div>
                  <button
                    onClick={handleConnect}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Connect
                  </button>
                </div>
              )
            ) : (
          <div className="flex items-center space-x-3">
                <div className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  ❌ Extension Tidak Tersedia
                </div>
                <button
                  onClick={checkExtension}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated && (
            <div className="relative">
            <button
                onClick={toggleMenu}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
            </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{businessInfo.language === 'id' ? 'Pengaturan' : 'Settings'}</span>
                  </button>
              <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                    <span>{businessInfo.language === 'id' ? 'Keluar' : 'Logout'}</span>
              </button>
                </div>
              )}
            </div>
            )}

          {/* Mobile Menu Button */}
            <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
            </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
              <button
                    key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as 'pos' | 'products' | 'history' | 'defi' | 'marketplace' | 'wallet-test' | 'simple-wallet-test' | 'simple-test');
                    setIsMenuOpen(false);
                  }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      currentView === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
              </button>
                );
              })}
          </div>
        </div>
        )}
      </div>
    </header>
  );
};