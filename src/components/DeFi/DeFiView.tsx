import React, { useState, useEffect } from 'react';
import { TrendingUp, PieChart, Plus, Minus, Gift, ArrowUpRight, Zap, Shield, Activity, Wallet, Star, Lock, Target, BarChart3 } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';

import { midenFinanceService, MidenFinancePool, MidenFinancePosition } from '../../utils/midenFinance';
import { getMidenWallet } from '../../utils/miden';
import toast from 'react-hot-toast';

export const DeFiView: React.FC = () => {
  const { 
    wallet,
    businessInfo,
    defiPositions,
    addDefiPosition,
    updateDefiPosition,
    removeDefiPosition,
    loadDefiPositions,
    currentStore,
    isAuthenticated
  } = useApiStore();

  // Ensure defiPositions is always an array
  const safeDefiPositions = Array.isArray(defiPositions) ? defiPositions : [];
  const [pools, setPools] = useState<MidenFinancePool[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<{ [key: string]: string }>({});
  const [withdrawAmount, setWithdrawAmount] = useState<{ [key: string]: string }>({});
  
  // Load DeFi positions when component mounts or store changes
  useEffect(() => {
    if (currentStore?.walletAddress) {
      loadDefiPositions(currentStore.walletAddress);
    }
  }, [currentStore, loadDefiPositions]);

  // Load pools and user positions
  useEffect(() => {
    const loadDeFiData = async () => {
      try {
        setLoading(true);
        const availablePools = await midenFinanceService.getPools();
        
        if (wallet.isConnected && wallet.address) {
          const userPositions = await midenFinanceService.getUserPositions(wallet.address);
          
          // Update pools with user positions
          const poolsWithPositions = availablePools.map(pool => {
            const userPosition = userPositions.find(pos => pos.poolId === pool.id);
            return {
              ...pool,
              userDeposited: userPosition?.amount || 0,
            };
          });
          
          setPools(poolsWithPositions);
        } else {
          setPools(availablePools);
        }
      } catch (error) {
        console.error('Failed to load DeFi data:', error);
        toast.error(
          businessInfo.language === 'id'
            ? 'Gagal memuat data DeFi'
            : 'Failed to load DeFi data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDeFiData();
  }, [wallet.isConnected, wallet.address, businessInfo.language]);

  const handleDeposit = async (pool: MidenFinancePool) => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Silakan hubungkan dompet terlebih dahulu'
          : 'Please connect your wallet first'
      );
      return;
    }

    const amount = parseFloat(depositAmount[pool.id] || '0');
    if (amount <= 0) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Masukkan jumlah yang valid'
          : 'Please enter a valid amount'
      );
      return;
    }

    // Check balance
    const availableBalance = pool.asset === 'MIDEN' ? (typeof wallet.balance?.miden === 'number' ? wallet.balance.miden : 0) : 0;
    if (!availableBalance || amount > availableBalance) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Saldo tidak mencukupi'
          : 'Insufficient balance'
      );
      return;
    }

    setActionLoading(`deposit-${pool.id}`);
    try {
      const midenWallet = getMidenWallet();
      if (!midenWallet) {
        throw new Error('Miden Wallet not available');
      }

      const txHash = await midenFinanceService.depositToPool(
        wallet.address,
        pool.id,
        amount,
        async (txn) => {
          const signedTxn = await midenWallet.signTransaction(txn);
          return signedTxn;
        }
      );

      // Add or update position
                  const existingPosition = safeDefiPositions.find(pos => pos.poolId === pool.id);
      const newAmount = (existingPosition?.amount || 0) + amount;
      const newValue = newAmount * (pool.asset === 'MIDEN' ? 0.25 : 1.0); // Mock prices

      if (existingPosition) {
        updateDefiPosition(pool.id, {
          amount: newAmount,
          value: newValue,
          timestamp: new Date(),
        });
      } else {
        addDefiPosition({
          poolId: pool.id,
          amount: newAmount,
          value: newValue,
          rewards: 0,
          timestamp: new Date(),
          txHash,
        });
      }

      // Update pool data
      setPools(prev => prev.map(p =>
        p.id === pool.id
          ? { ...p, userDeposited: newAmount, totalDeposited: p.totalDeposited + amount }
          : p
      ));

      setDepositAmount(prev => ({ ...prev, [pool.id]: '' }));
      
      toast.success(
        businessInfo.language === 'id'
          ? `Berhasil deposit ${amount} ${pool.asset} ke ${pool.name}`
          : `Successfully deposited ${amount} ${pool.asset} to ${pool.name}`
      );
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error(
        businessInfo.language === 'id'
          ? 'Gagal melakukan deposit'
          : 'Failed to deposit'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (pool: MidenFinancePool) => {
    if (!wallet.isConnected || !wallet.address) return;

    const amount = parseFloat(withdrawAmount[pool.id] || '0');
    if (amount <= 0 || amount > pool.userDeposited) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Jumlah withdraw tidak valid'
          : 'Invalid withdrawal amount'
      );
      return;
    }

    setActionLoading(`withdraw-${pool.id}`);
    try {
      const midenWallet = getMidenWallet();
      if (!midenWallet) {
        throw new Error('Miden Wallet not available');
      }

      // txHash is stored for future reference but not used immediately
      const txHash = await midenFinanceService.withdrawFromPool(
        wallet.address,
        pool.id,
        amount,
        async (txn) => {
          const signedTxn = await midenWallet.signTransaction(txn);
          return signedTxn;
        }
      );

      // Update position
      const newAmount = pool.userDeposited - amount;
      const newValue = newAmount * (pool.asset === 'MIDEN' ? 0.25 : 1.0); // Mock prices

      if (newAmount > 0) {
        updateDefiPosition(pool.id, {
          amount: newAmount,
          value: newValue,
          timestamp: new Date(),
        });
      } else {
        removeDefiPosition(pool.id);
      }

      // Update pool data
      setPools(prev => prev.map(p =>
        p.id === pool.id
          ? { ...p, userDeposited: newAmount, totalDeposited: p.totalDeposited - amount }
          : p
      ));

      setWithdrawAmount(prev => ({ ...prev, [pool.id]: '' }));
      
      toast.success(
        businessInfo.language === 'id'
          ? `Berhasil withdraw ${amount} ${pool.asset} dari ${pool.name}`
          : `Successfully withdrew ${amount} ${pool.asset} from ${pool.name}`
      );
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error(
        businessInfo.language === 'id'
          ? 'Gagal melakukan withdraw'
          : 'Failed to withdraw'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimRewards = async (pool: MidenFinancePool) => {
    if (!wallet.isConnected || !wallet.address) return;

    const position = safeDefiPositions.find(pos => pos.poolId === pool.id);
    if (!position || position.rewards <= 0) {
      toast.error(
        businessInfo.language === 'id'
          ? 'Tidak ada reward untuk diklaim'
          : 'No rewards to claim'
      );
      return;
    }

    setActionLoading(`claim-${pool.id}`);
    try {
      const midenWallet = getMidenWallet();
      if (!midenWallet) {
        throw new Error('Miden Wallet not available');
      }

      // txHash is stored for future reference but not used immediately
      const txHash = await midenFinanceService.claimRewards(
        wallet.address,
        pool.id,
        async (txn) => {
          const signedTxnArray = await midenWallet.signTransaction([txn] as any);
          return signedTxnArray[0];
        }
      );

      // Reset rewards
      updateDefiPosition(pool.id, {
        rewards: 0,
        timestamp: new Date(),
      });
      
      toast.success(
        businessInfo.language === 'id'
          ? `Berhasil klaim reward ${position.rewards.toFixed(6)} ${pool.asset}`
          : `Successfully claimed ${position.rewards.toFixed(6)} ${pool.asset} rewards`
      );
    } catch (error) {
      console.error('Claim rewards failed:', error);
      toast.error(
        businessInfo.language === 'id'
          ? 'Gagal klaim reward'
          : 'Failed to claim rewards'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const totalDefiValue = safeDefiPositions.reduce((sum, pos) => sum + (pos.value || 0), 0);
  const totalRewards = safeDefiPositions.reduce((sum, pos) => sum + (pos.rewards || 0), 0);

  // Check authentication and wallet connection after all hooks and logic
  if (!wallet.isConnected || !isAuthenticated || !currentStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section for Non-Connected Users */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
                  <Zap className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  DeFi
                </span>{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Powered
                </span>
              </h1>
              <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
                {businessInfo.language === 'id' 
                          ? 'Maksimalkan potensi aset digital Anda dengan protokol DeFi terdepan dari Miden Network'
        : 'Maximize your digital asset potential with cutting-edge DeFi protocols from Miden Network'
                }
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-white/20">
                <Wallet className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  {businessInfo.language === 'id'
                    ? 'Hubungkan Dompet untuk Memulai'
                    : 'Connect Wallet to Get Started'
                  }
                </h3>
                <p className="text-gray-300">
                  {businessInfo.language === 'id'
                    ? 'Hubungkan Miden Wallet untuk mengakses fitur DeFi lengkap'
                    : 'Connect your Miden Wallet to access full DeFi features'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* DeFi Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <PieChart className="h-8 w-8 text-white" />
              </div>
              <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {businessInfo.language === 'id' ? 'Total Nilai DeFi' : 'Total DeFi Value'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(totalDefiValue, businessInfo.currency)}
              </p>
              <p className="text-sm text-gray-500">
                {businessInfo.language === 'id' ? 'Semua posisi aktif' : 'All active positions'}
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>Claimable</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {businessInfo.language === 'id' ? 'Total Reward' : 'Total Rewards'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {totalRewards.toFixed(6)} MIDEN
              </p>
              <p className="text-sm text-gray-500">
                {businessInfo.language === 'id' ? 'Siap diklaim' : 'Ready to claim'}
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                Active
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {businessInfo.language === 'id' ? 'Posisi Aktif' : 'Active Positions'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {defiPositions.length}
              </p>
              <p className="text-sm text-gray-500">
                {businessInfo.language === 'id' ? 'Pool tersedia' : 'Available pools'}
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                APY
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {businessInfo.language === 'id' ? 'Rata-rata APY' : 'Average APY'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length).toFixed(1) : '0.0'}%
              </p>
              <p className="text-sm text-gray-500">
                {businessInfo.language === 'id' ? 'Yield tahunan' : 'Annual yield'}
              </p>
            </div>
          </div>
        </div>

        {/* Available Pools Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {businessInfo.language === 'id' ? 'Pool Lending Tersedia' : 'Available Lending Pools'}
                </h3>
                <p className="text-indigo-100">
                  {businessInfo.language === 'id' 
                    ? 'Pilih pool terbaik untuk memaksimalkan yield Anda'
                    : 'Choose the best pools to maximize your yield'
                  }
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {businessInfo.language === 'id' ? 'Memuat Data DeFi...' : 'Loading DeFi Data...'}
              </h3>
              <p className="text-gray-600 text-lg">
                {businessInfo.language === 'id' 
                          ? 'Mengambil informasi pool terbaru dari Miden Network'
        : 'Fetching latest pool information from Miden Network'
                }
              </p>
            </div>
          ) : pools.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {businessInfo.language === 'id' ? 'Tidak ada pool tersedia' : 'No pools available'}
              </h3>
              <p className="text-gray-600 text-lg">
                {businessInfo.language === 'id'
                  ? 'Pool DeFi akan muncul di sini setelah tersedia'
                  : 'DeFi pools will appear here when available'
                }
              </p>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {pools.map((pool) => {
                const userPosition = safeDefiPositions.find(pos => pos.poolId === pool.id);
                                 const availableBalance = pool.asset === 'MIDEN' ? (typeof wallet.balance?.miden === 'number' ? wallet.balance.miden : 0) : 0; // Fixed: using miden balance only
                const hasPosition = pool.userDeposited > 0;
                
                return (
                  <div
                    key={pool.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/90 relative overflow-hidden"
                  >
                    {/* Background Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Pool Header */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                            <div className="text-2xl font-bold text-white">
                              {pool.asset}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mb-2">
                              {pool.name}
                            </h4>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                <TrendingUp className="h-4 w-4" />
                                <span>{pool.apy.toFixed(1)}% APY</span>
                              </div>
                              {hasPosition && (
                                <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  <Lock className="h-4 w-4" />
                                  <span>
                                    {businessInfo.language === 'id' ? 'Posisi Aktif' : 'Active Position'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg">
                            <p className="text-3xl font-bold">{pool.apy.toFixed(1)}%</p>
                            <p className="text-sm text-green-100">Annual Yield</p>
                          </div>
                        </div>
                      </div>

                      {/* Pool Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                              {businessInfo.language === 'id' ? 'Total Deposited' : 'Total Deposited'}
                            </p>
                            <BarChart3 className="h-5 w-5 text-gray-500" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {pool.totalDeposited.toLocaleString()} {pool.asset}
                          </p>
                          <p className="text-sm text-gray-500">
                            {businessInfo.language === 'id' ? 'Likuiditas total' : 'Total liquidity'}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                                                            {businessInfo.language === 'id' ? 'Deposit Anda' : 'Your Deposit'}
                            </p>
                            <Wallet className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-2xl font-bold text-blue-900 mb-1">
                            {pool.userDeposited.toFixed(6)} {pool.asset}
                          </p>
                          <p className="text-sm text-blue-600">
                            ≈ {formatCurrency(pool.userDeposited * (pool.asset === 'MIDEN' ? 0.25 : 1.0), businessInfo.currency)}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">
                              {businessInfo.language === 'id' ? 'Reward Tersedia' : 'Available Rewards'}
                            </p>
                            <Gift className="h-5 w-5 text-green-500" />
                          </div>
                          <p className="text-2xl font-bold text-green-900 mb-1">
                            {userPosition?.rewards.toFixed(6) || '0.000000'} {pool.asset}
                          </p>
                          <p className="text-sm text-green-600">
                            {businessInfo.language === 'id' ? 'Siap diklaim' : 'Ready to claim'}
                          </p>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Deposit Section */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-green-500 p-2 rounded-lg">
                              <Plus className="h-5 w-5 text-white" />
                            </div>
                            <h5 className="text-lg font-bold text-green-900">
                              {businessInfo.language === 'id' ? 'Deposit' : 'Deposit'}
                            </h5>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-green-700 mb-2">
                                {businessInfo.language === 'id' ? 'Jumlah Deposit' : 'Deposit Amount'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={depositAmount[pool.id] || ''}
                                  onChange={(e) => setDepositAmount(prev => ({ ...prev, [pool.id]: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all duration-300 text-lg font-medium"
                                  placeholder={`0.000000 ${pool.asset}`}
                                />
                                <div className="absolute right-3 top-3 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
                                  {pool.asset}
                                </div>
                              </div>
                              <p className="text-sm text-green-600 mt-2 flex items-center space-x-1">
                                <Wallet className="h-4 w-4" />
                                <span>
                                  {businessInfo.language === 'id' ? 'Tersedia:' : 'Available:'} {availableBalance?.toFixed(6)} {pool.asset}
                                </span>
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleDeposit(pool)}
                              disabled={actionLoading === `deposit-${pool.id}` || !depositAmount[pool.id]}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-4 px-6 font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                            >
                              {actionLoading === `deposit-${pool.id}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>
                                    {businessInfo.language === 'id' ? 'Memproses...' : 'Processing...'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-5 w-5" />
                                  <span>
                                    {businessInfo.language === 'id' ? 'Deposit Sekarang' : 'Deposit Now'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Withdraw Section */}
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-red-500 p-2 rounded-lg">
                              <Minus className="h-5 w-5 text-white" />
                            </div>
                            <h5 className="text-lg font-bold text-red-900">
                              {businessInfo.language === 'id' ? 'Withdraw' : 'Withdraw'}
                            </h5>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-red-700 mb-2">
                                {businessInfo.language === 'id' ? 'Jumlah Withdraw' : 'Withdraw Amount'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={withdrawAmount[pool.id] || ''}
                                  onChange={(e) => setWithdrawAmount(prev => ({ ...prev, [pool.id]: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all duration-300 text-lg font-medium disabled:bg-gray-50"
                                  placeholder={`0.000000 ${pool.asset}`}
                                  disabled={pool.userDeposited === 0}
                                />
                                <div className="absolute right-3 top-3 bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold">
                                  {pool.asset}
                                </div>
                              </div>
                              <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                                <Lock className="h-4 w-4" />
                                <span>
                                  {businessInfo.language === 'id' ? 'Deposited:' : 'Deposited:'} {pool.userDeposited.toFixed(6)} {pool.asset}
                                </span>
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleWithdraw(pool)}
                              disabled={actionLoading === `withdraw-${pool.id}` || !withdrawAmount[pool.id] || pool.userDeposited === 0}
                              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl py-4 px-6 font-bold text-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                            >
                              {actionLoading === `withdraw-${pool.id}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>
                                    {businessInfo.language === 'id' ? 'Memproses...' : 'Processing...'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Minus className="h-5 w-5" />
                                  <span>
                                    {businessInfo.language === 'id' ? 'Withdraw Sekarang' : 'Withdraw Now'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Claim Rewards Section */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-500 p-2 rounded-lg">
                              <Gift className="h-5 w-5 text-white" />
                            </div>
                            <h5 className="text-lg font-bold text-blue-900">
                              {businessInfo.language === 'id' ? 'Klaim Reward' : 'Claim Rewards'}
                            </h5>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-xl p-4 border border-blue-200">
                              <p className="text-sm font-semibold text-blue-700 mb-2">
                                {businessInfo.language === 'id' ? 'Reward Tersedia' : 'Available Rewards'}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-blue-900">
                                  {userPosition?.rewards.toFixed(6) || '0.000000'}
                                </span>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">
                                  {pool.asset}
                                </span>
                              </div>
                              <p className="text-sm text-blue-600 mt-2">
                                ≈ {formatCurrency((userPosition?.rewards || 0) * (pool.asset === 'MIDEN' ? 0.25 : 1.0), businessInfo.currency)}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleClaimRewards(pool)}
                              disabled={actionLoading === `claim-${pool.id}` || !userPosition || userPosition.rewards <= 0}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-4 px-6 font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                            >
                              {actionLoading === `claim-${pool.id}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>
                                    {businessInfo.language === 'id' ? 'Mengklaim...' : 'Claiming...'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Gift className="h-5 w-5" />
                                  <span>
                                    {businessInfo.language === 'id' ? 'Klaim Reward' : 'Claim Rewards'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Pool Performance Metrics */}
                      <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                        <h6 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5" />
                          <span>
                            {businessInfo.language === 'id' ? 'Metrik Performa' : 'Performance Metrics'}
                          </span>
                        </h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{pool.apy.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">Current APY</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {((pool.userDeposited / pool.totalDeposited) * 100).toFixed(2)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {businessInfo.language === 'id' ? 'Share Pool' : 'Pool Share'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {pool.userDeposited > 0 ? ((userPosition?.rewards || 0) / pool.userDeposited * 100).toFixed(2) : '0.00'}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {businessInfo.language === 'id' ? 'Yield Earned' : 'Yield Earned'}
                            </p>
                          </div>
                          <div className="text-center">
                                                        <p className="text-2xl font-bold text-orange-600">
                              {pool.totalDeposited > 1000000 ? '🔥' : pool.totalDeposited > 100000 ? '⭐' : '🌱'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {businessInfo.language === 'id' ? 'Status Pool' : 'Pool Status'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DeFi Education Section */}
        

        {/* Risk Disclaimer */}
        <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-400 p-2 rounded-lg flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-yellow-800 mb-2">
                {businessInfo.language === 'id' ? 'Peringatan Risiko' : 'Risk Disclaimer'}
              </h4>
              <p className="text-yellow-700 leading-relaxed">
                {businessInfo.language === 'id'
                  ? 'DeFi melibatkan risiko termasuk smart contract risk, impermanent loss, dan volatilitas pasar. Pastikan Anda memahami risiko sebelum berinvestasi. Jangan investasikan lebih dari yang Anda mampu untuk kehilangan.'
                  : 'DeFi involves risks including smart contract risk, impermanent loss, and market volatility. Make sure you understand the risks before investing. Never invest more than you can afford to lose.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



