import React, { useState, useEffect } from 'react';

const SimpleTestRobust: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runRobustTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('🛡️ Running ROBUST Simple Test...');
    
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
      
      // Test 5: Test getStorage with error handling
      let getStorageResult = null;
      let getStorageError = null;
      if (objects.midenSimpleWallet && typeof objects.midenSimpleWallet.getStorage === 'function') {
        try {
          getStorageResult = await objects.midenSimpleWallet.getStorage();
          console.log('✅ getStorage() result:', getStorageResult);
        } catch (error) {
          getStorageError = error.message;
          console.error('❌ getStorage() error:', error);
        }
      }
      
      // Test 6: Test test function with error handling
      let testResult = null;
      let testError = null;
      if (objects.midenSimpleWallet && typeof objects.midenSimpleWallet.test === 'function') {
        try {
          testResult = await objects.midenSimpleWallet.test();
          console.log('✅ test() result:', testResult);
        } catch (error) {
          testError = error.message;
          console.error('❌ test() error:', error);
        }
      }
      
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
        functions: {
          getStorage: {
            success: !getStorageError,
            result: getStorageResult,
            error: getStorageError
          },
          test: {
            success: !testError,
            result: testResult,
            error: testError
          }
        },
        summary: {
          totalObjects: Object.values(objects).filter(Boolean).length,
          walletReady: !!objects.midenSimpleWallet,
          extensionDetected: !!extensionId,
          isAvailable: isAvailable,
          functionsWorking: !getStorageError && !testError,
          contextValid: !getStorageError?.includes('Extension context invalidated')
        }
      };
      
      console.log('✅ Robust test results:', results);
      setTestResults(results);
      
    } catch (error) {
      console.error('❌ Robust test error:', error);
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
    const timer = setTimeout(runRobustTest, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🛡️ Robust Simple Test
      </h1>
      
      <div className="mb-6">
        <button
          onClick={runRobustTest}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isRunning ? '🔄 Running...' : '🛡️ Run Robust Test'}
        </button>
      </div>

      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className={`border rounded-lg p-4 ${
            testResults.summary?.contextValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold text-lg mb-2 ${
              testResults.summary?.contextValid ? 'text-green-800' : 'text-red-800'
            }`}>
              📊 Test Summary
            </h3>
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
                <strong>Context Valid:</strong> {testResults.summary?.contextValid ? '✅' : '❌'}
              </div>
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

          {/* Function Tests */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔧 Function Tests</h3>
            <div className="space-y-4">
              {/* getStorage Test */}
              <div className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">getStorage():</span>
                  <span className={testResults.functions?.getStorage?.success ? 'text-green-600' : 'text-red-600'}>
                    {testResults.functions?.getStorage?.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                {testResults.functions?.getStorage?.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {testResults.functions.getStorage.error}
                  </div>
                )}
                {testResults.functions?.getStorage?.result && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    <strong>Result:</strong> {JSON.stringify(testResults.functions.getStorage.result)}
                  </div>
                )}
              </div>

              {/* test Test */}
              <div className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">test():</span>
                  <span className={testResults.functions?.test?.success ? 'text-green-600' : 'text-red-600'}>
                    {testResults.functions?.test?.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                {testResults.functions?.test?.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {testResults.functions.test.error}
                  </div>
                )}
                {testResults.functions?.test?.result && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    <strong>Result:</strong> {JSON.stringify(testResults.functions.test.result)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Extension Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔌 Extension Info</h3>
            <div className="text-sm">
              <div><strong>Extension ID:</strong> {testResults.extensionId || 'N/A'}</div>
              <div><strong>Available:</strong> {testResults.isAvailable ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Context Valid:</strong> {testResults.summary?.contextValid ? '✅ Yes' : '❌ No'}</div>
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
        <h3 className="font-semibold text-lg mb-2">📋 Robust Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Test ini mencoba memanggil fungsi <code>getStorage()</code> dan <code>test()</code> dengan error handling</li>
          <li>Jika ada "Extension context invalidated", reload halaman untuk memperbaiki</li>
          <li>Test ini menunjukkan apakah fungsi-fungsi benar-benar bekerja atau hanya terdeteksi</li>
          <li>Jika semua fungsi berhasil, sistem simplified content script berfungsi dengan sempurna</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTestRobust;
