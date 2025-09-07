import React, { useState, useEffect } from 'react';
import { 
  testSimpleContentScript, 
  testSimpleWalletBridge, 
  testSimpleConnection, 
  testBothSystems,
  manualTestSimple
} from '../utils/midenFixed';

const SimpleTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await testBothSystems();
      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const runSimpleTest = async () => {
    setIsLoading(true);
    try {
      const simple = testSimpleContentScript();
      const bridge = await testSimpleWalletBridge();
      const connection = await testSimpleConnection();
      
      setTestResults({
        simple,
        bridge,
        connection
      });
    } catch (error) {
      console.error('Simple test error:', error);
      setTestResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const runManualTest = () => {
    console.log('🔧 Running manual test...');
    manualTestSimple();
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🧪 Simplified Content Script Test
      </h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Both Systems'}
        </button>
        
        <button
          onClick={runSimpleTest}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Simple Only'}
        </button>
        
        <button
          onClick={runManualTest}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Manual Debug Test
        </button>
      </div>

      {testResults && (
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.error ? (
            <div className="text-red-600">
              <strong>Error:</strong> {testResults.error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Original System */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Original System</h3>
                <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                  testResults.original ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.original ? '✅ Available' : '❌ Not Available'}
                </div>
              </div>

              {/* Simple System */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Simple System</h3>
                <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                  testResults.simple ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.simple ? '✅ Available' : '❌ Not Available'}
                </div>
              </div>

              {/* Simple Bridge */}
              {testResults.simpleBridge && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Simple Bridge</h3>
                  <div className={`px-3 py-1 rounded-full text-sm inline-block mb-2 ${
                    testResults.simpleBridge.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testResults.simpleBridge.success ? '✅ Working' : '❌ Failed'}
                  </div>
                  {testResults.simpleBridge.data && (
                    <div className="mt-2 text-sm">
                      <div><strong>Extension ID:</strong> {testResults.simpleBridge.data.extensionId || 'N/A'}</div>
                      <div><strong>Available:</strong> {testResults.simpleBridge.data.isAvailable ? 'Yes' : 'No'}</div>
                      <div><strong>Functions:</strong> {testResults.simpleBridge.data.functions?.join(', ') || 'N/A'}</div>
                    </div>
                  )}
                  {testResults.simpleBridge.error && (
                    <div className="text-red-600 text-sm mt-2">
                      <strong>Error:</strong> {testResults.simpleBridge.error}
                    </div>
                  )}
                </div>
              )}

              {/* Simple Connection */}
              {testResults.simpleConnection && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Simple Connection</h3>
                  <div className={`px-3 py-1 rounded-full text-sm inline-block mb-2 ${
                    testResults.simpleConnection.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testResults.simpleConnection.success ? '✅ Connected' : '❌ Failed'}
                  </div>
                  {testResults.simpleConnection.data && (
                    <div className="mt-2 text-sm">
                      <div><strong>Extension ID:</strong> {testResults.simpleConnection.data.extensionId || 'N/A'}</div>
                      <div><strong>Connect Result:</strong> {JSON.stringify(testResults.simpleConnection.data.connect) || 'N/A'}</div>
                    </div>
                  )}
                  {testResults.simpleConnection.error && (
                    <div className="text-red-600 text-sm mt-2">
                      <strong>Error:</strong> {testResults.simpleConnection.error}
                    </div>
                  )}
                </div>
              )}

              {/* Raw Results */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Raw Results</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure the Miden Wallet Chrome extension is installed and enabled</li>
          <li>Refresh this page to load both content scripts</li>
          <li>Click "Test Both Systems" to test both original and simplified systems</li>
          <li>Check the console for detailed logs</li>
          <li>Look for <code>window.midenSimpleWallet</code> in browser console</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTest;
