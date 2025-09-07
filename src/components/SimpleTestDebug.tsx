import React, { useState, useEffect } from 'react';

const SimpleTestDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDebugTest = () => {
    console.log('🔧 RUNNING DEBUG TEST...');
    
    const info = {
      timestamp: new Date().toISOString(),
      windowKeys: Object.keys(window).filter(key => 
        key.toLowerCase().includes('miden') || 
        key.includes('MIDEN') ||
        key.includes('Simple')
      ),
      midenSimpleWallet: {
        exists: !!(window as any).midenSimpleWallet,
        type: typeof (window as any).midenSimpleWallet,
        methods: (window as any).midenSimpleWallet ? Object.keys((window as any).midenSimpleWallet) : [],
        isAvailable: (window as any).midenSimpleWallet?.isAvailable?.(),
        extensionId: (window as any).midenSimpleWallet?.extensionId
      },
      globalFlags: {
        MIDEN_SIMPLE_READY: (window as any).MIDEN_SIMPLE_READY,
        MIDEN_SIMPLE_EXTENSION_ID: (window as any).MIDEN_SIMPLE_EXTENSION_ID,
        getSimpleStorageData: typeof (window as any).getSimpleStorageData,
        testSimpleExtension: typeof (window as any).testSimpleExtension
      },
      chrome: {
        available: typeof (window as any).chrome !== 'undefined',
        runtime: !!(window as any).chrome?.runtime,
        storage: !!(window as any).chrome?.storage
      }
    };
    
    console.log('🔧 DEBUG INFO:', info);
    setDebugInfo(info);
    
    // Test functions
    if ((window as any).midenSimpleWallet) {
      console.log('🧪 Testing midenSimpleWallet functions...');
      
      try {
        const isAvailable = (window as any).midenSimpleWallet.isAvailable();
        console.log('✅ isAvailable():', isAvailable);
      } catch (error) {
        console.error('❌ isAvailable() error:', error);
      }
      
      try {
        (window as any).midenSimpleWallet.getStorage().then((result: any) => {
          console.log('✅ getStorage() result:', result);
        }).catch((error: any) => {
          console.error('❌ getStorage() error:', error);
        });
      } catch (error) {
        console.error('❌ getStorage() sync error:', error);
      }
      
      try {
        const testResult = (window as any).midenSimpleWallet.test();
        console.log('✅ test() result:', testResult);
      } catch (error) {
        console.error('❌ test() error:', error);
      }
    }
  };

  useEffect(() => {
    // Auto-run test on mount
    setTimeout(runDebugTest, 1000);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🔧 Simple Test Debug
      </h1>
      
      <div className="mb-6">
        <button
          onClick={runDebugTest}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          🔧 Run Debug Test
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-6">
          {/* Window Keys */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Miden-related Window Keys</h3>
            <div className="text-sm font-mono">
              {debugInfo.windowKeys.map((key: string, index: number) => (
                <div key={index} className="py-1">
                  <span className="text-blue-600">{key}</span>: <span className="text-green-600">{typeof (window as any)[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* midenSimpleWallet */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 midenSimpleWallet Object</h3>
            <div className="text-sm">
              <div><strong>Exists:</strong> {debugInfo.midenSimpleWallet.exists ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Type:</strong> {debugInfo.midenSimpleWallet.type}</div>
              <div><strong>Extension ID:</strong> {debugInfo.midenSimpleWallet.extensionId || 'N/A'}</div>
              <div><strong>isAvailable():</strong> {debugInfo.midenSimpleWallet.isAvailable ? '✅ True' : '❌ False/Undefined'}</div>
              <div><strong>Methods:</strong> {debugInfo.midenSimpleWallet.methods.join(', ')}</div>
            </div>
          </div>

          {/* Global Flags */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Global Flags</h3>
            <div className="text-sm">
              <div><strong>MIDEN_SIMPLE_READY:</strong> {debugInfo.globalFlags.MIDEN_SIMPLE_READY ? '✅ True' : '❌ False'}</div>
              <div><strong>MIDEN_SIMPLE_EXTENSION_ID:</strong> {debugInfo.globalFlags.MIDEN_SIMPLE_EXTENSION_ID || 'N/A'}</div>
              <div><strong>getSimpleStorageData:</strong> {debugInfo.globalFlags.getSimpleStorageData}</div>
              <div><strong>testSimpleExtension:</strong> {debugInfo.globalFlags.testSimpleExtension}</div>
            </div>
          </div>

          {/* Chrome API */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Chrome API Availability</h3>
            <div className="text-sm">
              <div><strong>Chrome Available:</strong> {debugInfo.chrome.available ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Chrome Runtime:</strong> {debugInfo.chrome.runtime ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Chrome Storage:</strong> {debugInfo.chrome.storage ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>

          {/* Raw Debug Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-white">🔍 Raw Debug Info</h3>
            <pre className="text-green-400 text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">📋 Debug Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Klik "Run Debug Test" untuk menjalankan test lengkap</li>
          <li>Periksa console browser untuk log detail</li>
          <li>Pastikan <code>midenSimpleWallet</code> ada dan <code>isAvailable()</code> mengembalikan <code>true</code></li>
          <li>Jika masih error, coba hard refresh (Ctrl + Shift + R)</li>
          <li>Reload ekstensi Chrome di <code>chrome://extensions/</code></li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTestDebug;
