import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Layout/Header';
import { POSView } from './components/POS/POSView';
import { ProductsView } from './components/Products/ProductsView';
import { HistoryView } from './components/History/HistoryView';
import { SettingsView } from './components/Settings/SettingsView';
import { DeFiView } from './components/DeFi/DeFiView';
import { MarketplaceView } from './components/Marketplace/MarketplaceView';
import { DebugInfo } from './components/DebugInfo';
import { WalletTest } from './components/WalletTest';
import { SimpleWalletTest } from './components/SimpleWalletTest';
import SimpleTest from './components/SimpleTest';
import SimpleTestDebug from './components/SimpleTestDebug';
import SimpleTestSafe from './components/SimpleTestSafe';
import SimpleTestRobust from './components/SimpleTestRobust';
import SimpleTestFinal from './components/SimpleTestFinal';
import DisconnectTest from './components/DisconnectTest';
import { useApiStore } from './store/apiStore';

function App() {
  const { currentView, initializeAuth } = useApiStore();

  // Initialize authentication on app load
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing app authentication...');
        await initializeAuth();
        console.log('App authentication initialization completed');
      } catch (error) {
        console.error('Failed to initialize app authentication:', error);
      }
    };

    initApp();
  }, [initializeAuth]);

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <POSView />;
      case 'products':
        return <ProductsView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />; // Re-enabled with safe wallet data handling
      case 'defi':
        return <DeFiView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'wallet-test':
        return <WalletTest />; // Re-enabled with safe wallet data handling
      case 'simple-wallet-test':
        return <SimpleWalletTest />;
      case 'simple-test':
        return <SimpleTest />;
      case 'simple-test-debug':
        return <SimpleTestDebug />;
      case 'simple-test-safe':
        return <SimpleTestSafe />;
      case 'simple-test-robust':
        return <SimpleTestRobust />;
      case 'simple-test-final':
        return <SimpleTestFinal />;
      case 'disconnect-test':
        return <DisconnectTest />;
      default:
        return <MarketplaceView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-indonesian">
      <Header />
      <main className="pb-6">
        {renderView()}
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#ffffff',
          },
        }}
      />
      {/* Debug Info - Hidden for production */}
      {/* <DebugInfo /> */}
    </div>
  );
}

export default App;