import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Wallet, QrCode, Copy, Check } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';
import { Transaction, CartItem } from '../../types';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (transaction: Omit<Transaction, 'id'>, originalCart: CartItem[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentComplete 
}) => {
  const { 
    cart, 
    getCartTotal, 
    clearCart, 
    businessInfo, 
    addTransaction,
    wallet,
    products,
    updateProduct
  } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cryptoCurrency, setCryptoCurrency] = useState<'MIDEN'>('MIDEN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Credit card states
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [cardType, setCardType] = useState<string>('');

  const total = getCartTotal();
  const change = selectedMethod === 'cash' ? Math.max(0, (parseFloat(cashReceived) || 0) - total) : 0;

  // Use connected wallet address as the recipient address
  const recipientAddress = wallet.isConnected && wallet.address ? wallet.address : businessInfo.cryptoWalletAddress;

  // Credit card validation and detection functions
  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    return '';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/\d{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateCardForm = () => {
    if (selectedMethod !== 'card') return true;
    
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    const cleanedExpiry = expiryDate.replace(/\D/g, '');
    const cleanedCvv = cvv.replace(/\D/g, '');
    
    return (
      cleanedCardNumber.length >= 13 &&
      cardHolderName.trim().length > 0 &&
      cleanedExpiry.length === 4 &&
      cleanedCvv.length >= 3
    );
  };

  const canProceed = selectedMethod === 'cash' 
    ? (parseFloat(cashReceived) || 0) >= total
    : selectedMethod === 'card'
    ? validateCardForm()
    : selectedMethod === 'crypto'
    ? recipientAddress
    : true;

  // Generate QR code and calculate crypto amount when crypto payment is selected
  useEffect(() => {
    if (selectedMethod === 'crypto' && recipientAddress) {
      // Calculate crypto amount based on fixed rates (for demo)
      const midenRate = 0.25; // 1 MIDEN = $0.25
      
      // Pastikan total adalah angka yang valid
      const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
      const totalUSD = businessInfo.currency === 'IDR' ? validTotal / 15000 : validTotal;
      const amount = totalUSD / midenRate;
      setCryptoAmount(amount);
      setPaymentAddress(recipientAddress);

      // Generate payment URI for QR code
      const paymentUri = `miden://${recipientAddress}?amount=${amount}&asset=miden&note=Payment for ${businessInfo.name} - Order #${Date.now()}`;
      
      // Generate QR code
      QRCode.toDataURL(paymentUri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeDataUrl(url);
      }).catch(err => {
        console.error('Failed to generate QR code:', err);
        // Fallback to simple address QR code
        QRCode.toDataURL(recipientAddress!, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(url => {
          setQrCodeDataUrl(url);
        });
      });
    }
  }, [selectedMethod, cryptoCurrency, total, recipientAddress, businessInfo.currency, businessInfo.name]);

  // Update card type when card number changes
  useEffect(() => {
    if (cardNumber) {
      setCardType(detectCardType(cardNumber));
    } else {
      setCardType('');
    }
  }, [cardNumber]);

  // Move the conditional return after all hooks
  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!canProceed) return;

    setIsProcessing(true);
    
    try {
      // Pre-flight stock check to avoid backend 400
      for (const item of cart) {
        const product = products.find(p => p.id === item.product.id);
        if (!product) {
          toast.error(`Produk tidak ditemukan: ${item.product.name}`);
          setIsProcessing(false);
          return;
        }
        if (product.stock < item.quantity) {
          toast.error(`Stok tidak cukup untuk ${product.name}. Stok: ${product.stock}, diminta: ${item.quantity}`);
          setIsProcessing(false);
          return;
        }
      }

      let paymentStatus: 'completed' | 'pending' | 'failed' = 'completed';

      // Handle different payment methods
      if (selectedMethod === 'crypto') {
        // For crypto payments, since user clicked "Confirm Payment", we mark as completed
        // In production, this would integrate with blockchain payment verification
        paymentStatus = 'completed';
        
        toast.success(
          businessInfo.language === 'id' 
            ? 'Pembayaran crypto berhasil dikonfirmasi!'
            : 'Crypto payment successfully confirmed!'
        );
      } else if (selectedMethod === 'card') {
        // Validate card form
        if (!validateCardForm()) {
          toast.error(
            businessInfo.language === 'id' 
              ? 'Mohon lengkapi data kartu kredit'
              : 'Please complete credit card information'
          );
          setIsProcessing(false);
          return;
        }
        
        // Simulate card payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        const success = Math.random() > 0.05; // 95% success rate for demo
        paymentStatus = success ? 'completed' : 'failed';
        
        if (!success) {
          toast.error(
            businessInfo.language === 'id' 
              ? 'Pembayaran kartu gagal'
              : 'Card payment failed'
          );
        } else {
          toast.success(
            businessInfo.language === 'id' 
              ? 'Pembayaran kartu berhasil!'
              : 'Card payment successful!'
          );
        }
      } else {
        // Cash payment
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Calculate crypto amount if not already set
      let finalCryptoAmount = cryptoAmount;
      if (selectedMethod === 'crypto' && (!finalCryptoAmount || finalCryptoAmount === 0)) {
        const midenRate = 0.25; // 1 MIDEN = $0.25
        
        const totalUSD = businessInfo.currency === 'IDR' ? total / 15000 : total;
        finalCryptoAmount = totalUSD / midenRate;
        console.log('Calculated crypto amount:', { totalUSD, finalCryptoAmount, cryptoCurrency });
      }

      // Create transaction
      const transactionData: Omit<Transaction, 'id'> = {
        timestamp: new Date(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.unitPrice ?? item.product.price,
          subtotal: item.subtotal,
        })),
        total,
        paymentMethod: selectedMethod.toLowerCase() as 'cash' | 'card' | 'crypto',
        paymentStatus: paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed',
        customer: customerPhone ? { 
          phone: customerPhone,
          preferredNotification: 'whatsapp' as const
        } : undefined,
        receiptSent: false,
        change: selectedMethod === 'cash' ? change : undefined,
        cryptoCurrency: selectedMethod === 'crypto' ? cryptoCurrency : undefined,
        cryptoAmount: selectedMethod === 'crypto' ? finalCryptoAmount : undefined,
        cardInfo: selectedMethod === 'card' ? {
          cardType,
          lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
          cardHolderName,
          expiryDate,
        } : undefined,
      };

      console.log('Transaction data being sent to backend:', transactionData);
      console.log('Crypto payment details:', {
        selectedMethod,
        cryptoCurrency,
        cryptoAmount,
        finalCryptoAmount,
        paymentStatus
      });

      // Do not update stock on frontend; backend will verify and decrement stock atomically during transaction creation.

      // Add transaction to store
      await addTransaction(transactionData);
      
      // Clear cart
      await clearCart();
      
      // Call completion handler
      onPaymentComplete(transactionData, cart);
      
      if (paymentStatus === 'completed') {
        toast.success(
          businessInfo.language === 'id' 
            ? 'Transaksi berhasil!'
            : 'Transaction completed!'
        );
      }
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error(
        businessInfo.language === 'id' 
          ? 'Gagal memproses pembayaran'
          : 'Failed to process payment'
      );
    } finally {
      setIsProcessing(false);
      onClose();
      setCashReceived('');
      setCustomerPhone('');
      setQrCodeDataUrl('');
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('processPayment')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total Amount */}
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">{t('total')}</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(total, businessInfo.currency)}
            </p>
          </div>

          {/* Customer Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {businessInfo.language === 'id' 
                ? 'Nomor HP Pelanggan (Opsional)'
                : 'Customer Phone (Optional)'
              }
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+628123456789"
            />
            <p className="mt-1 text-xs text-gray-500">
              {businessInfo.language === 'id' 
                ? 'Untuk mengirim struk otomatis'
                : 'For automatic receipt sending'
              }
            </p>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {t('paymentMethod')}
            </p>
            <div className="space-y-3">
              {/* Cash */}
              <button
                onClick={() => setSelectedMethod('cash')}
                className={`w-full flex items-center p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === 'cash'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6 mr-3 text-green-600" />
                <span className="font-medium">{t('cash')}</span>
              </button>

              {/* Card */}
              <button
                onClick={() => setSelectedMethod('card')}
                className={`w-full flex items-center p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === 'card'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
                <span className="font-medium">{t('card')}</span>
              </button>

              {/* Crypto */}
              <button
                onClick={() => setSelectedMethod('crypto')}
                disabled={!recipientAddress}
                className={`w-full flex items-center p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === 'crypto'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!recipientAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Wallet className="w-6 h-6 mr-3 text-orange-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{t('crypto')}</div>
                  <div className="text-xs text-gray-500">
                    {recipientAddress
                      ? wallet.isConnected 
                        ? `${businessInfo.language === 'id' ? 'Dompet terhubung sebagai penerima' : 'Connected wallet as recipient'}`
                        : `${businessInfo.language === 'id' ? 'Alamat penerima tersedia' : 'Receiving address available'}`
                      : `${businessInfo.language === 'id' ? 'Perlu alamat penerima' : 'Receiving address required'}`
                    }
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {selectedMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cashReceived')}
              </label>
              <input
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              />
              {change > 0 && (
                <p className="mt-2 text-sm text-green-600">
                  {t('change')}: <span className="font-semibold">
                    {formatCurrency(change, businessInfo.currency)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Credit Card Input */}
          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {businessInfo.language === 'id' ? 'Informasi Kartu Kredit' : 'Credit Card Information'}
                  </span>
                </div>
                
                {/* Card Number */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {businessInfo.language === 'id' ? 'Nomor Kartu' : 'Card Number'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value);
                        setCardNumber(formatted);
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                    />
                    {cardType && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className={`w-8 h-5 rounded bg-gradient-to-r ${
                          cardType === 'visa' ? 'from-blue-500 to-blue-600' :
                          cardType === 'mastercard' ? 'from-red-500 to-orange-500' :
                          cardType === 'amex' ? 'from-green-500 to-blue-500' :
                          'from-gray-500 to-gray-600'
                        } flex items-center justify-center text-white text-xs font-bold`}>
                          {cardType === 'visa' ? 'VISA' :
                           cardType === 'mastercard' ? 'MC' :
                           cardType === 'amex' ? 'AMEX' :
                           cardType === 'discover' ? 'DISC' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Holder Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {businessInfo.language === 'id' ? 'Nama Pemegang Kartu' : 'Card Holder Name'}
                  </label>
                  <input
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {businessInfo.language === 'id' ? 'Tanggal Kadaluarsa' : 'Expiry Date'}
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        setExpiryDate(formatted);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setCvv(cleaned.slice(0, 4));
                      }}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crypto Payment QR Code */}
          {selectedMethod === 'crypto' && recipientAddress && (
            <div className="space-y-4">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selectCurrency')}
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setCryptoCurrency('MIDEN')}
                    className={`p-3 rounded-lg border-2 transition-colors border-primary-500 bg-primary-50`}
                  >
                    <div className="font-medium">MIDEN</div>
                    <div className="text-xs text-gray-500">Miden Token</div>
                  </button>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    {businessInfo.language === 'id' ? 'Jumlah Pembayaran' : 'Payment Amount'}
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(() => {
                      // Gunakan nilai default langsung tanpa try-catch untuk menghindari error
                      const amount = typeof cryptoAmount === 'number' && !isNaN(cryptoAmount) ? cryptoAmount : 0;
                      return amount.toFixed(6);
                    })()} {cryptoCurrency}
                  </p>
                </div>
              </div>

              {/* Recipient Info */}
                                  {wallet.isConnected && wallet.address === recipientAddress && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      {businessInfo.language === 'id' 
                        ? 'Pembayaran akan diterima di dompet yang terhubung'
                        : 'Payment will be received in connected wallet'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <QrCode className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {businessInfo.language === 'id' ? 'Scan QR Code' : 'Scan QR Code'}
                    </h3>
                  </div>
                  
                  {qrCodeDataUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Payment QR Code" 
                        className="w-48 h-48 border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {businessInfo.language === 'id' 
                        ? 'Scan dengan dompet Miden Anda'
                        : 'Scan with your Miden wallet'
                      }
                    </p>
                    
                    {/* Receiving Address */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {businessInfo.language === 'id' ? 'Alamat Penerima:' : 'Receiving Address:'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-mono text-gray-700 flex-1 break-all">
                          {paymentAddress}
                        </p>
                        <button
                          onClick={() => copyToClipboard(paymentAddress)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  {businessInfo.language === 'id' ? 'Instruksi Pembayaran:' : 'Payment Instructions:'}
                </h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>
                    {businessInfo.language === 'id' 
                      ? 'Buka dompet Miden Anda'
                      : 'Open your Miden wallet'
                    }
                  </li>
                  <li>
                    {businessInfo.language === 'id' 
                      ? 'Scan QR code di atas'
                      : 'Scan the QR code above'
                    }
                  </li>
                  <li>
                    {businessInfo.language === 'id' 
                      ? 'Konfirmasi dan kirim pembayaran'
                      : 'Confirm and send the payment'
                    }
                  </li>
                  <li>
                    {businessInfo.language === 'id' 
                      ? 'Klik "Konfirmasi Pembayaran" setelah transaksi berhasil'
                      : 'Click "Confirm Payment" after transaction is successful'
                    }
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handlePayment}
              disabled={!canProceed || isProcessing || (selectedMethod === 'crypto' && !recipientAddress)}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {businessInfo.language === 'id' ? 'Memproses...' : 'Processing...'}
                  </span>
                </div>
              ) : selectedMethod === 'crypto' ? (
                businessInfo.language === 'id' ? 'Konfirmasi Pembayaran' : 'Confirm Payment'
              ) : selectedMethod === 'card' ? (
                businessInfo.language === 'id' ? 'Proses Kartu Kredit' : 'Process Credit Card'
              ) : (
                t('processPayment')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};