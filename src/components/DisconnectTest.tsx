import React, { useState, useEffect } from 'react';
import { useApiStore } from '../store/apiStore';

const DisconnectTest: React.FC = () => {
  const { wallet, isAuthenticated } = useApiStore();
  const [testResults, setTestResults] = useState<any>(null);

  const runDisconnectTest = () => {
    console.log('🧪 Running Disconnect Test...');
    
    const beforeState = {
      walletConnected: wallet.isConnected,
      walletAddress: wallet.address,
      walletBalance: wallet.balance?.miden || 0,
      isAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Before disconnect state:', beforeState);
    
    // Simulate disconnect
    const { setWallet, logout } = useApiStore.getState();
    
    // Clear wallet state
    const disconnectedWalletState = {
      address: '',
      isConnected: false,
      balance: { miden: 0 }
    };
    
    setWallet(disconnectedWalletState);
    logout();
    
    // Clear local storage
    try {
      localStorage.removeItem('miden-wallet-connection');
      localStorage.removeItem('miden-wallet-data');
      localStorage.removeItem('miden-connection-status');
      localStorage.removeItem('miden-user-connected'); // Remove user connection preference
      console.log('🧹 Local storage cleared');
    } catch (error) {
      console.log('❌ Could not clear local storage:', error);
    }
    
    const afterState = {
      walletConnected: wallet.isConnected,
      walletAddress: wallet.address,
      walletBalance: wallet.balance?.miden || 0,
      isAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 After disconnect state:', afterState);
    
    const results = {
      before: beforeState,
      after: afterState,
      success: !afterState.walletConnected && !afterState.isAuthenticated,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(results);
    console.log('🧪 Disconnect test results:', results);
  };

  const runReconnectTest = async () => {
    console.log('🧪 Running Reconnect Test...');
    
    try {
      // Check if extension is available
      if (typeof (window as any).midenSimpleWallet !== 'undefined') {
        const storageData = await (window as any).midenSimpleWallet.getStorage();
        console.log('🔍 Extension storage data:', storageData);
        
        if (storageData.success && storageData.data) {
          const walletData = storageData.data['miden-wallet-data'];
          
          if (walletData && walletData.isConnected && walletData.aliceMidenAddress) {
            const newWalletState = {
              address: walletData.aliceMidenAddress,
              isConnected: true,
              balance: { miden: Number(walletData.aliceBalance || 0) }
            };
            
            const { setWallet, login } = useApiStore.getState();
            setWallet(newWalletState);
            await login(walletData.aliceMidenAddress);
            
            console.log('✅ Reconnect successful:', newWalletState);
            setTestResults(prev => ({
              ...prev,
              reconnectSuccess: true,
              reconnectData: newWalletState
            }));
          }
        }
      }
    } catch (error) {
      console.error('❌ Reconnect test failed:', error);
      setTestResults(prev => ({
        ...prev,
        reconnectSuccess: false,
        reconnectError: error.message
      }));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🧪 Disconnect Test
      </h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runDisconnectTest}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          🧪 Test Disconnect
        </button>
        
        <button
          onClick={runReconnectTest}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          🔄 Test Reconnect
        </button>
      </div>

      {/* Current State */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-lg mb-2">📊 Current State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Wallet Connected:</strong> {wallet.isConnected ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Wallet Address:</strong> {wallet.address || 'None'}
          </div>
          <div>
            <strong>Wallet Balance:</strong> {wallet.balance?.miden || 0} MID
          </div>
          <div>
            <strong>User Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          {/* Before/After Comparison */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Before/After Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Before Disconnect</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Connected:</strong> {testResults.before.walletConnected ? '✅' : '❌'}</div>
                  <div><strong>Address:</strong> {testResults.before.walletAddress || 'None'}</div>
                  <div><strong>Balance:</strong> {testResults.before.walletBalance} MID</div>
                  <div><strong>Authenticated:</strong> {testResults.before.isAuthenticated ? '✅' : '❌'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-600 mb-2">After Disconnect</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Connected:</strong> {testResults.after.walletConnected ? '✅' : '❌'}</div>
                  <div><strong>Address:</strong> {testResults.after.walletAddress || 'None'}</div>
                  <div><strong>Balance:</strong> {testResults.after.walletBalance} MID</div>
                  <div><strong>Authenticated:</strong> {testResults.after.isAuthenticated ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Status */}
          <div className={`rounded-lg p-4 ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold text-lg mb-2 ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResults.success ? '✅ Disconnect Test PASSED' : '❌ Disconnect Test FAILED'}
            </h3>
            <div className="text-sm">
              <div><strong>Success:</strong> {testResults.success ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Timestamp:</strong> {testResults.timestamp}</div>
            </div>
          </div>

          {/* Reconnect Results */}
          {testResults.reconnectSuccess !== undefined && (
            <div className={`rounded-lg p-4 ${testResults.reconnectSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold text-lg mb-2 ${testResults.reconnectSuccess ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.reconnectSuccess ? '✅ Reconnect Test PASSED' : '❌ Reconnect Test FAILED'}
              </h3>
              {testResults.reconnectData && (
                <div className="text-sm">
                  <div><strong>Address:</strong> {testResults.reconnectData.address}</div>
                  <div><strong>Balance:</strong> {testResults.reconnectData.balance.miden} MID</div>
                </div>
              )}
              {testResults.reconnectError && (
                <div className="text-sm text-red-600">
                  <strong>Error:</strong> {testResults.reconnectError}
                </div>
              )}
            </div>
          )}

          {/* Raw Results */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-white">🔍 Raw Results</h3>
            <pre className="text-green-400 text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">📋 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Klik "Test Disconnect" untuk memutuskan web app dari wallet</li>
          <li>Pastikan wallet state menjadi disconnected dan user logout</li>
          <li>Klik "Test Reconnect" untuk menghubungkan kembali ke extension</li>
          <li>Pastikan extension tetap terhubung (tidak ikut terputus)</li>
        </ol>
      </div>
    </div>
  );
};

export default DisconnectTest;
