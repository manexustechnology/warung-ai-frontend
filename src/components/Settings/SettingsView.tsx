import React, { useState, useEffect } from 'react';
import { Save, Store, Globe, Wallet, Bell, Copy, Check, AlertCircle } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { useTranslation } from '../../utils/translations';
import { 
  connectMidenWallet, 
  disconnectMidenWallet, 
  getAccountInfo,
  formatMidenAddress,
  isMidenExtensionAvailable 
} from '../../utils/miden';
import { MidenStatus } from '../MidenStatus';
import toast from 'react-hot-toast';

export const SettingsView: React.FC = () => {
  const { businessInfo, updateBusinessInfo, updateBusinessInfoAndPersist, wallet, setWallet, isAuthenticated, currentStore } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [formData, setFormData] = useState(businessInfo);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Auto-fill crypto wallet address when wallet is connected
  useEffect(() => {
    if (wallet.isConnected && wallet.address && !formData.cryptoWalletAddress) {
      setFormData(prev => ({
        ...prev,
        cryptoWalletAddress: wallet.address
      }));
    }
  }, [wallet.isConnected, wallet.address, formData.cryptoWalletAddress]);

  // Update form data when businessInfo changes
  useEffect(() => {
    setFormData(businessInfo);
  }, [businessInfo]);

  // Check authentication and wallet connection after hooks
  if (!wallet.isConnected || !isAuthenticated || !currentStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {businessInfo.language === 'id' 
              ? 'Hubungkan Dompet untuk Mengakses Pengaturan'
              : 'Connect Wallet to Access Settings'
            }
          </h3>
          <p className="text-gray-500">
            {businessInfo.language === 'id' 
              ? 'Hubungkan Miden Wallet untuk mengelola pengaturan toko Anda'
              : 'Connect your Miden Wallet to manage your store settings'
            }
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBusinessInfoAndPersist(formData);
      toast.success(
        businessInfo.language === 'id' 
          ? 'Pengaturan berhasil disimpan ke database!' 
          : 'Settings saved successfully to database!'
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(
        businessInfo.language === 'id' 
          ? 'Gagal menyimpan pengaturan ke database' 
          : 'Failed to save settings to database'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if Miden wallet extension is available
      if (!isMidenExtensionAvailable()) {
        const errorMessage = businessInfo.language === 'id'
          ? 'Miden Wallet tidak ditemukan. Silakan install Miden Wallet terlebih dahulu.'
          : 'Miden Wallet not found. Please install Miden Wallet first.';
        toast.error(errorMessage);
        return;
      }
      
      console.log('Attempting to connect to Miden Wallet...');
      const result = await connectMidenWallet();
      
      if (result.success && result.address) {
        console.log('Getting account info for:', result.address);
        const accountInfo = await getAccountInfo(result.address);
        
        setWallet({
          isConnected: true,
          address: accountInfo.address,
          balance: { miden: accountInfo.midenBalance },
          provider: 'miden',
        });

        // Auto-fill the crypto wallet address
        setFormData(prev => ({
          ...prev,
          cryptoWalletAddress: accountInfo.address
        }));
        
        toast.success(
          businessInfo.language === 'id' 
            ? 'Miden Wallet berhasil terhubung!' 
            : 'Miden Wallet connected successfully!'
        );
        
        console.log('Wallet connected successfully:', accountInfo);
      } else {
        throw new Error(result.error || 'No accounts returned from Miden Wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let userMessage = businessInfo.language === 'id' 
        ? 'Gagal menghubungkan Miden Wallet' 
        : 'Failed to connect Miden Wallet';
        
      if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
        userMessage = businessInfo.language === 'id'
          ? 'Miden Wallet tidak ditemukan. Silakan install Miden Wallet terlebih dahulu.'
          : 'Miden Wallet not found. Please install Miden Wallet first.';
      } else if (errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
        userMessage = businessInfo.language === 'id'
          ? 'Koneksi dibatalkan oleh pengguna'
          : 'Connection cancelled by user';
      }
      
      toast.error(userMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectMidenWallet();
    setWallet({ connected: false });
    // Clear the auto-filled address
    setFormData(prev => ({
      ...prev,
      cryptoWalletAddress: ''
    }));
    toast.success(
      businessInfo.language === 'id' 
        ? 'Miden Wallet berhasil diputuskan' 
        : 'Miden Wallet disconnected successfully'
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast.success(
        businessInfo.language === 'id' 
          ? 'Alamat disalin ke clipboard' 
          : 'Address copied to clipboard'
      );
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('settings')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('settings_description')}
        </p>
      </div>

      {/* Miden Network Status */}
      <div className="mb-8">
        <MidenStatus />
      </div>

      {/* Business Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Store className="h-5 w-5 mr-2 text-blue-600" />
          {t('business_settings')}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('businessName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('businessPhone')} *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('businessAddress')} *
            </label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'IDR' | 'USD' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="IDR">Indonesian Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('language')}
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'id' | 'en' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {businessInfo.language === 'id' 
                ? 'Alamat Dompet untuk Menerima Crypto'
                : 'Crypto Receiving Wallet Address'
              }
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.cryptoWalletAddress || ''}
                onChange={(e) => setFormData({ ...formData, cryptoWalletAddress: e.target.value })}
                                 className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                   wallet.isConnected && wallet.address === formData.cryptoWalletAddress 
                     ? 'bg-green-50 border-green-300' 
                     : ''
                 }`}
                 placeholder="MIDEN_ADDRESS_HERE"
                 readOnly={wallet.isConnected && wallet.address === formData.cryptoWalletAddress}
              />
                             {wallet.isConnected && wallet.address === formData.cryptoWalletAddress && (
                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                   <Check className="h-5 w-5 text-green-600" />
                 </div>
               )}
             </div>
             <p className="mt-1 text-xs text-gray-500">
               {businessInfo.language === 'id' 
                 ? wallet.isConnected 
                   ? 'Alamat dompet otomatis terisi dari dompet yang terhubung'
                   : 'Alamat dompet Miden untuk menerima pembayaran crypto dari pelanggan'
                 : wallet.isConnected
                   ? 'Wallet address automatically filled from connected wallet'
                   : 'Miden wallet address to receive crypto payments from customers'
               }
             </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-500 text-white rounded-lg py-3 px-6 font-medium hover:bg-primary-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? (businessInfo.language === 'id' ? 'Menyimpan...' : 'Saving...') : t('save')}</span>
          </button>
        </form>
      </div>

      {/* Wallet Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <Wallet className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('walletSettings')}
          </h3>
        </div>

                 {wallet.isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    {t('walletConnected')} - Miden Wallet
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-green-600 font-mono">
                        {wallet.address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.address!)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        {copiedAddress ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 text-sm text-green-700">
                      <div>
                        <span className="font-medium">MIDEN:</span> {typeof wallet.balance?.miden === 'number' ? wallet.balance.miden.toFixed(6) : '0.000000'}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  {t('disconnect')}
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    {businessInfo.language === 'id' ? 'Alamat Penerima Otomatis' : 'Auto-filled Receiving Address'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {businessInfo.language === 'id' 
                      ? 'Alamat dompet Anda telah otomatis diisi sebagai alamat penerima untuk pembayaran crypto'
                      : 'Your wallet address has been automatically set as the receiving address for crypto payments'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    {businessInfo.language === 'id' ? 'Miden Wallet Diperlukan' : 'Miden Wallet Required'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {businessInfo.language === 'id' 
                      ? 'Hubungkan Miden Wallet untuk otomatis mengisi alamat penerima pembayaran crypto'
                      : 'Connect Miden Wallet to automatically fill the crypto payment receiving address'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="bg-orange-500 text-white rounded-lg py-3 px-6 font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('connectingToWallet')}</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  <span>
                    {businessInfo.language === 'id' ? 'Hubungkan Miden Wallet' : 'Connect Miden Wallet'}
                  </span>
                </>
              )}
            </button>
            
            <div className="text-xs text-gray-500">
              <p>
                {businessInfo.language === 'id' 
                  ? t.installMidenWallet
                   : t.installMidenWallet
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('notifications')}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {businessInfo.language === 'id' 
                ? 'Nomor WhatsApp untuk Struk'
                : 'WhatsApp Number for Receipts'
              }
            </label>
            <input
              type="tel"
              value={formData.whatsappNumber || ''}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+628123456789"
            />
            <p className="mt-1 text-xs text-gray-500">
              {businessInfo.language === 'id' 
                ? 'Nomor WhatsApp untuk mengirim struk otomatis ke pelanggan'
                : 'WhatsApp number to send automatic receipts to customers'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {businessInfo.language === 'id' 
                ? 'Token Bot Telegram'
                : 'Telegram Bot Token'
              }
            </label>
            <input
              type="password"
              value={formData.telegramBotToken || ''}
              onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Bot token from BotFather"
            />
            <p className="mt-1 text-xs text-gray-500">
              {businessInfo.language === 'id' 
                ? 'Token bot Telegram untuk mengirim struk via Telegram'
                : 'Telegram bot token to send receipts via Telegram'
              }
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {businessInfo.language === 'id' 
              ? 'Informasi Sistem'
              : 'System Information'
            }
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">WarungPay Web3 POS</h4>
            <p className="text-sm text-gray-600">
              {businessInfo.language === 'id' ? 'Versi' : 'Version'} 1.0.0
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {businessInfo.language === 'id' 
                ? 'Sistem kasir digital untuk UMKM Indonesia'
                : 'Digital POS system for Indonesian SMEs'
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Blockchain</h4>
            <p className="text-sm text-gray-600">Miden Mainnet</p>
            <p className="text-xs text-gray-500 mt-1">
              {businessInfo.language === 'id' 
                ? 'Pembayaran crypto menggunakan jaringan Miden'
                : 'Crypto payments using Miden network'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};