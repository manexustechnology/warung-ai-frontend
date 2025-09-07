import React, { useState } from 'react';
import { X, Printer, Send, MessageCircle, ExternalLink } from 'lucide-react';
import { Transaction } from '../../types';
import { useApiStore } from '../../store/apiStore';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from '../../utils/translations';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getMidenExplorerUrl } from '../../utils/miden';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { businessInfo } = useApiStore();
  const t = useTranslation(businessInfo.language);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSendReceipt = async (method: 'whatsapp' | 'telegram') => {
    if (!transaction.customer?.phone) return;

    setIsSending(true);
    try {
      const phone = transaction.customer.phone.replace(/[^0-9]/g, '');
      const dateStr = format(transaction.timestamp, 'dd/MM/yyyy HH:mm', { locale: id });
      const lines: string[] = [];
      lines.push(`Warung: ${businessInfo.name}`);
      lines.push(`Tanggal: ${dateStr}`);
      lines.push(`No: #${transaction.id}`);
      lines.push('');
      lines.push('Items:');
      transaction.items.forEach((item) => {
        const name = item.product ? (businessInfo.language === 'en' && item.product.nameEn ? item.product.nameEn : item.product.name) : item.productId;
        lines.push(`- ${name} x${item.quantity} @ ${formatCurrency(item.price, businessInfo.currency)} = ${formatCurrency(item.subtotal, businessInfo.currency)}`);
      });
      lines.push('');
      lines.push(`Total: ${formatCurrency(transaction.total, businessInfo.currency)}`);
      lines.push(`Pembayaran: ${transaction.paymentMethod.toUpperCase()}`);
      if (transaction.paymentMethod === 'cash' && transaction.change) {
        lines.push(`Kembalian: ${formatCurrency(transaction.change, businessInfo.currency)}`);
      }
      if (transaction.paymentMethod === 'crypto' && transaction.cryptoAmount && transaction.cryptoCurrency) {
        lines.push(`Kripto: ${transaction.cryptoAmount.toFixed(6)} ${transaction.cryptoCurrency}`);
      }
      const text = encodeURIComponent(lines.join('\n'));

      if (method === 'whatsapp') {
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
      } else {
        // Telegram deep link requires a bot or user; simplest is to open tg app with message composer
        window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
      }

      setSent(true);
    } catch (error) {
      console.error('Failed to send receipt:', error);
    } finally {
      setIsSending(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('receipt')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 font-mono text-sm" id="receipt">
          <div className="text-center mb-6">
            <h3 className="font-bold text-lg">{businessInfo.name}</h3>
            <p className="text-gray-600">{businessInfo.address}</p>
            <p className="text-gray-600">{businessInfo.phone}</p>
            <div className="border-t border-gray-300 my-3"></div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between">
              <span>
                {businessInfo.language === 'id' ? 'Tanggal:' : 'Date:'}
              </span>
              <span>{format(transaction.timestamp, 'dd/MM/yyyy HH:mm', { locale: id })}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {businessInfo.language === 'id' ? 'No. Transaksi:' : 'Transaction No:'}
              </span>
              <span>#{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {businessInfo.language === 'id' ? 'Kasir:' : 'Cashier:'}
              </span>
              <span>Admin</span>
            </div>
          </div>

          <div className="border-t border-gray-300 my-3"></div>

          {/* Items */}
          <div className="mb-4">
            {transaction.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span className="flex-1">
                    {/* Use product name if available, otherwise show productId */}
                    {item.product 
                      ? (businessInfo.language === 'en' && item.product.nameEn 
                          ? item.product.nameEn 
                          : item.product.name)
                      : `Product #${item.productId}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{item.quantity} x {formatCurrency(item.price, businessInfo.currency)}</span>
                  <span>{formatCurrency(item.subtotal, businessInfo.currency)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-300 my-3"></div>

          {/* Totals */}
          <div className="mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>{t('total').toUpperCase()}:</span>
              <span>{formatCurrency(transaction.total, businessInfo.currency)}</span>
            </div>
            
            <div className="flex justify-between mt-2">
              <span>
                {businessInfo.language === 'id' ? 'Pembayaran:' : 'Payment:'}
              </span>
              <span className="capitalize">
                {transaction.paymentMethod === 'cash' 
                  ? (businessInfo.language === 'id' ? 'Tunai' : 'Cash')
                  : transaction.paymentMethod === 'card' 
                  ? (businessInfo.language === 'id' ? 'Kartu' : 'Card')
                  : transaction.paymentMethod === 'crypto'
                  ? `${transaction.cryptoCurrency} (${businessInfo.language === 'id' ? 'Kripto' : 'Crypto'})`
                  : transaction.paymentMethod
                }
              </span>
            </div>

            {transaction.change && transaction.change > 0 && (
              <div className="flex justify-between">
                <span>
                  {businessInfo.language === 'id' ? 'Kembalian:' : 'Change:'}
                </span>
                <span>{formatCurrency(transaction.change, businessInfo.currency)}</span>
              </div>
            )}

            {transaction.cryptoAmount !== null && transaction.cryptoAmount !== undefined && transaction.cryptoCurrency && (
              <div className="flex justify-between">
                <span>
                  {businessInfo.language === 'id' ? 'Jumlah Kripto:' : 'Crypto Amount:'}
                </span>
                <span>
                  {(() => {
                    try {
                      const amount = typeof transaction.cryptoAmount === 'number' 
                        ? transaction.cryptoAmount 
                        : Number(transaction.cryptoAmount || 0);
                      return isNaN(amount) ? '0.000000' : amount.toFixed(6);
                    } catch (error) {
                      console.error('Error formatting crypto amount:', error);
                      return '0.000000';
                    }
                  })()} {transaction.cryptoCurrency}
                </span>
              </div>
            )}

            {transaction.cardInfo && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  {businessInfo.language === 'id' ? 'Informasi Kartu:' : 'Card Information:'}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    {businessInfo.language === 'id' ? 'Tipe:' : 'Type:'} {transaction.cardInfo.cardType?.toUpperCase()}
                  </div>
                  <div>
                    {businessInfo.language === 'id' ? 'Nomor:' : 'Number:'} **** **** **** {transaction.cardInfo.lastFourDigits}
                  </div>
                  <div>
                    {businessInfo.language === 'id' ? 'Pemegang:' : 'Holder:'} {transaction.cardInfo.cardHolderName}
                  </div>
                  <div>
                    {businessInfo.language === 'id' ? 'Kadaluarsa:' : 'Expires:'} {transaction.cardInfo.expiryDate}
                  </div>
                </div>
              </div>
            )}

            {transaction.txHash && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  {businessInfo.language === 'id' ? 'Hash Transaksi:' : 'Transaction Hash:'}
                </div>
                <div className="text-xs font-mono break-all text-gray-600">
                  {transaction.txHash}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 my-3"></div>

          <div className="text-center text-xs text-gray-500">
            <p>
              {businessInfo.language === 'id' 
                ? 'Terima kasih atas kunjungan Anda!'
                : 'Thank you for your visit!'
              }
            </p>
            <p>Powered by WarungPay Web3 POS</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={printReceipt}
            className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Printer className="h-5 w-5" />
            <span>
              {businessInfo.language === 'id' ? 'Cetak Struk' : 'Print Receipt'}
            </span>
          </button>

          {transaction.txHash && (
            <a
              href={getMidenExplorerUrl(transaction.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>
                {businessInfo.language === 'id' 
                  ? 'Lihat di Blockchain Explorer'
                  : 'View on Blockchain Explorer'
                }
              </span>
            </a>
          )}

          {transaction.customer?.phone && !sent && (
            <div className="space-y-2">
              <button
                onClick={() => handleSendReceipt('whatsapp')}
                disabled={isSending}
                className="w-full bg-green-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
                <span>
                  {businessInfo.language === 'id' 
                    ? 'Kirim ke WhatsApp'
                    : 'Send to WhatsApp'
                  }
                </span>
              </button>

              <button
                onClick={() => handleSendReceipt('telegram')}
                disabled={isSending}
                className="w-full bg-blue-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>
                  {businessInfo.language === 'id' 
                    ? 'Kirim ke Telegram'
                    : 'Send to Telegram'
                  }
                </span>
              </button>
            </div>
          )}

          {sent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-800 text-sm">
                ✅ {businessInfo.language === 'id' 
                  ? 'Struk berhasil dikirim!'
                  : 'Receipt sent successfully!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};