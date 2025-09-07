import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { useApiStore } from '../../store/apiStore';
import { useTranslation } from '../../utils/translations';
import { Transaction } from '../../types';
import { CartItem } from '../../types';

export const POSView: React.FC = () => {
  const { cart, getCartTotal, businessInfo, wallet, isAuthenticated, currentStore, loadProducts, loadCart } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Load products and cart from database when component mounts or currentStore changes
  useEffect(() => {
    if (currentStore && isAuthenticated) {
      console.log('Loading products and cart for POS store:', currentStore.walletAddress);
      loadProducts(currentStore.walletAddress);
      loadCart(currentStore.walletAddress);
    }
  }, [currentStore, isAuthenticated, loadProducts, loadCart]);

  const handlePaymentComplete = (transactionData: Omit<Transaction, 'id'>, originalCart: CartItem[]) => {
    // Create a temporary transaction object with id for display purposes
    // Use original cart data for receipt display
    const transaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(), // Temporary id for display
      items: originalCart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.unitPrice ?? item.product.price,
        subtotal: item.subtotal,
        product: item.product, // Include full product data for receipt
      })),
    };
    setLastTransaction(transaction);
    setShowReceipt(true);
  };

  // Check authentication and wallet connection after hooks
  if (!wallet.isConnected || !isAuthenticated || !currentStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {businessInfo.language === 'id' 
              ? 'Hubungkan Dompet untuk Mengakses POS'
              : 'Connect Wallet to Access POS'
            }
          </h3>
          <p className="text-gray-500">
            {businessInfo.language === 'id' 
              ? 'Hubungkan Miden Wallet untuk mulai menggunakan sistem kasir'
              : 'Connect your Miden Wallet to start using the POS system'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('products')}
            </h2>
            <p className="text-gray-600">
              Pilih produk untuk ditambahkan ke keranjang
            </p>
          </div>
          <ProductGrid />
        </div>

        {/* Cart and Checkout - Takes 1/3 on desktop */}
        <div className="space-y-6">
          <Cart />
          
          {cart.length > 0 && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full bg-primary-500 text-white rounded-lg py-4 px-6 font-semibold text-lg hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2 animate-pulse-soft"
            >
              <CreditCard className="h-6 w-6" />
              <span>{t('checkout')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Receipt Modal */}
      {lastTransaction && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          transaction={lastTransaction}
        />
      )}
    </div>
  );
};