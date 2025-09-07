import React, { useState } from 'react';
import { ArrowLeft, Store, MapPin, Phone, Package, ShoppingCart, Star, Clock, DollarSign } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StoreData, Product } from '../../types';

interface StoreDetailsViewProps {
  store: StoreData;
  onBack: () => void;
}

export const StoreDetailsView: React.FC<StoreDetailsViewProps> = ({ store, onBack }) => {
  const { businessInfo } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter products
  const filteredProducts = store.products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.nameEn && product.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0; // Only show products in stock
  });

  // Get unique categories
  const categories = Array.from(new Set(store.products.map(p => p.category)));

  // Calculate store stats
  const totalProducts = store.products.length;
  const inStockProducts = store.products.filter(p => p.stock > 0).length;
  const inStockList = store.products.filter(p => p.stock > 0);
  const avgPrice = inStockList.length > 0 
    ? inStockList.reduce((sum, p) => sum + Number(p.price || 0), 0) / inStockList.length 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>
            {businessInfo.language === 'id' ? 'Kembali ke Marketplace' : 'Back to Marketplace'}
          </span>
        </button>
      </div>

      {/* Store Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-xl">
              <Store className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {store.businessInfo.name}
              </h1>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{store.businessInfo.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{store.businessInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {businessInfo.language === 'id' ? 'Terakhir aktif:' : 'Last active:'} {' '}
                    {format(store.lastActive, 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Store Badge */}
          <div className="text-right">
            <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full mb-2">
              {businessInfo.language === 'id' ? 'Toko Aktif' : 'Active Store'}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              {store.walletAddress.slice(0, 8)}...{store.walletAddress.slice(-6)}
            </p>
          </div>
        </div>
      </div>

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {businessInfo.language === 'id' ? 'Total Produk' : 'Total Products'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {businessInfo.language === 'id' ? 'Tersedia' : 'In Stock'}
              </p>
              <p className="text-2xl font-bold text-green-600">{inStockProducts}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {businessInfo.language === 'id' ? 'Harga Rata-rata' : 'Average Price'}
              </p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(avgPrice, store.businessInfo.currency)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {businessInfo.language === 'id' ? 'Transaksi' : 'Transactions'}
              </p>
              <p className="text-2xl font-bold text-orange-600">{store.transactions.length}</p>
            </div>
            <Star className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder={businessInfo.language === 'id' ? 'Cari produk...' : 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">
                {businessInfo.language === 'id' ? 'Semua Kategori' : 'All Categories'}
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {businessInfo.language === 'id' ? 'Produk Tersedia' : 'Available Products'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredProducts.length} {businessInfo.language === 'id' ? 'produk ditemukan' : 'products found'}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all'
                ? (businessInfo.language === 'id' ? 'Produk tidak ditemukan' : 'No products found')
                : (businessInfo.language === 'id' ? 'Belum ada produk tersedia' : 'No products available')
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? (businessInfo.language === 'id' ? 'Coba ubah filter pencarian' : 'Try changing your search filters')
                : (businessInfo.language === 'id' ? 'Toko ini belum menambahkan produk' : 'This store hasn\'t added any products yet')
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {businessInfo.language === 'en' && product.nameEn 
                      ? product.nameEn 
                      : product.name}
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-primary-600 font-semibold">
                      {formatCurrency(product.price, store.businessInfo.currency)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {businessInfo.language === 'id' ? 'Stok:' : 'Stock:'} {product.stock}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  
                  {/* Contact Store Button */}
                  <button
                    onClick={() => {
                      // Open WhatsApp or phone contact
                      const message = encodeURIComponent(
                        `Hi! I'm interested in ${product.name} from your store ${store.businessInfo.name}`
                      );
                      const whatsappUrl = `https://wa.me/${store.businessInfo.phone.replace(/[^0-9]/g, '')}?text=${message}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full bg-green-500 text-white rounded-lg py-2 px-3 text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>
                      {businessInfo.language === 'id' ? 'Hubungi Toko' : 'Contact Store'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Contact Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          {businessInfo.language === 'id' ? 'Hubungi Toko' : 'Contact Store'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">
              {businessInfo.language === 'id' ? 'Informasi Kontak' : 'Contact Information'}
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <p><strong>{businessInfo.language === 'id' ? 'Telepon:' : 'Phone:'}</strong> {store.businessInfo.phone}</p>
              <p><strong>{businessInfo.language === 'id' ? 'Alamat:' : 'Address:'}</strong> {store.businessInfo.address}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">
              {businessInfo.language === 'id' ? 'Cara Pemesanan' : 'How to Order'}
            </p>
            <p className="text-sm text-blue-700">
              {businessInfo.language === 'id' 
                ? 'Klik tombol "Hubungi Toko" pada produk yang Anda inginkan untuk menghubungi penjual melalui WhatsApp'
                : 'Click "Contact Store" button on any product to reach the seller via WhatsApp'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};