import React, { useMemo, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';

export const ProductGrid: React.FC = () => {
  const { products, addToCart, businessInfo } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.nameEn?.toLowerCase().includes(q) ?? false) ||
      (p.category?.toLowerCase().includes(q) ?? false) ||
      (p.barcode?.toLowerCase().includes(q) ?? false)
    );
  }, [products, query]);

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product);
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    }
  };

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, kategori, atau barcode..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada produk cocok
          </h3>
          <p className="text-gray-500">
            Coba kata kunci lain
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
              onClick={() => handleAddToCart(product)}
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">
                  {businessInfo.language === 'en' && product.nameEn 
                    ? product.nameEn 
                    : product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 font-semibold">
                    {formatCurrency(product.price, businessInfo.currency)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t('stock')}: {product.stock}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="w-full bg-primary-500 text-white rounded-lg py-2 px-3 text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('add')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};