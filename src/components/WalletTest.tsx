import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  isMidenExtensionAvailable,
  connectMidenWallet,
  disconnectMidenWallet,
  getWalletFromStorage,
  getRealTimeBalance,
  formatMidenAddress
} from '../utils/midenFixed';
import toast from 'react-hot-toast';

export const WalletTest: React.FC = () => {
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [walletStatus, setWalletStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [walletData, setWalletData] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check extension availability
  useEffect(() => {
    const checkExtension = () => {
      addLog('Checking Miden extension availability...');
      const available = isMidenExtensionAvailable();
      setExtensionStatus(available ? 'available' : 'unavailable');
      addLog(`Extension status: ${available ? 'Available' : 'Not Available'}`);
    };

    checkExtension();
    
    // Check periodically
    const interval = setInterval(checkExtension, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check existing wallet
  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        addLog('Checking for existing wallet...');
        const storedWallet = await getWalletFromStorage();
        if (storedWallet && storedWallet.isConnected) {
          setWalletData(storedWallet);
          setWalletStatus('connected');
          addLog(`Found existing wallet: ${formatMidenAddress(storedWallet.aliceMidenAddress)}`);
          
          // Get balance
          try {
            const walletBalance = await getRealTimeBalance(storedWallet.aliceMidenAddress);
            setBalance(walletBalance);
            addLog(`Wallet balance: ${walletBalance} MIDEN`);
          } catch (error) {
            addLog(`Failed to get balance: ${error}`);
          }
        } else {
          addLog('No existing wallet found');
        }
      } catch (error) {
        addLog(`Error checking existing wallet: ${error}`);
      }
    };

    if (extensionStatus === 'available') {
      checkExistingWallet();
    }
  }, [extensionStatus]);

  const handleConnect = async () => {
    if (extensionStatus !== 'available') {
      toast.error('Miden extension not available');
      return;
    }

    setWalletStatus('connecting');
    addLog('Connecting to Miden wallet...');

    try {
      const result = await connectMidenWallet();
      if (result.success && result.address) {
        setWalletStatus('connected');
        addLog(`Successfully connected! Address: ${formatMidenAddress(result.address)}`);
        
        // Get wallet data
        const wallet = await getWalletFromStorage();
        setWalletData(wallet);
        
        // Get balance
        try {
          const walletBalance = result.balance || await getRealTimeBalance(result.address);
          setBalance(walletBalance);
          addLog(`Wallet balance: ${walletBalance} MIDEN`);
        } catch (error) {
          addLog(`Failed to get balance: ${error}`);
        }
        
        toast.success('Wallet connected successfully!');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      setWalletStatus('error');
      addLog(`Connection failed: ${error}`);
      toast.error(`Failed to connect: ${error}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMidenWallet();
      setWalletStatus('disconnected');
      setWalletData(null);
      setBalance(0);
      addLog('Wallet disconnected');
      toast.success('Wallet disconnected');
    } catch (error) {
      addLog(`Disconnect error: ${error}`);
      toast.error(`Disconnect failed: ${error}`);
    }
  };

  const handleRefreshBalance = async () => {
    if (!walletData?.aliceMidenAddress) {
      toast.error('No wallet connected');
      return;
    }

    try {
      addLog('Refreshing balance...');
      const walletBalance = await getRealTimeBalance(walletData.aliceMidenAddress);
      setBalance(walletBalance);
      addLog(`Balance updated: ${walletBalance} MIDEN`);
      toast.success(`Balance: ${walletBalance} MIDEN`);
    } catch (error) {
      addLog(`Failed to refresh balance: ${error}`);
      toast.error(`Failed to get balance: ${error}`);
    }
  };

  const getStatusIcon = () => {
    switch (walletStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (walletStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Miden Wallet Connection Test</h1>
        <p className="text-gray-600">Test the connection between frontend and Miden Chrome extension</p>
      </div>

      {/* Extension Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span>Extension Status</span>
        </h2>
        
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            extensionStatus === 'available' ? 'bg-green-500' : 
            extensionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="font-medium">
            {extensionStatus === 'available' ? 'Extension Available' :
             extensionStatus === 'checking' ? 'Checking...' : 'Extension Not Available'}
          </span>
        </div>
        
        {extensionStatus === 'unavailable' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              Miden Chrome extension not detected. Please make sure the extension is installed and enabled.
            </p>
          </div>
        )}
      </div>

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          {getStatusIcon()}
          <span>Wallet Status: {getStatusText()}</span>
        </h2>
        
        {walletData && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Wallet Information:</h3>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Address:</span> {formatMidenAddress(walletData.aliceMidenAddress)}</div>
              <div><span className="font-medium">Balance:</span> {balance} MIDEN</div>
              <div><span className="font-medium">Connected:</span> {walletData.isConnected ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-3">
          {walletStatus === 'disconnected' && (
            <button
              onClick={handleConnect}
              disabled={extensionStatus !== 'available'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Connect Wallet
            </button>
          )}
          
          {walletStatus === 'connected' && (
            <>
              <button
                onClick={handleRefreshBalance}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Refresh Balance
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disconnect
              </button>
            </>
          )}
          
          {walletStatus === 'error' && (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      {/* Connection Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Connection Logs</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-3 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
          <li>Make sure the Miden Chrome extension is installed and enabled</li>
          <li>Click "Connect Wallet" to establish connection</li>
          <li>Check the logs for connection details</li>
          <li>Use "Refresh Balance" to test balance updates</li>
          <li>Click "Disconnect" to test disconnection</li>
        </ol>
      </div>
    </div>
  );
};
