import React, { useState, useEffect } from 'react';
import { Store, TrendingUp, Users, DollarSign, Search, Filter, Eye, ShoppingCart, Zap, Globe, Star, Activity, Wallet, ArrowUpRight, Shield } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StoreData } from '../../types';
import { StoreDetailsView } from './StoreDetailsView';

export const MarketplaceView: React.FC = () => {
  const { 
    allStores,
    marketplaceStats,
    updateMarketplaceStats,
    businessInfo,
    currentStore,
    switchStore,
    setCurrentView 
  } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'transactions' | 'defi'>('earnings');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);

  // Update marketplace stats when component mounts
  useEffect(() => {
    updateMarketplaceStats();
  }, [updateMarketplaceStats]);

  // If a store is selected, show store details
  if (selectedStore) {
    return (
      <StoreDetailsView 
        store={selectedStore}
        onBack={() => setSelectedStore(null)}
      />
    );
  }

  // Filter and sort stores
  const filteredStores = allStores
    .filter(store => {
      const matchesSearch = store.businessInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' ||
                              (filterCategory === 'active' && store.lastActive > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                             (filterCategory === 'defi' && store.totalDefiValue > 0);
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.businessInfo.name.localeCompare(b.businessInfo.name);
        case 'earnings':
          return b.totalEarnings - a.totalEarnings;
        case 'transactions':
          return b.transactions.length - a.transactions.length;
        case 'defi':
          return b.totalDefiValue - a.totalDefiValue;
        default:
          return 0;
      }
    });

  const handleVisitStore = (store: StoreData) => {
    setSelectedStore(store);
  };

  const handleManageStore = (store: StoreData) => {
    if (store.storeId !== currentStore?.storeId) {
      switchStore(store.storeId);
    }
    setCurrentView('pos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                <Globe className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                WarungPay - DeFi
              </span>{' '}
              Marketplace
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {businessInfo.language === 'id' 
                ? 'Ekosistem perdagangan terdesentralisasi yang menghubungkan merchant dengan teknologi DeFi terdepan'
                : 'Decentralized trading ecosystem connecting merchants with cutting-edge DeFi technology'
              }
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span className="text-white font-medium">Secure</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">Fast</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">Profitable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-20 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {businessInfo.language === 'id' ? 'Total Toko' : 'Total Stores'}
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-1">{marketplaceStats.totalStores}</p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+12% this month</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {businessInfo.language === 'id' ? 'Toko Aktif' : 'Active Stores'}
                </p>
                <p className="text-4xl font-bold text-green-600 mt-1">{marketplaceStats.activeStores}</p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+8% this week</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {businessInfo.language === 'id' ? 'Total Volume' : 'Total Volume'}
                </p>
                <p className="text-4xl font-bold text-purple-600 mt-1">
                  {formatCurrency(marketplaceStats.totalVolume || 0, businessInfo.currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+24% this month</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {businessInfo.language === 'id' ? 'Total DeFi' : 'Total DeFi'}
                </p>
                <p className="text-4xl font-bold text-orange-600 mt-1">
                  {formatCurrency(marketplaceStats.totalDefiValue || 0, businessInfo.currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+18% this month</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={businessInfo.language === 'id' ? 'Cari toko atau alamat wallet...' : 'Search stores or wallet address...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="earnings">
                  {businessInfo.language === 'id' ? '📈 Urutkan: Pendapatan' : '📈 Sort: Earnings'}
                </option>
                <option value="name">
                  {businessInfo.language === 'id' ? '🔤 Urutkan: Nama' : '🔤 Sort: Name'}
                </option>
                <option value="transactions">
                  {businessInfo.language === 'id' ? '💳 Urutkan: Transaksi' : '💳 Sort: Transactions'}
                </option>
                <option value="defi">
                  {businessInfo.language === 'id' ? '⚡ Urutkan: DeFi' : '⚡ Sort: DeFi'}
                </option>
              </select>
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <option value="all">
                  {businessInfo.language === 'id' ? '🌐 Semua Toko' : '🌐 All Stores'}
                </option>
                <option value="active">
                  {businessInfo.language === 'id' ? '🟢 Toko Aktif' : '🟢 Active Stores'}
                </option>
                <option value="defi">
                  {businessInfo.language === 'id' ? '⚡ Dengan DeFi' : '⚡ With DeFi'}
                </option>
              </select>
            </div>
          </div>
        </div>

                {/* Enhanced Stores Grid */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {filteredStores.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Store className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm 
                  ? (businessInfo.language === 'id' ? 'Toko tidak ditemukan' : 'No stores found')
                  : (businessInfo.language === 'id' ? 'Belum ada toko' : 'No stores yet')
                }
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                {searchTerm 
                  ? (businessInfo.language === 'id' ? 'Coba gunakan kata kunci yang berbeda atau jelajahi kategori lain' : 'Try different search terms or explore other categories')
                  : (businessInfo.language === 'id' ? 'Toko akan muncul di sini setelah merchant menghubungkan wallet mereka' : 'Stores will appear here as merchants connect their wallets')
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
              {filteredStores.map((store) => (
                <div
                  key={store.storeId}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/90 relative overflow-hidden"
                >
                  {/* Background Gradient Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Store Header */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Store className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {store.businessInfo.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Wallet className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg">
                              {store.walletAddress.slice(0, 6)}...{store.walletAddress.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {store.storeId === currentStore?.storeId && (
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{businessInfo.language === 'id' ? 'Toko Saya' : 'My Store'}</span>
                        </div>
                      )}
                    </div>

                    {/* Store Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                              {businessInfo.language === 'id' ? 'Pendapatan' : 'Earnings'}
                            </p>
                            <p className="text-lg font-bold text-green-700 mt-1">
                              {formatCurrency(store.totalEarnings, store.businessInfo.currency)}
                            </p>
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                              {businessInfo.language === 'id' ? 'Transaksi' : 'Transactions'}
                            </p>
                            <p className="text-lg font-bold text-blue-700 mt-1">
                              {store.transactions.length}
                            </p>
                          </div>
                          <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                              DeFi Value
                            </p>
                            <p className="text-lg font-bold text-orange-700 mt-1">
                              {formatCurrency(store.totalDefiValue, store.businessInfo.currency)}
                            </p>
                          </div>
                          <Zap className="h-5 w-5 text-orange-500" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                              {businessInfo.language === 'id' ? 'Produk' : 'Products'}
                            </p>
                            <p className="text-lg font-bold text-purple-700 mt-1">
                              {store.products.length}
                            </p>
                          </div>
                          <ShoppingCart className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </div>

                    {/* Store Status */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          store.lastActive > new Date(Date.now() - 24 * 60 * 60 * 1000) 
                            ? 'bg-green-500 animate-pulse' 
                            : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                          {businessInfo.language === 'id' ? 'Terakhir aktif:' : 'Last active:'} {' '}
                          <span className="font-medium">
                            {format(store.lastActive, 'dd MMM yyyy', { locale: id })}
                          </span>
                        </span>
                      </div>
                      
                      {store.totalDefiValue > 0 && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>DeFi Enabled</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVisitStore(store)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-3 px-4 font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                      >
                        <Eye className="h-5 w-5" />
                        <span>
                          {businessInfo.language === 'id' ? 'Kunjungi Toko' : 'Visit Store'}
                        </span>
                      </button>
                      
                      {store.storeId === currentStore?.storeId && (
                        <button
                          onClick={() => handleManageStore(store)}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl py-3 px-4 font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl group-hover:scale-105"
                        >
                          <ShoppingCart className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              {businessInfo.language === 'id' ? 'Bergabung dengan Revolusi DeFi' : 'Join the DeFi Revolution'}
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {businessInfo.language === 'id' 
                ? 'Mulai perjalanan Anda dalam ekosistem perdagangan terdesentralisasi yang aman dan menguntungkan'
                : 'Start your journey in a secure and profitable decentralized trading ecosystem'
              }
            </p>
            <div className="flex justify-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="font-medium">Blockchain Secured</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-medium">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Global Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

