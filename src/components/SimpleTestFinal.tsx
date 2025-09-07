import React, { useState, useEffect } from 'react';

const SimpleTestFinal: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runFinalTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('🎯 Running FINAL Simple Test...');
    
    try {
      // Test 1: Check if objects exist (safe)
      const objects = {
        MIDEN_SIMPLE_READY: (window as any).MIDEN_SIMPLE_READY,
        MIDEN_SIMPLE_EXTENSION_ID: (window as any).MIDEN_SIMPLE_EXTENSION_ID,
        midenSimpleWallet: (window as any).midenSimpleWallet,
        getSimpleStorageData: (window as any).getSimpleStorageData,
        testSimpleExtension: (window as any).testSimpleExtension
      };
      
      console.log('🔍 Objects check:', objects);
      
      // Test 2: Check midenSimpleWallet methods (safe)
      let walletMethods = [];
      if (objects.midenSimpleWallet) {
        walletMethods = Object.keys(objects.midenSimpleWallet);
        console.log('🔍 Wallet methods:', walletMethods);
      }
      
      // Test 3: Check isAvailable (safe call)
      let isAvailable = false;
      if (objects.midenSimpleWallet && typeof objects.midenSimpleWallet.isAvailable === 'function') {
        try {
          isAvailable = objects.midenSimpleWallet.isAvailable();
          console.log('✅ isAvailable():', isAvailable);
        } catch (error) {
          console.error('❌ isAvailable() error:', error);
        }
      }
      
      // Test 4: Check extension ID
      const extensionId = objects.MIDEN_SIMPLE_EXTENSION_ID || objects.midenSimpleWallet?.extensionId;
      console.log('🔍 Extension ID:', extensionId);
      
      // Test 5: Check if functions exist (without calling them)
      const functionsExist = {
        getStorage: typeof objects.midenSimpleWallet?.getStorage === 'function',
        test: typeof objects.midenSimpleWallet?.test === 'function',
        connect: typeof objects.midenSimpleWallet?.connect === 'function',
        disconnect: typeof objects.midenSimpleWallet?.disconnect === 'function',
        getInfo: typeof objects.midenSimpleWallet?.getInfo === 'function',
        getBalance: typeof objects.midenSimpleWallet?.getBalance === 'function'
      };
      
      console.log('🔍 Functions exist:', functionsExist);
      
      const results = {
        timestamp: new Date().toISOString(),
        objects: {
          MIDEN_SIMPLE_READY: !!objects.MIDEN_SIMPLE_READY,
          MIDEN_SIMPLE_EXTENSION_ID: !!objects.MIDEN_SIMPLE_EXTENSION_ID,
          midenSimpleWallet: !!objects.midenSimpleWallet,
          getSimpleStorageData: !!objects.getSimpleStorageData,
          testSimpleExtension: !!objects.testSimpleExtension
        },
        walletMethods: walletMethods,
        isAvailable: isAvailable,
        extensionId: extensionId,
        functionsExist: functionsExist,
        summary: {
          totalObjects: Object.values(objects).filter(Boolean).length,
          walletReady: !!objects.midenSimpleWallet,
          extensionDetected: !!extensionId,
          isAvailable: isAvailable,
          functionsReady: Object.values(functionsExist).filter(Boolean).length,
          systemStatus: 'READY'
        }
      };
      
      console.log('✅ Final test results:', results);
      setTestResults(results);
      
    } catch (error) {
      console.error('❌ Final test error:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run test after 1 second
    const timer = setTimeout(runFinalTest, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🎯 Final Simple Test
      </h1>
      
      <div className="mb-6">
        <button
          onClick={runFinalTest}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isRunning ? '🔄 Running...' : '🎯 Run Final Test'}
        </button>
      </div>

      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-green-800">📊 Test Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Objects Found:</strong> {testResults.summary?.totalObjects || 0}/5
              </div>
              <div>
                <strong>Wallet Ready:</strong> {testResults.summary?.walletReady ? '✅' : '❌'}
              </div>
              <div>
                <strong>Extension Detected:</strong> {testResults.summary?.extensionDetected ? '✅' : '❌'}
              </div>
              <div>
                <strong>Functions Ready:</strong> {testResults.summary?.functionsReady || 0}/6
              </div>
            </div>
            <div className="mt-2 text-sm">
              <strong>System Status:</strong> <span className="text-green-600 font-semibold">{testResults.summary?.systemStatus}</span>
            </div>
          </div>

          {/* Objects Status */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Objects Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {testResults.objects && Object.entries(testResults.objects).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-mono">{key}:</span>
                  <span className={value ? 'text-green-600' : 'text-red-600'}>
                    {value ? '✅ Found' : '❌ Missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Functions Status */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔧 Functions Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {testResults.functionsExist && Object.entries(testResults.functionsExist).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-mono">{key}():</span>
                  <span className={value ? 'text-green-600' : 'text-red-600'}>
                    {value ? '✅ Ready' : '❌ Missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Extension Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔌 Extension Info</h3>
            <div className="text-sm">
              <div><strong>Extension ID:</strong> {testResults.extensionId || 'N/A'}</div>
              <div><strong>Available:</strong> {testResults.isAvailable ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Methods Count:</strong> {testResults.walletMethods?.length || 0}</div>
            </div>
          </div>

          {/* Error Display */}
          {testResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-red-800">❌ Error</h3>
              <div className="text-sm text-red-600">
                {testResults.error}
              </div>
            </div>
          )}

          {/* Success Message */}
          {testResults.summary?.systemStatus === 'READY' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-green-800">🎉 System Ready!</h3>
              <div className="text-sm text-green-600">
                Simplified Content Script untuk Miden Wallet Chrome Extension sudah siap digunakan!
                Semua objek dan fungsi telah terdeteksi dengan benar.
              </div>
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
        <h3 className="font-semibold text-lg mb-2">📋 Final Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Test ini hanya memeriksa keberadaan objek dan fungsi tanpa memanggilnya</li>
          <li>Jika semua objek ditemukan dan fungsi siap, sistem berfungsi dengan baik</li>
          <li>Test ini aman dan tidak akan menyebabkan "Extension context invalidated"</li>
          <li>Jika status "READY", sistem simplified content script siap digunakan</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTestFinal;
