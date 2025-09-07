import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Wallet, Receipt, Calendar, Eye, Filter } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { ReceiptModal } from '../POS/ReceiptModal';

export const HistoryView: React.FC = () => {
  const { transactions, businessInfo, wallet, isAuthenticated, currentStore, loadTransactions } = useApiStore();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Load transactions from database when component mounts or currentStore changes
  useEffect(() => {
    if (currentStore && isAuthenticated) {
      console.log('Loading transactions for History store:', currentStore.walletAddress);
      loadTransactions(currentStore.walletAddress);
    }
  }, [currentStore, isAuthenticated, loadTransactions]);

  // Debug: Log transactions data
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('Transactions loaded in HistoryView:', transactions.map(t => ({
        id: t.id,
        paymentMethod: t.paymentMethod,
        paymentStatus: t.paymentStatus,
        total: t.total,
        timestamp: t.timestamp,
        timestampType: typeof t.timestamp,
        isDate: t.timestamp instanceof Date,
        timestampValue: t.timestamp
      })));
    }
  }, [transactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    const paymentMatch = filterPayment === 'all' || transaction.paymentMethod?.toLowerCase() === filterPayment;
    
    let dateMatch = true;
    try {
      let transactionDate: Date;
      
      if (transaction.timestamp instanceof Date) {
        transactionDate = transaction.timestamp;
      } else if (typeof transaction.timestamp === 'string') {
        transactionDate = new Date(transaction.timestamp);
      } else {
        console.error('Invalid timestamp type for filtering:', typeof transaction.timestamp, transaction.timestamp);
        dateMatch = true; // Include in results if date parsing fails
        return paymentMatch && dateMatch;
      }
      
      if (isNaN(transactionDate.getTime())) {
        console.error('Invalid date value for filtering:', transaction.timestamp);
        dateMatch = true; // Include in results if date is invalid
        return paymentMatch && dateMatch;
      }
      
      if (dateFilter === 'today') {
        const today = new Date();
        dateMatch = format(transactionDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateMatch = transactionDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateMatch = transactionDate >= monthAgo;
      }
    } catch (error) {
      console.error('Error filtering by date:', error, transaction.timestamp);
      dateMatch = true; // Include in results if date parsing fails
    }

    return paymentMatch && dateMatch;
  });

  const totalRevenue = filteredTransactions.reduce((sum, transaction) => {
    const transactionTotal = Number(transaction.total) || 0;
    console.log(`Adding transaction total: ${transactionTotal} to sum: ${sum}`);
    return sum + transactionTotal;
  }, 0);
  const totalTransactions = filteredTransactions.length;

  console.log('Revenue calculation:', {
    totalTransactions,
    totalRevenue,
    transactionTotals: filteredTransactions.map(t => ({ id: t.id, total: t.total, totalType: typeof t.total }))
  });

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
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
              ? 'Hubungkan Dompet untuk Mengakses Riwayat'
              : 'Connect Wallet to Access History'
            }
          </h3>
          <p className="text-gray-500">
            {businessInfo.language === 'id' 
              ? 'Hubungkan Miden Wallet untuk melihat riwayat transaksi toko Anda'
              : 'Connect your Miden Wallet to view your store transaction history'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Riwayat Transaksi
          </h2>
          <p className="text-gray-600">
            Kelola dan pantau semua transaksi toko Anda
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue, businessInfo.currency)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata per Transaksi</p>
              <p className="text-3xl font-bold text-primary-600">
                {totalTransactions > 0 
                  ? formatCurrency(totalRevenue / totalTransactions, businessInfo.currency)
                  : formatCurrency(0, businessInfo.currency)
                }
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Filter className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Pembayaran
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai</option>
              <option value="card">Kartu</option>
              <option value="crypto">Kripto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Tanggal
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada transaksi
            </h3>
            <p className="text-gray-500">
              Transaksi akan muncul di sini setelah Anda melakukan penjualan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{transaction.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.items.length} item(s)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        try {
                          let date: Date;
                          
                          if (transaction.timestamp instanceof Date) {
                            date = transaction.timestamp;
                          } else if (typeof transaction.timestamp === 'string') {
                            date = new Date(transaction.timestamp);
                          } else {
                            console.error('Invalid timestamp type:', typeof transaction.timestamp, transaction.timestamp);
                            return 'Invalid Date';
                          }
                          
                          if (isNaN(date.getTime())) {
                            console.error('Invalid date value:', transaction.timestamp);
                            return 'Invalid Date';
                          }
                          
                          return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
                        } catch (error) {
                          console.error('Error formatting date:', error, transaction.timestamp);
                          return 'Invalid Date';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.paymentMethod?.toLowerCase() === 'cash' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.paymentMethod?.toLowerCase() === 'card'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.paymentMethod?.toLowerCase() === 'cash' ? 'Tunai' : 
                         transaction.paymentMethod?.toLowerCase() === 'card' ? 'Kartu' : 'Kripto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.total, businessInfo.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.paymentStatus?.toLowerCase() === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.paymentStatus?.toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.paymentStatus?.toLowerCase() === 'completed' ? 'Selesai' : 
                         transaction.paymentStatus?.toLowerCase() === 'pending' ? 'Pending' : 'Gagal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewReceipt(transaction)}
                        className="text-primary-600 hover:text-primary-900 transition-colors flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Lihat</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTransaction && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};