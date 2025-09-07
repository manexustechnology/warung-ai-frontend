import React from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';

export const Cart: React.FC = () => {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    getCartTotal, 
    businessInfo,
    updateCartItemPrice 
  } = useApiStore();
  const t = useTranslation(businessInfo.language);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      await updateCartItem(productId, quantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleUpdatePrice = async (productId: string, price: number) => {
    try {
      await updateCartItemPrice(productId, price);
    } catch (error) {
      console.error('Failed to update cart item price:', error);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('cart')} Kosong
        </h3>
        <p className="text-gray-500">
          Pilih produk untuk memulai transaksi
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5" />
          <span>{t('cart')} ({cart.length})</span>
        </h3>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center space-x-3 animate-slide-up">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {item.product.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-200 rounded flex items-center justify-center">
                  <span className="text-primary-600 text-xs font-bold">
                    {item.product.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {businessInfo.language === 'en' && item.product.nameEn 
                  ? item.product.nameEn 
                  : item.product.name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">Harga:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={(item.unitPrice ?? item.product.price).toString()}
                  onChange={(e) => handleUpdatePrice(item.product.id, parseFloat(e.target.value || '0'))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              
              <button
                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                disabled={item.quantity >= item.product.stock}
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(item.subtotal, businessInfo.currency)}
              </p>
              <button
                onClick={() => handleRemoveItem(item.product.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            {t('total')}:
          </span>
          <span className="text-xl font-bold text-primary-600">
            {formatCurrency(getCartTotal(), businessInfo.currency)}
          </span>
        </div>
      </div>
    </div>
  );
};