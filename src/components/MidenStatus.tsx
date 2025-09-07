import React, { useState, useEffect } from 'react';
import { Wallet, Network, Activity, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { 
  isMidenExtensionAvailable, 
  getCurrentNetwork, 
  getWalletFromStorage,
  getRealTimeBalance,
  connectToMidenNetwork
} from '../utils/miden';
import { useApiStore } from '../store/apiStore';
import toast from 'react-hot-toast';

export const MidenStatus: React.FC = () => {
  const { wallet, businessInfo, updateWallet } = useApiStore();
  const [extensionStatus, setExtensionStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [walletData, setWalletData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      // Check extension availability
      const isAvailable = isMidenExtensionAvailable();
      setExtensionStatus(isAvailable ? 'available' : 'unavailable');

      // Check network connection
      if (isAvailable) {
        try {
          const storedWallet = await getWalletFromStorage();
          setWalletData(storedWallet);
          
          if (storedWallet && storedWallet.isConnected) {
            setNetworkStatus('connected');
            
            // Update wallet in store if not already connected
            if (!wallet.isConnected) {
              updateWallet({
                address: storedWallet.aliceMidenAddress,
                isConnected: true,
                balance: { ...wallet.balance, miden: Number(storedWallet.aliceBalance || 0) }
              });
            }
          } else {
            setNetworkStatus('disconnected');
          }
        } catch (error) {
          setNetworkStatus('disconnected');
        }
      } else {
        setNetworkStatus('disconnected');
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
  };

  const handleConnect = async () => {
    try {
      const walletInfo = await connectToMidenNetwork();
      if (walletInfo) {
        updateWallet({
          address: walletInfo.aliceMidenAddress,
          isConnected: true,
          balance: { ...wallet.balance, miden: Number(walletInfo.aliceBalance || 0) }
        });
        
        toast.success(
          businessInfo.language === 'id'
            ? 'Berhasil terhubung ke jaringan Miden!'
            : 'Successfully connected to Miden network!'
        );
        
        await checkStatus();
      }
    } catch (error) {
      console.error('Failed to connect to Miden network:', error);
      toast.error(
        businessInfo.language === 'id'
          ? 'Gagal terhubung ke jaringan Miden'
          : 'Failed to connect to Miden network'
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unavailable':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, type: 'extension' | 'network') => {
    const isIndonesian = businessInfo.language === 'id';
    
    switch (status) {
      case 'available':
        return isIndonesian ? 'Extension Tersedia' : 'Extension Available';
      case 'unavailable':
        return isIndonesian ? 'Extension Tidak Tersedia' : 'Extension Unavailable';
      case 'connected':
        return isIndonesian ? 'Terhubung' : 'Connected';
      case 'disconnected':
        return isIndonesian ? 'Terputus' : 'Disconnected';
      case 'checking':
        return isIndonesian ? 'Memeriksa...' : 'Checking...';
      default:
        return isIndonesian ? 'Tidak Diketahui' : 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unavailable':
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const currentNetwork = getCurrentNetwork();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-blue-600" />
          Miden Network Status
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Extension Status */}
        <div className={`p-4 rounded-lg border ${getStatusColor(extensionStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5" />
              <div>
                <h4 className="font-medium">Extension Status</h4>
                <p className="text-sm opacity-75">{getStatusText(extensionStatus, 'extension')}</p>
              </div>
            </div>
            {getStatusIcon(extensionStatus)}
          </div>
        </div>

        {/* Network Status */}
        <div className={`p-4 rounded-lg border ${getStatusColor(networkStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network className="h-5 w-5" />
              <div>
                <h4 className="font-medium">Network Status</h4>
                <p className="text-sm opacity-75">{getStatusText(networkStatus, 'network')}</p>
              </div>
            </div>
            {getStatusIcon(networkStatus)}
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Network className="h-4 w-4 mr-2 text-gray-600" />
          Network Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">Network:</span>
            <div className="font-medium text-gray-900">{currentNetwork.chainId}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">RPC URL:</span>
            <div className="font-medium text-gray-900 text-sm truncate">{currentNetwork.rpcUrl}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Explorer:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 text-sm truncate">{currentNetwork.explorerUrl}</span>
              <button
                onClick={() => window.open(currentNetwork.explorerUrl, '_blank')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Information */}
      {walletData && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Wallet Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Alice ID:</span>
              <div className="font-mono text-sm text-gray-900">{walletData.aliceId || 'N/A'}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Faucet ID:</span>
              <div className="font-mono text-sm text-gray-900">{walletData.faucetId || 'N/A'}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Block Number:</span>
              <div className="font-medium text-gray-900">{walletData.blockNumber || 'N/A'}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Balance:</span>
              <div className="font-medium text-gray-900">
                {Number(walletData.aliceBalance || 0).toFixed(2)} MIDEN
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        
        {extensionStatus === 'available' && networkStatus === 'disconnected' && (
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {businessInfo.language === 'id' ? 'Hubungkan ke Miden' : 'Connect to Miden'}
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {extensionStatus === 'unavailable' 
              ? (businessInfo.language === 'id' 
                  ? 'Miden wallet extension tidak terdeteksi. Silakan install extension terlebih dahulu.'
                  : 'Miden wallet extension not detected. Please install the extension first.')
              : networkStatus === 'disconnected'
              ? (businessInfo.language === 'id'
                  ? 'Extension tersedia tapi belum terhubung ke jaringan Miden.'
                  : 'Extension available but not connected to Miden network.')
              : (businessInfo.language === 'id'
                  ? 'Semua sistem berfungsi dengan baik.'
                  : 'All systems are functioning properly.')
            }
          </span>
        </div>
      </div>
    </div>
  );
};
