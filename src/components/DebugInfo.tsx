import React, { useState, useEffect } from 'react';
import { Info, Copy, Check, ExternalLink, RefreshCw, Wallet, Network, Database, Activity, X } from 'lucide-react';
import { useApiStore } from '../store/apiStore';
import { 
  getCurrentNetwork, 
  getWalletFromStorage, 
  isMidenExtensionAvailable,
  getRealTimeBalance,
  getTransactionStatus
} from '../utils/miden';

export const DebugInfo: React.FC = () => {
  const { wallet, businessInfo } = useApiStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [extensionStatus, setExtensionStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadDebugInfo();
  }, [wallet.isConnected]);

  const loadDebugInfo = async () => {
    try {
      // Get wallet data from storage
      const storedWallet = await getWalletFromStorage();
      setWalletData(storedWallet);

      // Get network info
      const currentNetwork = getCurrentNetwork();
      setNetworkInfo(currentNetwork);

      // Check extension status
      const isAvailable = isMidenExtensionAvailable();
      setExtensionStatus({
        isAvailable,
        timestamp: new Date().toISOString()
      });

      // Get real-time balance if wallet is connected
      if (wallet.isConnected && wallet.address) {
        try {
          const balance = await getRealTimeBalance(wallet.address);
          setWalletData((prev: any) => ({ ...prev, realTimeBalance: balance }));
        } catch (error) {
          console.error('Failed to get real-time balance:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load debug info:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDebugInfo();
    setIsRefreshing(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openExplorer = (txHash: string) => {
    const network = getCurrentNetwork();
    const url = `${network.explorerUrl}/tx/${txHash}`;
    window.open(url, '_blank');
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Show Debug Info"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Info className="h-6 w-6 mr-2 text-blue-600" />
              Debug Information
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-green-600" />
                Wallet Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Connection Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    wallet.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {wallet.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {wallet.isConnected && wallet.address && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Address:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-800">
                          {wallet.address && typeof wallet.address === 'string' && wallet.address.length > 14 ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : 'No Address'}
                        </span>
                        <button
                          onClick={() => wallet.address && copyToClipboard(wallet.address, 'address')}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          {copiedField === 'address' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Balance:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {wallet.balance?.miden?.toFixed(2) || '0.00'} MIDEN
                      </span>
                    </div>

                    {walletData?.realTimeBalance !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Real-time Balance:</span>
                        <span className="text-sm font-medium text-gray-800">
                          {walletData.realTimeBalance.toFixed(2)} MIDEN
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Extension Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Extension Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Extension Available:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    extensionStatus?.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {extensionStatus?.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>

                {extensionStatus?.timestamp && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Last Check:</span>
                    <span className="text-sm text-gray-800">
                      {new Date(extensionStatus.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Network Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Network className="h-5 w-5 mr-2 text-purple-600" />
                Network Configuration
              </h3>
              
              {networkInfo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Network:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {networkInfo.chainId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">RPC URL:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-800">
                        {networkInfo.rpcUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(networkInfo.rpcUrl, 'rpc')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {copiedField === 'rpc' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Explorer:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-800">
                        {networkInfo.explorerUrl}
                      </span>
                      <button
                        onClick={() => window.open(networkInfo.explorerUrl, '_blank')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stored Wallet Data */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-orange-600" />
                Stored Wallet Data
              </h3>
              
              {walletData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Alice ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {walletData.aliceId || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Faucet ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {walletData.faucetId || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Block Number:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {walletData.blockNumber || 'N/A'}
                    </span>
                  </div>

                  {walletData.mintedNotes && walletData.mintedNotes.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Minted Notes:</span>
                      <div className="mt-2 space-y-1">
                        {walletData.mintedNotes.slice(0, 3).map((note: string, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs font-mono text-gray-600">
                              {note.slice(0, 8)}...{note.slice(-6)}
                            </span>
                                                    <button
                          onClick={() => copyToClipboard(note || '', `note-${index}`)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                              {copiedField === `note-${index}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                        {walletData.mintedNotes.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{walletData.mintedNotes.length - 3} more...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No wallet data stored</span>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          {wallet.isConnected && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-sm text-gray-600">
                Wallet connected at {new Date().toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 