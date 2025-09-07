import React, { useState, useEffect } from 'react';

export const SimpleWalletTest: React.FC = () => {
  const [chromeAvailable, setChromeAvailable] = useState(false);
  const [midenTestAvailable, setMidenTestAvailable] = useState(false);
  const [midenWalletAvailable, setMidenWalletAvailable] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Check extension availability
  const checkExtensionAvailability = () => {
    addLog('🔍 Checking extension availability...');
    
    // Check Chrome object
    if (typeof (window as any).chrome !== 'undefined') {
      setChromeAvailable(true);
      addLog('✅ Chrome object detected');
    } else {
      setChromeAvailable(false);
      addLog('❌ Chrome object not detected');
    }
    
    // Check Miden Test object (content script injection)
    if ((window as any).midenTest) {
      setMidenTestAvailable(true);
      addLog('✅ Miden Test object detected (content script working)');
      console.log('🎯 SimpleWalletTest: midenTest found:', (window as any).midenTest);
    } else {
      setMidenTestAvailable(false);
      addLog('❌ Miden Test object not detected');
    }
    
    // Check Miden Wallet bridge
    if ((window as any).midenWallet) {
      setMidenWalletAvailable(true);
      addLog('✅ Miden Wallet bridge detected');
      console.log('🎯 SimpleWalletTest: midenWallet found:', (window as any).midenWallet);
      
      // Test bridge methods
      try {
        const available = (window as any).midenWallet.isAvailable();
        addLog(`✅ Bridge isAvailable(): ${available}`);
      } catch (error) {
        addLog(`❌ Bridge test error: ${error}`);
      }
    } else {
      setMidenWalletAvailable(false);
      addLog('❌ Miden Wallet bridge not detected');
    }
    
    // Check Chrome runtime ID
    if ((window as any).chrome?.runtime?.id) {
      addLog(`✅ Chrome runtime ID: ${(window as any).chrome.runtime.id}`);
    } else {
      addLog('❌ Chrome runtime ID not found');
    }
  };

  // Force check extension availability
  const forceCheckExtension = () => {
    addLog('🚀 Force checking extension availability...');
    
    // Wait a bit for content script to complete
    setTimeout(() => {
      checkExtensionAvailability();
    }, 500);
  };

  // Direct object check - bypass event listener
  const directObjectCheck = () => {
    console.log('🔍 Direct object check...');
    
    // Test multiple injection methods
    const results = {
      // Test functions
      testMidenSimple: typeof (window as any).testMidenSimple === 'function',
      testMidenExtension: typeof (window as any).testMidenExtension === 'function',
      
      // Window objects
      windowMidenTest: !!(window as any).midenTest,
      windowMidenWallet: !!(window as any).midenWallet,
      windowMidenTestReliable: !!(window as any).midenTestReliable,
      windowMidenWalletReliable: !!(window as any).midenWalletReliable,
      
      // Document objects
      documentMidenTest: !!(document as any).midenTest,
      documentMidenWallet: !!(document as any).midenWallet,
      
      // Chrome runtime
      chromeRuntime: !!(window as any).chrome?.runtime?.id
    };
    
    console.log('📊 Direct check results:', results);
    
    // Test each method individually
    if (results.testMidenSimple) {
      try {
        const testResult = (window as any).testMidenSimple();
        console.log('✅ testMidenSimple() result:', testResult);
      } catch (error) {
        console.error('❌ testMidenSimple() error:', error);
      }
    }
    
    if (results.testMidenExtension) {
      try {
        const testResult = (window as any).testMidenExtension();
        console.log('✅ testMidenExtension() result:', testResult);
      } catch (error) {
        console.error('❌ testMidenExtension() error:', error);
      }
    }
    
    // Log object details if available
    if (results.windowMidenTest) {
      console.log('✅ window.midenTest details:', (window as any).midenTest);
    }
    
    if (results.windowMidenWallet) {
      console.log('✅ window.midenWallet details:', (window as any).midenWallet);
    }
    
    if (results.documentMidenTest) {
      console.log('✅ document.midenTest details:', (document as any).midenTest);
    }
    
    if (results.documentMidenWallet) {
      console.log('✅ document.midenWallet details:', (document as any).midenWallet);
    }
    
    if (results.chromeRuntime) {
      console.log('✅ Chrome runtime ID:', (window as any).chrome?.runtime?.id);
    }
    
    return results;
  };

  useEffect(() => {
    console.log('🔧 SimpleWalletTest: Setting up event listeners...');
    
    // Listen for the midenWalletReady event from content script
    const handleMidenWalletReady = (event: CustomEvent) => {
      console.log('🎉 SimpleWalletTest: midenWalletReady event received!', event.detail);
      addLog('🎉 midenWalletReady event received from content script!');
      
      // Re-check extension availability after event
      setTimeout(() => {
        console.log('🔍 SimpleWalletTest: Re-checking after event...');
        checkExtensionAvailability();
      }, 100);
    };

    // Add event listener
    window.addEventListener('midenWalletReady', handleMidenWalletReady as EventListener);
    console.log('✅ SimpleWalletTest: Event listener added for midenWalletReady');
    
    // Initial check
    checkExtensionAvailability();
    
    // Auto-check after delay (for content script completion)
    setTimeout(() => {
      console.log('⏰ SimpleWalletTest: Auto-checking after delay...');
      directObjectCheck(); // Use direct check instead
    }, 3000); // Wait 3 seconds for content script
    
    // Second auto-check after longer delay
    setTimeout(() => {
      console.log('⏰ SimpleWalletTest: Second auto-check after longer delay...');
      directObjectCheck(); // Use direct check instead
    }, 5000); // Wait 5 seconds for content script
    
    // Also check periodically for safety
    const interval = setInterval(() => {
      console.log('⏰ SimpleWalletTest: Periodic check...');
      directObjectCheck(); // Use direct check instead
    }, 2000);
    
    return () => {
      console.log('🧹 SimpleWalletTest: Cleaning up event listeners...');
      window.removeEventListener('midenWalletReady', handleMidenWalletReady as EventListener);
      clearInterval(interval);
    };
  }, []);

  const testChromeRuntime = async () => {
    try {
      addLog('Testing Chrome runtime message...');
      if ((window as any).chrome?.runtime) {
        addLog('✅ Chrome runtime available, but cannot call sendMessage directly from webpage');
        addLog('This is normal - webpages cannot call chrome.runtime.sendMessage directly');
        addLog('Messages must go through content script first');
      } else {
        addLog('❌ Chrome runtime not available');
      }
    } catch (error) {
      addLog(`❌ Runtime error: ${error}`);
    }
  };

  const testMidenWalletBridge = async () => {
    try {
      addLog('Testing Miden Wallet bridge...');
      if ((window as any).midenWallet) {
        const isAvailable = (window as any).midenWallet.isAvailable();
        addLog(`✅ Bridge isAvailable(): ${isAvailable}`);
        
        if (isAvailable) {
          addLog('Testing bridge methods...');
          // Test connect method
          try {
            addLog('Testing bridge.connect()...');
            const result = await (window as any).midenWallet.connect();
            addLog(`✅ Connect result: ${JSON.stringify(result)}`);
          } catch (error) {
            addLog(`❌ Connect error: ${error}`);
          }
        }
      } else {
        addLog('❌ Miden Wallet bridge not available');
        addLog('This means the content script did not inject properly');
      }
    } catch (error) {
      addLog(`❌ Bridge test error: ${error}`);
    }
  };

  const testDirectMessage = async () => {
    try {
      addLog('Testing direct message to content script...');
      if ((window as any).midenWallet) {
        addLog('Sending test message via bridge...');
        const result = await (window as any).midenWallet.sendMessage({ 
          type: 'TEST_MESSAGE',
          data: 'Hello from frontend!'
        });
        addLog(`✅ Direct message result: ${JSON.stringify(result)}`);
      } else {
        addLog('❌ Cannot test - bridge not available');
      }
    } catch (error) {
      addLog(`❌ Direct message error: ${error}`);
    }
  };

  const testExtensionBackground = async () => {
    try {
      addLog('Testing extension background script...');
      if ((window as any).chrome?.runtime) {
        addLog('✅ Chrome runtime available, attempting to send message to background script...');
        const result = await (window as any).chrome.runtime.sendMessage({
          type: 'TEST_BACKGROUND_MESSAGE',
          data: 'Hello from frontend!'
        });
        addLog(`✅ Background script response: ${JSON.stringify(result)}`);
      } else {
        addLog('❌ Chrome runtime not available, cannot test background script.');
      }
    } catch (error) {
      addLog(`❌ Background script error: ${error}`);
    }
  };

  const useContentScriptTests = () => {
    addLog('🧪 Using content script test functions...');
    testChromeRuntime();
    testMidenWalletBridge();
    testDirectMessage();
    testExtensionBackground();
  };

  const useDetailedTests = () => {
    addLog('🧪 Running detailed tests...');
    checkExtensionAvailability();
    forceCheckExtension();
    directObjectCheck();
    useContentScriptTests();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple Wallet Test</h1>
        <p className="text-gray-600">Basic extension detection test</p>
      </div>

      {/* Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Chrome Object</h3>
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${chromeAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={chromeAvailable ? 'text-green-600' : 'text-red-600'}>
                {chromeAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
            <button
              onClick={checkExtensionAvailability}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check Extension
            </button>
            <button
              onClick={forceCheckExtension}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
            >
              Force Check
            </button>
            <button
              onClick={directObjectCheck}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
            >
              Direct Check
            </button>
            <button
              onClick={useContentScriptTests}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-2"
            >
              Use Test Functions
            </button>
            <button
              onClick={useDetailedTests}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 ml-2"
            >
              Detailed Tests
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Miden Test Object</h3>
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${midenTestAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={midenTestAvailable ? 'text-green-600' : 'text-red-600'}>
                {midenTestAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Simple test object to verify content script injection
            </p>
            {midenTestAvailable && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Message:</strong> {(window as any).midenTest?.message}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Miden Wallet Bridge</h3>
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${midenWalletAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={midenWalletAvailable ? 'text-green-600' : 'text-red-600'}>
                {midenWalletAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Wallet bridge for communication with extension
            </p>
            {midenWalletAvailable && (
              <button
                onClick={() => {
                  addLog('🧪 Testing wallet bridge...');
                  try {
                    const available = (window as any).midenWallet.isAvailable();
                    addLog(`✅ Bridge isAvailable(): ${available}`);
                  } catch (error) {
                    addLog(`❌ Bridge test error: ${error}`);
                  }
                }}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Test Bridge
              </button>
            )}
          </div>
        </div>

      {/* Test Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
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
        <h3 className="font-medium text-blue-900 mb-2">What This Test Does:</h3>
        <ul className="list-decimal list-inside text-blue-800 text-sm space-y-1">
          <li>Checks if Chrome object is available in window</li>
          <li>Checks if Chrome runtime has an ID (extension loaded)</li>
          <li>Checks if Miden Wallet bridge is injected</li>
          <li>Checks if Miden Test object is injected</li>
          <li>Listens for custom events from content script</li>
          <li>Tests basic communication with extension</li>
        </ul>
      </div>
    </div>
  );
};
